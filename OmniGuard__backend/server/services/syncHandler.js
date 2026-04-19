/**
 * OmniGuard Backend — Real-time Sync Handlers
 * Dedicated logic for processing Firestore changes and broadcasting via WebSockets.
 */

const { listResponders } = require('./firestoreService');
const { getTeamStats, getGlobalStats } = require('./statsService');
const { calculateDistance } = require('./locationUtils');

class SyncHandler {
  constructor(wsService, logger) {
    this.wsService = wsService;
    this.logger = logger;
    this.notifiedNearbyIncidents = new Set();
  }

  /**
   * Main entry point for incident changes
   */
  async handleIncidentChange(changeType, incidentData) {
    const event = this._getEventName(changeType, incidentData);
    if (!event) return;

    // 1. Process specific lifecycle side-effects
    await this._handleSosActivation(changeType, incidentData);
    await this._handleIncidentClosed(changeType, incidentData);
    await this._handleNearbyNotifications(changeType, incidentData);

    // 2. Update Statistics
    await this._updateStats(incidentData);

    // 3. Global Broadcast
    this.wsService.broadcast(event, {
      incident: incidentData,
      changeType,
      source: 'firestore-sync',
    });

    this.logger.debug(`Firestore sync: ${event}`, { incidentId: incidentData.id });
  }

  /**
   * Handle responder location updates
   */
  handleResponderUpdate(changeType, responderData) {
    if (changeType === 'modified' && responderData.currentPosition) {
      this.wsService.broadcast('RESPONDER_LOCATION_UPDATE', {
        responderId: responderData.id,
        name: responderData.name,
        lat: responderData.currentPosition.lat,
        lng: responderData.currentPosition.lng,
        updatedAt: responderData.currentPosition.updatedAt,
        source: 'firestore-sync',
      });
    }
  }

  // ── Private Helpers ─────────────────────────────────────

  _getEventName(changeType, data) {
    const eventMap = {
      added: 'INCIDENT_CREATED',
      modified: 'INCIDENT_UPDATED',
      removed: 'INCIDENT_DELETED',
    };

    let event = eventMap[changeType];
    if (changeType === 'modified' && data.status === 'Triaged') {
      event = 'TRIAGE_COMPLETE';
    }
    return event;
  }

  async _handleSosActivation(changeType, data) {
    if (changeType === 'modified' && data.sosActive) {
      this.wsService.broadcast('SOS_TRIGGERED', {
        incidentId: data.id,
        incidentNumber: data.incidentNumber,
        type: data.type,
        location: data.location,
        source: 'firestore-sync',
      });
    }
  }

  async _handleIncidentClosed(changeType, data) {
    if (changeType === 'modified' && data.status === 'Closed' && data.assignedTeam) {
      this.wsService.broadcastToTeam(data.assignedTeam, 'INCIDENT_CLOSED', {
        incidentId: data.id,
        assignedTeam: data.assignedTeam,
        source: 'firestore-sync',
      });
    }
  }

  async _handleNearbyNotifications(changeType, data) {
    const activeStatuses = ['Reported', 'Triaged', 'Dispatching'];
    if (
      (changeType === 'added' || changeType === 'modified') && 
      activeStatuses.includes(data.status) && 
      data.assignedTeam && 
      data.location?.coordinates
    ) {
      if (this.notifiedNearbyIncidents.has(data.id)) return;
      this.notifiedNearbyIncidents.add(data.id);

      try {
        const responders = await listResponders({ teamType: data.assignedTeam });
        responders.forEach(responder => {
          if (responder.currentPosition) {
            const distance = calculateDistance(data.location.coordinates, responder.currentPosition);
            if (distance !== null && distance <= 5) {
              this.wsService.sendToUser(responder.id, 'NEW_INCIDENT_NEARBY', {
                incidentId: data.id,
                incidentNumber: data.incidentNumber,
                type: data.type,
                severity: data.severity,
                distance: parseFloat(distance.toFixed(2)),
                source: 'firestore-sync'
              });
            }
          }
        });
      } catch (err) {
        this.logger.error('Failed to push NEW_INCIDENT_NEARBY:', err);
      }
    }
  }

  async _updateStats(data) {
    try {
      // Team Stats
      if (data.assignedTeam) {
        const stats = await getTeamStats(data.assignedTeam);
        this.wsService.broadcastToTeam(data.assignedTeam, 'TEAM_STATS_UPDATED', {
          teamId: data.assignedTeam,
          stats,
          source: 'firestore-sync'
        });
      }

      // Global Stats
      const globalStats = await getGlobalStats();
      this.wsService.broadcastToRole('coordinator', 'GLOBAL_STATS_UPDATED', { stats: globalStats });
      this.wsService.broadcastToRole('admin', 'GLOBAL_STATS_UPDATED', { stats: globalStats });
    } catch (err) {
      this.logger.error('Failed to update stats during sync:', err);
    }
  }
}

module.exports = { SyncHandler };
