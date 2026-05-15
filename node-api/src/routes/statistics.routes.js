const express = require('express');
const statisticsController = require('../controllers/statistics.controller');

const router = express.Router();

router.post('/statistics', statisticsController.computeStatistics);

module.exports = router;
