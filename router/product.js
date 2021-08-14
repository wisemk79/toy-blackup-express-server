const express = require("express");
const router = express.Router();
const connection = require("../connection");
const { verifyAccessToken, executeQuery } = require("../util/utilFunction");

/**
 * TODO Swagger UI 연결하도록
 */

router.get("/category",async (req, res) => {

      const SQL = "SELECT * FROM category";
      const rs = await executeQuery(SQL);
      console.log("결과?",rs)

      if (rs.status === "success") {
        return res.status(200).json(rs);
      } else {
        return res.status(400).json(rs);
      }

});

/**
 * 카테고리 별 아이템들
 */
router.get("/category/:id/items",async (req, res) => {

      const SQL = "select * from product p left join inventory i on p.prod_id = i.prod_id where cate_id=?";
      const rs = await executeQuery(SQL, [req.params.id]);

      if (rs.status === "success") {
        return res.status(200).json(rs);
      } else {
        return res.status(400).json(rs);
      }
});

/**
 * 아이템 정보
 */
router.get("/item/:id",async (req, res) => {
      const SQL = "select * from product p left join inventory i on p.prod_id = i.prod_id where i.prod_id=?";
      const rs = await executeQuery(SQL, [req.params.id]);

      if (rs.status === "success") {
        return res.status(200).json({
          ...rs,
          data: rs.data.length > 0 ? rs.data[0] : {}
        });
      } else {
        return res.status(400).json(rs);
      }

});

module.exports = router;
