const authValidator = require('../validators/auth.validator');
const authService = require('../services/auth.service');
const { success } = require('../utils/response');

async function login(req, res, next) {
  try {
    const credentials = authValidator.validateLoginPayload(req.body);
    const data = authService.login(credentials.username, credentials.password);
    res.status(200).json(success(data, 'Login successful'));
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    res.status(200).json(success({ username: req.user.username }));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  me,
};
