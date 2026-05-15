const { ValidationError } = require('../utils/errors');

function assertDefined(name, value) {
  if (value === undefined || value === null) {
    throw new ValidationError(`Missing required field: ${name}`);
  }
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * @param {unknown} m
 * @param {string} name
 * @returns {number[][]}
 */
function validateNumericMatrix(m, name) {
  assertDefined(name, m);
  if (!Array.isArray(m)) {
    throw new ValidationError(`${name} must be an array`);
  }
  if (m.length === 0) {
    throw new ValidationError(`${name} must not be empty`);
  }

  const cols = m[0].length;
  if (cols === 0) {
    throw new ValidationError(`${name} must be rectangular (first row is empty)`);
  }

  for (let i = 0; i < m.length; i += 1) {
    const row = m[i];
    if (!Array.isArray(row)) {
      throw new ValidationError(`${name} row ${i} must be an array`);
    }
    if (row.length !== cols) {
      throw new ValidationError(`${name} must be rectangular`);
    }
    for (let j = 0; j < row.length; j += 1) {
      const v = row[j];
      if (v === null) {
        throw new ValidationError(`${name} contains null at [${i}][${j}]`);
      }
      if (!isFiniteNumber(v)) {
        throw new ValidationError(`${name} must contain only finite numbers`);
      }
    }
  }

  return /** @type {number[][]} */ (m);
}

/**
 * @param {unknown} body
 * @returns {{ q: number[][], r: number[][] }}
 */
function validateStatisticsPayload(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const q = validateNumericMatrix(body.q, 'q');
  const r = validateNumericMatrix(body.r, 'r');

  return { q, r };
}

module.exports = {
  validateStatisticsPayload,
};
