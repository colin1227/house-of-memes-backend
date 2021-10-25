const express = require('express');

const {
  usernamesQuery,
  memeCountQuery,
  tagQuery } = require('../../db/queries');
const router = express.Router();

router.get('/test', async(req, res, next) => {
  try {
    res.json({
      testRoute: 'yes'
    })
  } catch (err) {
    next(err);
    res.status(err.status).json({
      error: err.message
    });
  }
})

router.get('/manage', async(req, res, next) => {
  try {
    let usernames = await usernamesQuery();
    usernames = usernames.rows.map(row => row.username);

    let hashtags = await tagQuery();
    hashtags = hashtags.rows.map(row => row.groupname);

    let memeCount = await memeCountQuery();
    memeCount = memeCount.rows[0].count;

    res.json({
      users: usernames,
      hashtags: hashtags,
      memeCount
    });

  } catch(err) {
    next(err) // Pass errors to Express.
    res.status(err.status).json({
      error: err.message
    })
  }
})

module.exports = router;