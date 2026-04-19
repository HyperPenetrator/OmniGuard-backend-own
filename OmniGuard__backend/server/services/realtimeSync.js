/**
 * OmniGuard Backend — Real-time Sync Service
 * Bridges Firestore onSnapshot changes to WebSocket broadcasts.
 * Ensures all connected clients receive live incident updates
 * regardless of which API endpoint triggered the change.
 */

const { subscribeToIncidents, subscribeToResponders } = require('./firestoreService');
const { SyncHandler } = require('./syncHandler');

/**
 * Start real-time Firestore → WebSocket synchronization.
 * 
 * @param {object} wsService - WebSocket service
 * @param {import('winston').Logger} logger - Winston logger
 * @returns {Function} Unsubscribe function
 */
function startRealtimeSync(wsService, logger) {
  logger.info('Starting Firestore → WebSocket real-time sync...');

  const handler = new SyncHandler(wsService, logger);

  // Subscribe to Incident changes
  const incidentUnsub = subscribeToIncidents((changeType, incidentData) => {
    handler.handleIncidentChange(changeType, incidentData).catch(err => {
      logger.error('Error handling incident change sync:', err);
    });
  });

  // Subscribe to Responder location updates
  const responderUnsub = subscribeToResponders((changeType, responderData) => {
    handler.handleResponderUpdate(changeType, responderData);
  });

  logger.info('✔ Firestore real-time sync active (Incidents + Responders)');

  return () => {
    incidentUnsub();
    responderUnsub();
  };
}

module.exports = { startRealtimeSync };
