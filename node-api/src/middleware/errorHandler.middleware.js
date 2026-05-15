const { failure } = require('../utils/response');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json(failure(message));
}

module.exports = errorHandler;
