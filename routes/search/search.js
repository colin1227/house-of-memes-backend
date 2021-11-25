const express = require("express");
const cors = require('cors');
const { hashTagsTermQuery, memeSearchQuery } = require("../../db/queries");

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

const router = express.Router();

router.get('/meme/:term', async(req, res, next) => {
  try {
    const modifiedSearchTerm = req.params.term.toLowerCase();
    const query = await memeSearchQuery(modifiedSearchTerm);
    // TODO: weblinks added to search
    const options = query.rows.map(row => {
      return {
        label: row.description,
        awsName: row.aws_name,
        format: row.format
      }
    });
    res.json({
        options
      });
  } catch(err) {
    next(err);
    res.json({
      error: err.message
    })
  }
})

router.get('/hashtags/:term', async(req, res, next) => {
  try {

    const hashTagsTermQuery = await hashTagsTermQuery(req.query.term);
    hashTagsTermQuery = hashTagsTermQuery.rows.map(value => value.hashtag_id);

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
