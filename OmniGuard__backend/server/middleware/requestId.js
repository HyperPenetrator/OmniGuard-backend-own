/**
 * OmniGuard Backend — Request ID Middleware
 * Attaches a UUID v4 to every incoming request for log correlation.
 * The ID is also returned in the X-Request-ID response header.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware: attaches req.requestId and sets X-Request-ID header.
 */
function requestIdMiddleware(req, res, next) {
  // Allow clients to pass their own request ID (useful for tracing across services)
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

module.exports = { requestIdMiddleware };
