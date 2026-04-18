export const API_BASE = import.meta.env.PROD 
  ? 'https://hrishikeshdutta-omniguard-api.hf.space/api' 
  : 'http://localhost:3001/api';

export const WS_BASE = import.meta.env.PROD 
  ? 'wss://hrishikeshdutta-omniguard-api.hf.space/ws' 
  : 'ws://localhost:3001/ws';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Login failed');
  
  return data.data; // { accessToken, user }
}

export async function getIncidents(token) {
  const res = await fetch(`${API_BASE}/incidents`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch incidents');
  
  return data.data.incidents;
}

export async function closeIncident(id, token) {
  const res = await fetch(`${API_BASE}/incidents/${id}/close`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to close incident');
  return data;
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
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to update status');
  return data;
}
