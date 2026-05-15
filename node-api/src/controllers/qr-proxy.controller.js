const qrProxyService = require('../services/qr-proxy.service');

async function factorize(req, res, next) {
  try {
    const upstream = await qrProxyService.forwardQRFactorization(
      req.body,
      req.headers.authorization,
    );
    res.status(upstream.status).json(upstream.data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  factorize,
};
