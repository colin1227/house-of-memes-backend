const express = require("express");
const cors = require('cors');

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

const { pool } = require('../../db/index');

const router = express.Router();

router.get('/rose', cors(corsOptions), async(req, res) => {
  try {
    pool.query('SELECT NOW();', (err, res) => {
      console.log("____--- ~~~ PogU", res)
    })
    return res.status(200).json({
      one: "time for the 1"
    })
  } catch (err) {
    console.log(err.message);
    return err.message;
  }
});

module.exports = router;