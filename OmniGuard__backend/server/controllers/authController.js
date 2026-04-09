/**
 * OmniGuard Backend — Auth Controller
 * Handles login (JWT issuance) and refresh token rotation.
 * Uses Firestore users collection for credential verification.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getUserByEmail, updateUserLastSeen } = require('../services/firestoreService');
const { AuthenticationError, ValidationError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/auth/login
 * Validates email + password against Firestore, returns JWT access + refresh tokens.
 *
 * NOTE: In a production system, passwords should be hashed with bcrypt.
 * For this implementation, we use a simplified hash comparison suitable
 * for the OmniGuard prototype. Swap to bcrypt before production deployment.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const env = req.app.locals.env;
    const logger = req.app.locals.logger;

    // Find user by email in Firestore
    const user = await getUserByEmail(email);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated. Contact your coordinator.');
    }

    // Verify password (SHA-256 hash comparison for prototype)
    const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== hashedInput) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: 'omniguard-api',
        subject: user.id,
      }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        tokenType: 'refresh',
      },
      env.JWT_REFRESH_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        issuer: 'omniguard-api',
        subject: user.id,
      }
    );

    // Update last seen timestamp
    await updateUserLastSeen(user.id);

    logger.info('User authenticated', {
      requestId: req.requestId,
      userId: user.id,
      role: user.role,
    });

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        nodeId: user.nodeId,
      },
      expiresIn: env.JWT_EXPIRES_IN,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Validates a refresh token and issues a new access + refresh token pair.
 * Implements token rotation — old refresh token becomes invalid conceptually.
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const env = req.app.locals.env;
    const logger = req.app.locals.logger;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
        issuer: 'omniguard-api',
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Refresh token has expired. Please login again.');
      }
      throw new AuthenticationError('Invalid refresh token');
    }

    if (decoded.tokenType !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    // Look up user to get current role/info (may have changed since token was issued)
    const { getUserById } = require('../services/firestoreService');
    const user = await getUserById(decoded.userId);

    if (!user || !user.isActive) {
      throw new AuthenticationError('User account not found or deactivated');
    }

    // Issue new token pair
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: 'omniguard-api',
        subject: user.id,
      }
    );

    const newRefreshToken = jwt.sign(
      {
        userId: user.id,
        tokenType: 'refresh',
      },
      env.JWT_REFRESH_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        issuer: 'omniguard-api',
        subject: user.id,
      }
    );

    logger.info('Token refreshed', {
      requestId: req.requestId,
      userId: user.id,
    });

    sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, refresh };
