const { ValidationError } = require('../utils/errors');

function validateLoginPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username) {
    throw new ValidationError('username is required');
  }
  if (!password) {
    throw new ValidationError('password is required');
  }

  return { username, password };
}

module.exports = {
  validateLoginPayload,
};
