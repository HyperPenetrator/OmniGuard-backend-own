/**
 * OmniGuard Backend — Triage Controller
 * Handles manual re-triage requests (coordinator only).
 */

const { getIncidentById, updateIncidentTriage } = require('../services/firestoreService');
const { triageIncident } = require('../services/triageService');
const { writeAuditLog } = require('../services/auditService');
const { sendSuccess } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

/**
 * POST /api/triage/manual
 * Coordinator-initiated re-triage of an existing incident.
 * Forces a fresh Gemini analysis regardless of cached triage.
 */
async function manualTriage(req, res, next) {
  try {
    const { incidentId } = req.body;
    const logger = req.app.locals.logger;
    const env = req.app.locals.env;

    if (!incidentId) {
      throw new ValidationError('incidentId is required');
    }

    // Fetch existing incident
    const incident = await getIncidentById(incidentId);

    logger.info('Manual triage initiated', {
      requestId: req.requestId,
      incidentId,
      initiatedBy: req.user.userId,
    });

    // Run Gemini triage
    const { result, model } = await triageIncident(
      {
        type: incident.type,
        location: incident.location,
        contextData: incident.description,
        reportedBy: incident.reportedBy,
      },
      env,
      logger
    );

    // Update incident with fresh triage results
    const updated = await updateIncidentTriage(incidentId, { ...result, model });

    // Audit log
    writeAuditLog(logger, {
      action: 'MANUAL_TRIAGE',
      actorId: req.user.userId,
      actorRole: req.user.role,
      resourceType: 'incident',
      resourceId: incidentId,
      requestId: req.requestId,
      ipAddress: req.ip,
      previousState: { triage: incident.triage },
      nextState: { triage: result },
    });

    // WebSocket broadcast
    const wsService = req.app.locals.wsService;
    if (wsService) {
      wsService.broadcast('TRIAGE_COMPLETE', {
        incidentId,
        triage: result,
        model,
        initiatedBy: req.user.name,
      });
    }

    sendSuccess(res, {
      incident: updated,
      triage: result,
      model,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { manualTriage };
