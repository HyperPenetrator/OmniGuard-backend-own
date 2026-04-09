/**
 * OmniGuard Backend — Zod Request Validation Middleware
 * Factory that creates middleware to validate req.body, req.query, or req.params.
 */

const { ValidationError } = require('../utils/errors');

/**
 * Factory: creates middleware that validates the specified request property
 * against a Zod schema. Parse-not-validate: replaces the property with the
 * parsed (coerced + stripped) result on success.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} [source='body'] - Request property to validate
 * @returns {Function} Express middleware
 *
 * @example
 *   const { z } = require('zod');
 *   const schema = z.object({ type: z.string().min(3), location: z.string() });
 *   router.post('/incidents', validate(schema), handler);
 */
function validate(schema, source = 'body') {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      return next(new ValidationError('Request validation failed', details));
    }

    // Replace with parsed data (coerced types, stripped unknown keys)
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
