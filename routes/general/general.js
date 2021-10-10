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

router.get('/manage', async(req, res, nex) => {
  try {
    // console.log(req)
    // adminCheck(req.cookies);

    const userNumbersQuery = await pool.query(`
      SELECT username
      FROM userprofile;
    `);

    const memeNumbersQuery = await pool.query(`
      SELECT COUNT(*)
      FROM meme;
    `);

    const tagQuery = await pool.query(`
      SELECT groupname
      FROM contenttags;
    `)


    // res.json(req.headers);
    res.json({
      users: userNumbersQuery.rows.map(a => a.username),
      hashtags: tagQuery.rows.map(a => a.groupname),
      memeCount: Number(memeNumbersQuery.rows[0].count)
    });

  } catch(err) {
    next(err) // Pass errors to Express.
    console.log(err.message);
    res.status(400).json({
      respondus: "no good"
    })
  }
})

module.exports = router;