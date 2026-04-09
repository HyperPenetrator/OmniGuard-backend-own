
const WebSocket = require('ws');

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001/ws';

async function runE2ETest() {
  console.log('1. Authenticating as Coordinator...');
  
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'coordinator@omniguard.io',
        password: 'omni2024!',
      })
    });
    
    if (!loginRes.ok) throw new Error(await loginRes.text());
    
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('✔ Login successful. JWT received.');

    console.log('\n2. Connecting to WebSocket...');
    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.on('open', async () => {
      console.log('✔ WebSocket connected and authenticated.');
      
      console.log('\n3. Simulating Frontend: Reporting a new incident...');
      
      // Post the incident after waiting 1 second for WS to settle
      setTimeout(async () => {
        try {
          const incidentRes = await fetch(`${API_URL}/incidents`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
              type: 'Severe Flooding',
              location: 'Sector Alpha',
              description: 'E2E Test Simulation - Flooding detected in Sector Alpha.'
            })
          });
          
          if (!incidentRes.ok) throw new Error(await incidentRes.text());
          const incidentData = await incidentRes.json();
          
          console.log('✔ API Request Successful: Incident Created ->', incidentData.data.id);
        } catch (err) {
          console.error('❌ Failed to report incident:', err.message);
          process.exit(1);
        }
      }, 1000);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      
      // Wait for the Incident Created Broadcast
      if (msg.event === 'INCIDENT_CREATED') {
        console.log(`\n4. 🟢 SUCCESS: Received WebSocket Broadcast for ${msg.payload.id}!`);
        console.log('Push Event Data:', msg.payload.type, '-', msg.payload.severity);
        console.log('\n✅ E2E Flow Validated flawlessly without a browser.');
        process.exit(0);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket Error:', err);
    });

  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}

runE2ETest();
