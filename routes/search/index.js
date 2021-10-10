const express = require("express");
const cors = require('cors');

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

// const { pool } = require('../../db/index');

const router = express.Router();

router.get('/free-real-estate', cors(corsOptions), async(req, res, next) => {
  try {
    return res.status(200).json({
      itIsFreeRealEstate: "*smug smirk towards camera, somewhat sensually sugestive*"
    })
  } catch (err) {
    next(err)  // Pass errors to Express.
    console.log(err.message);
    return err.message;
  }
});

module.exports = router;