const EPS = 1e-9;
const ORTHO_EPS = 1e-5;

/**
 * @param {number[][]} matrix
 * @returns {number[]}
 */
function flattenMatrix(matrix) {
  const out = [];
  for (const row of matrix) {
    for (const v of row) {
      out.push(v);
    }
  }
  return out;
}

/**
 * @param {number[][]} matrix
 * @returns {boolean}
 */
function isSquare(matrix) {
  return matrix.length > 0 && matrix.length === matrix[0].length;
}

/**
 * True if square and all off-diagonal entries are ~0.
 * @param {number[][]} matrix
 * @returns {boolean}
 */
function isDiagonalMatrix(matrix) {
  if (!isSquare(matrix)) {
    return false;
  }
  const n = matrix.length;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i !== j && Math.abs(matrix[i][j]) > EPS) {
        return false;
      }
    }
  }
  return true;
}

/**
 * @param {number[][]} a rows x cols
 * @returns {number[][]} cols x rows
 */
function transpose(a) {
  const rows = a.length;
  const cols = a[0].length;
  const t = [];
  for (let j = 0; j < cols; j += 1) {
    const row = [];
    for (let i = 0; i < rows; i += 1) {
      row.push(a[i][j]);
    }
    t.push(row);
  }
  return t;
}

/**
 * @param {number[][]} a m x k
 * @param {number[][]} b k x n
 * @returns {number[][]} m x n
 */
function matMul(a, b) {
  const m = a.length;
  const k = a[0].length;
  const k2 = b.length;
  const n = b[0].length;
  if (k !== k2) {
    throw new Error('matMul: dimension mismatch');
  }
  const out = [];
  for (let i = 0; i < m; i += 1) {
    const row = [];
    for (let j = 0; j < n; j += 1) {
      let s = 0;
      for (let p = 0; p < k; p += 1) {
        s += a[i][p] * b[p][j];
      }
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

/**
 * R factor in QR is upper trapezoidal: R[i][j] ≈ 0 when i > j.
 * @param {number[][]} matrix
 * @returns {boolean}
 */
function isUpperTrapezoidal(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols && j < i; j += 1) {
      if (Math.abs(matrix[i][j]) > EPS) {
        return false;
      }
    }
  }
  return true;
}

/**
 * True if Q has orthonormal columns (QᵀQ ≈ I), which holds for full QR when m >= n.
 * If there are more columns than rows, orthonormal columns are impossible in ℝ^m.
 * @param {number[][]} q
 * @returns {boolean}
 */
function hasOrthonormalColumns(q) {
  const m = q.length;
  const n = q[0].length;
  if (n > m) {
    return false;
  }
  const qt = transpose(q);
  const qtq = matMul(qt, q);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const want = i === j ? 1 : 0;
      if (Math.abs(qtq[i][j] - want) > ORTHO_EPS) {
        return false;
      }
    }
  }
  return true;
}

module.exports = {
  flattenMatrix,
  isDiagonalMatrix,
  transpose,
  matMul,
  isUpperTrapezoidal,
  hasOrthonormalColumns,
};
