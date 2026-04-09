/**
 * OmniGuard Backend — Global Error Handler Middleware
 * Catches all errors thrown/forwarded via next(error), maps them to standardized
 * API responses, and logs with full context. Never leaks stack traces in production.
 */

const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

/**
 * Factory: creates the global error handler middleware.
 * Must be registered LAST in the Express middleware stack.
 * @param {import('winston').Logger} logger - Winston logger instance
 * @param {string} nodeEnv - Current NODE_ENV
 * @returns {Function} Express error-handling middleware (4 args)
 */
function createErrorHandler(logger, nodeEnv) {
  const isDev = nodeEnv === 'development';

  // eslint-disable-next-line no-unused-vars
  return function errorHandler(err, req, res, next) {
    // If headers already sent, delegate to Express default handler
    if (res.headersSent) {
      return next(err);
    }

    // Determine if this is a known operational error
    const isOperational = err instanceof AppError && err.isOperational;

    // Log the error with context
    const logPayload = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userId: req.user?.userId || null,
      statusCode: err.statusCode || 500,
      errorCode: err.code || 'INTERNAL_ERROR',
    };

    if (isOperational) {
      // Expected errors — log at warn level
      logger.warn(err.message, logPayload);
    } else {
      // Unexpected errors — log at error level with full stack
      logger.error(err.message, {
        ...logPayload,
        stack: err.stack,
      });
    }

    // Build response
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = isOperational
      ? err.message
      : isDev
        ? err.message // Show real message in dev only
        : 'An unexpected error occurred. Please try again later.';

    // Include details for operational errors, stack trace in dev for unexpected ones
    let details = null;
    if (isOperational && err.details) {
      details = err.details;
    } else if (isDev && !isOperational) {
      details = [{ stack: err.stack }];
    }

    sendError(res, statusCode, code, message, details);
  };
}

/**
 * Middleware for handling 404 — unknown routes.
 * Must be registered AFTER all route handlers, BEFORE the error handler.
 */
function notFoundHandler(req, res) {
  sendError(
    res,
    404,
    'ROUTE_NOT_FOUND',
    `The route ${req.method} ${req.originalUrl} does not exist`
  );
}

module.exports = { createErrorHandler, notFoundHandler };
