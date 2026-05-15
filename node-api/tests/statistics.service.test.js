const {
  computeStatisticsForQR,
} = require('../src/services/statistics.service');

describe('computeStatisticsForQR', () => {
  it('aggregates scalars across Q and R', () => {
    const out = computeStatisticsForQR({
      q: [
        [1, 0],
        [0, 1],
      ],
      r: [
        [2, 0],
        [0, 3],
      ],
    });
    expect(out.max).toBe(3);
    expect(out.min).toBe(0);
    expect(out.sum).toBe(7);
    expect(out.average).toBe(7 / 8);
    expect(out.elementCount).toBe(8);
    expect(out.q.sum).toBe(2);
    expect(out.r.sum).toBe(5);
  });

  it('detects upper-trapezoidal R', () => {
    const out = computeStatisticsForQR({
      q: [[1, 0], [0, 1]],
      r: [
        [2, 3],
        [0, 4],
      ],
    });
    expect(out.isUpperTrapezoidalR).toBe(true);
  });

  it('detects orthonormal columns in Q', () => {
    const out = computeStatisticsForQR({
      q: [
        [1, 0],
        [0, 1],
      ],
      r: [[1]],
    });
    expect(out.isOrthonormalColumnsQ).toBe(true);
  });

  it('rejects orthonormal columns when n > m', () => {
    const out = computeStatisticsForQR({
      q: [
        [1, 0, 0],
        [0, 1, 0],
      ],
      r: [[1]],
    });
    expect(out.isOrthonormalColumnsQ).toBe(false);
  });
});
