const { failure } = require('../utils/response');

function notFound(req, res) {
  res.status(404).json(failure('Not found'));
}

module.exports = notFound;
