/**
 * OmniGuard Backend — JWT Authentication Middleware
 * Validates Bearer tokens, attaches decoded user payload to req.user.
 */

const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../utils/errors');

/**
 * Factory: creates JWT verification middleware using the given env config.
 * @param {object} env - Validated environment config
 * @returns {Function} Express middleware
 */
function createAuthMiddleware(env) {
  return function verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('Missing or malformed authorization header');
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        throw new AuthenticationError('Token not provided');
      }

      // Verify and decode the JWT
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      });

      // Attach user payload to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      };

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return next(error);
      }

      if (error.name === 'TokenExpiredError') {
        return next(new AuthenticationError('Token has expired'));
      }

      if (error.name === 'JsonWebTokenError') {
        return next(new AuthenticationError('Invalid token'));
      }

      return next(new AuthenticationError('Authentication failed'));
    }
  };
}

module.exports = { createAuthMiddleware };
