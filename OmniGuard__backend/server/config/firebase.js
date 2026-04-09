/**
 * OmniGuard Backend — Firebase Admin SDK Initialization
 * Uses service account credentials from environment variables.
 * Exports Firestore db instance and admin auth.
 */

const admin = require('firebase-admin');

let _db = null;
let _auth = null;
let _initialized = false;

/**
 * Initialize Firebase Admin SDK with environment-based service account.
 * Safe to call multiple times — will only initialize once.
 * @param {object} env - Validated environment config object
 * @returns {{ db: admin.firestore.Firestore, auth: admin.auth.Auth }}
 */
function initFirebase(env) {
  if (_initialized) {
    return { db: _db, auth: _auth };
  }

  const serviceAccount = {
    type: 'service_account',
    project_id: env.FIREBASE_PROJECT_ID,
    client_email: env.FIREBASE_CLIENT_EMAIL,
    // Firebase private keys contain escaped newlines that need converting
    private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: env.FIREBASE_PROJECT_ID,
  });

  _db = admin.firestore();
  _auth = admin.auth();
  _initialized = true;

  // Firestore settings for optimal performance
  _db.settings({
    ignoreUndefinedProperties: true,
  });

  return { db: _db, auth: _auth };
}

/**
 * Get Firestore database instance (must call initFirebase first).
 * @returns {admin.firestore.Firestore}
 */
function getDb() {
  if (!_db) {
    throw new Error('Firebase not initialized. Call initFirebase(env) first.');
  }
  return _db;
}

/**
 * Get Firebase Auth instance (must call initFirebase first).
 * @returns {admin.auth.Auth}
 */
function getAuth() {
  if (!_auth) {
    throw new Error('Firebase not initialized. Call initFirebase(env) first.');
  }
  return _auth;
}

/**
 * Check if Firebase is connected and responsive.
 * @returns {Promise<boolean>}
 */
async function checkFirebaseHealth() {
  try {
    if (!_db) return false;
    // Attempt a lightweight read to confirm connectivity
    await _db.collection('_health_check').limit(1).get();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  initFirebase,
  getDb,
  getAuth,
  checkFirebaseHealth,
};
