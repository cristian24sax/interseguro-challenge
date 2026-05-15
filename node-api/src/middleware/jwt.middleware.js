const authService = require('../services/auth.service');

/**
 * Extracts a Bearer token from the Authorization header (case-insensitive scheme).
 * @param {string | undefined} headerValue
 * @returns {string | null}
 */
function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') return null;

  const parts = headerValue.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;

  const token = parts[1].trim();
  return token || null;
}

/**
 * Express middleware: validates JWT Bearer tokens (HS256, shared JWT_SECRET).
 * Sets req.user = { username } on success; forwards UnauthorizedError to error handler.
 */
function jwtAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    req.user = authService.verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  jwtAuth,
  extractBearerToken,
};
