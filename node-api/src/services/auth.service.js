const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { UnauthorizedError } = require('../utils/errors');

function login(username, password) {
  if (!username || !password) {
    throw new UnauthorizedError('Invalid username or password');
  }

  if (username !== config.authUsername) {
    throw new UnauthorizedError('Invalid username or password');
  }

  const valid = bcrypt.compareSync(password, config.authPasswordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid username or password');
  }

  const token = jwt.sign({ sub: username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return {
    token,
    accessToken: token,
    tokenType: 'Bearer',
    expiresIn: config.jwtExpiresIn,
    username,
  };
}

function verifyToken(token) {
  if (!token) {
    throw new UnauthorizedError('Missing access token');
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return { username: payload.sub };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

module.exports = {
  login,
  verifyToken,
};
