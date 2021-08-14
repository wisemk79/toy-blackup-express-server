const express = require("express");
const router = express.Router();
const connection = require("../connection");
const { dycryptionData, encryptionData, generateAccessToken, generateRefreshToken, verifyAccessToken, executeQuery } = require("../util/utilFunction");

router.post("/signup", async (req, res) => {

  if (req.body.id && req.body.password) {
      const SQL =
        "INSERT INTO member(id, password, register_at) VALUES(?,?,?)";
      const rs = await executeQuery(SQL, [req.body.id, req.body.password, new Date().toISOString()]);
      console.log("결과?",rs)

      if (rs.status === "success") {
        return res.status(200).json(rs);
      } else {
        return res.status(400).json({
          ...rs,
          message: rs.message.sqlMessage
        });
      }
    } else {
        return res.status(400).json({
          status: "fail",
          message: "incorrect body"
        });
    }
});

router.post("/signin", async (req, res) => {
      console.log("data", req.body);

  if (req.body.id && req.body.password) {
      const SQL = "SELECT * FROM member where id=?";
      const rs = await executeQuery(SQL, [req.body.id]);
      console.log("결과?",rs)

      if (rs.status === "success") {
            if (rs.data.length > 0) {
                const selectedRs = rs.data[0] || {};

                if (req.body.password === selectedRs.password) {
                      const accessToken = generateAccessToken(req.body.id);
                      const refreshToken = generateRefreshToken(req.body.id);

                    return res.status(200).json({
                        status: "success",
                        accessToken,
                        refreshToken
                    });     
                } else {
                    return res.status(400).json({
                        status: "fail",
                        message: "incorrect id or password"
                    });
                }
            } else {
                return res.status(400).json({
                  status: "fail",
                  message: "incorrect id or password"
                });
            }
      } else {
        return res.status(400).json({
          ...rs,
          message: rs.message.sqlMessage
        });
      }
  } else {
    return res.status(400).json({
          status: 'fail',
          error: 'incorrect body',
    }); 
  }
});

// access token을 refresh token 기반으로 재발급
router.post("/refresh", async (req, res) => {
    let authHeader = req.headers.authorization;
    let refreshToken = authHeader && authHeader.split(" ")[1];
    if (!refreshToken) {
        console.log("wrong token format or token is not sended");
        return res.sendStatus(400);
    }

    const verifyResult = await verifyAccessToken(refreshToken, "refresh");
    if (verifyResult.id) {
      const accessToken = generateAccessToken(verifyResult.id);
      res.json({
        statusCode: "200",
        status: "success",
        accessToken
      });
    } else {
      res.json({
        statusCode: "403",
        status: "fail"
      });
    }
});

// access token 유효성 확인을 위한 예시 요청
router.get("/verify",async (req, res) => {

    let authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.log("wrong token format or token is not sended");
        return res.sendStatus(400);
    }

    const verifyResult = await verifyAccessToken(token, "access");
    if (verifyResult.id) {
      res.json({
        statusCode: "200",
        status: "success"
      });
    } else {
      res.json({
        statusCode: "403",
        status: "fail"
      });
    }
    console.log("결과????", verifyResult.id);
});

module.exports = router;
