const express = require('express');
const qrProxyController = require('../controllers/qr-proxy.controller');
const { jwtAuth } = require('../middleware/jwt.middleware');

const router = express.Router();

router.post('/qr-factorization', jwtAuth, qrProxyController.factorize);

module.exports = router;
