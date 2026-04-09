/**
 * OmniGuard Backend — Gemini AI Triage Service
 * Server-side crisis triage using Google Gemini 1.5 Flash.
 * Validates AI output with Zod, falls back to rule-based classifier on failure.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');

// ── Zod Schema: Validates Gemini's JSON output ──────────
const TriageResultSchema = z.object({
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  briefSummary: z.string().min(5).max(500),
  tacticalAdvice: z.string().min(5).max(500),
  recommendedTeam: z.enum(['Medical', 'Fire', 'Security', 'All']),
  estimatedResponseTime: z.number().min(1).max(120),
  riskFactors: z.array(z.string().max(100)).max(5),
});

// ── Rule-based Fallback Classifier ──────────────────────
const FALLBACK_RULES = {
  medical: { severity: 'Critical', recommendedTeam: 'Medical', estimatedResponseTime: 3 },
  cardiac: { severity: 'Critical', recommendedTeam: 'Medical', estimatedResponseTime: 2 },
  fire: { severity: 'Critical', recommendedTeam: 'Fire', estimatedResponseTime: 5 },
  explosion: { severity: 'Critical', recommendedTeam: 'Fire', estimatedResponseTime: 3 },
  security: { severity: 'High', recommendedTeam: 'Security', estimatedResponseTime: 5 },
  intrusion: { severity: 'High', recommendedTeam: 'Security', estimatedResponseTime: 5 },
  breach: { severity: 'High', recommendedTeam: 'Security', estimatedResponseTime: 5 },
  communication: { severity: 'Medium', recommendedTeam: 'Security', estimatedResponseTime: 15 },
  outage: { severity: 'Medium', recommendedTeam: 'Security', estimatedResponseTime: 15 },
  flooding: { severity: 'High', recommendedTeam: 'All', estimatedResponseTime: 10 },
  earthquake: { severity: 'Critical', recommendedTeam: 'All', estimatedResponseTime: 5 },
};

const DEFAULT_FALLBACK = {
  severity: 'Medium',
  recommendedTeam: 'Security',
  estimatedResponseTime: 10,
};

/**
 * Run rule-based fallback triage.
 * @param {string} type - Incident type
 * @param {string} location - Incident location/sector
 * @returns {object} Triage result matching TriageResultSchema
 */
function ruleBasedTriage(type, location) {
  const typeLower = type.toLowerCase();

  // Find matching rule
  let rule = DEFAULT_FALLBACK;
  for (const [keyword, ruleData] of Object.entries(FALLBACK_RULES)) {
    if (typeLower.includes(keyword)) {
      rule = ruleData;
      break;
    }
  }

  return {
    severity: rule.severity,
    briefSummary: `${type} reported at ${location}. Automated severity assessment applied.`,
    tacticalAdvice: `Deploy ${rule.recommendedTeam} team to ${location}. Follow standard operating procedure.`,
    recommendedTeam: rule.recommendedTeam,
    estimatedResponseTime: rule.estimatedResponseTime,
    riskFactors: ['Automated assessment — manual review recommended'],
  };
}

/**
 * Sleep utility for exponential backoff.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Triage an incident using Gemini AI with retry logic and Zod validation.
 * Falls back to rule-based classifier if Gemini fails after all retries.
 *
 * @param {object} params
 * @param {string} params.type - Incident type
 * @param {object} params.location - { sector, coordinates? }
 * @param {string} [params.contextData] - Additional context
 * @param {object} params.reportedBy - { role, name }
 * @param {object} env - Environment config (for API key and model)
 * @param {import('winston').Logger} logger - Winston logger
 * @returns {Promise<{ result: object, model: string }>}
 *   result: validated triage data
 *   model: 'gemini-1.5-flash' or 'rule-based-fallback'
 */
async function triageIncident({ type, location, contextData, reportedBy }, env, logger) {
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 1000;

  // Attempt Gemini triage with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Gemini triage attempt ${attempt}/${MAX_RETRIES}`, {
        type,
        sector: location?.sector,
      });

      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: env.GEMINI_MODEL || 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `
You are the OmniGuard AI Triage Engine — a military-grade crisis classification system.

INCOMING INCIDENT REPORT:
- Type: ${type}
- Location/Sector: ${location?.sector || 'Unknown sector'}
- Coordinates: ${location?.coordinates ? `${location.coordinates.lat}, ${location.coordinates.lng}` : 'Not available'}
- Reported by: ${reportedBy?.name || 'Anonymous'} (Role: ${reportedBy?.role || 'unknown'})
- Additional Context: ${contextData || 'None provided'}

CLASSIFICATION PROTOCOL:
1. Assess the threat level based on incident type and context.
2. Assign severity based on potential for loss of life, property damage, and operational impact.
3. Recommend the most appropriate response team.
4. Estimate realistic response time in minutes.
5. Identify specific risk factors.

RESPOND WITH VALID JSON ONLY — no markdown, no explanation:
{
  "severity": "Critical" | "High" | "Medium" | "Low",
  "briefSummary": "Concise operational summary (max 300 chars)",
  "tacticalAdvice": "Immediate instruction for field teams (max 500 chars)",
  "recommendedTeam": "Medical" | "Fire" | "Security" | "All",
  "estimatedResponseTime": <number 1-120 in minutes>,
  "riskFactors": ["risk1", "risk2"] (max 5 items)
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Parse and validate with Zod
      const parsed = JSON.parse(responseText);
      const validated = TriageResultSchema.parse(parsed);

      logger.info('Gemini triage successful', {
        severity: validated.severity,
        recommendedTeam: validated.recommendedTeam,
        attempt,
      });

      return {
        result: validated,
        model: env.GEMINI_MODEL || 'gemini-1.5-flash',
      };
    } catch (error) {
      logger.warn(`Gemini triage attempt ${attempt} failed`, {
        error: error.message,
        attempt,
        maxRetries: MAX_RETRIES,
      });

      // If not the last attempt, wait with exponential backoff
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.info(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted — use rule-based fallback
  logger.warn('Gemini triage exhausted all retries. Using rule-based fallback.', {
    type,
    sector: location?.sector,
  });

  const fallbackResult = ruleBasedTriage(type, location?.sector || 'Unknown');

  return {
    result: fallbackResult,
    model: 'rule-based-fallback',
  };
}

/**
 * Check if the Gemini API key is valid by making a minimal call.
 * @param {string} apiKey
 * @returns {Promise<boolean>}
 */
async function checkGeminiHealth(apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('respond with ok');
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  triageIncident,
  ruleBasedTriage,
  checkGeminiHealth,
  TriageResultSchema,
};
