/**
 * OmniGuard Backend — Auth Routes
 * POST /api/auth/login   — authenticate and receive JWT
 * POST /api/auth/refresh — rotate refresh token
 */

const express = require('express');
const { z } = require('zod');
const { login, refresh } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { createAuthLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── Zod Schemas ─────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ── Route Registration ──────────────────────────────────

/**
 * POST /api/auth/login
 * Public — no auth required. Stricter rate limit applied.
 */
module.exports = function createAuthRoutes(env) {
  const authLimiter = createAuthLimiter(env);

  router.post('/login', authLimiter, validate(loginSchema), login);
  router.post('/refresh', validate(refreshSchema), refresh);

  return router;
};
