const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_ID,
  region: 'us-east-2'
});

module.exports = { s3 };
