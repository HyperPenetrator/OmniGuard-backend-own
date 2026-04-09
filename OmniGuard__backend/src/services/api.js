/**
 * OmniGuard Frontend — API Client
 * Axios-based HTTP client with JWT auto-injection, token refresh interceptor,
 * and standardized error handling.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/** Token storage keys */
const TOKEN_KEY = 'omniguard_access_token';
const REFRESH_KEY = 'omniguard_refresh_token';
const USER_KEY = 'omniguard_user';

// ── Token Management ─────────────────────────────────────

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeAuth(accessToken, refreshToken, user) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getAccessToken();
}

// ── Core Fetch Wrapper ──────────────────────────────────

/**
 * Make an authenticated API request.
 * Automatically injects JWT and handles 401 with token refresh.
 *
 * @param {string} path - API path (e.g., '/api/incidents')
 * @param {object} [options] - Fetch options
 * @returns {Promise<object>} Parsed JSON response body
 */
async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 — attempt token refresh
  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      // Retry original request with new token
      headers.Authorization = `Bearer ${getAccessToken()}`;
      const retryResponse = await fetch(url, { ...options, headers });
      return handleResponse(retryResponse);
    } else {
      // Refresh failed — force logout
      clearAuth();
      window.dispatchEvent(new CustomEvent('omniguard:auth:expired'));
      throw new ApiError('Session expired. Please login again.', 401, 'SESSION_EXPIRED');
    }
  }

  return handleResponse(response);
}

/**
 * Parse response and throw on error.
 */
async function handleResponse(response) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errMsg = body?.error?.message || `HTTP ${response.status}`;
    const errCode = body?.error?.code || 'API_ERROR';
    throw new ApiError(errMsg, response.status, errCode, body?.error?.details);
  }

  return body;
}

/**
 * Attempt to refresh the access token.
 * @returns {Promise<boolean>} true if refresh succeeded
 */
async function attemptTokenRefresh() {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const body = await response.json();
    if (body.success && body.data) {
      storeAuth(body.data.accessToken, body.data.refreshToken, getStoredUser());
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Custom Error Class ──────────────────────────────────

export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ══════════════════════════════════════════════════════════
//  PUBLIC API METHODS
// ══════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────

export async function login(email, password) {
  const body = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (body.success && body.data) {
    storeAuth(body.data.accessToken, body.data.refreshToken, body.data.user);
  }

  return body;
}

export async function logout() {
  clearAuth();
  window.dispatchEvent(new CustomEvent('omniguard:auth:expired'));
}

// ── Incidents ────────────────────────────────────────────

export async function getIncidents(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.severity) query.set('severity', params.severity);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest(`/api/incidents${qs ? '?' + qs : ''}`);
}

export async function getIncident(id) {
  return apiRequest(`/api/incidents/${id}`);
}

export async function createIncident(data) {
  return apiRequest('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIncidentStatus(id, status) {
  return apiRequest(`/api/incidents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteIncident(id) {
  return apiRequest(`/api/incidents/${id}`, { method: 'DELETE' });
}

export async function triggerSOS(id) {
  return apiRequest(`/api/incidents/${id}/sos`, { method: 'POST' });
}

// ── Triage ───────────────────────────────────────────────

export async function manualTriage(incidentId) {
  return apiRequest('/api/triage/manual', {
    method: 'POST',
    body: JSON.stringify({ incidentId }),
  });
}

// ── Responders ───────────────────────────────────────────

export async function getResponders(params = {}) {
  const query = new URLSearchParams();
  if (params.teamType) query.set('teamType', params.teamType);
  if (params.status) query.set('status', params.status);

  const qs = query.toString();
  return apiRequest(`/api/responders${qs ? '?' + qs : ''}`);
}

export async function updateResponderLocation(id, lat, lng) {
  return apiRequest(`/api/responders/${id}/location`, {
    method: 'PATCH',
    body: JSON.stringify({ lat, lng }),
  });
}

// ── Health ───────────────────────────────────────────────

export async function getHealth() {
  return apiRequest('/api/health');
}

export async function getWsHealth() {
  return apiRequest('/api/ws/health');
}
