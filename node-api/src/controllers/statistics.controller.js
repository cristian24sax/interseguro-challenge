const statisticsValidator = require('../validators/statistics.validator');
const statisticsService = require('../services/statistics.service');
const { success } = require('../utils/response');

async function computeStatistics(req, res, next) {
  try {
    const matrices = statisticsValidator.validateStatisticsPayload(req.body);
    const data = statisticsService.computeStatistics(matrices);
    res.status(200).json(success(data));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  computeStatistics,
};
