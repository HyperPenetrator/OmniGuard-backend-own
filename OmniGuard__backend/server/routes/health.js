/**
 * OmniGuard Backend — Health Check Route
 * Returns system status: uptime, DB connectivity, WebSocket connections, Gemini availability.
 */

const express = require('express');
const { sendSuccess } = require('../utils/response');
const { checkFirebaseHealth } = require('../config/firebase');

const router = express.Router();

/**
 * GET /api/health
 * System health check — returns operational status of all subsystems.
 * Protected: coordinator-only in production (open in dev for convenience).
 */
router.get('/', async (req, res, next) => {
  try {
    const startTime = Date.now();

    // Check Firestore connectivity
    const dbHealthy = await checkFirebaseHealth();

    // Get WebSocket stats if available
    const wsService = req.app.locals.wsService;
    const wsConnections = wsService ? wsService.getConnectionCount() : 0;

    // Check Gemini API reachability (lightweight — just verifies key exists)
    const geminiConfigured = !!req.app.locals.env?.GEMINI_API_KEY;

    const latencyMs = Date.now() - startTime;

    sendSuccess(res, {
      status: dbHealthy ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      uptimeFormatted: formatUptime(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbHealthy ? 'connected' : 'disconnected',
          latencyMs,
        },
        websocket: {
          status: wsConnections >= 0 ? 'active' : 'inactive',
          activeConnections: wsConnections,
        },
        geminiAI: {
          status: geminiConfigured ? 'configured' : 'not_configured',
          model: req.app.locals.env?.GEMINI_MODEL || 'unknown',
        },
      },
      environment: req.app.locals.env?.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      memoryUsage: {
        rss: formatBytes(process.memoryUsage().rss),
        heapUsed: formatBytes(process.memoryUsage().heapUsed),
        heapTotal: formatBytes(process.memoryUsage().heapTotal),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Format seconds into human-readable uptime string.
 * @param {number} seconds
 * @returns {string}
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Format bytes to human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  const mb = (bytes / 1024 / 1024).toFixed(2);
  return `${mb} MB`;
}

module.exports = router;
