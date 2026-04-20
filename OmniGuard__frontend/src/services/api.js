const DEV_HOST = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
  ? 'localhost' 
  : '10.0.2.2';

export const API_BASE = import.meta.env.PROD 
  ? 'https://hrishikeshdutta-omniguard-api.hf.space/api' 
  : `http://${DEV_HOST}:3001/api`;

export const WS_BASE = import.meta.env.PROD 
  ? 'wss://hrishikeshdutta-omniguard-api.hf.space/ws' 
  : `ws://${DEV_HOST}:3001/ws`;

async function handleResponse(res, errorMessage) {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('unauthorized'));
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || errorMessage);
    return data;
  } else {
    const text = await res.text();
    if (text.includes('Your space') || text.includes('sleeping')) {
      throw new Error('OmniGuard Intelligence Suite is currently initializing. Please try again in 30 seconds.');
    }
    throw new Error('Communication error with secure uplink. Please check your connection.');
  }
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await handleResponse(res, 'Login failed');
  return data.data; // { accessToken, user }
}

export async function createIncident(data, token) {
  const isPublic = !token;
  const url = isPublic ? `${API_BASE}/incidents/public` : `${API_BASE}/incidents`;
  const headers = { 'Content-Type': 'application/json' };
  
  if (!isPublic) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  
  const resData = await handleResponse(res, 'Failed to create incident');
  return resData.data;
}

export async function getIncidents(token) {
  const res = await fetch(`${API_BASE}/incidents`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(res, 'Failed to fetch incidents');
  return data.data;
}

export async function closeIncident(id, token) {
  const res = await fetch(`${API_BASE}/incidents/${id}/close`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return handleResponse(res, 'Failed to close incident');
}

export async function updateIncidentStatus(id, status, token) {
  const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ status })
  });
  
  return handleResponse(res, 'Failed to update status');
}

export async function getStats(token) {
  const res = await fetch(`${API_BASE}/incidents/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await handleResponse(res, 'Failed to fetch stats');
  return data.data;
}

