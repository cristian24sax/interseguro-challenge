const express = require('express');
const authRoutes = require('./auth.routes');
const qrRoutes = require('./qr.routes');
const statisticsRoutes = require('./statistics.routes');

const router = express.Router();

router.use(authRoutes);
router.use(qrRoutes);
router.use(statisticsRoutes);

module.exports = router;
