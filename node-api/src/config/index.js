require('dotenv').config();

const port = parseInt(process.env.PORT || '3000', 10);

if (Number.isNaN(port) || port <= 0) {
  throw new Error('PORT must be a positive integer');
}

module.exports = {
  port,
};
