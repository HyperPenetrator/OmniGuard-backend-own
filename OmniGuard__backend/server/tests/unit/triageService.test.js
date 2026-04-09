/**
 * OmniGuard Backend — Triage Service Unit Tests
 * Tests Gemini integration, Zod validation, fallback classifier, and retry logic.
 */

// Mock @google/generative-ai before importing
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
    __mockGenerateContent: mockGenerateContent,
  };
});

const { triageIncident, ruleBasedTriage, TriageResultSchema } = require('../../services/triageService');
const { GoogleGenerativeAI, __mockGenerateContent } = require('@google/generative-ai');

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Mock env
const mockEnv = {
  GEMINI_API_KEY: 'test-key',
  GEMINI_MODEL: 'gemini-1.5-flash',
};

describe('TriageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ruleBasedTriage', () => {
    it('should classify medical emergencies as Critical', () => {
      const result = ruleBasedTriage('Medical Emergency', 'North Alpha Sector');
      expect(result.severity).toBe('Critical');
      expect(result.recommendedTeam).toBe('Medical');
      expect(result.estimatedResponseTime).toBe(3);
    });

    it('should classify fire alarms as Critical', () => {
      const result = ruleBasedTriage('Fire Alarm Triggered', 'Kitchen Annex');
      expect(result.severity).toBe('Critical');
      expect(result.recommendedTeam).toBe('Fire');
    });

    it('should classify security breaches as High', () => {
      const result = ruleBasedTriage('Security Breach', 'Perimeter Gate 2');
      expect(result.severity).toBe('High');
      expect(result.recommendedTeam).toBe('Security');
    });

    it('should classify unknown types as Medium/Security', () => {
      const result = ruleBasedTriage('Strange Noise', 'Lobby');
      expect(result.severity).toBe('Medium');
      expect(result.recommendedTeam).toBe('Security');
    });

    it('should include location in summary', () => {
      const result = ruleBasedTriage('Fire Alarm', 'West Wing');
      expect(result.briefSummary).toContain('West Wing');
      expect(result.tacticalAdvice).toContain('West Wing');
    });

    it('should always return valid Zod schema output', () => {
      const result = ruleBasedTriage('Flooding', 'Basement');
      const parsed = TriageResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });
  });

  describe('triageIncident', () => {
    const validGeminiResponse = {
      severity: 'High',
      briefSummary: 'Medical emergency in gym area requiring immediate attention',
      tacticalAdvice: 'Deploy medical team with AED equipment to gym zone L1',
      recommendedTeam: 'Medical',
      estimatedResponseTime: 5,
      riskFactors: ['Possible cardiac event', 'Crowded area'],
    };

    it('should return Gemini result on success', async () => {
      __mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(validGeminiResponse) },
      });

      const { result, model } = await triageIncident(
        {
          type: 'Medical Emergency',
          location: { sector: 'Gym Zone' },
          reportedBy: { role: 'civilian', name: 'Test User' },
        },
        mockEnv,
        mockLogger
      );

      expect(model).toBe('gemini-1.5-flash');
      expect(result.severity).toBe('High');
      expect(result.recommendedTeam).toBe('Medical');
    });

    it('should fall back to rule-based on Gemini failure', async () => {
      __mockGenerateContent.mockRejectedValue(new Error('API error'));

      const { result, model } = await triageIncident(
        {
          type: 'Fire Alarm',
          location: { sector: 'Kitchen' },
          reportedBy: { role: 'coordinator', name: 'Admin' },
        },
        mockEnv,
        mockLogger
      );

      expect(model).toBe('rule-based-fallback');
      expect(result.severity).toBe('Critical');
      expect(result.recommendedTeam).toBe('Fire');
    });

    it('should fall back on invalid Gemini JSON output', async () => {
      __mockGenerateContent.mockResolvedValue({
        response: { text: () => '{"severity": "INVALID_VALUE"}' },
      });

      const { result, model } = await triageIncident(
        {
          type: 'Security Breach',
          location: { sector: 'Gate 2' },
          reportedBy: { role: 'responder', name: 'Guard' },
        },
        mockEnv,
        mockLogger
      );

      expect(model).toBe('rule-based-fallback');
    });

    it('should retry up to 3 times before falling back', async () => {
      __mockGenerateContent
        .mockRejectedValueOnce(new Error('Attempt 1 fail'))
        .mockRejectedValueOnce(new Error('Attempt 2 fail'))
        .mockRejectedValueOnce(new Error('Attempt 3 fail'));

      const { model } = await triageIncident(
        {
          type: 'Unknown',
          location: { sector: 'Unknown' },
          reportedBy: { role: 'civilian', name: 'Test' },
        },
        mockEnv,
        mockLogger
      );

      expect(model).toBe('rule-based-fallback');
      expect(mockLogger.warn).toHaveBeenCalledTimes(4); // 3 attempt failures + 1 fallback message
    });
  });

  describe('TriageResultSchema', () => {
    it('should accept valid triage result', () => {
      const valid = {
        severity: 'Critical',
        briefSummary: 'Fire detected in kitchen',
        tacticalAdvice: 'Evacuate and deploy fire team',
        recommendedTeam: 'Fire',
        estimatedResponseTime: 5,
        riskFactors: ['Smoke inhalation risk'],
      };
      expect(TriageResultSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject invalid severity', () => {
      const invalid = {
        severity: 'EXTREME',
        briefSummary: 'Test',
        tacticalAdvice: 'Test',
        recommendedTeam: 'Fire',
        estimatedResponseTime: 5,
        riskFactors: [],
      };
      expect(TriageResultSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject response time > 120', () => {
      const invalid = {
        severity: 'Low',
        briefSummary: 'Test summary',
        tacticalAdvice: 'Test advice',
        recommendedTeam: 'Security',
        estimatedResponseTime: 200,
        riskFactors: [],
      };
      expect(TriageResultSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
