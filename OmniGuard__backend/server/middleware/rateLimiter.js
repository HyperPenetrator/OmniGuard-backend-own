/**
 * OmniGuard Backend — Rate Limiting Middleware
 * Configures global and per-route rate limiters.
 */

const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

/**
 * Create the global API rate limiter.
 * Default: 100 requests per 15-minute window.
 * @param {object} env - Validated environment config
 * @returns {Function} Express middleware
 */
function createGlobalLimiter(env) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,  // Disable X-RateLimit-* headers
    handler: (req, res) => {
      sendError(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.');
    },
    keyGenerator: (req) => {
      // Use X-Forwarded-For in production (behind reverse proxy), fallback to IP
      return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    },
  });
}

/**
 * Create an auth-specific rate limiter (stricter).
 * Default: 10 attempts per 15-minute window.
 * @param {object} env - Validated environment config
 * @returns {Function} Express middleware
 */
function createAuthLimiter(env) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      sendError(
        res,
        429,
        'AUTH_RATE_LIMIT_EXCEEDED',
        'Too many authentication attempts. Please wait before trying again.'
      );
    },
    keyGenerator: (req) => {
      return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    },
    // Skip successful requests from counting toward the limit
    skipSuccessfulRequests: false,
  });
}

module.exports = { createGlobalLimiter, createAuthLimiter };
