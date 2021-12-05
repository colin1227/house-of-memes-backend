const express = require("express");
const fs = require('fs');
const { v4 } = require("uuid");
const { s3 } = require('../../aws');
const {
  memeQuery,
  memeCountQuery,
  previewQuery,
  memesFloorRandomQuery,
  createMemeTagEntry,
  createTagEntry,
  createWebLinkEnteryQuery,
  createMemeTagAssociation,
  tagCheckQuery } = require('../../db/queries');

const { verifyAToken, decodeToken } = require('../../jwt/jwt');

const router = express.Router();

const dangerStrings = ['SELECT', 'INSERT', 'DROP', 'DECLARE'];

const uploadIsValid = (username, description) => {
  if (!username) {
    return {
      valid: false,
      status: 401,
      message: 'No user was associated to this request'
    }
  } else if (
    description &&
    description.includes(';') &&
    dangerStrings.filter(s => description.toUpperCase().includes(s))
      .length
    ) {
    return {
      valid: false,
      status: 401,
      message: "invalid description"
    }
  ;
  } else {
    return {
      valid: true
    }
  }
  // TODO: tag check(similar to dangerStrings)
}

// TODO: export recRand, and router from other files then import
// TODO: add content ordering to queries in upload routes.

const recRand = (arr, final) => {
  const passing = Math.floor(Math.random() * arr.length);
  if (!final.includes(arr[passing])) {
    return arr[passing];
  } else {
    return recRand(arr, final);
  }
}

const onlyUnique = (value, index, self)  => {
  return self.indexOf(value) === index;
}

router.get('/preview/:id', async(req, res, next) => {
  try {
    
    const { id } = req.params;

    const results = previewQuery(id);

    if (!results.rows.length) {
      return res.status(400).send('no preview available');
    }
    const { preview_size, preview_format } = results.rows[0];

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
      "Content-Range": `bytes 0-${preview_size - 1}/${preview_size}`,
      "Content-Length": preview_size,
      "Content-Type": preview_format
    };
    res.writeHead(206, headers);

    memeObj.createReadStream().pipe(res);

  } catch (err) {
    next(err) // Pass errors to Express.
    res.status(err.status).json({
      error: err.message
    });
  }
})

router.get("/:name", async(req, res, next) => {
  try {
    console.log(`GET /m/meme/:name hit, name: ${req.params.name}`);
    const { name: s3_meme_name } = req.params;
    
    const memeName = s3_meme_name.slice(0, s3_meme_name.length - 2);
    const memePsqlQuery = await memeQuery(memeName);
    
    if (!memePsqlQuery.rows.length) {
      throw Error('Meme not found');
    }
    const meme = memePsqlQuery.rows[0];
    const contentRange = `${0}-${meme.size - 1}/${meme.size}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3_meme_name,
      Range: `bytes=${contentRange}`
    };
    let memeObj = {};
    try {
      memeObj = await s3.getObject(params);
    } catch (err) {
      next(err)
      return res.status(err.status).json({
        message: err.message
      })
    }
    if (meme.format.includes('video')){
      const headers = {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${contentRange}`,
        "Content-Length": meme.size,
        "Content-Type": meme.format
      };
      res.writeHead(206, headers);

      memeObj.createReadStream().pipe(res);

    } else if (meme.format.includes('image')) {
      res.status(200).json({
        not: 'done'
      })
    }
  } catch(err) {
    next(err) // Pass errors to Express.
    res.status(err.status).json({
      message: err.message
    })
  }
})

router.get("/imports/:n", async(req, res, next) => {
  try{
    if (req.query.token && !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    }

    let memeCount = await memeCountQuery();
    memeCount = memeCount.rows[0].count;

    let randomMemeResult = await memesFloorRandomQuery(memeCount, req.params.n);

    let names, nameGroups, formats = [];
    if (randomMemeResult && randomMemeResult.rows){
      names = randomMemeResult.rows.map(row => row.aws_name);
      nameGroups = randomMemeResult.rows.map(row => row.name_group).filter(onlyUnique);
      formats = randomMemeResult.rows.map(row => row.format);
      description = randomMemeResult.rows.map(row => row.description);
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
    return res.status(err.status).json({
      error: err.message
    });
  };
});

// upload a video/image/audio
router.post("/upload-meme", async(req, res, next) => {
  try {
    // TODO: implement on all routes
    console.log('POST /memes/upload-meme hit');

    let uploadError = '';
    const { files } = req;
    const { username, desc, tags } = req.body;
    const description = desc ? desc : '';



    if (!req.query.token || !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    }
    const decoded = decodeToken(req.query.token);

    const uploadCheck = uploadIsValid(username, desc);

    if (!uploadCheck.valid) {
      res.status(uploadCheck.status).json({
        message: uploadCheck.message
      })
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log("No files were uploaded.");
      // TODO: seems like it could be cleaner
      return res.status(400).send('No files were uploaded.');
    }

    const memeName = v4();
    let count = 0;
    
    // adding to Databases
    // S3
    // PostgrSQL

    while(count < Object.keys(files).length) {
      const key = `${memeName}_${count}`;
      const s3params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: files[count].data,
      }
      // S3
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

      const result = await createMemeEnteryQuery(params); 

      const memeTagId = result.rows[0].meme_tag_id;
  
      if (tags && tags.length <= 10) {
        for (let i = 0; i < tags.length; i++) {
          const tagCheck = await tagCheckQuery(tags[i]);
          if (availableCookieTags.includes(tags[i]) || tagCheck.rows.length) {
            // tag exists, create entry
            await createMemeTagEntry(tags[i], memeTagId);
          } else {
            // tag doesn't exist
            await createMemeTagEntry(tags[i], memeTagId);
            await createTagEntry(tags[i])
          }
          // TODO: tags not allowed to be created or added to
        } 
      } else if (tags && tags.length > 10) {
        res.status(401).json({
          message: "tag limit exceeded"
        })
      }

      if (uploadError) throw Error(uploadError);
      count++
    }
    res.status(201).json({
      meme: memeName
    });

  } catch (err) {
    next(err) // Pass errors to Express.
    return res.status(err.status).json({
      error: err.message
    });
  };
});

// upload a link
router.post("/upload-link", async(req, res, next) => {
  try {
    console.log('POST /memes/upload-link hit');

    if (!req.query.token || !verifyAToken(req.query.token)) {
      errorCode = 401
      return res.status(401).send("Cookie monster does not approve");
    }

    const decoded = decodeToken(req.query.token);

    const availableTags = [...decoded.public];

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

    const createdEntryReturn = await createWebLinkEnteryQuery(link, username, files.preview.size, files.preview.mimetype, desc);

    const web_link_id = createdEntryReturn.rows[0].web_link_id;

    // puts preview image in s3
    if (!fileDoesntExist) {
      const s3params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: web_link_id,
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
          await createMemeTagAssociation(allTags[i], web_link_id)
        }
      }
    }

    res.status(201).json({
      web_link_id: web_link_id
    })

  } catch(err) {
    next(err) // Pass errors to Express.
    return res.status(err.status).json({
      error: err.message
    });
  };
});

module.exports = router;