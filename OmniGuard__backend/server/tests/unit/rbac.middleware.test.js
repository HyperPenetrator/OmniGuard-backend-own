/**
 * OmniGuard Backend — RBAC Middleware Unit Tests
 * Tests role-based access control for all role combinations.
 */

const { requireRole } = require('../../middleware/rbac');

// Helper: create mock req/res/next
function createMocks(role) {
  const req = {
    user: role ? { userId: 'test-user', role, name: 'Test' } : null,
    requestId: 'test-req-id',
    originalUrl: '/api/test',
    method: 'GET',
    app: { locals: { logger: { warn: jest.fn() } } },
  };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
}

describe('RBAC Middleware (requireRole)', () => {
  describe('Single role checks', () => {
    it('should allow coordinator access to coordinator-only routes', () => {
      const middleware = requireRole('coordinator');
      const { req, res, next } = createMocks('coordinator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(); // No error
    });

    it('should deny responder access to coordinator-only routes', () => {
      const middleware = requireRole('coordinator');
      const { req, res, next } = createMocks('responder');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should deny civilian access to coordinator-only routes', () => {
      const middleware = requireRole('coordinator');
      const { req, res, next } = createMocks('civilian');

      middleware(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });

  describe('Multi-role checks', () => {
    it('should allow coordinator access to coordinator+responder routes', () => {
      const middleware = requireRole('coordinator', 'responder');
      const { req, res, next } = createMocks('coordinator');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow responder access to coordinator+responder routes', () => {
      const middleware = requireRole('coordinator', 'responder');
      const { req, res, next } = createMocks('responder');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny civilian access to coordinator+responder routes', () => {
      const middleware = requireRole('coordinator', 'responder');
      const { req, res, next } = createMocks('civilian');

      middleware(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });

  describe('Edge cases', () => {
    it('should deny access when req.user is null', () => {
      const middleware = requireRole('coordinator');
      const { req, res, next } = createMocks(null);

      middleware(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it('should deny access when user role is undefined', () => {
      const middleware = requireRole('coordinator');
      const req = {
        user: { userId: 'test', name: 'Test' }, // role missing
        requestId: 'test-id',
        originalUrl: '/api/test',
        method: 'GET',
        app: { locals: { logger: { warn: jest.fn() } } },
      };
      const next = jest.fn();

      middleware(req, {}, next);

      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it('should log denied access with request context', () => {
      const middleware = requireRole('coordinator');
      const { req, res, next } = createMocks('civilian');

      middleware(req, res, next);

      expect(req.app.locals.logger.warn).toHaveBeenCalledWith(
        'RBAC denied',
        expect.objectContaining({
          userId: 'test-user',
          userRole: 'civilian',
          requiredRoles: ['coordinator'],
        })
      );
    });
  });

  describe('Full RBAC matrix', () => {
    const routes = [
      { name: 'DELETE incident', roles: ['coordinator'], allow: ['coordinator'], deny: ['responder', 'civilian'] },
      { name: 'PATCH status', roles: ['coordinator', 'responder'], allow: ['coordinator', 'responder'], deny: ['civilian'] },
      { name: 'Manual triage', roles: ['coordinator'], allow: ['coordinator'], deny: ['responder', 'civilian'] },
    ];

    routes.forEach(({ name, roles, allow, deny }) => {
      describe(`${name} (requires: ${roles.join(', ')})`, () => {
        const middleware = requireRole(...roles);

        allow.forEach((role) => {
          it(`should ALLOW ${role}`, () => {
            const { req, res, next } = createMocks(role);
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
          });
        });

        deny.forEach((role) => {
          it(`should DENY ${role}`, () => {
            const { req, res, next } = createMocks(role);
            middleware(req, res, next);
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(403);
          });
        });
      });
    });
  });
});
