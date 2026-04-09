/**
 * OmniGuard Backend — Responder Routes
 * GET   /api/responders           — list responders
 * PATCH /api/responders/:id/location — update GPS location
 */

const express = require('express');
const { z } = require('zod');
const responderController = require('../controllers/responderController');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

const router = express.Router();

// ── Zod Schemas ─────────────────────────────────────────

const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ── Route Registration ──────────────────────────────────

/**
 * GET /api/responders
 * Responders see own entry; coordinators see all.
 */
router.get(
  '/',
  requireRole('coordinator', 'responder'),
  responderController.list
);

/**
 * PATCH /api/responders/:id/location
 * Responders update own location; coordinators can update any.
 */
router.patch(
  '/:id/location',
  requireRole('coordinator', 'responder'),
  validate(updateLocationSchema),
  responderController.updateLocation
);

module.exports = router;
