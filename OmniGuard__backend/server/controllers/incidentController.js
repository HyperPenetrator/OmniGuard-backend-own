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
const { triageIncident, ruleBasedTriage } = require('../services/triageService');
const { writeAuditLog } = require('../services/auditService');
const { getIncidentStats } = require('../services/statsService');
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

    // Admins have no filters, they see all incidents
    
    // Civilians can only see their own incidents
    if (req.user.role === 'civilian') {
      options.reportedByUserId = req.user.uid || req.user.userId;
    }

    // Responders can only see incidents assigned to their team
    if (req.user.role === 'responder' && (req.user.assignedTeam || req.user.responderTeam)) {
      options.assignedTeam = req.user.assignedTeam || req.user.responderTeam;
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
    if (req.user.role === 'civilian' && incident.reportedBy?.userId !== (req.user.uid || req.user.userId)) {
      throw new NotFoundError('Incident');
    }

    // Responders can only see incidents assigned to their team
    if (req.user.role === 'responder' && incident.assignedTeam !== (req.user.assignedTeam || req.user.responderTeam)) {
      throw new NotFoundError('Incident');
    }

    // Status Check: 'Closed' threats are only visible to the team that handled them and admins/coordinators
    if (incident.status === 'Closed' || incident.status === 'closed') {
      if (req.user.role === 'civilian') {
         throw new NotFoundError('Incident');
      }
    }

    sendSuccess(res, incident);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/incidents/stats
 * Get 'Active' and 'Closed' counts. 
 * Responder: only their assignedTeam. Admin: global across all teams.
 */
async function getStats(req, res, next) {
  try {
    const stats = await getIncidentStats(req.user);
    sendSuccess(res, stats);
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
    const { type, location, description, assignedTeam } = req.body;
    const logger = req.app.locals.logger;
    const env = req.app.locals.env;

    logger.info('Received incident creation request', {
      type,
      location: typeof location === 'string' ? location : (location?.sector || 'Object'),
      isPublic: !req.user,
    });

    // Run preliminary rule-based triage for immediate routing
    const preTriage = ruleBasedTriage(type, (location?.sector || 'Unknown Sector'));

    // Build incident data
    const incidentData = {
      incidentNumber: generateIncidentNumber(),
      type,
      location: {
        sector: typeof location === 'string' 
          ? location 
          : (typeof location?.sector === 'string' 
              ? location.sector 
              : (location?.sector?.sector || location?.address || 'G-Sector Alpha')),
        coordinates: location?.coordinates || (location?.lat ? { lat: location.lat, lng: location.lng } : null),
        address: location?.address || (typeof location === 'string' ? null : null),
      },
      severity: preTriage.severity || 'Medium',
      status: 'Reported',
      reportedBy: req.user ? {
        userId: req.user.uid || req.user.userId,
        role: req.user.role,
        name: req.user.name,
      } : {
        userId: 'anonymous_civilian',
        role: 'civilian',
        name: 'Anonymous',
      },
      assignedTeam: assignedTeam || preTriage.assignedTeam,
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
      reportedBy: req.user ? req.user.userId : 'anonymous',
    });

    // Trigger async Gemini triage (non-blocking)
    triageIncident(
      {
        incidentId: incident.id,
        type,
        location: incidentData.location,
        contextData: description,
        reportedBy: req.user ? { role: req.user.role, name: req.user.name } : { role: 'civilian', name: 'Anonymous' },
        assignedTeam: incidentData.assignedTeam,
      },
      env,
      logger
    )
      .then(async ({ result, model }) => {
        // Update incident with triage results
        await updateIncidentTriage(incident.id, { ...result, model });

        logger.info('Triage completed for incident', {
          incidentId: incident.id,
          model,
          severity: result.severity,
        });
      })
      .catch((triageError) => {
        logger.error('Background triage failed', {
          incidentId: incident.id,
          error: triageError.message,
        });
      });

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
    let { status, assignedTeam } = req.body;
    const logger = req.app.locals.logger;

    // Normalize status (handle snake_case from frontend)
    if (status === 'en_route') status = 'En Route';
    if (status === 'on_scene') status = 'On Scene';
    if (status === 'resolved') status = 'Resolved';

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

    const { previousState, updated } = await updateIncidentStatus(req.params.id, status, assignedTeam);

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
      previousState: { status: previousState.status, assignedTeam: previousState.assignedTeam },
      nextState: { status, assignedTeam: updated.assignedTeam },
    });

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

    sendSuccess(res, {
      message: 'SOS alert dispatched. All hands notified.',
      incident: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/incidents/:id/close
 * Close an incident. Update status to 'Closed' and log the event.
 */
async function closeIncident(req, res, next) {
  try {
    const logger = req.app.locals.logger;

    const { previousState, updated } = await updateIncidentStatus(req.params.id, 'Closed');

    logger.info('Incident closed', {
      requestId: req.requestId,
      incidentId: req.params.id,
      closedBy: req.user.userId,
    });

    writeAuditLog(logger, {
      action: 'INCIDENT_CLOSED',
      actorId: req.user.userId,
      actorRole: req.user.role,
      resourceType: 'incident',
      resourceId: req.params.id,
      requestId: req.requestId,
      ipAddress: req.ip,
      previousState: { status: previousState.status },
      nextState: { status: 'Closed' },
    });

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  getStats,
  create,
  updateStatus,
  remove,
  triggerSOS,
  closeIncident,
  VALID_STATUSES,
};
