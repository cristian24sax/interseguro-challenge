const express = require('express');
const statisticsRoutes = require('./statistics.routes');

const router = express.Router();

router.use(statisticsRoutes);

module.exports = router;
