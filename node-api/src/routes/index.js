const express = require('express');
const authRoutes = require('./auth.routes');
const statisticsRoutes = require('./statistics.routes');

const router = express.Router();

router.use(authRoutes);
router.use(statisticsRoutes);

module.exports = router;
