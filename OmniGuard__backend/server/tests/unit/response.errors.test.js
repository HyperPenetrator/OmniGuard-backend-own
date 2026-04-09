/**
 * OmniGuard Backend — Response Envelope & Error Classes Unit Tests
 */

const { sendSuccess, sendPaginated, sendError } = require('../../utils/response');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServiceUnavailableError,
} = require('../../utils/errors');

// Mock Express response object
function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    req: { requestId: 'test-req-123' },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe('Response Envelope', () => {
  describe('sendSuccess', () => {
    it('should return standard success envelope', () => {
      const res = createMockRes();
      sendSuccess(res, { id: '123', name: 'Test' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('123');
      expect(res.body.error).toBeNull();
      expect(res.body.meta.requestId).toBe('test-req-123');
      expect(res.body.meta.timestamp).toBeDefined();
    });

    it('should allow custom status codes', () => {
      const res = createMockRes();
      sendSuccess(res, { created: true }, 201);
      expect(res.statusCode).toBe(201);
    });
  });

  describe('sendPaginated', () => {
    it('should include pagination metadata', () => {
      const res = createMockRes();
      sendPaginated(res, [{ id: '1' }, { id: '2' }], { page: 1, limit: 20, total: 42 });

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.pagination.page).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(20);
      expect(res.body.meta.pagination.total).toBe(42);
      expect(res.body.meta.pagination.totalPages).toBe(3);
    });
  });

  describe('sendError', () => {
    it('should return standard error envelope', () => {
      const res = createMockRes();
      sendError(res, 400, 'VALIDATION_ERROR', 'Bad input');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Bad input');
    });

    it('should include details when provided', () => {
      const res = createMockRes();
      const details = [{ field: 'email', message: 'Invalid format' }];
      sendError(res, 400, 'VALIDATION_ERROR', 'Bad input', details);

      expect(res.body.error.details).toEqual(details);
    });
  });
});

describe('Custom Error Classes', () => {
  it('ValidationError should have correct properties', () => {
    const err = new ValidationError('Field invalid', [{ field: 'email' }]);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.isOperational).toBe(true);
    expect(err.details).toHaveLength(1);
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('AuthenticationError should be 401', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTHENTICATION_ERROR');
  });

  it('AuthorizationError should be 403', () => {
    const err = new AuthorizationError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('AUTHORIZATION_ERROR');
  });

  it('NotFoundError should include resource name', () => {
    const err = new NotFoundError('Incident');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Incident not found');
  });

  it('ServiceUnavailableError should be 503', () => {
    const err = new ServiceUnavailableError('Gemini API');
    expect(err.statusCode).toBe(503);
    expect(err.message).toContain('Gemini API');
  });

  it('All errors should have stack traces', () => {
    const err = new ValidationError('test');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('ValidationError');
  });
});
