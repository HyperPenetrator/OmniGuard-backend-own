/**
 * OmniGuard Backend — Incident Controller
 * Handles all incident lifecycle operations: CRUD, SOS trigger, status updates.
 * Wires Firestore persistence, Gemini triage, audit logging, and WebSocket events.
 */

const {
  createIncident,
  getIncidentById,
  listIncidents,
  updateIncidentStatus,
  softDeleteIncident,
  activateSOS,
  generateIncidentNumber,
  updateIncidentTriage,
} = require('../services/firestoreService');
const { triageIncident } = require('../services/triageService');
const { writeAuditLog } = require('../services/auditService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');

// ── Valid status values (used for validation) ───────────
const VALID_STATUSES = ['Reported', 'Triaged', 'Dispatching', 'En Route', 'On Scene', 'Resolved', 'Closed'];
const RESPONDER_ALLOWED_STATUSES = ['En Route', 'On Scene'];

/**
 * GET /api/incidents
 * Paginated list with optional status/severity filters.
 * Civilians see only their own reports.
 */
async function list(req, res, next) {
  try {
    const {
      status,
      severity,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const options = {
      status: status || undefined,
      severity: severity || undefined,
      page: parseInt(page, 10) || 1,
      limit: Math.min(parseInt(limit, 10) || 20, 100), // Cap at 100
      sortBy,
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // Civilians can only see their own incidents
    if (req.user.role === 'civilian') {
      options.reportedByUserId = req.user.userId;
    }

    const { incidents, total } = await listIncidents(options);

    sendPaginated(res, incidents, {
      page: options.page,
      limit: options.limit,
      total,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/incidents/:id
 * Single incident with full tactical data.
 * Civilians can only see their own incidents.
 */
async function getById(req, res, next) {
  try {
    const incident = await getIncidentById(req.params.id);

    // Ownership check for civilians
    if (req.user.role === 'civilian' && incident.reportedBy?.userId !== req.user.userId) {
      throw new NotFoundError('Incident');
    }

    sendSuccess(res, incident);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/incidents
 * Create a new incident, auto-trigger Gemini triage, persist to Firestore.
 * Emits INCIDENT_CREATED WebSocket event.
 */
async function create(req, res, next) {
  try {
    const { type, location, description } = req.body;
    const logger = req.app.locals.logger;
    const env = req.app.locals.env;

    // Build incident data
    const incidentData = {
      incidentNumber: generateIncidentNumber(),
      type,
      location: {
        sector: location?.sector || location || 'Unknown',
        coordinates: location?.coordinates || null,
        address: location?.address || null,
      },
      severity: 'Medium', // Temporary — will be updated by triage
      status: 'Reported',
      reportedBy: {
        userId: req.user.userId,
        role: req.user.role,
        name: req.user.name,
      },
      assignedTeam: null,
      triage: null,
      sosActive: false,
      description: description || null,
    };

    // Persist to Firestore
    const incident = await createIncident(incidentData);

    logger.info('Incident created', {
      requestId: req.requestId,
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      type,
      reportedBy: req.user.userId,
    });

    // Audit log
    writeAuditLog(logger, {
      action: 'INCIDENT_CREATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      resourceType: 'incident',
      resourceId: incident.id,
      requestId: req.requestId,
      ipAddress: req.ip,
      nextState: incident,
    });

    // Trigger async Gemini triage (non-blocking)
    triageIncident(
      {
        type,
        location: incidentData.location,
        contextData: description,
        reportedBy: { role: req.user.role, name: req.user.name },
      },
      env,
      logger
    )
      .then(async ({ result, model }) => {
        // Update incident with triage results
        const updated = await updateIncidentTriage(incident.id, { ...result, model });

        logger.info('Triage completed for incident', {
          incidentId: incident.id,
          model,
          severity: result.severity,
        });

        // Emit WebSocket event if service is available
        const wsService = req.app.locals.wsService;
        if (wsService) {
          wsService.broadcast('TRIAGE_COMPLETE', {
            incidentId: incident.id,
            triage: result,
            model,
          });
        }
      })
      .catch((triageError) => {
        logger.error('Background triage failed', {
          incidentId: incident.id,
          error: triageError.message,
        });
      });

    // Emit WebSocket event
    const wsService = req.app.locals.wsService;
    if (wsService) {
      wsService.broadcast('INCIDENT_CREATED', incident);
    }

    sendSuccess(res, incident, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/incidents/:id/status
 * Update incident status. RBAC: responders can set En Route/On Scene only.
 * Coordinators can set any valid status.
 */
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const logger = req.app.locals.logger;

    if (!status || !VALID_STATUSES.includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        [{ field: 'status', message: `Must be one of: ${VALID_STATUSES.join(', ')}` }]
      );
    }

    // Responders can only set specific statuses
    if (req.user.role === 'responder' && !RESPONDER_ALLOWED_STATUSES.includes(status)) {
      throw new ValidationError(
        `Responders can only set status to: ${RESPONDER_ALLOWED_STATUSES.join(', ')}`
      );
    }

    const { previousState, updated } = await updateIncidentStatus(req.params.id, status);

    logger.info('Incident status updated', {
      requestId: req.requestId,
      incidentId: req.params.id,
      previousStatus: previousState.status,
      newStatus: status,
      updatedBy: req.user.userId,
    });

    // Audit log
    writeAuditLog(logger, {
      action: 'STATUS_UPDATED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      resourceType: 'incident',
      resourceId: req.params.id,
      requestId: req.requestId,
      ipAddress: req.ip,
      previousState: { status: previousState.status },
      nextState: { status },
    });

    // WebSocket broadcast
    const wsService = req.app.locals.wsService;
    if (wsService) {
      wsService.broadcast('INCIDENT_UPDATED', {
        incidentId: req.params.id,
        previousStatus: previousState.status,
        newStatus: status,
        updatedBy: req.user.name,
      });
    }

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/incidents/:id
 * Soft-delete an incident. Coordinator only.
 */
async function remove(req, res, next) {
  try {
    const logger = req.app.locals.logger;

    const previousState = await softDeleteIncident(req.params.id);

    logger.info('Incident soft-deleted', {
      requestId: req.requestId,
      incidentId: req.params.id,
      deletedBy: req.user.userId,
    });

    // Audit log
    writeAuditLog(logger, {
      action: 'INCIDENT_DELETED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      resourceType: 'incident',
      resourceId: req.params.id,
      requestId: req.requestId,
      ipAddress: req.ip,
      previousState,
    });

    // WebSocket broadcast (coordinators only)
    const wsService = req.app.locals.wsService;
    if (wsService) {
      wsService.broadcastToRole('coordinator', 'INCIDENT_DELETED', {
        incidentId: req.params.id,
        deletedBy: req.user.name,
      });
    }

    sendSuccess(res, { message: 'Incident deleted', incidentId: req.params.id });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/incidents/:id/sos
 * Trigger global SOS on an incident. Any authenticated user.
 * Broadcasts GLOBAL_SOS to all connected WebSocket clients.
 */
async function triggerSOS(req, res, next) {
  try {
    const logger = req.app.locals.logger;

    const updated = await activateSOS(req.params.id);

    logger.warn('🚨 SOS TRIGGERED', {
      requestId: req.requestId,
      incidentId: req.params.id,
      triggeredBy: req.user.userId,
      triggeredByRole: req.user.role,
    });

    // Audit log (critical — SOS is always logged)
    writeAuditLog(logger, {
      action: 'SOS_TRIGGERED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      resourceType: 'incident',
      resourceId: req.params.id,
      requestId: req.requestId,
      ipAddress: req.ip,
      nextState: { sosActive: true },
    });

    // WebSocket: broadcast to ALL users
    const wsService = req.app.locals.wsService;
    if (wsService) {
      wsService.broadcast('SOS_TRIGGERED', {
        incidentId: req.params.id,
        incidentNumber: updated.incidentNumber,
        type: updated.type,
        location: updated.location,
        triggeredBy: req.user.name,
        triggeredAt: new Date().toISOString(),
      });
    }

    sendSuccess(res, {
      message: 'SOS alert dispatched. All hands notified.',
      incident: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  updateStatus,
  remove,
  triggerSOS,
  VALID_STATUSES,
};
