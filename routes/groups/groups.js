const express = require("express");

const {
  publicGroupNameQueryByTerm,
  queryMemesByGroup,
  queryLinksByGroup
} = require('../../db/queries');
const {
  verifyAToken,
  decodeToken } = require('../../jwt/jwt');

const router = express.Router();

router.get('/', async(req, res, next) => {
  try {
    console.log('GET /groups hit');
    let decodedToken = {};

    if (req.query.token && verifyAToken(req.query.token)) {
      decodedToken = decodeToken(req.query.token);
      res.json({
        public: decodedToken.public
      });
    } else if (req.query.token && !verifyAToken(req.query.token)) {
      return res.status(401).send("Cookie monster does not approve");
    } else {
      res.json({
        public: [],
      })
    }

  } catch (err) {
    next(err) // Pass errors to Express.
    res.status(err.status).json({
      error: err.message
    });
  }
});

router.get('/groups', async(req, res, next) => {
  try {
    
  } catch(err) {
    next(err);
    res.status(err.status).json({
      error: err.message
    })
  }
})

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

    const results = await publicGroupNameQueryByTerm(req.params.term);

    res.json({
      allGroups: results.rows.map(r => r.groupname)
    })
  } catch(err) {
    next(err) // Pass errors to Express.
    res.status(err.status).json({
      message : err.message
    })
  }
})

router.get('/:groupname', async(req, res, next) => {
  let errorCode = 400;
  try {
    console.log('GET /groups/:groupname hit');
   
    const linkQueryResults = await queryLinksByGroup();
    const memeQueryResults = await queryMemesByGroup();

    return res.status(200).json({
      groupName: req.params.groupname,
      links: linkQueryResults.rows.map(r => r.web_link),
      descriptions: [
        ...linkQueryResults.rows.map(r => r.description ? r.description : false),
        ...memeQueryResults.rows.map(r => r.description ? r.description : false)
      ],
      previews: linkQueryResults.rows.map(r => r.previewsize ? true : false),
      previewIds: linkQueryResults.rows.map(r => r.web_link_id),
      memes: memeQueryResults.rows.map(r => r.name),
      formats: memeQueryResults.rows.map(r => r.format),
      linkRows: linkQueryResults.rowCount,
      memeRows: memeQueryResults.rowCount
    })
  } catch (err) {
    next(err) // Pass errors to Express.
    res.status(err.status).json({
      message: err.message
    })
  }
});

module.exports = router;