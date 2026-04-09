/**
 * OmniGuard Backend — Role-Based Access Control Middleware
 * Factory function that creates middleware restricting routes to specific roles.
 */

const { AuthorizationError } = require('../utils/errors');

/**
 * Factory: creates middleware that restricts access to the specified roles.
 * Must be placed AFTER the auth middleware (req.user must exist).
 *
 * @param {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware
 *
 * @example
 *   router.delete('/incidents/:id', verifyToken, requireRole('coordinator'), handler);
 *   router.patch('/status', verifyToken, requireRole('coordinator', 'responder'), handler);
 */
function requireRole(...allowedRoles) {
  return function rbacMiddleware(req, res, next) {
    if (!req.user) {
      return next(new AuthorizationError('User context not found. Authentication required.'));
    }

    const userRole = req.user.role;

    if (!userRole) {
      return next(new AuthorizationError('User role not defined'));
    }

    if (!allowedRoles.includes(userRole)) {
      const logger = req.app?.locals?.logger;
      if (logger) {
        logger.warn('RBAC denied', {
          requestId: req.requestId,
          userId: req.user.userId,
          userRole,
          requiredRoles: allowedRoles,
          path: req.originalUrl,
          method: req.method,
        });
      }

      return next(
        new AuthorizationError(
          `Role '${userRole}' does not have permission for this action. Required: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
}

module.exports = { requireRole };
