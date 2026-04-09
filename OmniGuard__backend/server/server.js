/**
 * ══════════════════════════════════════════════════════════════
 *  OmniGuard — Crisis Management System API Server
 *  Industrial-grade Express.js backend with real-time WebSocket,
 *  Firebase Firestore, Gemini AI Triage, and RBAC.
 * ══════════════════════════════════════════════════════════════
 */

// Load environment variables FIRST (before any other imports that depend on env)
require('dotenv').config();

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// ── Config ─────────────────────────────────────────────────
const { loadEnv } = require('./config/env');
const { initFirebase } = require('./config/firebase');

// ── Utils ──────────────────────────────────────────────────
const { createLogger } = require('./utils/logger');

// ── Middleware ──────────────────────────────────────────────
const { requestIdMiddleware } = require('./middleware/requestId');
const { createAuthMiddleware } = require('./middleware/auth');
const { createGlobalLimiter } = require('./middleware/rateLimiter');
const { sanitizeMiddleware } = require('./middleware/sanitize');
const { createErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ── Routes ─────────────────────────────────────────────────
const healthRoutes = require('./routes/health');
const createAuthRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const responderRoutes = require('./routes/responders');
const triageRoutes = require('./routes/triage');

// ── Services ───────────────────────────────────────────────
const { createWsService } = require('./services/wsService');
const { startRealtimeSync } = require('./services/realtimeSync');

// ═══════════════════════════════════════════════════════════
//  BOOTSTRAP
// ═══════════════════════════════════════════════════════════

async function bootstrap() {
  // 1. Validate environment
  const env = loadEnv();
  const logger = createLogger(env);

  logger.info('╔══════════════════════════════════════════╗');
  logger.info('║   OmniGuard API Server — Initializing    ║');
  logger.info('╚══════════════════════════════════════════╝');
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Port: ${env.PORT}`);

  // 2. Initialize Firebase
  let firebaseReady = false;
  try {
    initFirebase(env);
    firebaseReady = true;
    logger.info('✔ Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('✖ Firebase initialization failed', { error: error.message });
    logger.warn('Server starting in degraded mode — database operations will fail');
  }

  // 3. Create Express app
  const app = express();
  const server = http.createServer(app);

  // Store env and logger in app.locals for access in routes/middleware
  app.locals.env = env;
  app.locals.logger = logger;

  // Trust proxy (needed for rate limiter behind reverse proxy)
  app.set('trust proxy', 1);

  // 4. Initialize WebSocket service
  const wsService = createWsService(server, env, logger);
  app.locals.wsService = wsService;

  // 5. Start Firestore → WebSocket real-time sync (if Firebase is ready)
  let realtimeUnsubscribe = null;
  if (firebaseReady) {
    try {
      realtimeUnsubscribe = startRealtimeSync(wsService, logger);
    } catch (error) {
      logger.warn('Real-time sync failed to start', { error: error.message });
    }
  }

  // ── JWT Auth Middleware (created once, reused) ──────────
  const verifyToken = createAuthMiddleware(env);

  // ── Global Middleware Stack (ORDER MATTERS) ──────────────

  // 6a. Request ID — must be first for log correlation
  app.use(requestIdMiddleware);

  // 6b. Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        ip: req.ip,
      };

      if (res.statusCode >= 500) {
        logger.error(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, logData);
      } else if (res.statusCode >= 400) {
        logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, logData);
      } else {
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, logData);
      }
    });
    next();
  });

  // 6c. Security headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'wss:'],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      } : false,
      hsts: { maxAge: 31536000, includeSubDomains: true },
    })
  );

  // 6d. CORS
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
      credentials: true,
      maxAge: 86400,
    })
  );

  // 6e. Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 6f. Rate limiting (on all /api routes)
  app.use('/api/', createGlobalLimiter(env));

  // 6g. Input sanitization (XSS)
  app.use(sanitizeMiddleware);

  // ── Route Registration ──────────────────────────────────

  // Public routes (no auth required)
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', createAuthRoutes(env));

  // Protected routes (JWT required)
  app.use('/api/incidents', verifyToken, incidentRoutes);
  app.use('/api/responders', verifyToken, responderRoutes);
  app.use('/api/triage', verifyToken, triageRoutes);

  // WebSocket health endpoint (coordinator only, but no auth for simplicity)
  app.get('/api/ws/health', (req, res) => {
    res.json({
      success: true,
      data: {
        activeConnections: wsService.getConnectionCount(),
        connectionsByRole: wsService.getConnectionSummary(),
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ── 404 + Global Error Handler (MUST BE LAST) ──────────

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger, env.NODE_ENV));

  // ── Start Server ───────────────────────────────────────
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`✖ Port ${env.PORT} is already in use by another process.`);
      logger.info(`Try: kill-port ${env.PORT} (if installed) or find the PID using: netstat -ano | findstr :${env.PORT}`);
    } else {
      logger.error('✖ Server error during startup', { error: error.message });
    }
    process.exit(1);
  });

  server.listen(env.PORT, '0.0.0.0', () => {
    logger.info('');
    logger.info('┌─────────────────────────────────────────────┐');
    logger.info(`│  OmniGuard API listening on port ${String(env.PORT).padEnd(13)}│`);
    logger.info(`│  Health:   http://localhost:${env.PORT}/api/health  │`);
    logger.info(`│  WS:       ws://localhost:${env.PORT}/ws            │`);
    logger.info('│  Status:   ✔ OPERATIONAL                    │');
    logger.info('└─────────────────────────────────────────────┘');
    logger.info('');
  });

  // ── Graceful Shutdown ──────────────────────────────────

  const shutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');

      // Shutdown WebSocket
      wsService.shutdown();

      // Stop Firestore listener
      if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
        logger.info('Firestore real-time sync stopped');
      }

      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled rejections and uncaught exceptions
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', { error: reason?.message || String(reason) });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception — shutting down', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  return { app, server, wsService };
}

// ── Execute ────────────────────────────────────────────────
if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('FATAL: Server failed to start', error);
    process.exit(1);
  });
}

module.exports = { bootstrap };
