const { getDb } = require('../config/firebase');

const COLLECTIONS = {
  INCIDENTS: 'incidents',
};

// Title Case protocol statuses
const ACTIVE_STATUSES = ['Reported', 'Triaged', 'Dispatching', 'En Route', 'On Scene'];
const CLOSED_STATUSES = ['Closed', 'Resolved'];

/**
 * Calculates Active and Closed incident counts based on user role.
 * 
 * @param {object} user - The authenticated user object
 * @returns {Promise<{active: number, closed: number}>}
 */
async function getIncidentStats(user) {
  const db = getDb();
  let baseQuery = db.collection(COLLECTIONS.INCIDENTS).where('softDeleted', '==', false);

  if (user && user.role === 'responder') {
    const teamId = user.assignedTeam || user.responderTeam;
    if (teamId) {
      baseQuery = baseQuery.where('assignedTeam', '==', teamId);
    }
  }

  const [activeSnapshot, closedSnapshot] = await Promise.all([
    baseQuery.where('status', 'in', ACTIVE_STATUSES).select().get(),
    baseQuery.where('status', 'in', CLOSED_STATUSES).select().get()
  ]);

  return {
    active: activeSnapshot.size,
    closed: closedSnapshot.size
  };
}

/**
 * Global stats calculator for WebSocket broadcast
 */
async function getGlobalStats() {
  const db = getDb();
  const baseQuery = db.collection(COLLECTIONS.INCIDENTS).where('softDeleted', '==', false);
  
  const [activeSnapshot, closedSnapshot] = await Promise.all([
    baseQuery.where('status', 'in', ACTIVE_STATUSES).select().get(),
    baseQuery.where('status', 'in', CLOSED_STATUSES).select().get()
  ]);
  
  return {
    active: activeSnapshot.size,
    closed: closedSnapshot.size
  };
}

/**
 * Team-specific stats calculator for WebSocket broadcast
 */
async function getTeamStats(teamId) {
  if (!teamId) return { active: 0, closed: 0 };

  const db = getDb();
  const baseQuery = db.collection(COLLECTIONS.INCIDENTS)
    .where('softDeleted', '==', false)
    .where('assignedTeam', '==', teamId);
    
  const [activeSnapshot, closedSnapshot] = await Promise.all([
    baseQuery.where('status', 'in', ACTIVE_STATUSES).select().get(),
    baseQuery.where('status', 'in', CLOSED_STATUSES).select().get()
  ]);
  
  return {
    active: activeSnapshot.size,
    closed: closedSnapshot.size
  };
}

module.exports = {
  getIncidentStats,
  getGlobalStats,
  getTeamStats
};
