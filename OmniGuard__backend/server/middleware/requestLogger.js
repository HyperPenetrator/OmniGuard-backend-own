/**
 * OmniGuard Backend — Request Logging Middleware
 */

const createRequestLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        ip: req.ip,
      };

      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

      if (res.statusCode >= 500) {
        logger.error(message, logData);
      } else if (res.statusCode >= 400) {
        logger.warn(message, logData);
      } else {
        logger.info(message, logData);
      }
    });

    next();
  };
};

module.exports = { createRequestLogger };
