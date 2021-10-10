const express = require("express");
const fs = require('fs');
const { v4 } = require("uuid");

const { s3 } = require('../../aws/index');
const { pool } = require('../../db/index');
const { verifyAToken, decodeToken } = require('../../jwt/jwt');


const dangerStrings = ['SELECT', 'INSERT', 'DROP', 'DECLARE'];

// TODO: export recRand, and router from other files then re-import
// TODO: fix threeParamQuery and rename to withoutRepeatQuery.
// TODO: add content ordering to queries in upload routes.

const threeParamQuery = (first, second, thrid) => {
  return `
  SELECT name, "nameGroup", format, description
  FROM meme
  WHERE name NOT IN(${first.map(o => `'${o}'`)})
  ORDER BY FLOOR(random() * ${second})
  LIMIT ${thrid};`
} 

const twoParamQuery = (first, second) => {
  return `
  SELECT name, "nameGroup", format, description
  FROM meme
  ORDER BY FLOOR(random() * ${first})
  LIMIT ${second};`
};

const recRand = (arr, final) => {
  const passing = Math.floor(Math.random() * arr.length);
  if (!final.includes(arr[passing])) {
    return arr[passing];
  } else {
    return recRand(arr, final);
  }
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

const router = express.Router();

// ??
router.get('/preview/:id', async(req, res, next) => {
  let errorCode = 400;
  try {
    
    const { id } = req.params;

    const results = await pool.query(`
      SELECT previewsize, previewformat
      FROM weblinks
      WHERE weblinkid = $1;
      `,[id]);


    if (!results.rows.length) {
      return res.status(400).send('no preview available');
    }
    const { previewsize, previewformat } = results.rows[0];

    console.log(results.rows);

    let memeObj = {};

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: id,
      Range: `bytes=0-${previewsize - 1}/${previewsize}`
    };
    try {
      memeObj = await s3.getObject(params);
    } catch (err) {
      next(err) // Pass errors to Express.
      return res.status(500).json({
        message: "Hey, Can we talk? We need to spend some time apart. I've been down lately and It's not you it's me I just need some time. FeelsBadMan"
      })
    }

    const headers = {
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes 0-${previewsize - 1}/${previewsize}`,
      "Content-Length": previewsize,
      "Content-Type": previewformat
    };
    res.writeHead(206, headers);

    memeObj.createReadStream().pipe(res);

  } catch (err) {
    next(err) // Pass errors to Express.
    res.status(errorCode).send('something didnt work');
  }
})


// specific meme
router.get("/:name", async(req, res, next) => {
  let errorCode = 400;
  try {
    console.log(`GET /m/meme/:name hit, name: ${req.params.name}`);
    const { name: s3_meme_name } = req.params;
    const range = req.headers.range;


    const groupname = s3_meme_name.slice(0, s3_meme_name.length - 2);

    if (!range) {
      res.status(400).send("Requires Range header");
    } 

    const memeQuery = await pool.query(
      `
        SELECT size, format
        FROM meme
        WHERE "nameGroup" = $1;
      `,
      [groupname]
    );

    if (!memeQuery.rowCount) {
      throw Error('Meme not found');
    }

    const { size: videoSize, format } = memeQuery.rows[0];
    const contentRange = `${0}-${videoSize - 1}/${videoSize}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3_meme_name,
      Range: `bytes=${contentRange}`
    };
    let memeObj = {};
    try {
      memeObj = await s3.getObject(params);
    } catch (err) {
      return res.status(500).json({
        message: "Hey, Can we talk? We need to spend some time apart. I've been down lately and It's not you it's me I just need some time. FeelsBadMan"
      })
    }

    if (format.includes('video')){

      const headers = {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${contentRange}`,
        "Content-Length": videoSize,
        "Content-Type": format
      };
      res.writeHead(206, headers);

      memeObj.createReadStream().pipe(res);

    } else if (format.includes('image')) {
      res.status(200).json({
        not: 'done'
      })
    }
  } catch(err) {
    next(err) // Pass errors to Express.
    console.log(err.message)
    res.status(errorCode).json({
      message: "something went wrong"
    })
  }
})


// get memes info to reqest in frontend viewers
router.get("/imports/:n", async(req, res, next) => {
  try{
    console.log(`/memes/imports/:n hit; n: ${req.params.n}`);
    if (req.query.token && !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    }
  
    const memeCount = await pool.query(`
      SELECT count(DISTINCT name)
      FROM meme;
    `).then(value => value.rows[0].count)

    const randomMemesQueries = await pool.query(twoParamQuery(memeCount, req.params.n));

    let names, nameGroups, formats = [];
    if (randomMemesQueries && randomMemesQueries.rows){
      names = randomMemesQueries.rows.map(row => row.name);
      nameGroups = randomMemesQueries.rows.map(row => row.nameGroup).filter(onlyUnique);
      formats = randomMemesQueries.rows.map(row => row.format);
      description = randomMemesQueries.rows.map(row => row.description);
    }

    return res.status(200).json({ 
      memeExport: {
        names,
        description,
        formats,
        nameGroups
      }
    });
  } catch (err) {
    next(err) // Pass errors to Express.
    console.log(err.message);
    return res.status(400).json({
      error: err.message
    });
  };
});


// upload a video/image/audio
router.post("/upload-meme", async(req, res, next) => {
  let errorCode = 400;
  try {
    console.log('POST /memes/upload-meme hit');
    if (!req.query.token || !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    }

    const decoded = decodeToken(req.query.token);

    const availableTags = [...decoded.public, decoded.private];

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log("No files were uploaded.");
      // TODO: seems like it could be cleaner
      return res.status(400).send('No files were uploaded.');
    }
    


    let uploadError = '';

    const { files } = req;


    console.log(req.body)
    const { username, desc, tags } = req.body;
    


    if (!username) {
      return res.status(401).send('No user was associated to this request');
    }

    // Temporary, maybe use knex.raw again?
    if (
      desc &&
      desc.includes(';') &&
      dangerStrings.filter(s => desc.toUpperCase().includes(s))
        .length
      ) {
      return res.status(errorCode).send("invalid description");
    }

    const description = desc ? desc : '';

    const memeName = v4();
    let count = 0;
    
    while(count < Object.keys(files).length) {
      const key = `${memeName}_${count}`;
      const s3params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: files[count].data,
      }

      await Promise.all([s3.putObject(s3params,
        (err, data) => {
          if (err) {
            uploadError = err.message;
            errorCode = 500;
          }
        })
      ]);

      if (uploadError) break;

      const params = [
        key,
        memeName,
        files[count].mimetype,
        files[count].size,
        username,
        !count ? description : ''
      ];

      /* 
        TODO: knex has some way of undoing queries if something fails,
        pg certainly has a similar method, implement it when possible
        to avoid useless rows.(Rollbacks)
      */

      const result = await pool.query(`
        INSERT INTO meme(
          name,
          "nameGroup",
          format,
          size,
          poster,
          description
        ) VALUES(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        RETURNING memetagid;
      `, params);

      const memetagid = result.rows[0].memetagid;
  
      if (tags) {
        for (let i = 0; i < tags.length; i++) {
          if (tags && !availableTags.includes(tags[i])) {
            return res.status(errorCode).send("invalid tag");
          } else {
            await pool.query(`
              INSERT INTO contenttags(
                groupname,
                tagid
              )
              VALUES(
                $1,
                $2
              )
            `, [tags[i], memetagid]);
          }
        }
      }

      if (uploadError) throw Error(uploadError);
      count++
    }
    res.status(201).json({
      meme: memeName
    });

  } catch (err) {
    next(err) // Pass errors to Express.
    console.log(err.message);
    return res.status(errorCode).json({
      error: "There was a problem, Try again, unless this is you trying again then you can stop, Sooo, if your seeing this ... sorry it doesn't work? ¯\\_(ツ)_/¯ "
    });
  };
});


// upload a link
router.post("/upload-link", async(req, res, next) => {
  let errorCode = 400;
  try {
    console.log('POST /memes/upload-link hit');

    if (!req.query.token || !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    }

    const decoded = decodeToken(req.query.token);

    const availableTags = [...decoded.public, ...decoded.private];

    console.log(availableTags);
    const { files } = req;
    const fileDoesntExist = typeof files === 'object' && !files;
    const { link, username, description: desc, tags } = req.body;

    const allTags = tags.split(',');
    console.log(req.body);
    if (!req.body) return res.status(errorCode).send("body required");

    if (
      !fileDoesntExist &&
      !files.preview.mimetype.includes('image')) {
      return res.status(errorCode).send('preview media must be an image type');
    }

    if (
      !fileDoesntExist &&
      Object.keys(req.files).length > 1
      ) {
      res.status(errorCode).send('Only one preview image per link');
    }

    if (!link) return res.status(errorCode).send("link required in body");
    if (!username) return res.status(errorCode).send("username required in body");

    if (
      desc &&
      desc.includes(';') &&
      dangerStrings.filter(s => desc.toUpperCase().includes(s))
        .length
      ) {
      return res.status(errorCode).send("invalid description");
    }

    // puts link in table
    const result = await pool.query(`
      INSERT INTO weblinks(
        link,
        poster,
        previewsize,
        previewformat,
        description
      )
      VALUES(
        $1,
        $2,
        $3,
        $4,
        $5
      )
      RETURNING weblinkid;
    `, [link, username, files.preview.size, files.preview.mimetype, desc]);

    const weblinkid = result.rows[0].weblinkid;

    // puts preview image in s3
    if (!fileDoesntExist) {
      const s3params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: weblinkid,
        Body: files.preview.data,
      }
  
      await Promise.all([s3.putObject(s3params,
        (err, data) => {
          if (err) {
            uploadError = err.message;
            errorCode = 500;
          }
        })
      ]);   
    }

    // adds tags to link
    if (allTags) {
      for (let i = 0; i < allTags.length; i++) {
        if (tags && !availableTags.includes(allTags[i])) {
          return res.status(errorCode).send("invalid tag");
        } else {
          // TODO: add to order to have them chronologically sorted
          const results1 = pool.query(`
            SELECT COUNT(*)
            FROM contenttags
            WHERE groupname = $1;
          `, [allTags[i]]);
          console.log(results1);

          await pool.query(`
            INSERT INTO contenttags(
              groupname,
              tagid
            )
            VALUES(
              $1,
              $2
            )
          `, [allTags[i], weblinkid]);
        }
      }
    }

    res.status(201).json({
      webLinkId: weblinkid
    })

  } catch(err) {
    next(err) // Pass errors to Express.
    console.log(err.message);
    return res.status(errorCode).json({
      error: "There was a problem, Try again, unless this is you trying again then you can stop, Sooo, if your seeing this ... sorry it doesn't work? ¯\\_(ツ)_/¯ "
    });
  };
});

module.exports = router;