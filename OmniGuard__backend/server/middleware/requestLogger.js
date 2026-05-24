/**
 * OmniGuard Backend — Request Logging Middleware
 * Intercepts HTTP requests to log them via Winston, feed the traffic analytics service,
 * and broadcast real-time metric updates strictly to authorized coordinators/admins.
 */

const { recordRequest, getTrafficStats } = require('../services/trafficService');

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

      // Feed the traffic service
      try {
        const logEntry = recordRequest(req, res, duration);

        // Real-time WebSocket broadcast to coordinators/admins ONLY
        const wsService = req.app?.locals?.wsService;
        if (wsService) {
          const stats = getTrafficStats();
          // Persona B security check: strictly broadcast to the 'coordinator' role/room
          wsService.broadcastToRole('coordinator', 'TRAFFIC_UPDATE', {
            latestLog: logEntry,
            summary: stats.summary,
            statusCodes: stats.statusCodes,
            methods: stats.methods,
          });
        }
      } catch (err) {
        logger.warn('Failed to record traffic stats or broadcast WS event', { error: err.message });
      }
    });

    next();
  };
};

module.exports = { createRequestLogger };

