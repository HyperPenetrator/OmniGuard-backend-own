/**
 * OmniGuard Backend — Audit Service
 * Writes audit log entries to Firestore for compliance and traceability.
 *
 * Implementation: Phase 4 (wired into incident operations)
 */

const { getDb } = require('../config/firebase');

const AUDIT_COLLECTION = 'audit_log';

/**
 * Write an audit log entry to Firestore.
 * Non-blocking — fires and forgets, logs errors silently.
 *
 * @param {object} logger - Winston logger instance
 * @param {object} entry
 * @param {string} entry.action - e.g., 'INCIDENT_CREATED', 'SOS_TRIGGERED'
 * @param {string} entry.actorId - userId who performed the action
 * @param {string} entry.actorRole - Role of the actor
 * @param {string} entry.resourceType - e.g., 'incident', 'responder'
 * @param {string} entry.resourceId - ID of the affected resource
 * @param {string} [entry.requestId] - Correlation ID
 * @param {string} [entry.ipAddress] - Client IP
 * @param {object} [entry.previousState] - State before change
 * @param {object} [entry.nextState] - State after change
 */
async function writeAuditLog(logger, entry) {
  try {
    const db = getDb();
    await db.collection(AUDIT_COLLECTION).add({
      ...entry,
      timestamp: new Date(),
    });
  } catch (error) {
    // Audit failures should never crash the main operation
    if (logger) {
      logger.error('Failed to write audit log', {
        error: error.message,
        entry,
      });
    }
  }
}

module.exports = { writeAuditLog, AUDIT_COLLECTION };
