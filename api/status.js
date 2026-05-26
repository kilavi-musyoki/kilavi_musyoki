// Vercel Serverless Function — Current Availability / Hire-Me Status
//
// GET /api/status → { available, seeking, until }
// Controlled via Vercel env vars: STATUS_AVAILABLE, STATUS_SEEKING, STATUS_UNTIL

// ── In-memory rate limiter (30 req / IP / min for a public GET) ───────────
const _rlStore    = new Map();
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX_REQ   = 30;

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = _rlStore.get(ip) || { count: 0, resetAt: now + RL_WINDOW_MS };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RL_WINDOW_MS; }
  entry.count++;
  _rlStore.set(ip, entry);
  return { allowed: entry.count <= RL_MAX_REQ };
}

export default async function handler(req, res) {
  // ── CORS — Allow GitHub Pages, Localhost, same-origin, and Vercel domains ──
  const origin = req.headers.origin;
  const allowedOrigins = ['https://kilavi-musyoki.github.io'];
  if (process.env.VERCEL_ENV !== 'production') allowedOrigins.push('http://localhost:5173');
  if (process.env.ALLOWED_ORIGIN) allowedOrigins.push(process.env.ALLOWED_ORIGIN);

  const isAllowed = 
      !origin || 
      allowedOrigins.includes(origin) || 
      (req.headers.host && origin.replace(/^https?:\/\//, '') === req.headers.host) ||
      /\.vercel\.app$/.test(origin);

  if (!isAllowed) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }

  res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Rate limit
  const clientIp = ((req.headers['x-forwarded-for'] || '') + '').split(',')[0].trim()
                   || req.socket?.remoteAddress
                   || 'unknown';
  if (!checkRateLimit(clientIp).allowed) {
    res.status(429).json({ error: 'Too many requests.' });
    return;
  }

  // Cache at the CDN edge for 5 minutes — reduces cold hammering significantly
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

  const availableEnv = process.env.STATUS_AVAILABLE;
  const available =
    typeof availableEnv === 'string'
      ? availableEnv.toLowerCase() === 'true'
      : true;

  res.status(200).json({
    available,
    seeking: process.env.STATUS_SEEKING || 'Industrial Attachment',
    until:   process.env.STATUS_UNTIL   || 'May 2026',
  });
}
