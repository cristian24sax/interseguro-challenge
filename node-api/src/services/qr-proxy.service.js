const axios = require('axios');
const config = require('../config');

/**
 * Forwards QR factorization to the Go API, passing through the client Authorization header.
 * @param {object} body
 * @param {string | undefined} authorizationHeader
 */
async function forwardQRFactorization(body, authorizationHeader) {
  if (!config.goApiUrl) {
    const err = new Error('GO_API_URL is not configured on the server');
    err.statusCode = 503;
    throw err;
  }

  const url = `${config.goApiUrl}/api/v1/qr-factorization`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (authorizationHeader) {
    headers.Authorization = authorizationHeader;
  }

  return axios.post(url, body, {
    headers,
    timeout: config.goApiTimeoutMs,
    validateStatus: () => true,
  });
}

module.exports = {
  forwardQRFactorization,
};
