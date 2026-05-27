// Vercel Serverless Function — CV Download Event Logger
//
// POST /api/track-download
// Logs a CV download event to Google Sheets via the sheet-proxy webhook.
// Called by the frontend when a user downloads the CV.

import { checkRateLimit } from './rate-limit.js';

// ── Shared sanitizer — prevents Google Sheets formula injection ──────────
function sanitizeForSheets(value) {
    if (typeof value !== 'string') return '';
    // Strip any leading formula-trigger characters
    let sanitized = value;
    if (/^[=+\-@]/.test(sanitized)) {
        sanitized = "'" + sanitized;
    }
    // Length cap — Referer can be arbitrarily long
    return sanitized.slice(0, 500);
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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // ── Rate limit ────────────────────────────────────────────────────────
    const clientIp = ((req.headers['x-forwarded-for'] || '') + '').split(',')[0].trim()
                     || req.socket?.remoteAddress
                     || 'unknown';
    const rateLimit = await checkRateLimit(clientIp, 10, 60);
    if (!rateLimit.allowed) {
        return res.status(429).json({ error: 'Too many requests.' });
    }

    // ── Origin validation — only allow requests that came from our own site ──
    // This blocks direct curl/Postman abuse since they won't have a matching Origin.
    // Combined with CORS, this provides defense-in-depth.
    if (!origin || !isAllowed) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // ── Log to Google Sheets ──────────────────────────────────────────────
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK;
    if (!webhookUrl) {
        console.error('GOOGLE_SHEET_WEBHOOK is not configured.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Sanitize the Referer header — it's attacker-controlled and could contain
    // Google Sheets formula injection payloads (e.g. =IMPORTRANGE(...))
    const safeReferer = sanitizeForSheets(req.headers.referer || 'unknown page');

    try {
        await fetch(webhookUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type:      'cv-download',
                timestamp: new Date().toISOString(),
                name:      '—',
                email:     '—',
                subject:   'CV Download',
                message:   `CV downloaded from ${safeReferer}`,
            }),
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('track-download: sheet log failed:', err);
        // Still return success — tracking failure shouldn't block the user
        res.status(200).json({ success: true });
    }
}
