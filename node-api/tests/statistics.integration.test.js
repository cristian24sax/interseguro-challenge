const http = require('http');
const { createApp } = require('../src/app');

/**
 * @param {import('express').Express} app
 * @param {string} method
 * @param {string} path
 * @param {object | null} body
 */
function request(app, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('invalid listen address'));
        return;
      }
      const payload = body ? JSON.stringify(body) : '';
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let raw = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            raw += chunk;
          });
          res.on('end', () => {
            server.close(() => {
              let parsed = null;
              if (raw) {
                try {
                  parsed = JSON.parse(raw);
                } catch (e) {
                  reject(e);
                  return;
                }
              }
              resolve({ status: res.statusCode, body: parsed });
            });
          });
        },
      );
      req.on('error', (err) => {
        server.close(() => reject(err));
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

describe('POST /api/v1/statistics', () => {
  const app = createApp();

  it('returns statistics for valid q and r', async () => {
    const res = await request(app, 'POST', '/api/v1/statistics', {
      q: [
        [1, 0],
        [0, 1],
      ],
      r: [
        [2, 3],
        [0, 4],
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      max: 4,
      min: 0,
      sum: 11,
      average: 1.375,
      elementCount: 8,
      q: { max: 1, min: 0, sum: 2, average: 0.5, count: 4 },
      r: { max: 4, min: 0, sum: 9, average: 2.25, count: 4 },
      isDiagonalQ: true,
      isDiagonalR: false,
      isDiagonal: false,
      isUpperTrapezoidalR: true,
      isOrthonormalColumnsQ: true,
    });
  });

  it('rejects invalid body', async () => {
    const res = await request(app, 'POST', '/api/v1/statistics', {
      q: [
        [1, 2],
        [3],
      ],
      r: [
        [1, 2],
        [3, 4],
      ],
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/rectangular/i);
  });

  it('returns 404 for unknown path', async () => {
    const res = await request(app, 'GET', '/api/v1/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
