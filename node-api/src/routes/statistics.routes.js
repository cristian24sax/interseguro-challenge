const express = require('express');
const statisticsController = require('../controllers/statistics.controller');
const { jwtAuth } = require('../middleware/jwt.middleware');

const router = express.Router();

router.post('/statistics', jwtAuth, statisticsController.computeStatistics);

module.exports = router;
