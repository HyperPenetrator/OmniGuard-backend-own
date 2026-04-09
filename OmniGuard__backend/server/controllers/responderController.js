/**
 * OmniGuard Backend — Responder Controller
 * Handles responder listing and location updates.
 */

const {
  listResponders,
  getResponderById,
  updateResponderLocation,
} = require('../services/firestoreService');
const { sendSuccess } = require('../utils/response');
const { writeAuditLog } = require('../services/auditService');

/**
 * GET /api/responders
 * List responders with optional teamType/status filters.
 * Responders can only see themselves; coordinators see all.
 */
async function list(req, res, next) {
  try {
    const { teamType, status } = req.query;
    const options = {};

    if (teamType) options.teamType = teamType;
    if (status) options.status = status;

    let responders = await listResponders(options);

    // Responders can only see their own entry
    if (req.user.role === 'responder') {
      responders = responders.filter((r) => r.userId === req.user.userId);
    }

    sendSuccess(res, responders);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/responders/:id/location
 * Update a responder's GPS coordinates.
 * Responders can only update their own; coordinators can update any.
 */
async function updateLocation(req, res, next) {
  try {
    const { lat, lng } = req.body;
    const logger = req.app.locals.logger;

    // Ownership check for responders
    if (req.user.role === 'responder') {
      const responder = await getResponderById(req.params.id);
      if (responder.userId !== req.user.userId) {
        const { AuthorizationError } = require('../utils/errors');
        throw new AuthorizationError('You can only update your own location');
      }
    }

    const updated = await updateResponderLocation(req.params.id, { lat, lng });

    logger.info('Responder location updated', {
      requestId: req.requestId,
      responderId: req.params.id,
      lat,
      lng,
      updatedBy: req.user.userId,
    });

    // WebSocket: broadcast to coordinators
    const wsService = req.app.locals.wsService;
    if (wsService) {
      wsService.broadcastToRole('coordinator', 'RESPONDER_LOCATION_UPDATE', {
        responderId: req.params.id,
        name: updated.name,
        lat,
        lng,
        updatedAt: new Date().toISOString(),
      });
    }

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

module.exports = { list, updateLocation };
