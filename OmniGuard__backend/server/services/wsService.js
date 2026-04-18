/**
 * OmniGuard Backend — WebSocket Service
 * Manages WebSocket connections, JWT-authenticated sessions,
 * and broadcast/unicast messaging with role-based targeting.
 */

const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

/**
 * Create and initialize the WebSocket service.
 * Attaches to the existing HTTP server.
 *
 * @param {import('http').Server} server - HTTP server instance
 * @param {object} env - Validated environment config
 * @param {import('winston').Logger} logger - Winston logger
 * @returns {object} WebSocket service API
 */
function createWsService(server, env, logger) {
  const wss = new WebSocketServer({ noServer: true });

  // Map of authenticated connections: ws -> { userId, role, name }
  const clients = new Map();
  // Map of rooms (teamId -> Set of WebSockets)
  const rooms = new Map();

  function subscribe(ws, room) {
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(ws);
  }

  function unsubscribeAll(ws) {
    rooms.forEach(clientsSet => clientsSet.delete(ws));
  }

  // ── Connection Handler ──────────────────────────────────
  wss.on('connection', (ws, req) => {
    const queryParams = url.parse(req.url, true).query;
    const token = queryParams.token || req.headers['authorization']?.split(' ')[1];

    // Authenticate the WebSocket connection via JWT
    if (!token) {
      logger.warn('WebSocket connection rejected — no token', {
        ip: req.socket.remoteAddress,
      });
      ws.close(4001, 'Authentication required');
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      logger.warn('WebSocket connection rejected — invalid token', {
        ip: req.socket.remoteAddress,
        error: err.message,
      });
      ws.close(4002, 'Invalid or expired token');
      return;
    }

    // Store authenticated client
    const assignedTeam = decoded.assignedTeam || decoded.responderTeam;
    const clientInfo = {
      userId: decoded.uid || decoded.userId,
      role: decoded.role,
      name: decoded.name,
      assignedTeam: assignedTeam,
      responderTeam: assignedTeam, // legacy fallback
      connectedAt: new Date().toISOString(),
    };
    clients.set(ws, clientInfo);

    // Channel-based communication: Subscribe client to their team room
    if (assignedTeam) {
      subscribe(ws, assignedTeam);
    }
    // Coordinators are subscribed to a special 'coordinator' room
    if (decoded.role === 'coordinator' || decoded.role === 'admin') {
      subscribe(ws, 'coordinator');
    }

    logger.info('WebSocket client connected', {
      userId: decoded.userId,
      role: decoded.role,
      totalConnections: clients.size,
    });

    // Send connection acknowledgment
    sendToClient(ws, 'CONNECTION_ACK', {
      message: 'Connected to OmniGuard real-time feed',
      userId: decoded.userId,
      role: decoded.role,
      serverTime: new Date().toISOString(),
    });

    // ── Heartbeat (ping/pong) ──────────────────────────
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // ── Message Handler ────────────────────────────────
    ws.on('message', (rawData) => {
      try {
        const message = JSON.parse(rawData.toString());
        handleClientMessage(ws, clientInfo, message, logger);
      } catch {
        sendToClient(ws, 'ERROR', { message: 'Invalid JSON message' });
      }
    });

    // ── Disconnect Handler ─────────────────────────────
    ws.on('close', (code, reason) => {
      unsubscribeAll(ws);
      clients.delete(ws);
      logger.info('WebSocket client disconnected', {
        userId: clientInfo.userId,
        code,
        reason: reason?.toString(),
        totalConnections: clients.size,
      });
    });

    ws.on('error', (err) => {
      logger.error('WebSocket client error', {
        userId: clientInfo.userId,
        error: err.message,
      });
      unsubscribeAll(ws);
      clients.delete(ws);
    });
  });

  // ── Heartbeat Interval (30s) ────────────────────────────
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        const clientInfo = clients.get(ws);
        if (clientInfo) {
          logger.info('Terminating stale WebSocket', { userId: clientInfo.userId });
        }
        unsubscribeAll(ws);
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // ── Public API ──────────────────────────────────────────

  /**
   * Send a message to a single WebSocket client.
   * @param {WebSocket} ws
   * @param {string} event - Event name
   * @param {object} payload - Event data
   */
  function sendToClient(ws, event, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event,
        payload,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  /**
   * Broadcast an event to ALL authenticated clients.
   * @param {string} event - Event name
   * @param {object} payload - Event data
   */
  function broadcast(event, payload) {
    const message = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    let sent = 0;
    clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sent++;
      }
    });

    logger.debug(`WS broadcast: ${event}`, { recipients: sent });
  }

  /**
   * Broadcast an event to clients with a specific role.
   * @param {string} role - Target role
   * @param {string} event - Event name
   * @param {object} payload - Event data
   */
  function broadcastToRole(role, event, payload) {
    const message = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    let sent = 0;
    clients.forEach((clientInfo, ws) => {
      if (clientInfo.role === role && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sent++;
      }
    });

    logger.debug(`WS role broadcast: ${event} → ${role}`, { recipients: sent });
  }

  /**
   * Broadcast an event to clients with a specific team (channel).
   * @param {string} team - Target team channel
   * @param {string} event - Event name
   * @param {object} payload - Event data
   */
  function broadcastToTeam(team, event, payload) {
    const message = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    let sent = 0;
    
    // Send to team room
    const teamSubscribers = rooms.get(team) || new Set();
    teamSubscribers.forEach((ws) => {
      const clientInfo = clients.get(ws);
      // Security Audit: Check recipient's team ID before emitting the event
      if (clientInfo && (clientInfo.assignedTeam === team || clientInfo.responderTeam === team)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          sent++;
        }
      }
    });

    // Also send to coordinators, as they need to oversee all teams
    const coordinatorSubscribers = rooms.get('coordinator') || new Set();
    coordinatorSubscribers.forEach((ws) => {
      // Don't double-send if they are somehow in both
      if (teamSubscribers.has(ws)) return; 
      
      const clientInfo = clients.get(ws);
      if (clientInfo && (clientInfo.role === 'coordinator' || clientInfo.role === 'admin')) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          sent++;
        }
      }
    });

    logger.debug(`WS team channel broadcast: ${event} → ${team}`, { recipients: sent });
  }

  /**
   * Send an event to a specific user by userId.
   * @param {string} userId - Target user ID
   * @param {string} event - Event name
   * @param {object} payload - Event data
   */
  function sendToUser(userId, event, payload) {
    clients.forEach((clientInfo, ws) => {
      if (clientInfo.userId === userId && ws.readyState === WebSocket.OPEN) {
        sendToClient(ws, event, payload);
      }
    });
  }

  /**
   * Get the count of active authenticated connections.
   * @returns {number}
   */
  function getConnectionCount() {
    return clients.size;
  }

  /**
   * Get a summary of connected clients by role.
   * @returns {object} e.g., { coordinator: 2, responder: 5, civilian: 3 }
   */
  function getConnectionSummary() {
    const summary = {};
    clients.forEach((clientInfo) => {
      summary[clientInfo.role] = (summary[clientInfo.role] || 0) + 1;
    });
    return summary;
  }

  /**
   * Gracefully close all connections and the WebSocket server.
   */
  function shutdown() {
    clearInterval(heartbeatInterval);
    clients.forEach((clientInfo, ws) => {
      ws.close(1001, 'Server shutting down');
    });
    wss.close();
    logger.info('WebSocket server shut down');
  }

  /**
   * Handle incoming messages from clients.
   */
  function handleClientMessage(ws, clientInfo, message, log) {
    switch (message.type) {
      case 'ping':
        sendToClient(ws, 'pong', { serverTime: new Date().toISOString() });
        break;

      case 'subscribe':
        // Future: topic-based subscriptions
        log.debug('Client subscription request', {
          userId: clientInfo.userId,
          topic: message.topic,
        });
        sendToClient(ws, 'SUBSCRIBED', { topic: message.topic });
        break;

      default:
        sendToClient(ws, 'ERROR', { message: `Unknown message type: ${message.type}` });
    }
  }

  logger.info('✔ WebSocket server initialized on /ws');

  return {
    broadcast,
    broadcastToRole,
    broadcastToTeam,
    sendToUser,
    sendToClient,
    getConnectionCount,
    getConnectionSummary,
    shutdown,
    wss, // Expose raw WSS for testing
  };
}

module.exports = { createWsService };
