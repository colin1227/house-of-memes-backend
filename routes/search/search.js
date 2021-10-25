const express = require("express");
const cors = require('cors');
const { hashTagsTermQuery } = require("../../db/queries");

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

const { hashTagsTermQuery } = require('../../db/queries');


const router = express.Router();

router.get('/hashtags', async(req, res, next) => {
  try {

    const hashTagsTermQuery = await hashTagsTermQuery(req.query.term);
    hashTagsTermQuery = hashTagsTermQuery.rows.map(value => value.groupname);

    res.json({
      hashtags: hashTagsTermQuery
    })
  } catch(err) {
    next(err);
    res.status(err.status).json({
      message: err.message
    })
  }
})

module.exports = router;