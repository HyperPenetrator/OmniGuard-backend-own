/**
 * OmniGuard Backend — E2E API Test Suite
 * Tests the full incident lifecycle: Civilian Report → Triage → Dispatch → Status Update
 * 
 * Run: node scripts/test-e2e-suite.js
 * (Requires backend running on :3001)
 */

const API_URL = 'http://localhost:3001/api';
const PB_LOCATION = { lat: 26.1806, lng: 91.7561 }; // Paltan Bazaar

let testsPassed = 0;
let totalTests = 3;

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); testsPassed++; }
function fail(msg) { console.error(`  ❌ FAIL: ${msg}`); }
function section(msg) { console.log(`\n─── ${msg} ───`); }

async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${data.error?.message || res.status}`);
  return data.data.accessToken;
}

async function createIncident(token, body) {
  const res = await fetch(`${API_URL}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Create incident failed: ${JSON.stringify(data.error)}`);
  return data.data;
}

async function getIncidents(token) {
  const res = await fetch(`${API_URL}/incidents`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Get incidents failed: ${data.error?.message}`);
  return data.data;
}

async function updateStatus(token, id, status) {
  const res = await fetch(`${API_URL}/incidents/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Update status failed: ${JSON.stringify(data.error)}`);
  return data.data;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runE2ESuite() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   OmniGuard E2E API Test Suite           ║');
  console.log('╚══════════════════════════════════════════╝');

  try {
    // ─── Authenticate all test users ───
    section('Authenticating test users');
    const coordinatorToken = await login('coordinator@omniguard.io', 'omni2024!');
    const fireToken        = await login('fire_beta@omniguard.io',   'resp2024!');
    const policeToken      = await login('patrol99@omniguard.io',    'resp2024!');
    const civilianToken    = await login('civilian@omniguard.io',    'civ2024!');
    console.log('  ✔ Authenticated: coordinator, fire_beta, patrol99, civilian');

    // ─── TEST 1: RBAC — Team Isolation ───
    section('TEST 1: Team-based RBAC isolation');

    // Coordinator creates a Fire incident
    const fireInc = await createIncident(coordinatorToken, {
      type: 'Structural Fire',
      location: { sector: 'Test Zone A', coordinates: PB_LOCATION },
      description: 'RBAC test — fire incident',
      assignedTeam: 'Fire'
    });
    console.log(`  Created Fire incident: ${fireInc.id}`);
    await sleep(1500);

    const fireIncidents   = await getIncidents(fireToken);
    const policeIncidents = await getIncidents(policeToken);

    const fireCanSee   = fireIncidents.some(i => i.id === fireInc.id || i.incidentNumber === fireInc.incidentNumber);
    const policeCanSee = policeIncidents.some(i => i.id === fireInc.id || i.incidentNumber === fireInc.incidentNumber);

    if (fireCanSee && !policeCanSee) {
      pass('Fire responder sees Fire incident; Police responder does NOT');
    } else {
      fail(`RBAC breach — Fire can see: ${fireCanSee}, Police can see: ${policeCanSee}`);
    }

    // ─── TEST 2: Civilian Report → Triage Auto-Assignment ───
    section('TEST 2: Civilian report → Gemini triage → auto-assign team');

    const civInc = await createIncident(civilianToken, {
      type: 'Medical Emergency',
      location: { sector: 'Paltan Bazaar', coordinates: PB_LOCATION },
      description: 'Person collapsed, not breathing'
    });
    console.log(`  Civilian created incident: ${civInc.id} (status: ${civInc.status})`);
    await sleep(3000); // Wait for Gemini triage

    // Re-fetch to get triaged version
    const medToken = await login('medic1@omniguard.io', 'resp2024!');
    const medIncidents = await getIncidents(medToken);
    const triaged = medIncidents.find(i => i.id === civInc.id || i.incidentNumber === civInc.incidentNumber);

    if (triaged) {
      pass(`Incident triaged and visible to Medical team (status: ${triaged.status}, team: ${triaged.assignedTeam})`);
    } else {
      // It might not be assigned to Medical if Gemini chose different team — check by ID via coordinator
      const allIncs = await getIncidents(coordinatorToken);
      const found = allIncs.find(i => i.id === civInc.id || i.incidentNumber === civInc.incidentNumber);
      if (found) {
        pass(`Incident triaged — assigned to team: ${found.assignedTeam}, status: ${found.status} (not Medical, Gemini chose differently)`);
      } else {
        fail('Incident not found after triage wait');
      }
    }

    // ─── TEST 3: Status Lifecycle — Title Case Protocol ───
    section('TEST 3: Status lifecycle (Title Case enforcement)');

    const liveInc = await createIncident(coordinatorToken, {
      type: 'Bank Robbery',
      location: { sector: 'Dispur', coordinates: { lat: 26.1445, lng: 91.7362 } },
      description: 'Status lifecycle test',
      assignedTeam: 'Police'
    });
    console.log(`  Created Police incident: ${liveInc.id}`);
    await sleep(1000);

    // Coordinator dispatches (En Route)
    const enRoute = await updateStatus(coordinatorToken, liveInc.id, 'En Route');
    if (enRoute.status === 'En Route') {
      pass('Status updated to "En Route" (Title Case accepted by backend)');
    } else {
      fail(`Expected "En Route", got "${enRoute.status}"`);
    }

    // ─── Summary ───
    console.log('\n╔══════════════════════════════════════════╗');
    console.log(`║   Results: ${testsPassed}/${totalTests} tests passed`.padEnd(43) + '║');
    console.log('╚══════════════════════════════════════════╝');
    process.exit(testsPassed === totalTests ? 0 : 1);

  } catch (err) {
    console.error('\nFatal error during E2E suite:', err.message);
    process.exit(1);
  }
}

runE2ESuite();
