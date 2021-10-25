const express = require("express");
const cors = require('cors');
const { signAToken } = require('../../jwt/jwt');
const bcrypt = require('bcrypt');

const router = express.Router();
const {
  loginDataQuery,
  getGroupsByUserId,
  usernameCountQuery,
  queryMemesByUser } = require('../../db/queries');

// TODO: move
const hashIt = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

router.post('/sign-in', async(req, res, next) => {
  try {
    if (!req.body.username) throw Error('Username is required to Login');
    if (!req.body.password) throw Error('Password is required to Login');
    // TODO: username to lower case.
    const { username, password } = req.body;

    const userQuery = await loginDataQuery(username);

    if (userQuery.rows.length <= 0) throw Error('specified user was not found'); // no username found
    bcrypt.compare(password, userQuery.rows[0].password, function(err, result) {
      // execute code to test for access and login
      if(err) {
        return Error("Login failure"); // didn't match
      }
      return true;
    });

    // retrive public groups and sign the token.

    const groupsResults = getGroupsByUserId(userQuery.rows[0].userId);
    
    const tokenObject = {
      userId: userQuery.rows[0].userid
    };
    if (groupsResults.rows.length > 0) {
      tokenObject.public = groupsResults.rows.map(row => row.groupname);
    }

    const token = signAToken(tokenObject);

    return res.status(200).json({
      username,
      token
    })
  } catch(err) {
    next(err);
    res.status(err.status).json({
      error: err.message
    })
  }
});

router.post('/sign-up', async(req, res, next) => {
  let errorCode = 400;
  try {
    const { username, password } = req.body;
    const hashedPass = hashIt(password);

    let sqlParams = [ username, hashedPass ];

    const usernameCount = usernameCountQuery(username);

    if (usernameCount && usernameCount.rows && usernameCount.rows[0].count > 0) throw Error('Username Taken');

    await createUserQuery(sqlParams);

    const token = signAToken([]);

    return res.status(201).json({
      username,
      token
    })
  } catch(err) {
    next(err);
    res.status(err.status).json({
      error: err.message
    })
  }
});

router.get('/:username', async(req, res, next) => {
  try {
    if (req.query.token && !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    }
  
    const results = queryMemesByUser(req.params.username);
  
    res.status(200).json({
      memeUrls: results.rows.map(a => a.name)
    })
  } catch (err) {
    next(err);
    res.status(err.status).json({
      message: err.message
    })
  }

})

module.exports = router;
