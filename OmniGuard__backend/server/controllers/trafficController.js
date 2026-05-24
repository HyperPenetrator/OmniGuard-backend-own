/**
 * OmniGuard Backend — Traffic Analytics Controller
 * Handles secure admin/coordinator endpoint queries for traffic statistics.
 */

const { getTrafficStats } = require('../services/trafficService');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/stats/traffic
 * Returns all HTTP traffic metrics and recent logs.
 * Restricted to coordinators/admins via RBAC.
 */
async function getStats(req, res, next) {
  try {
    const stats = getTrafficStats();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
};
