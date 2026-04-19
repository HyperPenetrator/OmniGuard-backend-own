/**
 * OmniGuard Backend — Firestore Service
 * Full CRUD operations for incidents, users, and responders collections.
 * All operations use the centralized Firebase Admin SDK.
 */

const { getDb } = require('../config/firebase');
const { NotFoundError } = require('../utils/errors');

// ── Collection Names ─────────────────────────────────────
const COLLECTIONS = {
  INCIDENTS: 'incidents',
  USERS: 'users',
  RESPONDERS: 'responders',
  AUDIT_LOG: 'audit_log',
};

// ══════════════════════════════════════════════════════════
//  INCIDENT OPERATIONS
// ══════════════════════════════════════════════════════════

/**
 * Create a new incident document.
 * @param {object} incidentData - Validated incident payload
 * @returns {Promise<object>} Created incident with Firestore-generated ID
 */
async function createIncident(incidentData) {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.INCIDENTS).doc();

  const incident = {
    ...incidentData,
    id: docRef.id,
    softDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await docRef.set(incident);
  return incident;
}

/**
 * Get a single incident by ID.
 * @param {string} incidentId
 * @returns {Promise<object>}
 * @throws {NotFoundError} If incident not found or soft-deleted
 */
async function getIncidentById(idOrNumber) {
  const db = getDb();
  
  // 1. Try direct Firestore Doc ID lookup (fastest)
  let doc = await db.collection(COLLECTIONS.INCIDENTS).doc(idOrNumber).get();

  // 2. Fallback: Search by incidentNumber (e.g., INC-772)
  if (!doc.exists) {
    const snapshot = await db.collection(COLLECTIONS.INCIDENTS)
      .where('incidentNumber', '==', idOrNumber)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      doc = snapshot.docs[0];
    }
  }

  if (!doc.exists || doc.data().softDeleted) {
    throw new NotFoundError('Incident');
  }

  return { ...doc.data(), id: doc.id };
}

/**
 * List incidents with filtering, pagination, and sorting.
 * @param {object} options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.severity] - Filter by severity
 * @param {string} [options.reportedByUserId] - Filter by reporter (for civilian-only access)
 * @param {string} [options.assignedTeam] - Filter by assigned team (for responders)
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.sortBy='createdAt'] - Sort field
 * @param {string} [options.sortOrder='desc'] - Sort direction: 'asc' or 'desc'
 * @returns {Promise<{ incidents: object[], total: number }>}
 */
async function listIncidents(options = {}) {
  const db = getDb();
  const {
    status,
    severity,
    reportedByUserId,
    assignedTeam,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  let query = db.collection(COLLECTIONS.INCIDENTS).where('softDeleted', '==', false);

  if (status) {
    query = query.where('status', '==', status);
  }

  if (severity) {
    query = query.where('severity', '==', severity);
  }

  if (reportedByUserId) {
    query = query.where('reportedBy.userId', '==', reportedByUserId);
  }

  if (assignedTeam) {
    query = query.where('assignedTeam', '==', assignedTeam);
  }

  // Get total count (Firestore doesn't have native count in older SDK, so we fetch all IDs)
  const countSnapshot = await query.select().get();
  const total = countSnapshot.size;

  try {
    // Apply sorting and pagination
    let finalQuery = query.orderBy(sortBy, sortOrder);

    const offset = (page - 1) * limit;
    if (offset > 0) {
      finalQuery = finalQuery.offset(offset);
    }
    finalQuery = finalQuery.limit(limit);

    const snapshot = await finalQuery.get();
    const incidents = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    return { incidents, total };
  } catch (error) {
    // If it's an index error, fallback to unsorted query in development
    if (error.code === 9 && error.message.includes('index')) {
      console.warn('[FirestoreService] Missing composite index. Falling back to unsorted query.');
      
      const offset = (page - 1) * limit;
      let fallbackQuery = query.limit(limit);
      if (offset > 0) {
        fallbackQuery = fallbackQuery.offset(offset);
      }
      
      const snapshot = await fallbackQuery.get();
      const incidents = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      return { incidents, total };
    }
    throw error;
  }
}

/**
 * Update an incident's status.
 * @param {string} idOrNumber
 * @param {string} newStatus
 * @param {string} [assignedTeam]
 * @returns {Promise<object>} Updated incident
 */
async function updateIncidentStatus(idOrNumber, newStatus, assignedTeam) {
  const incident = await getIncidentById(idOrNumber);
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.INCIDENTS).doc(incident.id);

  const previousState = { ...incident };

  const updateData = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (assignedTeam) {
    updateData.assignedTeam = assignedTeam;
  }

  await docRef.update(updateData);

  return {
    previousState,
    updated: { ...incident, ...updateData },
  };
}

/**
 * Update incident with triage results.
 * @param {string} incidentId
 * @param {object} triageData - Parsed triage result from Gemini or fallback
 * @returns {Promise<object>} Updated incident
 */
async function updateIncidentTriage(incidentId, triageData) {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.INCIDENTS).doc(incidentId);

  await docRef.update({
    triage: {
      ...triageData,
      processedAt: new Date(),
    },
    severity: triageData.severity,
    assignedTeam: triageData.assignedTeam,
    status: 'Triaged',
    updatedAt: new Date(),
  });

  const updated = await docRef.get();
  return { ...updated.data(), id: updated.id };
}

/**
 * Soft-delete an incident (coordinator only).
 * @param {string} incidentId
 * @returns {Promise<object>} The deleted incident data
 */
async function softDeleteIncident(idOrNumber) {
  const incident = await getIncidentById(idOrNumber);
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.INCIDENTS).doc(incident.id);

  const previousState = { ...incident };

  await docRef.update({
    softDeleted: true,
    updatedAt: new Date(),
  });

  return previousState;
}

/**
 * Activate SOS on an incident.
 * @param {string} incidentId
 * @returns {Promise<object>} Updated incident
 */
async function activateSOS(idOrNumber) {
  const incident = await getIncidentById(idOrNumber);
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.INCIDENTS).doc(incident.id);

  // SOS is a flag overlay — do NOT override the incident status
  // The status remains whatever it was (Reported, Triaged, etc.)
  await docRef.update({
    sosActive: true,
    updatedAt: new Date(),
  });

  return { ...incident, sosActive: true };
}

/**
 * Generate a human-readable incident number.
 * @returns {string} e.g., "INC-7842"
 */
function generateIncidentNumber() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `INC-${num}`;
}

// ══════════════════════════════════════════════════════════
//  USER OPERATIONS
// ══════════════════════════════════════════════════════════

/**
 * Create a new user document.
 * @param {object} userData
 * @returns {Promise<object>}
 */
async function createUser(userData) {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.USERS).doc(userData.id || undefined);

  const user = {
    ...userData,
    id: docRef.id,
    isActive: true,
    createdAt: new Date(),
    lastSeen: new Date(),
  };

  await docRef.set(user);
  return user;
}

/**
 * Get a user by ID.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUserById(userId) {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

  if (!doc.exists) return null;
  return { ...doc.data(), id: doc.id };
}

/**
 * Find a user by email.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function getUserByEmail(email) {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.USERS)
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { ...doc.data(), id: doc.id };
}

/**
 * Update user's last seen timestamp.
 * @param {string} userId
 */
async function updateUserLastSeen(userId) {
  const db = getDb();
  await db.collection(COLLECTIONS.USERS).doc(userId).update({
    lastSeen: new Date(),
  });
}

// ══════════════════════════════════════════════════════════
//  RESPONDER OPERATIONS
// ══════════════════════════════════════════════════════════

/**
 * List responders with optional filters.
 * @param {object} options
 * @param {string} [options.teamType] - Filter by team type
 * @param {string} [options.status] - Filter by status
 * @returns {Promise<object[]>}
 */
async function listResponders(options = {}) {
  const db = getDb();
  let query = db.collection(COLLECTIONS.RESPONDERS);

  if (options.teamType) {
    query = query.where('teamType', '==', options.teamType);
  }

  if (options.status) {
    query = query.where('status', '==', options.status);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
}

/**
 * Get a responder by ID.
 * @param {string} responderId
 * @returns {Promise<object>}
 */
async function getResponderById(responderId) {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.RESPONDERS).doc(responderId).get();

  if (!doc.exists) {
    throw new NotFoundError('Responder');
  }

  return { ...doc.data(), id: doc.id };
}

/**
 * Update responder's GPS location.
 * @param {string} responderId
 * @param {{ lat: number, lng: number }} coordinates
 * @returns {Promise<object>} Updated responder
 */
async function updateResponderLocation(responderId, coordinates) {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.RESPONDERS).doc(responderId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new NotFoundError('Responder');
  }

  await docRef.update({
    currentPosition: {
      lat: coordinates.lat,
      lng: coordinates.lng,
      updatedAt: new Date(),
    },
  });

  const updated = await docRef.get();
  return { ...updated.data(), id: updated.id };
}

/**
 * Update responder's operational status.
 * @param {string} responderId
 * @param {string} newStatus
 * @param {string} [assignedIncidentId]
 * @returns {Promise<object>}
 */
async function updateResponderStatus(responderId, newStatus, assignedIncidentId = null) {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.RESPONDERS).doc(responderId);

  const updateData = { status: newStatus };
  if (assignedIncidentId !== null) {
    updateData.assignedIncidentId = assignedIncidentId;
  }

  await docRef.update(updateData);
  const updated = await docRef.get();
  return { ...updated.data(), id: updated.id };
}

// ══════════════════════════════════════════════════════════
//  REAL-TIME SUBSCRIPTION (Firestore onSnapshot)
// ══════════════════════════════════════════════════════════

/**
 * Subscribe to real-time incident changes.
 * Returns an unsubscribe function.
 * @param {Function} callback - Called with (changeType, incidentData)
 *   changeType: 'added' | 'modified' | 'removed'
 * @returns {Function} Unsubscribe function
 */
function subscribeToIncidents(callback) {
  const db = getDb();

  const unsubscribe = db
    .collection(COLLECTIONS.INCIDENTS)
    .where('softDeleted', '==', false)
    .onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = { ...change.doc.data(), id: change.doc.id };
          callback(change.type, data);
        });
      },
      (error) => {
        console.error('[FirestoreService] Subscription error:', error.message);
      }
    );

  return unsubscribe;
}

/**
 * Subscribe to real-time responder changes.
 * Returns an unsubscribe function.
 * @param {Function} callback - Called with (changeType, responderData)
 * @returns {Function} Unsubscribe function
 */
function subscribeToResponders(callback) {
  const db = getDb();

  const unsubscribe = db
    .collection(COLLECTIONS.RESPONDERS)
    .onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = { ...change.doc.data(), id: change.doc.id };
          callback(change.type, data);
        });
      },
      (error) => {
        console.error('[FirestoreService] Responder subscription error:', error.message);
      }
    );

  return unsubscribe;
}

module.exports = {
  COLLECTIONS,
  // Incidents
  createIncident,
  getIncidentById,
  listIncidents,
  updateIncidentStatus,
  updateIncidentTriage,
  softDeleteIncident,
  activateSOS,
  generateIncidentNumber,
  // Users
  createUser,
  getUserById,
  getUserByEmail,
  updateUserLastSeen,
  // Responders
  listResponders,
  getResponderById,
  updateResponderLocation,
  updateResponderStatus,
  // Real-time
  subscribeToIncidents,
  subscribeToResponders,
};
