/**
 * OmniGuard Backend — Traffic Analytics Routes
 * Restricted strictly to coordinators and admins.
 */

const express = require('express');
const trafficController = require('../controllers/trafficController');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

/**
 * GET /api/traffic
 * Fetch in-memory traffic statistics and logs.
 * Restricted to: coordinator, admin
 */
router.get('/', requireRole('coordinator', 'admin'), trafficController.getStats);

module.exports = router;
