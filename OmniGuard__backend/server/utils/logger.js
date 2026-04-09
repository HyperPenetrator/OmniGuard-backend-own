/**
 * OmniGuard Backend — Winston Logger
 * Structured JSON logging with daily rotation, request ID correlation,
 * and colorized console output in development.
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * Create and configure the Winston logger instance.
 * @param {object} env - Validated environment config
 * @returns {winston.Logger}
 */
function createLogger(env) {
  const logDir = path.resolve(env.LOG_DIR || './logs');
  const isDev = env.NODE_ENV === 'development';

  // Custom format: adds timestamp, requestId, and structured metadata
  const structuredFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
      const reqStr = requestId ? ` [${requestId}]` : '';
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level.toUpperCase().padEnd(5)}]${reqStr} ${message}${metaStr}`;
    })
  );

  // JSON format for production log files (machine-parseable)
  const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  // Colorized console format for development
  const devConsoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
      const reqStr = requestId ? ` \x1b[36m[${requestId.slice(0, 8)}]\x1b[0m` : '';
      const metaStr = Object.keys(meta).length
        ? `\n  \x1b[90m${JSON.stringify(meta, null, 2)}\x1b[0m`
        : '';
      return `${timestamp} ${level}${reqStr} ${message}${metaStr}`;
    })
  );

  const transports = [];

  // Console transport (always active)
  transports.push(
    new winston.transports.Console({
      format: isDev ? devConsoleFormat : structuredFormat,
    })
  );

  // File transports (production and development — not in test)
  if (env.NODE_ENV !== 'test') {
    // Combined log — all levels
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'omniguard-combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: jsonFormat,
      })
    );

    // Error log — errors only
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'omniguard-error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
        format: jsonFormat,
      })
    );
  }

  const logger = winston.createLogger({
    level: env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'omniguard-api' },
    transports,
    // Prevent crashes from unhandled logger errors
    exitOnError: false,
  });

  return logger;
}

module.exports = { createLogger };
