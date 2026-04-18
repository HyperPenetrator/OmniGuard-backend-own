/**
 * OmniGuard Backend — Firestore User Seed Script
 * Creates initial test users for all three roles (coordinator, responder, civilian).
 * Run once: node scripts/seed-users.js
 *
 * Passwords are SHA-256 hashed (matching authController.js prototype logic).
 */

require('dotenv').config();

const crypto = require('crypto');
const { loadEnv } = require('../config/env');
const { initFirebase, getDb } = require('../config/firebase');

if (process.env.NODE_ENV === 'production') {
  console.log('Safety Abort: Database seeding is disabled in production environments.');
  process.exit(1);
}

const USERS = [
  { email: 'coordinator@omniguard.io', password: 'omni2024!', role: 'coordinator', name: 'COMMAND ALPHA', rank: 'Commander' },
  { email: 'medic1@omniguard.io', password: 'resp2024!', role: 'responder', name: 'UNIT M-1', assignedTeam: 'Medical', unitId: 'MED-77', status: 'Available' },
  { email: 'fire_beta@omniguard.io', password: 'resp2024!', role: 'responder', name: 'ENGINE 4', assignedTeam: 'Fire', unitId: 'ENG-04', status: 'On Patrol' },
  { email: 'patrol99@omniguard.io', password: 'resp2024!', role: 'responder', name: 'OFFICER 99', assignedTeam: 'Police', unitId: 'POL-99', status: 'Available' },
  { email: 'tech_ops@omniguard.io', password: 'resp2024!', role: 'responder', name: 'HAZMAT TEAM', assignedTeam: 'Tech-Hazard', unitId: 'HAZ-01', clearance: 'Level 4' },
  { email: 'civilian@omniguard.io', password: 'civ2024!', role: 'civilian', name: 'JANE DOE', location: 'Downtown', priority: 'Standard' },
];

// Mock responders for geospatial display
const RESPONDERS = [
  {
    name: 'SDRF Alpha Team',
    teamType: 'Medical',
    status: 'Available',
    userId: null, // Will be linked to responder1
    currentPosition: { lat: 26.1600, lng: 91.7500, updatedAt: new Date() },
  },
  {
    name: 'Dibrugarh Response Unit',
    teamType: 'Security',
    status: 'Available',
    userId: null,
    currentPosition: { lat: 27.4800, lng: 94.9200, updatedAt: new Date() },
  },
  {
    name: 'Tezpur Fire Brigade',
    teamType: 'Fire',
    status: 'Available',
    userId: null,
    currentPosition: { lat: 26.6338, lng: 92.7926, updatedAt: new Date() },
  },
];

async function seed() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   OmniGuard — Seeding Firestore Users    ║');
  console.log('╚══════════════════════════════════════════╝');

  const env = loadEnv();
  initFirebase(env);
  const db = getDb();

  // Seed users
  console.log('\n── Seeding Users ──');
  for (const userData of USERS) {
    const { password, ...rest } = userData;
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const doc = {
      ...rest,
      passwordHash,
      isActive: true,
      createdAt: new Date(),
      lastSeen: new Date(),
    };

    // Use email as a deterministic ID for idempotency
    const docId = userData.email.replace(/[@.]/g, '_');
    await db.collection('users').doc(docId).set(doc, { merge: true });
    console.log(`  ✔ ${userData.role.padEnd(12)} ${userData.email} (pass: ${password})`);
  }

  // Seed responders
  console.log('\n── Seeding Responders ──');
  for (let i = 0; i < RESPONDERS.length; i++) {
    const resp = { ...RESPONDERS[i] };
    const docId = `resp-${i + 1}`;
    await db.collection('responders').doc(docId).set(resp, { merge: true });
    console.log(`  ✔ ${resp.name} (${resp.teamType})`);
  }

  console.log('\n✔ Seed complete. Test credentials:');
  for (const u of USERS) {
    console.log(`  ${u.email.padEnd(25)} / ${u.password}`);
  }
  console.log('');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
