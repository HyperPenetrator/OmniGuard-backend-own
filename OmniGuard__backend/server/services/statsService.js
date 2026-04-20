const { getDb } = require('../config/firebase');

const COLLECTIONS = {
  INCIDENTS: 'incidents',
};

// Title Case protocol statuses
const ACTIVE_STATUSES = ['Reported', 'Triaged', 'Dispatching', 'En Route', 'On Scene'];
const RESOLVED_STATUSES = ['Resolved'];
const CLOSED_STATUSES = ['Closed'];

/**
 * Calculates Active, Resolved, and Closed incident counts based on user role.
 * Also calculates a "Success Rate" based on Resolved vs Closed.
 * 
 * @param {object} user - The authenticated user object
 * @returns {Promise<object>}
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

  const [activeSnapshot, resolvedSnapshot, closedSnapshot] = await Promise.all([
    baseQuery.where('status', 'in', ACTIVE_STATUSES).select().get(),
    baseQuery.where('status', 'in', RESOLVED_STATUSES).select().get(),
    baseQuery.where('status', 'in', CLOSED_STATUSES).select().get()
  ]);

  const resolved = resolvedSnapshot.size;
  const closed = closedSnapshot.size;
  const totalFinished = resolved + closed;
  const successRate = totalFinished > 0 ? Math.round((resolved / totalFinished) * 100) : 100;

  return {
    active: activeSnapshot.size,
    resolved,
    closed,
    successRate: `${successRate}%`,
    totalHandled: totalFinished
  };
}

/**
 * Global stats calculator for WebSocket broadcast
 */
async function getGlobalStats() {
  const db = getDb();
  const baseQuery = db.collection(COLLECTIONS.INCIDENTS).where('softDeleted', '==', false);
  
  const [activeSnapshot, resolvedSnapshot, closedSnapshot] = await Promise.all([
    baseQuery.where('status', 'in', ACTIVE_STATUSES).select().get(),
    baseQuery.where('status', 'in', RESOLVED_STATUSES).select().get(),
    baseQuery.where('status', 'in', CLOSED_STATUSES).select().get()
  ]);
  
  const resolved = resolvedSnapshot.size;
  const closed = closedSnapshot.size;
  const totalFinished = resolved + closed;
  const successRate = totalFinished > 0 ? Math.round((resolved / totalFinished) * 100) : 100;

  return {
    active: activeSnapshot.size,
    resolved,
    closed,
    successRate: `${successRate}%`,
    totalHandled: totalFinished
  };
}

/**
 * Team-specific stats calculator for WebSocket broadcast
 */
async function getTeamStats(teamId) {
  if (!teamId) return { active: 0, resolved: 0, closed: 0, successRate: '100%', totalHandled: 0 };

  const db = getDb();
  const baseQuery = db.collection(COLLECTIONS.INCIDENTS)
    .where('softDeleted', '==', false)
    .where('assignedTeam', '==', teamId);
    
  const [activeSnapshot, resolvedSnapshot, closedSnapshot] = await Promise.all([
    baseQuery.where('status', 'in', ACTIVE_STATUSES).select().get(),
    baseQuery.where('status', 'in', RESOLVED_STATUSES).select().get(),
    baseQuery.where('status', 'in', CLOSED_STATUSES).select().get()
  ]);
  
  const resolved = resolvedSnapshot.size;
  const closed = closedSnapshot.size;
  const totalFinished = resolved + closed;
  const successRate = totalFinished > 0 ? Math.round((resolved / totalFinished) * 100) : 100;

  return {
    active: activeSnapshot.size,
    resolved,
    closed,
    successRate: `${successRate}%`,
    totalHandled: totalFinished
  };
}

module.exports = {
  getIncidentStats,
  getGlobalStats,
  getTeamStats
};

