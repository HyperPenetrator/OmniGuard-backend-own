/**
 * OmniGuard Backend — Standard API Response Envelope
 *
 * All API responses follow this structure:
 * {
 *   success: boolean,
 *   data: any | null,
 *   meta: { requestId, timestamp, pagination? },
 *   error: { code, message, details? } | null
 * }
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {any} data - Response payload
 * @param {number} [statusCode=200] - HTTP status code
 * @param {object} [meta={}] - Additional metadata (e.g., pagination)
 */
function sendSuccess(res, data, statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      requestId: res.req?.requestId || null,
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error: null,
  });
}

/**
 * Send a paginated success response.
 * @param {import('express').Response} res
 * @param {any[]} data - Array of items
 * @param {object} pagination - { page, limit, total }
 */
function sendPaginated(res, data, pagination) {
  return sendSuccess(res, data, 200, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Machine-readable error code (e.g., VALIDATION_ERROR)
 * @param {string} message - Human-readable error description
 * @param {any[]} [details] - Optional array of detailed error info
 */
function sendError(res, statusCode, code, message, details = null) {
  const errorPayload = { code, message };
  if (details) errorPayload.details = details;

  return res.status(statusCode).json({
    success: false,
    data: null,
    meta: {
      requestId: res.req?.requestId || null,
      timestamp: new Date().toISOString(),
    },
    error: errorPayload,
  });
}

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
};
