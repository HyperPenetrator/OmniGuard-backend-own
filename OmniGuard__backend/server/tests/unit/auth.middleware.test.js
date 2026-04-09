/**
 * OmniGuard Backend — Auth Middleware Unit Tests
 * Tests JWT verification, token expiration, and malformed token handling.
 */

const { createAuthMiddleware } = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test-secret-key-minimum-32-characters-long';

const mockEnv = { JWT_SECRET: TEST_SECRET };
const verifyToken = createAuthMiddleware(mockEnv);

// Helper: create a mock Express req/res/next
function createMocks(authHeader) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
}

// Helper: sign a test JWT
function signToken(payload, options = {}) {
  return jwt.sign(payload, TEST_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    ...options,
  });
}

describe('Auth Middleware (verifyToken)', () => {
  it('should reject requests with no Authorization header', () => {
    const { req, res, next } = createMocks();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should reject requests with non-Bearer auth', () => {
    const { req, res, next } = createMocks('Basic dXNlcjpwYXNz');

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should reject requests with invalid JWT', () => {
    const { req, res, next } = createMocks('Bearer invalid.token.here');

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Invalid token');
  });

  it('should reject expired tokens', () => {
    const token = signToken(
      { userId: 'u1', email: 'test@test.com', role: 'coordinator', name: 'Test' },
      { expiresIn: '0s' } // Already expired
    );
    const { req, res, next } = createMocks(`Bearer ${token}`);

    // Small delay to ensure expiration
    setTimeout(() => {
      verifyToken(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('expired');
    }, 10);
  });

  it('should accept valid tokens and attach user to req', () => {
    const payload = {
      userId: 'user-123',
      email: 'coordinator@omniguard.io',
      role: 'coordinator',
      name: 'Commander Alpha',
    };
    const token = signToken(payload);
    const { req, res, next } = createMocks(`Bearer ${token}`);

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // Called with no error
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('user-123');
    expect(req.user.role).toBe('coordinator');
    expect(req.user.email).toBe('coordinator@omniguard.io');
    expect(req.user.name).toBe('Commander Alpha');
  });

  it('should reject tokens signed with wrong secret', () => {
    const token = jwt.sign(
      { userId: 'u1', email: 'test@test.com', role: 'civilian', name: 'Test' },
      'wrong-secret-key-that-is-at-least-32-chars',
      { algorithm: 'HS256' }
    );
    const { req, res, next } = createMocks(`Bearer ${token}`);

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should reject Bearer with empty token string', () => {
    const { req, res, next } = createMocks('Bearer ');

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});
