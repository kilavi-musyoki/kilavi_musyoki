// ── In-memory rate limiter ─────────────────────────────────────────────────
const _rlStore    = new Map();
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX_REQ   = 5;

function checkRateLimit(ip) {
    const now   = Date.now();
    const entry = _rlStore.get(ip) || { count: 0, resetAt: now + RL_WINDOW_MS };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RL_WINDOW_MS; }
    entry.count++;
    _rlStore.set(ip, entry);
    return { allowed: entry.count <= RL_MAX_REQ };
}

export default async function handler(req, res) {
    // ── IP-based rate limiting ───────────────────────────────────────────────
    const clientIp = ((req.headers['x-forwarded-for'] || '') + '').split(',')[0].trim()
                     || req.socket?.remoteAddress
                     || 'unknown';
    if (!checkRateLimit(clientIp).allowed) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute before trying again.' });
    }

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

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, subject, message, type, timestamp, turnstileToken } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Server-side input length limits — prevents payload bombing
    if (name.length > 100 || email.length > 254 || (subject && subject.length > 200) || message.length > 5000) {
        return res.status(400).json({ error: 'Input exceeds maximum allowed length' });
    }

    // Strict email format validation
    const emailRegex = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address format' });
    }

    // Turnstile verification — FAIL CLOSED: if secret key is missing, refuse all requests.
    // This prevents the CAPTCHA gate from silently dropping on misconfigured deployments.
    if (!process.env.TURNSTILE_SECRET_KEY) {
        console.error('SECURITY: TURNSTILE_SECRET_KEY is not configured. Rejecting request.');
        return res.status(500).json({ error: 'Server security misconfiguration. Contact the administrator.' });
    }

    if (!turnstileToken) {
        return res.status(403).json({ error: 'Missing security token' });
    }

    try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: turnstileToken,
            }),
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
            return res.status(403).json({ error: 'Invalid security token' });
        }
    } catch (verifyError) {
        console.error('Turnstile verification failed:', verifyError);
        return res.status(500).json({ error: 'Security verification failed' });
    }

    // Use the secure environment variable that is NOT exposed to the frontend bundle
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK;

    if (!webhookUrl) {
        console.error('GOOGLE_SHEET_WEBHOOK is not defined in environment variables.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Utility to prevent Google Sheets Formula Injection
    const sanitizeForSheets = (value) => {
        if (typeof value !== 'string') return value;
        if (/^[=+\-@]/.test(value)) {
            return "'" + value;
        }
        return value;
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // We use standard fetch here on the backend. 
            // Note: If the Google Apps Script expects redirects to be followed, Node's fetch handles it.
            body: JSON.stringify({
                type: type || 'contact',
                timestamp: timestamp || new Date().toISOString(),
                name: sanitizeForSheets(name),
                email: sanitizeForSheets(email),
                subject: sanitizeForSheets(subject),
                message: sanitizeForSheets(message),
            }),
        });

        // We can safely read response status on the backend
        if (!response.ok) {
            throw new Error(`Google Webhook returned ${response.status}`);
        }

        res.status(200).json({ success: true, message: 'Signal transmitted.' });
    } catch (error) {
        console.error('Error proxying to Google Sheet:', error);
        res.status(500).json({ error: 'Failed to transmit signal to database.' });
    }
}
