/**
 * OmniGuard Backend — Input Sanitization Middleware
 * Sanitizes all string values in request bodies to prevent XSS injection.
 */

const xss = require('xss');

/**
 * Options for the xss library — allow no HTML tags at all.
 */
const xssOptions = {
  whiteList: {},          // No tags allowed
  stripIgnoreTag: true,   // Strip tags not in whitelist
  stripIgnoreTagBody: ['script', 'style'], // Remove script/style content entirely
};

/**
 * Recursively sanitize all string values in an object.
 * @param {any} value - Input to sanitize
 * @returns {any} Sanitized output
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return xss(value, xssOptions);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Middleware: sanitizes req.body, req.query, and req.params against XSS.
 */
function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  next();
}

module.exports = { sanitizeMiddleware, sanitizeValue };
