// api/rate-limit.js
// Hybrid Serverless Rate Limiter
// - Uses Upstash Redis REST API if UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN are set.
// - Falls back gracefully to a local in-memory Map in local development/fallback mode.
// - 100% Zero-dependency (uses standard fetch).

const memoryStore = new Map();

/**
 * Check if the given client IP has exceeded the rate limit.
 *
 * @param {string} ip - The client's IP address
 * @param {number} limit - Maximum requests allowed in the window
 * @param {number} windowSec - Time window in seconds
 * @returns {Promise<{allowed: boolean, count: number, limit: number}>}
 */
export async function checkRateLimit(ip, limit = 5, windowSec = 60) {
  const now = Date.now();
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      // Key format: ratelimit:ip:windowId
      // Segmenting by window ID naturally clusters requests and avoids complex Redis script cleanups.
      const key = `ratelimit:${ip}:${Math.floor(now / (windowSec * 1000))}`;
      
      // Execute INCR and EXPIRE pipeline via standard HTTP REST fetch
      const response = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSec * 2], // Keep expiry slightly longer to clear trace reliably
        ]),
      });

      if (response.ok) {
        const result = await response.json();
        // Pipeline returns array of responses: [ { result: count }, { result: 1 } ]
        const count = result[0]?.result;
        if (typeof count === 'number') {
          return { allowed: count <= limit, count, limit };
        }
      }
    } catch (err) {
      console.warn('Rate Limit: Upstash Redis connection failed, falling back to memory store:', err);
    }
  }

  // Fallback to local in-memory Map (Vercel container isolated, resets on cold start)
  const windowMs = windowSec * 1000;
  const entry = memoryStore.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  memoryStore.set(ip, entry);
  return { allowed: entry.count <= limit, count: entry.count, limit };
}
