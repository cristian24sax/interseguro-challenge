const http = require('http');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const config = require('../src/config');
const { jwtAuth, extractBearerToken } = require('../src/middleware/jwt.middleware');

describe('jwt.middleware', () => {
  describe('extractBearerToken', () => {
    it('parses Bearer tokens case-insensitively', () => {
      expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
      expect(extractBearerToken('bearer token-value')).toBe('token-value');
      expect(extractBearerToken('Basic abc')).toBeNull();
      expect(extractBearerToken('')).toBeNull();
    });
  });

  describe('jwtAuth on POST /api/v1/statistics', () => {
    const app = createApp();

    function request(headers = {}, body = { q: [[1]], r: [[1]] }) {
      return new Promise((resolve, reject) => {
        const server = http.createServer(app);
        server.listen(0, () => {
          const addr = server.address();
          const payload = JSON.stringify(body);
          const req = http.request(
            {
              hostname: '127.0.0.1',
              port: addr.port,
              path: '/api/v1/statistics',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers,
              },
            },
            (res) => {
              let raw = '';
              res.on('data', (chunk) => {
                raw += chunk;
              });
              res.on('end', () => {
                server.close(() => {
                  resolve({
                    status: res.statusCode,
                    body: raw ? JSON.parse(raw) : null,
                  });
                });
              });
            },
          );
          req.on('error', (err) => server.close(() => reject(err)));
          req.write(payload);
          req.end();
        });
      });
    }

    it('rejects requests without Authorization header', async () => {
      const res = await request();
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/missing access token/i);
    });

    it('rejects expired tokens', async () => {
      const expired = jwt.sign({ sub: 'demo' }, config.jwtSecret, { expiresIn: '-1s' });
      const res = await request({ Authorization: `Bearer ${expired}` });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('rejects invalid tokens', async () => {
      const res = await request({ Authorization: 'Bearer not-a-valid-jwt' });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid access token/i);
    });

    it('allows valid Bearer tokens', async () => {
      const token = jwt.sign({ sub: 'demo' }, config.jwtSecret, { expiresIn: '1h' });
      const res = await request(
        { Authorization: `Bearer ${token}` },
        {
          q: [
            [1, 0],
            [0, 1],
          ],
          r: [
            [2, 3],
            [0, 4],
          ],
        },
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('jwtAuth unit', () => {
    it('attaches req.user when token is valid', () => {
      const token = jwt.sign({ sub: 'demo' }, config.jwtSecret, { expiresIn: '1h' });
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = jest.fn();

      jwtAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({ username: 'demo' });
    });

    it('forwards UnauthorizedError when token is missing', () => {
      const req = { headers: {} };
      const next = jest.fn();

      jwtAuth(req, {}, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
