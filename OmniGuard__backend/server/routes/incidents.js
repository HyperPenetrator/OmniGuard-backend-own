/**
 * OmniGuard Backend — Incident Routes
 * Full CRUD + SOS endpoint for incident lifecycle management.
 * All routes require JWT auth. Write operations require specific roles.
 */

const express = require('express');
const { z } = require('zod');
const incidentController = require('../controllers/incidentController');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

const router = express.Router();

// ── Zod Schemas ─────────────────────────────────────────

const createIncidentSchema = z.object({
  type: z.string().min(3, 'Incident type must be at least 3 characters').max(100),
  location: z.union([
    z.string().min(1),
    z.object({
      sector: z.string().min(1),
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }).optional(),
      address: z.string().optional(),
    }),
  ]),
  description: z.string().max(1000).optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

// ── Route Registration ──────────────────────────────────
// NOTE: verifyToken middleware is applied globally in server.js for /api/incidents

/**
 * GET /api/incidents
 * Paginated list with status/severity filters.
 * All authenticated users (civilians see own only — controlled in controller).
 */
router.get('/', incidentController.list);

/**
 * GET /api/incidents/:id
 * Single incident detail.
 */
router.get('/:id', incidentController.getById);

/**
 * POST /api/incidents
 * Create a new incident + trigger AI triage.
 * All authenticated users can report.
 */
router.post('/', validate(createIncidentSchema), incidentController.create);

/**
 * PATCH /api/incidents/:id/status
 * Update incident status.
 * Coordinators: all statuses. Responders: En Route, On Scene only.
 */
router.patch(
  '/:id/status',
  requireRole('coordinator', 'responder'),
  validate(updateStatusSchema),
  incidentController.updateStatus
);

/**
 * DELETE /api/incidents/:id
 * Soft-delete. Coordinator only.
 */
router.delete('/:id', requireRole('coordinator'), incidentController.remove);

/**
 * POST /api/incidents/:id/sos
 * Trigger global SOS alert. Any authenticated user.
 */
router.post('/:id/sos', incidentController.triggerSOS);

module.exports = router;
