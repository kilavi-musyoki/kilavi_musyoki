// Vercel Serverless Function — Contact Form Email Delivery
// Deploy: this file goes in /api/contact.js at project root
// If using Vercel, this auto-deploys as an API route: POST /api/contact

import nodemailer from 'nodemailer';

// ── In-memory rate limiter ─────────────────────────────────────────────────
// Limits each IP to 5 requests per minute. Resets on cold starts (acceptable
// for a low-traffic portfolio). No external dependencies needed.
const _rlStore = new Map();
const RL_WINDOW_MS   = 60 * 1000; // 1-minute window
const RL_MAX_REQ     = 5;         // max submissions per IP per window

function checkRateLimit(ip) {
    const now   = Date.now();
    const entry = _rlStore.get(ip) || { count: 0, resetAt: now + RL_WINDOW_MS };
    if (now > entry.resetAt) {
        entry.count   = 0;
        entry.resetAt = now + RL_WINDOW_MS;
    }
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

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, email, subject, message, turnstileToken } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Server-side input length limits — prevents payload bombing
    if (name.length > 100 || email.length > 254 || (subject && subject.length > 200) || message.length > 5000) {
        return res.status(400).json({ error: 'Input exceeds maximum allowed length' });
    }

    // Strict email format validation — prevents email header injection via replyTo
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

    // Utility to escape HTML to prevent injection
    const escapeHtml = (unsafe) => {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Sanitize inputs
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    // Recipient email — sourced from env var for flexibility
    const recipientEmail = process.env.CONTACT_RECIPIENT || 'musyokikilavi870@gmail.com';

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.GMAIL_USER, 
                pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your main password!)
            },
        });

        await transporter.sendMail({
            from: `"Silicon Soul Portfolio" <${process.env.GMAIL_USER}>`,
            to: recipientEmail,
            replyTo: email, // Note: Not using safeEmail here because it needs to be valid email for replyTo
            subject: `[Portfolio] ${safeSubject || 'New contact from ' + safeName}`,
            html: `
        <div style="font-family: monospace; background: #0A0A0F; color: #00FF88; padding: 24px; border-radius: 8px;">
          <h2 style="color: #D4A843; margin-bottom: 16px;">📨 New Signal Received — Silicon Soul</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: rgba(0,255,136,0.5); width: 100px;">FROM:</td><td style="color: #e0ffe8;">${safeName}</td></tr>
            <tr><td style="padding: 8px 0; color: rgba(0,255,136,0.5);">EMAIL:</td><td style="color: #e0ffe8;">${safeEmail}</td></tr>
            <tr><td style="padding: 8px 0; color: rgba(0,255,136,0.5);">SUBJECT:</td><td style="color: #e0ffe8;">${safeSubject || '—'}</td></tr>
          </table>
          <hr style="border-color: rgba(0,255,136,0.2); margin: 16px 0;" />
          <div style="color: rgba(0,255,136,0.6); margin-bottom: 8px;">MESSAGE:</div>
          <div style="color: #e0ffe8; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</div>
          <hr style="border-color: rgba(0,255,136,0.2); margin: 16px 0;" />
          <div style="color: rgba(0,255,136,0.3); font-size: 11px;">SN-2024-KM-PORTFOLIO-REV2 · Silicon Soul</div>
        </div>
      `,
        });

        res.status(200).json({ success: true, message: 'Signal transmitted.' });
    } catch (err) {
        console.error('Email send error:', err);
        res.status(500).json({ error: 'Transmission failed. Check SMTP configuration.' });
    }
}
