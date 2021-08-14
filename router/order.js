const express = require("express");
const router = express.Router();
const connection = require("../connection");
const { verifyAccessToken, executeQuery } = require("../util/utilFunction");

/**
 * 주문 생성
 */
router.post("/",async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.log("wrong token format or token is not sended");
        return res.sendStatus(400);
    }

    const verifyResult = await verifyAccessToken(token, "access");
    if (verifyResult.id) {
        console.log(req.body)
      const SQL = "insert into shop_order(mem_id, order_status, phone, address, name, description, register_at) values (?,?,?,?,?,?,?);";
      const insertRs = await executeQuery(SQL, [req.body.mem_id, "INIT", req.body.phone, req.body.address, req.body.name, req.body.description || "", new Date().toISOString()]);

      if (insertRs.status === "success") {
        const SQL2 = "select * from shop_order where mem_id=? order by register_at DESC limit 1;"
        const selectRs = await executeQuery(SQL2, [req.body.mem_id]);

        const orderInfo = selectRs.data.length > 0 ? selectRs.data[0] : {}

        const DETAIL_SQL = "insert into shop_order_detail(order_id, prod_id, order_quantity, register_at) values(?,?,?,?)"
        req.body.products.forEach(prod => {
          executeQuery(DETAIL_SQL, [orderInfo.order_id, prod.prod_id, prod.order_quantity, new Date().toISOString()]);
        });

          return res.status(200).json({
              ...selectRs,
              data: orderInfo
          });     
      } else {
        return res.status(400).json(insertRs);
      }
    } else {
      return res.status(400).json({
          status: "fail",
          message: "unauthorized"
      });   
    }


});

/**
 * 주문 결제
 */
router.post("/paid", async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.log("wrong token format or token is not sended");
        return res.sendStatus(400);
    }

    const verifyResult = await verifyAccessToken(token, "access");
    if (verifyResult.id) {

      const CREATE_PAYMENT_SQL = "insert into payment(order_id, amount_pay, register_at) values (?,?,?)";
      const insertRs = await executeQuery(CREATE_PAYMENT_SQL, [req.body.order_id, req.body.total_price, new Date().toISOString()]);
      if (insertRs.status === "success") {
        const SELECT_PAYMENT_SQL = "select * from payment where order_id=? order by register_at DESC limit 1;"
        const selectRs = await executeQuery(SELECT_PAYMENT_SQL, [req.body.order_id]);
        const paymentInfo = selectRs.data.length > 0 ? selectRs.data[0] : {}

        const UPDATE_ORDER_SQL = "update shop_order set order_status=?, pay_id=?, update_at=? where order_id=?"
        const updateRs = await executeQuery(UPDATE_ORDER_SQL, ["PROGRESS", paymentInfo.pay_id, new Date().toISOString(), req.body.order_id]);

        const SELECT_ORDER_DETAILS = "select * from shop_order_detail where order_id=?"
        const selectOrderDetailRs = await executeQuery(SELECT_ORDER_DETAILS, [req.body.order_id]);
        
        const productsData = selectOrderDetailRs.data || [];
      
        const SELECT_INVENTORY = "select * from inventory where prod_id=?";
        const UPDATE_INVENTORY = "update inventory set inventory_quantity=?, update_at=? where prod_id=?";

        productsData.forEach(async prod => {
          const selectInventoryRs = await executeQuery(SELECT_INVENTORY, [prod.prod_id]);
          const inventoryInfo = selectInventoryRs.data[0] || {};

          executeQuery(UPDATE_INVENTORY, [inventoryInfo.inventory_quantity - prod.order_quantity, new Date().toISOString(), prod.prod_id]);
        })

        return res.status(200).json(updateRs);  
      } else {
        return res.status(400).json(insertRs);
      }

    } else {
      return res.status(400).json({
          status: "fail",
          message: "unauthorized"
      });   
    }   
});

/**
 * 주문 취소
 */
router.post("/cancel", async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.log("wrong token format or token is not sended");
        return res.sendStatus(400);
    }

    const verifyResult = await verifyAccessToken(token, "access");
    if (verifyResult.id) {
      const SELECT_ORDER_SQL = "select * from shop_order where order_id=?";
      const selectRs = await executeQuery(SELECT_ORDER_SQL, [req.body.order_id]);

      const selectInfo = selectRs.data[0] || {};

      if (selectInfo.order_status !== "CANCEL") {
        const UPDATE_STATUS_SQL = "update shop_order set order_status=?, update_at=? where order_id=?";
        const updateRs = await executeQuery(UPDATE_STATUS_SQL, ["CANCEL", new Date().toISOString(), req.body.order_id]);
        if (updateRs.status === "success") {
          const SELECT_ORDER_DETAILS = "select * from shop_order_detail where order_id=?"
          const selectOrderDetailRs = await executeQuery(SELECT_ORDER_DETAILS, [req.body.order_id]);
          
          const productsData = selectOrderDetailRs.data || [];
        
          const SELECT_INVENTORY = "select * from inventory where prod_id=?";
          const UPDATE_INVENTORY = "update inventory set inventory_quantity=?, update_at=? where prod_id=?";
  
          productsData.forEach(async prod => {
            const selectInventoryRs = await executeQuery(SELECT_INVENTORY, [prod.prod_id]);
            const inventoryInfo = selectInventoryRs.data[0] || {};
  
            executeQuery(UPDATE_INVENTORY, [inventoryInfo.inventory_quantity + prod.order_quantity, new Date().toISOString(), prod.prod_id]);
          })
  
          return res.status(200).json(updateRs);  
        } else {
          return res.status(400).json(updateRs);
        }
      } else {
        res.status(200).json({
          status: "fail",
          message: "already canceled"
        })
      }



    } else {
      return res.status(400).json({
          status: "fail",
          message: "unauthorized"
      });   
    }   
});

module.exports = router;
