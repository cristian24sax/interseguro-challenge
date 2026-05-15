const path = require('path');
const express = require('express');
const requestLogger = require('./middleware/requestLogger.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const notFound = require('./middleware/notFound.middleware');
const apiV1Routes = require('./routes');

const publicDir = path.join(__dirname, '..', 'public');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Runtime config for static UI (Render / Cloud Run: set GO_API_URL in env)
  app.get('/config.js', (req, res) => {
    const goApiUrl = (process.env.GO_API_URL || '').trim().replace(/\/$/, '');
    res.setHeader('Cache-Control', 'no-store');
    res.type('application/javascript');
    res.send(`window.__INTERSEGURO_CONFIG__=${JSON.stringify({ goApiUrl })};`);
  });

  app.use(
    express.static(publicDir, {
      index: 'index.html',
      extensions: ['html'],
    }),
  );

  app.use('/api/v1', apiV1Routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
module.exports = {
  createApp,
};
