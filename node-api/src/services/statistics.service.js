const {
  flattenMatrix,
  isDiagonalMatrix,
  isUpperTrapezoidal,
  hasOrthonormalColumns,
} = require('../utils/matrix.utils');

/**
 * @param {number[]} values
 */
function scalarStats(values) {
  const sum = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const count = values.length;
  const average = sum / count;
  return { max, min, sum, average, count };
}

/**
 * Statistics for QR factors (Q, R) produced by the Go API / Gonum.
 * Combines scalar aggregates across both matrices and adds QR-structure flags.
 *
 * @param {{ q: number[][], r: number[][] }} matrices
 */
function computeStatisticsForQR(matrices) {
  const { q, r } = matrices;

  const qFlat = flattenMatrix(q);
  const rFlat = flattenMatrix(r);
  const combined = [...qFlat, ...rFlat];

  const qStats = scalarStats(qFlat);
  const rStats = scalarStats(rFlat);
  const overall = scalarStats(combined);

  const isDiagonalQ = isDiagonalMatrix(q);
  const isDiagonalR = isDiagonalMatrix(r);

  return {
    max: overall.max,
    min: overall.min,
    average: overall.average,
    sum: overall.sum,
    elementCount: overall.count,
    q: qStats,
    r: rStats,
    isDiagonalQ,
    isDiagonalR,
    isDiagonal: isDiagonalQ && isDiagonalR,
    isUpperTrapezoidalR: isUpperTrapezoidal(r),
    isOrthonormalColumnsQ: hasOrthonormalColumns(q),
  };
}

module.exports = {
  computeStatistics: computeStatisticsForQR,
  computeStatisticsForQR,
};
