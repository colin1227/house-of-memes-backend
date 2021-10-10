const express = require("express");
const fs = require('fs');
const { v4 } = require("uuid");

const { s3 } = require('../../aws/index');
const { pool } = require('../../db/index');
const { verifyAToken, decodeToken } = require('../../jwt/jwt');

const router = express.Router();

router.get('/', async(req, res, next) => {
  let errorCode = 400;
  try {
    console.log('GET /groups hit');
    let decodedToken = {};

    if (req.query.token && verifyAToken(req.query.token)) {
      decodedToken = decodeToken(req.query.token);
      res.json({
        public: decodedToken.public,
        private: decodedToken.private
       });
    } else if (req.query.token && !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    } else {
      res.json({
        public: [],
        private: []
      })
    }

  } catch (err) {
    // errorCode = err.status;
    next(err) // Pass errors to Express.
    console.log('/groups failed req', err.message);
    res.status(errorCode).json({
      message: "something broke, sorry"
    });
  }
});

router.get('/search/:term', async(req, res, next) => {
  let errorCode = 400;
  try {
    let decodedToken = {};
    if (req.query.token && verifyAToken(req.query.token)) {
      decodedToken = decodeToken(req.query.token);
    } else if (req.query.token && !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    }

    // TODO: make queryable for private if they have them or invites.
    const query = `
    SELECT groupname
    FROM groups
    where groups.private = false
    and groupname LIKE '%${req.params.term}%'
    LIMIT 10;`
    const results = await pool.query(query);

    console.log(results)
    res.json({
      allGroups: results.rows.map(r => r.groupname)
    })
  } catch(err) {
    next(err) // Pass errors to Express.
    res.status(errorCode).json({
      message : err.message
    })
  }
})

router.get('/:groupname', async(req, res, next) => {

  let errorCode = 400;
  try {
    console.log('GET /groups/:groupname hit');
    // if (!req.query.token || !verifyAToken(req.query.token)) {
    //   errorCode = 401
    //   return res.status(401).send("Cookie monster does not approve");
    // }

    // links
    const linkQueryResults = await pool.query(`
        SELECT weblinks.link, contenttags.order, weblinks.previewsize, weblinks.weblinkid, weblinks.description
        FROM weblinks
        JOIN contenttags
        ON weblinks.weblinkid = contenttags.tagid
        WHERE contenttags.groupname = $1
        ORDER BY contenttags.order;
      `,
      [req.params.groupname.replace('_', ' ')]
    );

    // memes
    const memeQueryResults = await pool.query(`
        SELECT meme.name, contenttags.order, meme.format, meme.description
        FROM meme
        JOIN contenttags
        ON meme.memetagid = contenttags.tagid
        WHERE contenttags.groupname = $1
        ORDER BY contenttags.order;
      `,
      [req.params.groupname]
    );
   
    return res.status(200).json({
      groupName: req.params.groupname,
      links: linkQueryResults.rows.map(r => r.link),
      descriptions: [
        ...linkQueryResults.rows.map(r => r.description ? r.description : false),
        ...memeQueryResults.rows.map(r => r.description ? r.description : false)
      ],
      previews: linkQueryResults.rows.map(r => r.previewsize ? true : false),
      previewIds: linkQueryResults.rows.map(r => r.weblinkid),
      memes: memeQueryResults.rows.map(r => r.name),
      formats: memeQueryResults.rows.map(r => r.format),
      linkRows: linkQueryResults.rowCount,
      memeRows: memeQueryResults.rowCount
    })
  } catch (err) {
    next(err) // Pass errors to Express.

    res.status(errorCode).json({
      message: err
    })
  }
});

router.get('/:groupname/invite', async(req, res, next) => {
  let errorCode = 400;
  try {
    
  } catch(err) {
    next(err) // Pass errors to Express.
    res.status(errorCode).json({
      message
    })
  }
});

module.exports = router;