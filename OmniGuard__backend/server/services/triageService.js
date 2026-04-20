/**
 * OmniGuard Backend — Gemini AI Triage Service
 * Server-side crisis triage using Google Gemini 1.5 Flash.
 * Validates AI output with Zod, falls back to rule-based classifier on failure.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const { isWithinRange } = require('./locationUtils');
const { writeAuditLog } = require('./auditService');

// ── Zod Schema: Validates Gemini's JSON output ──────────
const TriageResultSchema = z.object({
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  briefSummary: z.string().min(5).max(500),
  tacticalAdvice: z.string().min(5).max(500),
  assignedTeam: z.enum(['Fire', 'Medical', 'Police', 'Tech-Hazard']),
  estimatedResponseTime: z.number().min(1).max(120),
  riskFactors: z.array(z.string().max(100)).max(5),
});

// ── Zod Schema: Validates incoming incidents ────────────
const IncomingIncidentSchema = z.object({
  incidentId: z.string().optional(),
  type: z.string(),
  location: z.any(),
  contextData: z.string().optional().nullable(),
  reportedBy: z.any(),
  assignedTeam: z.enum(['Fire', 'Medical', 'Police', 'Tech-Hazard']).optional(),
});

// ── Rule-based Fallback Classifier ──────────────────────
const FALLBACK_RULES = {
  medical: { severity: 'Critical', assignedTeam: 'Medical', estimatedResponseTime: 3 },
  cardiac: { severity: 'Critical', assignedTeam: 'Medical', estimatedResponseTime: 2 },
  injury: { severity: 'High', assignedTeam: 'Medical', estimatedResponseTime: 5 },
  accident: { severity: 'High', assignedTeam: 'Medical', estimatedResponseTime: 5 },
  fire: { severity: 'Critical', assignedTeam: 'Fire', estimatedResponseTime: 5 },
  explosion: { severity: 'Critical', assignedTeam: 'Fire', estimatedResponseTime: 3 },
  smoke: { severity: 'High', assignedTeam: 'Fire', estimatedResponseTime: 7 },
  hazard: { severity: 'High', assignedTeam: 'Fire', estimatedResponseTime: 8 },
  security: { severity: 'High', assignedTeam: 'Police', estimatedResponseTime: 5 },
  intrusion: { severity: 'High', assignedTeam: 'Police', estimatedResponseTime: 5 },
  breach: { severity: 'High', assignedTeam: 'Police', estimatedResponseTime: 5 },
  robbery: { severity: 'Critical', assignedTeam: 'Police', estimatedResponseTime: 3 },
  crime: { severity: 'High', assignedTeam: 'Police', estimatedResponseTime: 5 },
  theft: { severity: 'Medium', assignedTeam: 'Police', estimatedResponseTime: 10 },
  communication: { severity: 'Medium', assignedTeam: 'Tech-Hazard', estimatedResponseTime: 15 },
  outage: { severity: 'Medium', assignedTeam: 'Tech-Hazard', estimatedResponseTime: 15 },
  leak: { severity: 'High', assignedTeam: 'Tech-Hazard', estimatedResponseTime: 12 },
  flooding: { severity: 'High', assignedTeam: 'Fire', estimatedResponseTime: 10 },
  earthquake: { severity: 'Critical', assignedTeam: 'Tech-Hazard', estimatedResponseTime: 5 },
  natural: { severity: 'High', assignedTeam: 'Tech-Hazard', estimatedResponseTime: 10 },
  disaster: { severity: 'Critical', assignedTeam: 'Tech-Hazard', estimatedResponseTime: 5 },

};

const DEFAULT_FALLBACK = {
  severity: 'Medium',
  assignedTeam: 'Police',
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
    tacticalAdvice: `Deploy ${rule.assignedTeam} team to ${location}. Follow standard operating procedure.`,
    assignedTeam: rule.assignedTeam,
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
 * Checks if there are responders within 5km. If not, expands to 10km and logs a warning.
 * @param {string} incidentId
 * @param {string} assignedTeam
 * @param {object} location
 * @param {import('winston').Logger} logger
 */
async function checkResponderProximity(incidentId, assignedTeam, location, logger) {
  if (!incidentId || !location?.coordinates) return;

  try {
    // Lazy load to avoid circular dependencies if any
    const { listResponders } = require('./firestoreService');
    
    // In our system, responder locations are stored in the responders collection
    const responders = await listResponders({ teamType: assignedTeam });

    const within5km = responders.filter(r => 
      r.currentPosition && isWithinRange(location.coordinates, r.currentPosition, 5)
    );

    if (within5km.length === 0) {
      // Expand to 10km
      const within10km = responders.filter(r => 
        r.currentPosition && isWithinRange(location.coordinates, r.currentPosition, 10)
      );

      // Log a 'Delayed Response Warning' to the auditService
      writeAuditLog(logger, {
        action: 'DELAYED_RESPONSE_WARNING',
        actorId: 'system',
        actorRole: 'system',
        resourceType: 'incident',
        resourceId: incidentId,
        nextState: {
          expandedRadiusKm: 10,
          respondersFoundAt10km: within10km.length,
          assignedTeam
        }
      });

      logger.warn('Delayed Response Warning: No responders within 5km', {
        incidentId,
        assignedTeam,
        respondersFoundAt10km: within10km.length
      });
    }
  } catch (error) {
    logger.error('Proximity check failed', { error: error.message, incidentId });
  }
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
 * @param {string} params.assignedTeam - Required assigned team
 * @param {object} env - Environment config (for API key and model)
 * @param {import('winston').Logger} logger - Winston logger
 * @returns {Promise<{ result: object, model: string }>}
 *   result: validated triage data
 *   model: 'gemini-1.5-flash' or 'rule-based-fallback'
 */
async function triageIncident(params, env, logger) {
  // Validate incoming incident data
  IncomingIncidentSchema.parse(params);
  
  const { incidentId, type, location, contextData, reportedBy, assignedTeam } = params;
  
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 1000;

  // Attempt Gemini triage with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const modelName = env.GEMINI_MODEL || 'gemini-1.5-flash';
      logger.info(`Gemini triage attempt ${attempt}/${MAX_RETRIES}`, {
        type,
        sector: location?.sector,
        model: modelName
      });

      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `
You are the OmniGuard AI Triage Engine — a military-grade crisis classification system.

INCOMING INCIDENT REPORT:
- Type: ${type}
- Location/Sector: ${location?.sector || 'Unknown sector'}
- Coordinates: ${location?.coordinates ? `${location.coordinates.lat}, ${location.coordinates.lng}` : 'Not available'}
- Reported by: ${reportedBy?.name || 'Anonymous'} (Role: ${reportedBy?.role || 'unknown'})
- Pre-assigned Team: ${assignedTeam || 'None (Determine from context)'}
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
  "assignedTeam": "Fire" | "Medical" | "Police" | "Tech-Hazard",
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
        assignedTeam: validated.assignedTeam,
        attempt,
      });

      // Query responder_locations and filter by radius
      await checkResponderProximity(incidentId, validated.assignedTeam, location, logger);

      return {
        result: validated,
        model: env.GEMINI_MODEL || 'gemini-1.5-flash',
      };
    } catch (error) {
      logger.warn(`Gemini triage attempt ${attempt} failed`, {
        error: error,
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
  
  await checkResponderProximity(incidentId, fallbackResult.assignedTeam, location, logger);

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
