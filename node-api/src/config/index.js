require('dotenv').config();
const bcrypt = require('bcryptjs');

const port = parseInt(process.env.PORT || '3000', 10);
if (Number.isNaN(port) || port <= 0) {
  throw new Error('PORT must be a positive integer');
}

const jwtSecret = process.env.JWT_SECRET || 'interseguro-dev-secret-change-me';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
const authUsername = process.env.AUTH_USERNAME || 'demo';
const authPassword = process.env.AUTH_PASSWORD || 'interseguro';
const authPasswordHash = bcrypt.hashSync(authPassword, 10);
const goApiUrl = (process.env.GO_API_URL || '').trim().replace(/\/$/, '');
const goApiTimeoutMs = parseInt(process.env.GO_API_TIMEOUT_MS || '60000', 10);

module.exports = {
  port,
  jwtSecret,
  jwtExpiresIn,
  authUsername,
  authPasswordHash,
  goApiUrl,
  goApiTimeoutMs,
};
