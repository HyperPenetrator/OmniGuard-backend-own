/**
 * OmniGuard Backend — Real-time Sync Service
 * Bridges Firestore onSnapshot changes to WebSocket broadcasts.
 * Ensures all connected clients receive live incident updates
 * regardless of which API endpoint triggered the change.
 */

const { subscribeToIncidents } = require('./firestoreService');

/**
 * Start real-time Firestore → WebSocket synchronization.
 * Subscribes to incident collection changes and pipes them into
 * the WebSocket broadcast system.
 *
 * @param {object} wsService - WebSocket service (from wsService.js)
 * @param {import('winston').Logger} logger - Winston logger
 * @returns {Function} Unsubscribe function to stop the listener
 */
function startRealtimeSync(wsService, logger) {
  logger.info('Starting Firestore → WebSocket real-time sync...');

  const unsubscribe = subscribeToIncidents((changeType, incidentData) => {
    // Map Firestore change types to WebSocket events
    const eventMap = {
      added: 'INCIDENT_CREATED',
      modified: 'INCIDENT_UPDATED',
      removed: 'INCIDENT_DELETED',
    };

    const event = eventMap[changeType];
    if (!event) return;

    // Check if this is an SOS activation
    if (changeType === 'modified' && incidentData.sosActive) {
      wsService.broadcast('SOS_TRIGGERED', {
        incidentId: incidentData.id,
        incidentNumber: incidentData.incidentNumber,
        type: incidentData.type,
        location: incidentData.location,
        source: 'firestore-sync',
      });
    }

    // Broadcast the change to all connected clients
    // (deleted events go to coordinators only)
    if (changeType === 'removed') {
      wsService.broadcastToRole('coordinator', event, {
        incidentId: incidentData.id,
        changeType,
        source: 'firestore-sync',
      });
    } else {
      wsService.broadcast(event, {
        incident: incidentData,
        changeType,
        source: 'firestore-sync',
      });
    }

    logger.debug(`Firestore sync: ${event}`, {
      incidentId: incidentData.id,
      changeType,
    });
  });

  logger.info('✔ Firestore real-time sync active');

  return unsubscribe;
}

module.exports = { startRealtimeSync };
