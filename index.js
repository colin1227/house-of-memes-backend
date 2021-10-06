const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require("cors");
const bodyParser = require("body-parser");

require('dotenv').config();

const port = process.env.PORT || 9000;

const memes = require("./routes/memes/index");
const users = require("./routes/users/index");
const general = require("./routes/general/general");
const groups = require("./routes/groups/index");
const app = express();

app.use(fileUpload());

app.use(cors());

app.use("/memes/", memes);
app.use("/users/", users);
app.use("/groups/", groups);
app.use("/", general);


const server = app.listen(port, () => {
  console.log(`running on port ${port}`);
  setTimeout(()=> {
    console.log("Press Ctrl + C when done..");
  }, 1200);
});

server.keepAliveTimeout = 60000 * 2;

app.use(function(req, res, _){
  res.status(404);

  if (req.accepts('html')) {
    res.json({ url: `${req.url} not found, try again` });
    return;
  }

  if (req.accepts('json')) {
    res.json({ error: 'Not found, try again' });
    return;
  }

  res.type('txt').send('Not found, try again');
});