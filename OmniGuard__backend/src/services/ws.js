/**
 * OmniGuard Frontend — WebSocket Client
 * Auto-reconnecting WebSocket with JWT authentication,
 * event subscription system, and connection state tracking.
 */

/**
 * Derive the WebSocket URL.
 * If VITE_WS_URL is set, use it directly.
 * Otherwise, build from the current page origin (works with Vite proxy).
 */
function getWsUrl() {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;

  // Auto-detect from page origin: http→ws, https→wss
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

const WS_BASE = getWsUrl();

/** Connection states */
export const WS_STATE = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
};

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let currentState = WS_STATE.DISCONNECTED;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1s, doubles each attempt
const INITIAL_CONNECT_DELAY = 500; // ms — small delay to let backend finish starting

/** Event listeners: Map<event, Set<callback>> */
const listeners = new Map();

/** State change listeners */
const stateListeners = new Set();

// ── State Management ─────────────────────────────────────

function setState(newState) {
  if (currentState !== newState) {
    currentState = newState;
    stateListeners.forEach((cb) => {
      try { cb(newState); } catch (e) { console.error('[WS] State listener error:', e); }
    });
  }
}

export function getConnectionState() {
  return currentState;
}

/**
 * Subscribe to connection state changes.
 * @param {Function} callback - Called with new state string
 * @returns {Function} Unsubscribe function
 */
export function onStateChange(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

// ── Event System ─────────────────────────────────────────

/**
 * Subscribe to a WebSocket event.
 * @param {string} event - Event name (e.g., 'INCIDENT_CREATED')
 * @param {Function} callback - Called with event payload
 * @returns {Function} Unsubscribe function
 */
export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);

  return () => {
    listeners.get(event)?.delete(callback);
  };
}

/**
 * Emit event to all registered listeners.
 */
function emit(event, payload) {
  const cbs = listeners.get(event);
  if (cbs) {
    cbs.forEach((cb) => {
      try { cb(payload); } catch (e) { console.error(`[WS] Listener error on ${event}:`, e); }
    });
  }

  // Also emit to wildcard listeners
  const wildcardCbs = listeners.get('*');
  if (wildcardCbs) {
    wildcardCbs.forEach((cb) => {
      try { cb({ event, payload }); } catch (e) { /* silently ignore */ }
    });
  }
}

// ── Connection Management ────────────────────────────────

/**
 * Connect to the OmniGuard WebSocket server.
 * @param {string} token - JWT access token
 */
export function connect(token) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return; // Already connected or connecting
  }

  if (!token) {
    console.warn('[WS] Cannot connect without token');
    return;
  }

  // On first connection, add a small delay to let the backend finish starting
  if (reconnectAttempts === 0 && !socket) {
    setState(WS_STATE.CONNECTING);
    setTimeout(() => _doConnect(token), INITIAL_CONNECT_DELAY);
    return;
  }

  _doConnect(token);
}

/**
 * Internal: establish the raw WebSocket connection.
 */
function _doConnect(token) {
  setState(reconnectAttempts > 0 ? WS_STATE.RECONNECTING : WS_STATE.CONNECTING);

  try {
    socket = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('[WS] Connection error:', err);
    scheduleReconnect(token);
    return;
  }

  socket.onopen = () => {
    console.log('[WS] Connected to OmniGuard real-time feed');
    reconnectAttempts = 0;
    setState(WS_STATE.CONNECTED);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event) {
        emit(data.event, data.payload);
      }
    } catch {
      console.warn('[WS] Failed to parse message:', event.data);
    }
  };

  socket.onclose = (event) => {
    console.log(`[WS] Disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`);
    setState(WS_STATE.DISCONNECTED);

    // Don't reconnect on intentional close or auth failures
    if (event.code === 4001 || event.code === 4002 || event.code === 1000) {
      return;
    }

    scheduleReconnect(token);
  };

  socket.onerror = (error) => {
    console.error('[WS] Error:', error);
  };
}

/**
 * Disconnect from the WebSocket server.
 */
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;

  if (socket) {
    socket.close(1000, 'Client disconnect');
    socket = null;
  }

  setState(WS_STATE.DISCONNECTED);
}

/**
 * Schedule a reconnect attempt with exponential backoff.
 */
function scheduleReconnect(token) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`[WS] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
    setState(WS_STATE.DISCONNECTED);
    return;
  }

  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;

  console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  setState(WS_STATE.RECONNECTING);

  reconnectTimer = setTimeout(() => {
    connect(token);
  }, delay);
}

/**
 * Send a message to the WebSocket server.
 * @param {string} type - Message type
 * @param {object} [data] - Message payload
 */
export function send(type, data = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, ...data }));
  } else {
    console.warn('[WS] Cannot send — not connected');
  }
}

// ── Cleanup on page unload ───────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    disconnect();
  });
}
