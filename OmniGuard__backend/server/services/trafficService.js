/**
 * OmniGuard Backend — Traffic Analytics Service
 * Manages in-memory circular buffers for request logs and provides
 * real-time aggregations of HTTP metrics.
 */

const MAX_LOGS = 100;
const requestBuffer = [];

// Aggregated metric counters
const statusCounts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
const methodCounts = {};
let totalRequests = 0;
let totalDurationSum = 0;

/**
 * Mask IP addresses to preserve client anonymity while allowing analytics.
 * @param {string} ip - Unmasked IP address
 * @returns {string} Masked IP address
 */
function maskIp(ip) {
  if (!ip) return 'unknown';
  
  // IPv6 loopback or format
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.x';
  }
  
  // IPv4 mapping in IPv6
  if (ip.startsWith('::ffff:')) {
    const ipv4 = ip.substring(7);
    const parts = ipv4.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
    }
  }

  // IPv4 standard
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  // Standard IPv6
  const groups = ip.split(':');
  if (groups.length > 1) {
    groups[groups.length - 1] = 'xxxx';
    return groups.join(':');
  }

  return 'masked';
}

/**
 * Record a single HTTP request's statistics.
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {number} durationMs - Execution time in milliseconds
 * @returns {object} The recorded request payload
 */
function recordRequest(req, res, durationMs) {
  const status = res.statusCode;
  const method = req.method;
  const path = req.originalUrl || req.url;
  
  // Skip static resources or manifest files if necessary, but log all APIs
  const isApi = path.startsWith('/api');

  const logEntry = {
    timestamp: new Date().toISOString(),
    method,
    path,
    status,
    durationMs,
    ip: maskIp(req.ip || req.connection?.remoteAddress),
    requestId: req.requestId || 'unknown',
  };

  // Add to ring buffer
  requestBuffer.unshift(logEntry);
  if (requestBuffer.length > MAX_LOGS) {
    requestBuffer.pop();
  }

  // Update real-time global aggregates
  totalRequests++;
  totalDurationSum += durationMs;
  
  // Status categorization
  const cat = Math.floor(status / 100);
  if (cat === 2) statusCounts['2xx']++;
  else if (cat === 3) statusCounts['3xx']++;
  else if (cat === 4) statusCounts['4xx']++;
  else if (cat === 5) statusCounts['5xx']++;

  // Method categorization
  methodCounts[method] = (methodCounts[method] || 0) + 1;

  return logEntry;
}

/**
 * Compile and calculate system traffic statistics.
 * @returns {object} Aggregated traffic analytics report
 */
function getTrafficStats() {
  const avgResponseTime = totalRequests > 0 ? Math.round(totalDurationSum / totalRequests) : 0;
  
  // Calculate average duration of recent requests in the buffer
  const recentSum = requestBuffer.reduce((sum, item) => sum + item.durationMs, 0);
  const recentAvg = requestBuffer.length > 0 ? Math.round(recentSum / requestBuffer.length) : 0;

  return {
    summary: {
      totalRequests,
      avgResponseTimeMs: avgResponseTime,
      recentAvgResponseTimeMs: recentAvg,
      activeConnectionsCount: requestBuffer.length,
    },
    statusCodes: { ...statusCounts },
    methods: { ...methodCounts },
    recentLogs: [...requestBuffer],
  };
}

module.exports = {
  recordRequest,
  getTrafficStats,
};
