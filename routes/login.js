const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const config = require("../config");

router.post("/", (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      // TODO log
      return res.status(400).send({
        isSuccess: 0,
        retMessage: "Invalid request",
        token: ""
      });
    }

    const connection = mysql.createConnection({
      host: config.dbHost,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName
    });

    connection.connect(err => {
      if (err) {
        // TODO log
        console.log("Could not connect to database: ", err);
        // TODO figure out how to catch this
        throw Error("Could not connect to database");
      }
    });

    const sql =
      "SELECT user_id, password FROM users WHERE username = ? LIMIT 1";
    connection.query(
      { sql, values: [username], timeout: 30000 },
      (err, results, fields) => {
        const [user] = results;

        if (!user) {
          // Invalid username
          return res.status(200).send({
            isSuccess: 0,
            retMessage: "Invalid username or password",
            token: ""
          });
        }

        if (user.password === password) {
          // Valid credentials
          // TODO wishlist - tokens should expire
          const token = jwt.sign({ sub: user.user_id }, config.jwtSecret);
          return res.status(200).send({
            isSuccess: 1,
            retMessage: "Success",
            token
          });
        } else {
          // Invalid password
          // TODO unencrypt
          return res.status(200).send({
            isSuccess: 0,
            retMessage: "Invalid username or password",
            token: ""
          });
        }
      }
    );
  } catch (e) {
    // TODO log
    console.log(e);
    return res.status(500).send({
      isSuccess: 0,
      retMessage: "An unexpected error occurred",
      token: ""
    });
  }
});

// TODO method not allowed

module.exports = router;