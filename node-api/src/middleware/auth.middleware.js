const { jwtAuth, extractBearerToken } = require('./jwt.middleware');

/** @deprecated Use jwtAuth from jwt.middleware.js */
const authenticate = jwtAuth;

module.exports = {
  authenticate,
  jwtAuth,
  extractBearerToken,
};
