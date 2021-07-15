const express = require("express");
const cors = require('cors');
const { signAToken } = require('../../jwt/jwt');
const bcrypt = require('bcrypt');

const router = express.Router();
const { pool } = require('../../db/index');

const hashIt = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

router.post('/sign-in', async(req, res) => {
  let errorCode = 400;
  try {
    if (!req.body.username) throw Error('no username');
    if (!req.body.password) throw Error('no password');
    const { username, password } = req.body;

    const userQuery = await pool.query(`
      SELECT password, userid
      FROM userprofile
      WHERE username = $1;
      `, [username]); // add status to select query
    if (userQuery.rows.length <= 0) throw Error('Something went wrong'); // no username found
    bcrypt.compare(password, userQuery.rows[0].password, function(err, result) {
      // execute code to test for access and login
      if(err) {
        return Error("something went wrong"); // didn't match
      }
      return true;
    });

    // retrive private and public groups and sign the token.

    const groupsResults = await pool.query(
      `
        SELECT groups.groupname, groups.private
        FROM groups
        JOIN "userGroups"
        ON "userGroups".groupid = groups.groupid
        WHERE "userGroups".userid = $1;
      `,
      [userQuery.rows[0].userid]
    );
    
    const tokenObject = {
      userId: userQuery.rows[0].userid
    };
    tokenObject.public = groupsResults.rows.filter(r => !r.private);
    if (tokenObject.public.length > 0) {
      tokenObject.public = tokenObject.public.map(pbr => pbr.groupname);
    }
    tokenObject.private = groupsResults.rows.filter(r => r.private);
    if (tokenObject.private.length > 0) {
      tokenObject.private = tokenObject.private.map(pvr => pvr.groupname);
    }

    const token = signAToken(tokenObject);

    return res.status(200).json({
      username,
      token
    })
  } catch({ message }) {
    res.status(errorCode).json({
      message
    })
  }
});

router.post('/sign-up', async(req, res) => {
  let errorCode = 400;
  try {
    const { username, password } = req.body;
    const hashedPass = hashIt(password);

    let sqlParams = [ username, hashedPass ];

    const usernameCount = await pool.query(`
      SELECT COUNT(*)
      FROM userprofile
      WHERE username = $1;
      `, [username]);

    if (usernameCount && usernameCount.rows && usernameCount.rows[0].count > 0) throw Error('Username Taken');

    // Add
    const v = await pool.query(`
      INSERT INTO userprofile(username, password)
      VALUES( $1, $2);
    `, sqlParams);

    // retrive private and public groups and sign the token.

    const groupsResults = await pool.query(
      `
        SELECT groupname
        FROM groups
        JOIN userGroups
        ON userGroups.groupid = groups.groupid
        WHERE userGroups.userid = $1;
      `
    );

    console.log(groupsResults.rows);

    const token = signAToken([]);

    return res.status(201).json({
      username,
      token
    })
  } catch({ message }) {
    res.status(errorCode).json({
      message
    })
  }
});

module.exports = router;
