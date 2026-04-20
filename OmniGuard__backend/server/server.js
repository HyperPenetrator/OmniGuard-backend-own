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
const { sendSuccess } = require('./utils/response');

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

// ── Config & Middleware ────────────────────────────────────
const { getSecurityConfig } = require('./config/security');
const { createRequestLogger } = require('./middleware/requestLogger');

/**
 * Main Application Bootstrap
 */
async function bootstrap() {
  const env = loadEnv();
  const logger = createLogger(env);

  logger.info('╔══════════════════════════════════════════╗');
  logger.info('║   OmniGuard API Server — Initializing    ║');
  logger.info('╚══════════════════════════════════════════╝');

  // 1. Initialize Core Services
  let firebaseReady = false;
  try {
    initFirebase(env);
    firebaseReady = true;
    logger.info('✔ Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('✖ Firebase initialization failed', { error: error.message });
  }

  const app = express();
  const server = http.createServer(app);
  const wsService = createWsService(server, env, logger);
  
  app.locals.env = env;
  app.locals.logger = logger;
  app.locals.wsService = wsService;
  app.set('trust proxy', 1);

  // 2. Real-time Synchronization
  let realtimeUnsubscribe = null;
  if (firebaseReady) {
    try {
      realtimeUnsubscribe = startRealtimeSync(wsService, logger);
    } catch (error) {
      logger.warn('Real-time sync failed to start', { error: error.message });
    }
  }

  // 3. Global Middleware Pipeline
  const { allowedOrigins, helmetConfig } = getSecurityConfig(env);
  const verifyToken = createAuthMiddleware(env);

  app.use(requestIdMiddleware);
  app.use(createRequestLogger(logger));
  app.use(helmet(helmetConfig));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
          return regex.test(origin);
        }
        return pattern === origin;
      });
      if (isAllowed || (env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))) {
        return callback(null, true);
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 86400,
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use('/api/', createGlobalLimiter(env));
  app.use(sanitizeMiddleware);

  // 4. API Routes
  app.get('/', (req, res) => {
    res.json({ 
      success: true, 
      message: 'OmniGuard Intelligence Suite API is running',
      version: '1.0.0'
    });
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', createAuthRoutes(env));
  
  // Public incident creation (no token required) — for civilian portal
  const incidentController = require('./controllers/incidentController');
  app.post('/api/incidents/public', sanitizeMiddleware, incidentController.create);
  
  app.use('/api/incidents', verifyToken, incidentRoutes);
  app.use('/api/responders', verifyToken, responderRoutes);
  app.use('/api/triage', verifyToken, triageRoutes);

  // WebSocket health (internal diagnostic)
  app.get('/api/ws/health', (req, res) => {
    sendSuccess(res, {
      activeConnections: wsService.getConnectionCount(),
      connectionsByRole: wsService.getConnectionSummary(),
    });
  });

  // 5. Upgrade Handler for WebSockets
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = require('url').parse(request.url);
    if (pathname === '/ws' || pathname === '/ws/') {
      wsService.wss.handleUpgrade(request, socket, head, (ws) => {
        wsService.wss.emit('connection', ws, request);
      });
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });

  // 6. Error Handling
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
