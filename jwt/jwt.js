const jwt = require('jsonwebtoken');

const signAToken = (obj) => {
  return jwt.sign(obj, process.env.JWT_SECRET);
}

const verifyAToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return false;
  }
}

const decodeToken = (token) => {
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return jwt.decode(token);
  } catch (err) {
    return false;
  }
}


module.exports = { signAToken, verifyAToken, decodeToken };
