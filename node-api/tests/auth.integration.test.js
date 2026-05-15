const http = require('http');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const config = require('../src/config');

function request(app, method, path, body = null, headers = {}) {
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
            ...headers,
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

function bearerToken(username = 'demo') {
  const token = jwt.sign({ sub: username }, config.jwtSecret, { expiresIn: '1h' });
  return { Authorization: `Bearer ${token}` };
}

describe('auth API', () => {
  const app = createApp();

  it('logs in with valid credentials', async () => {
    const res = await request(app, 'POST', '/api/v1/auth/login', {
      username: 'demo',
      password: 'interseguro',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.accessToken).toBe(res.body.data.token);
    expect(res.body.data.tokenType).toBe('Bearer');
    expect(res.body.data.expiresIn).toBe('1h');
    expect(res.body.data.username).toBe('demo');
  });

  it('rejects login with missing fields', async () => {
    const res = await request(app, 'POST', '/api/v1/auth/login', { username: 'demo' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/password/i);
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app, 'POST', '/api/v1/auth/login', {
      username: 'demo',
      password: 'wrong',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns current user for valid bearer token', async () => {
    const res = await request(app, 'GET', '/api/v1/auth/me', null, bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('demo');
  });

  it('rejects statistics without token', async () => {
    const res = await request(app, 'POST', '/api/v1/statistics', {
      q: [[1, 0], [0, 1]],
      r: [[2, 3], [0, 4]],
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
