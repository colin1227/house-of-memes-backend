const express = require('express');
const { s3 } = require('../../aws/index');
const { pool } = require('../../db/index');
const router = express.Router();

router.get('/test', async(req, res) => {
  try {
    res.json({
      testRoute: 'yes'
    })
  } catch (err) {
    res.status(400).json({
      broken: err.message
    });
  }
})

module.exports = router;