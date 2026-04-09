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

const USERS = [
  {
    email: 'coordinator@omniguard.io',
    name: 'Commander Alpha',
    role: 'coordinator',
    password: 'omni2024!',  // Will be hashed
    nodeId: 'NODE-ALPHA-1',
  },
  {
    email: 'responder1@omniguard.io',
    name: 'SDRF Alpha Lead',
    role: 'responder',
    password: 'resp2024!',
    nodeId: 'NODE-RESP-1',
  },
  {
    email: 'civilian@omniguard.io',
    name: 'Field Reporter',
    role: 'civilian',
    password: 'civ2024!',
    nodeId: 'NODE-CIV-1',
  },
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
  console.log('  coordinator@omniguard.io / omni2024!');
  console.log('  responder1@omniguard.io  / resp2024!');
  console.log('  civilian@omniguard.io    / civ2024!');
  console.log('');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
