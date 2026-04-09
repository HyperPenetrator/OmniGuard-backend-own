/**
 * OmniGuard Backend — Triage Routes
 * POST /api/triage/manual — coordinator-initiated re-triage
 */

const express = require('express');
const { z } = require('zod');
const { manualTriage } = require('../controllers/triageController');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

const router = express.Router();

const manualTriageSchema = z.object({
  incidentId: z.string().min(1, 'incidentId is required'),
});

/**
 * POST /api/triage/manual
 * Coordinator only — triggers a fresh Gemini analysis on an existing incident.
 */
router.post(
  '/manual',
  requireRole('coordinator'),
  validate(manualTriageSchema),
  manualTriage
);

module.exports = router;
