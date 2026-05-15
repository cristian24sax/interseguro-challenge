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
