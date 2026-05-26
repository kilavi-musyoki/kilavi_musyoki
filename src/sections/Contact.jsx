import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';
import { getTheme } from '../theme.js';

// ── Responsive hook ────────────────────────────────────────────────────────────
const useWindowWidth = () => {
    const [width, setWidth] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return width;
};

// ── Oscilloscope waveform generator ───────────────────────────────────────────
const generateWavePath = (text, isTyping, width = 480, height = 100) => {
    const time = Date.now();
    const baseAmp = 4 + (text.length * 0.3);
    const targetAmp = isTyping ? baseAmp + 15 : baseAmp;
    
    const amplitude = Math.min(targetAmp, 42); 
    const freq = isTyping ? 0.08 : 0.02;
    const distortion = isTyping ? 5 : 0.5;

    const points = [];
    for (let x = 0; x <= width + 4; x += 4) {
        let wave = Math.sin(x * freq + time * 0.005) * amplitude;
        // Secondary harmonic
        wave *= (1 + 0.3 * Math.sin(x * 0.015 - time * 0.002));
        // High frequency noise
        const noise = Math.sin(x * 0.45 + time * 0.01) * distortion;
        // Static spikes
        const spike = isTyping && Math.random() > 0.95 ? (Math.random() - 0.5) * 16 : 0;
        
        const y = height / 2 + wave + noise + spike;
        points.push(`${x},${y}`);
    }
    return `M${points.join(' L')}`;
};

// ── ECG pulse path: flat → spike → flat ───────────────────────────────────────
const generateEcgPath = (progress, width = 480, height = 100) => {
    // progress 0→1 sweeps the pulse across the screen
    const mid = height / 2;
    const pulseCenter = progress * width;
    const points = [];
    for (let x = 0; x <= width; x += 3) {
        const dx = x - pulseCenter;
        let y = mid;
        if (Math.abs(dx) < 60) {
            // QRS complex shape
            if (dx < -30) y = mid + (dx + 30) * 0.3;
            else if (dx < -10) y = mid - (dx + 30) * 1.4;
            else if (dx < 0)   y = mid + dx * 4.5;
            else if (dx < 10)  y = mid - dx * 5.5;
            else if (dx < 20)  y = mid + (dx - 10) * 1.8;
            else               y = mid - (dx - 20) * 0.4;
        }
        points.push(`${x},${y}`);
    }
    return `M${points.join(' L')}`;
};

const Contact = ({ isDark }) => {
    const formRef        = useRef(null);
    const rafRef         = useRef(null);
    const typingTimerRef = useRef(null);
    // DOM refs for SVG path elements — updated directly in RAF loops to avoid
    // triggering a full React reconcile on every animation frame (~60 fps).
    const wavePathElRef = useRef(null);
    const ecgPathElRef  = useRef(null);
    const ecgGlowElRef  = useRef(null);

    const [formData,    setFormData]    = useState({ name: '', email: '', subject: '', message: '' });
    const [status,      setStatus]      = useState('idle'); // idle | sending | sent | error
    const [isTyping,    setIsTyping]    = useState(false);
    const [ecgPhase,    setEcgPhase]    = useState(0);   // drives isHeart render logic; updated only on phase change
    const [turnstileToken, setTurnstileToken] = useState('');
    const turnstileRef = useRef(null);

    // ── Backend Proxy Endpoint ──────────────────────────────────────────────────
    const webhook = (import.meta.env.VITE_API_BASE_URL || '') + '/api/sheet-proxy';

    // ── Responsive breakpoints ─────────────────────────────────────────────────
    const windowWidth = useWindowWidth();
    const isMobile  = windowWidth < 640;
    const isTablet  = windowWidth < 900;

    // ── Palette ────────────────────────────────────────────────────────────────
    const t = getTheme(isDark);
    const { dimColor, accentColor, accentGlow, accentHover, cardBg, cardBgHover, borderHover } = t;
    const textColor   = t.textBright;
    const borderColor = t.borderStrong;
    const btnColor    = t.btnTextColor;
    const errorColor  = t.statusRed;

    // Component-specific tokens (oscilloscope display)
    const sectionBg        = 'transparent';  // inherits obsidian base
    const scopeBg          = isDark ? '#00070F'                        : '#2E3A42';
    const scopeBorderColor = isDark ? 'rgba(75,216,160,0.28)'         : 'rgba(13,148,136,0.55)';
    const scopeGridColor   = isDark ? 'rgba(75,216,160,0.06)'         : 'rgba(13,148,136,0.09)';
    const scopeLabelColor  = isDark ? 'rgba(75,216,160,0.55)'         : 'rgba(13,148,136,0.7)';
    const waveColor        = isDark ? '#4BD8A0'                       : '#0D9488';
    const ecgColor         = isDark ? '#4BD8A0'                       : '#0D9488';

    // ── Idle/typing oscilloscope animation ────────────────────────────────────
    useEffect(() => {
        if (status !== 'idle' && status !== 'sending') {
            cancelAnimationFrame(rafRef.current);
            return;
        }
        const animateWave = () => {
            const text = formData.name + formData.email + formData.subject + formData.message;
            wavePathElRef.current?.setAttribute('d', generateWavePath(text, isTyping));
            rafRef.current = requestAnimationFrame(animateWave);
        };
        rafRef.current = requestAnimationFrame(animateWave);
        return () => cancelAnimationFrame(rafRef.current);
    }, [formData, isTyping, status]);

    // ── ECG success animation: 2 sweeps then hold flatline ───────────────────
    useEffect(() => {
        if (status !== 'sent') {
            return;
        }
        let progress = 0;
        let phase    = 0;
        const totalSweeps = 2;
        const speed = 0.018; // progress per frame

        const animate = () => {
            progress += speed;
            if (progress >= 1.15) {
                progress = 0;
                phase   += 1;
                // Call setState only when phase changes (3× total), not every frame.
                setEcgPhase(phase);
            }
            if (phase >= totalSweeps) {
                const flat = generateEcgPath(2, 480, 100);
                ecgPathElRef.current?.setAttribute('d', flat);
                ecgGlowElRef.current?.setAttribute('d', flat);
                return;
            }
            const d = generateEcgPath(progress, 480, 100);
            ecgPathElRef.current?.setAttribute('d', d);
            ecgGlowElRef.current?.setAttribute('d', d);
            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [status]);

    // ── Input handler ──────────────────────────────────────────────────────────
    // ── Reset ────────────────────────────────────────────────────────────────
    const resetForm = useCallback(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setStatus('idle');
        setEcgPhase(0);
        setTurnstileToken('');
        turnstileRef.current?.reset();
    }, []);

    const handleInput = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsTyping(true);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 500);
    }, []);

    // ── Shared Google Sheets logger ────────────────────────────────────────────
    const logToSheet = useCallback(async (payload) => {
        if (!webhook) throw new Error('Webhook URL not configured');
        const response = await fetch(webhook, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    }, [webhook]);

    // ── Form submit → Google Sheets ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Guard: webhook URL must be configured for the form to work
        if (!webhook) { 
            setStatus('error'); 
            setEcgPhase(0);
            return; 
        }

        const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
        if (siteKey && !turnstileToken) {
            alert('Please complete the security check.');
            return;
        }

        setStatus('sending');
        setEcgPhase(0);
        try {
            await logToSheet({
                type:      'contact',
                timestamp: new Date().toISOString(),
                name:      formData.name,
                email:     formData.email,
                subject:   formData.subject,
                message:   formData.message,
                turnstileToken,
            });
            setStatus('sent');
            turnstileRef.current?.reset();
        } catch (err) {
            console.error('Contact send error:', err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 4000);
            turnstileRef.current?.reset();
        }
    };

    // ── Shared style helpers ───────────────────────────────────────────────────
    const labelStyle = {
        fontFamily:    'JetBrains Mono, monospace',
        fontSize:      '0.6rem',
        color:         dimColor,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display:       'block',
        marginBottom:  '4px',
    };

    // ── Scope labels ───────────────────────────────────────────────────────────
    const isComplete = status === 'sent' && ecgPhase >= 2;
    const scopeStatusLabel =
        isComplete           ? '✓ SIGNAL LOCKED'
        : status === 'sent'    ? 'TRANSMITTING PULSE...'
        : status === 'sending' ? 'TRANSMITTING...'
        : isTyping             ? 'RECEIVING...'
        : 'STANDBY';

    return (
        <section
            id="contact"
            className="section-base"
            data-debug="contact-section"
            style={{ background: sectionBg }}
        >
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1rem' }}>

                {/* ── Section header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: dimColor, letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                        04 — CONTACT
                    </div>
                    <h2 style={{
                        fontFamily:   'Syne, sans-serif',
                        fontWeight:   800,
                        fontSize:     'clamp(1.6rem, 5vw, 3.5rem)',
                        color:        textColor,
                        marginBottom: '0.75rem',
                    }}>
                        Let's Build Something Real.
                    </h2>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: dimColor, maxWidth: '520px', lineHeight: 1.7, marginBottom: '3rem' }}>
                        If you're working on something meaningful in networking, electronics, or ICT systems — let's talk.
                    </p>
                </motion.div>

                {/* ── Main grid ── */}
                <div style={{
                    display:             'grid',
                    gridTemplateColumns: isTablet ? '1fr' : 'clamp(260px, 35%, 360px) 1fr',
                    gap:                 isMobile ? '2rem' : '3rem',
                    alignItems:          'start',
                }}>

                    {/* ── Left: contact links ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: dimColor, letterSpacing: '0.1em', marginBottom: '16px' }}>
                            // CONTACT TERMINALS
                        </div>

                        <div style={{
                            display:             'grid',
                            gridTemplateColumns: (isTablet && !isMobile) ? '1fr 1fr' : '1fr',
                            gap:                 '8px',
                        }}>
                            {[
                                {
                                    icon:  '📧',
                                    label: 'Email',
                                    value: 'musyokikilavi870@gmail.com',
                                    href:  'mailto:musyokikilavi870@gmail.com',
                                },
                                {
                                    icon:  '📞',
                                    label: 'Phone',
                                    value: '+254 700 663 557',
                                    href:  'tel:+254700663557',
                                },
                                {
                                    icon:  '💼',
                                    label: 'LinkedIn',
                                    value: 'linkedin.com/in/kilavi-musyoki',
                                    href:  'https://www.linkedin.com/in/kilavi-musyoki',
                                },
                                {
                                    icon:  '🐙',
                                    label: 'GitHub',
                                    value: 'github.com/kilavi-musyoki',
                                    href:  'https://github.com/kilavi-musyoki',
                                },
                            ].map((item, i) => (
                                <motion.a
                                    key={item.label}
                                    href={item.href}
                                    target={item.href.startsWith('http') ? '_blank' : undefined}
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    style={{
                                        display:        'flex',
                                        alignItems:     'center',
                                        gap:            '12px',
                                        padding:        '12px 16px',
                                        border:         `1px solid ${borderColor}`,
                                        borderRadius:   '3px',
                                        textDecoration: 'none',
                                        background:     cardBg,
                                        transition:     'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease',
                                        cursor:         'pointer',
                                        minWidth:       0,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = borderHover;
                                        e.currentTarget.style.background  = cardBgHover;
                                        e.currentTarget.style.boxShadow   = `0 0 14px ${accentGlow}`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = borderColor;
                                        e.currentTarget.style.background  = cardBg;
                                        e.currentTarget.style.boxShadow   = 'none';
                                    }}
                                >
                                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: dimColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                            {item.label}
                                        </div>
                                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: accentColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.value}
                                        </div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', color: dimColor, flexShrink: 0 }}>→</span>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── Right: oscilloscope + form ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {/* ── Oscilloscope display ── */}
                        <div style={{
                            marginBottom:  '16px',
                            height:        '100px',
                            position:      'relative',
                            background:    status === 'sent' ? (isDark ? '#000f04' : '#2a3228') : scopeBg,
                            border:        `2px solid ${status === 'sent' ? ecgColor + '88' : status === 'error' ? errorColor + '88' : scopeBorderColor}`,
                            borderRadius:  '8px',
                            overflow:      'hidden',
                            transition:    'background 0.5s, border-color 0.5s',
                            boxShadow:     status === 'sent' ? `0 0 20px ${ecgColor}22` : 'none',
                        }}>
                            {/* Grid */}
                            <div style={{
                                position:        'absolute',
                                inset:           0,
                                backgroundImage: `
                                    linear-gradient(${status === 'sent' ? ecgColor + '09' : scopeGridColor} 1px, transparent 1px),
                                    linear-gradient(90deg, ${status === 'sent' ? ecgColor + '09' : scopeGridColor} 1px, transparent 1px)
                                `,
                                backgroundSize: '40px 40px',
                                transition: 'all 0.5s',
                            }} />

                            {/* Wave / ECG / Heart SVG */}
                            <svg
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                                viewBox="0 0 480 100"
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
                                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <filter id="heart-glow" x="-40%" y="-40%" width="180%" height="180%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {status === 'sent' && !isComplete ? (
                                    /* ECG pulse phase */
                                    <>
                                        <path
                                            ref={ecgPathElRef}
                                            d=""
                                            stroke={ecgColor}
                                            strokeWidth="2"
                                            fill="none"
                                            opacity="0.9"
                                            filter="url(#glow)"
                                        />
                                        <path
                                            ref={ecgGlowElRef}
                                            d=""
                                            stroke={ecgColor}
                                            strokeWidth="5"
                                            fill="none"
                                            opacity="0.15"
                                        />
                                    </>
                                ) : isComplete ? (
                                    /* Signal beacon — radiating ping rings */
                                    <g transform="translate(240,50)" filter="url(#heart-glow)">
                                        {/* Expanding ping rings */}
                                        {[0, 1, 2].map((i) => (
                                            <circle
                                                key={i}
                                                cx="0" cy="0" r="20"
                                                fill="none"
                                                stroke={ecgColor}
                                                strokeWidth="1.5"
                                                style={{
                                                    animation: `signal-ping 2.4s ${i * 0.8}s ease-out infinite`,
                                                    transformOrigin: 'center',
                                                }}
                                            />
                                        ))}
                                        {/* Center beacon dot */}
                                        <circle cx="0" cy="0" r="6" fill={ecgColor} opacity="0.9"
                                            style={{ animation: 'signal-pulse 1.2s ease-in-out infinite' }} />
                                        {/* Checkmark inside dot */}
                                        <polyline
                                            points="-3,1 -1,3.5 4,-2"
                                            fill="none"
                                            stroke={isDark ? '#000810' : '#1e2a32'}
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </g>
                                ) : status === 'error' ? (
                                    <line x1="0" y1="50" x2="480" y2="50" stroke={errorColor} strokeWidth="1.5" opacity="0.8" />
                                ) : (
                                    <path ref={wavePathElRef} d="" stroke={waveColor} strokeWidth="1.5" fill="none" opacity="0.85" />
                                )}
                            </svg>

                            {/* Scope readouts */}
                            <div style={{
                                position: 'absolute', top: '6px', left: '10px',
                                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
                                color: status === 'sent' ? ecgColor + 'cc' : scopeLabelColor,
                                transition: 'color 0.4s',
                            }}>
                                {status === 'sent' ? 'BIO · PULSE DETECTED' : 'CH1: SIGNAL · 50mV/div'}
                            </div>
                            <div style={{
                                position: 'absolute', top: '6px', right: '10px',
                                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
                                color: status === 'sent' ? ecgColor : status === 'error' ? errorColor : scopeLabelColor,
                                transition: 'color 0.3s',
                            }}>
                                {scopeStatusLabel}
                            </div>

                            {/* BPM readout on success */}
                            <AnimatePresence>
                                {status === 'sent' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: 0.3 }}
                                        style={{
                                            position:   'absolute',
                                            bottom:     '7px',
                                            right:      '10px',
                                            fontFamily: 'JetBrains Mono, monospace',
                                            fontSize:   '0.6rem',
                                            color:      ecgColor,
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        {isComplete ? '— LOCKED' : '72 BPM'}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status messages */}
                        <AnimatePresence mode="wait">
                            {status === 'sent' && !isComplete && (
                                <motion.div
                                    key="ecg-msg"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    style={{
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fontSize: '0.75rem',
                                        color: ecgColor,
                                        textAlign: 'center',
                                        marginBottom: '12px',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    ⚡ TRANSMITTING PULSE...
                                </motion.div>
                            )}
                            {isComplete && (
                                <motion.div
                                    key="complete-msg"
                                    initial={{ opacity: 0, scale: 0.85, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    style={{
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fontSize: '0.8rem',
                                        color: ecgColor,
                                        textAlign: 'center',
                                        marginBottom: '12px',
                                        letterSpacing: '0.06em',
                                        textShadow: `0 0 12px ${ecgColor}55`,
                                    }}
                                >
                                    ✓ SIGNAL LOCKED · MESSAGE DELIVERED
                                </motion.div>
                            )}

                            {status === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fontSize: '0.75rem',
                                        color: errorColor,
                                        textAlign: 'center',
                                        marginBottom: '12px',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    ✗ TRANSMISSION FAILED. CHECK SIGNAL.
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Success card ─ shown when all 3 ECG sweeps complete ── */}
                        <AnimatePresence>
                            {isComplete && (
                                <motion.div
                                    key="success-card"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                    style={{
                                        border:       `1px solid ${ecgColor}35`,
                                        background:   isDark ? 'rgba(75,216,160,0.035)' : 'rgba(64,200,128,0.06)',
                                        borderRadius: '4px',
                                        padding:      '20px 20px 16px',
                                        marginBottom: '10px',
                                    }}
                                >
                                    {/* Header: animated ring + checkmark + title */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                                        <svg width="36" height="36" viewBox="0 0 36 36" style={{ flexShrink: 0, marginTop: '1px' }}>
                                            <circle cx="18" cy="18" r="15" fill="none" stroke={ecgColor} strokeWidth="1.5" opacity="0.2" />
                                            <circle
                                                cx="18" cy="18" r="15"
                                                fill="none"
                                                stroke={ecgColor}
                                                strokeWidth="1.5"
                                                strokeDasharray="94"
                                                strokeDashoffset="94"
                                                strokeLinecap="round"
                                                style={{ animation: 'success-ring-draw 0.55s ease-out forwards' }}
                                            />
                                            <polyline
                                                points="10,18 16,24 26,12"
                                                fill="none"
                                                stroke={ecgColor}
                                                strokeWidth="2.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeDasharray="28"
                                                strokeDashoffset="28"
                                                style={{ animation: 'success-check-draw 0.35s 0.5s ease-out forwards' }}
                                            />
                                        </svg>
                                        <div>
                                            <div style={{
                                                fontFamily:    'Syne, sans-serif',
                                                fontWeight:    800,
                                                fontSize:      '1rem',
                                                color:         ecgColor,
                                                letterSpacing: '0.04em',
                                                marginBottom:  '3px',
                                            }}>
                                                TRANSMISSION COMPLETE
                                            </div>
                                            <div style={{
                                                fontFamily:    'JetBrains Mono, monospace',
                                                fontSize:      '0.58rem',
                                                color:         ecgColor,
                                                opacity:       0.55,
                                                letterSpacing: '0.08em',
                                            }}>
                                                SIGNAL LOCKED · AWAITING ACK
                                            </div>
                                        </div>
                                    </div>

                                    {/* Flowing success wave */}
                                    <div style={{
                                        height:       '46px',
                                        overflow:     'hidden',
                                        borderRadius: '2px',
                                        marginBottom: '16px',
                                        background:   isDark ? '#000810' : '#1e2a32',
                                        border:       `1px solid ${ecgColor}18`,
                                        position:     'relative',
                                    }}>
                                        <svg
                                            width="100%" height="46" viewBox="0 0 480 46"
                                            preserveAspectRatio="none"
                                            style={{ display: 'block', overflow: 'visible' }}
                                        >
                                            <defs>
                                                <filter id="success-wave-glow" x="-5%" y="-100%" width="110%" height="300%">
                                                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                                                    <feMerge>
                                                        <feMergeNode in="blur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            {/* Glow fill */}
                                            <path
                                                d="M-480,23 C-400,7 -320,39 -240,23 C-160,7 -80,39 0,23 C80,7 160,39 240,23 C320,7 400,39 480,23 C560,7 640,39 720,23 C800,7 880,39 960,23 L960,46 L-480,46 Z"
                                                fill={ecgColor} opacity="0.07"
                                                style={{ animation: 'success-wave-scroll 2.6s linear infinite' }}
                                            />
                                            {/* Reverse secondary wave */}
                                            <path
                                                d="M-480,23 C-400,39 -320,7 -240,23 C-160,39 -80,7 0,23 C80,39 160,7 240,23 C320,39 400,7 480,23 C560,39 640,7 720,23 C800,39 880,7 960,23"
                                                fill="none" stroke={ecgColor} strokeWidth="1" opacity="0.2"
                                                style={{ animation: 'success-wave-scroll 4s linear infinite reverse' }}
                                            />
                                            {/* Primary glowing wave */}
                                            <path
                                                d="M-480,23 C-400,7 -320,39 -240,23 C-160,7 -80,39 0,23 C80,7 160,39 240,23 C320,7 400,39 480,23 C560,7 640,39 720,23 C800,7 880,39 960,23"
                                                fill="none" stroke={ecgColor} strokeWidth="2" opacity="0.9"
                                                filter="url(#success-wave-glow)"
                                                style={{ animation: 'success-wave-scroll 2.6s linear infinite' }}
                                            />
                                        </svg>
                                    </div>

                                    {/* Transmission receipt */}
                                    <div style={{
                                        fontFamily:   'JetBrains Mono, monospace',
                                        fontSize:     '0.68rem',
                                        lineHeight:   2,
                                        borderTop:    `1px solid ${ecgColor}18`,
                                        paddingTop:   '12px',
                                        marginBottom: '16px',
                                    }}>
                                        {[
                                            ['FROM',    formData.name    || '—'],
                                            ['SUBJECT', formData.subject || 'General Enquiry'],
                                            ['STATUS',  'QUEUED FOR REPLY'],
                                            ['ETA',     '24–48h'],
                                        ].map(([k, v]) => (
                                            <div key={k} style={{ display: 'flex', gap: '10px' }}>
                                                <span style={{ width: '58px', flexShrink: 0, color: ecgColor, opacity: 0.5 }}>{k}</span>
                                                <span style={{ color: textColor }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Send another */}
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        style={{
                                            fontFamily:    'JetBrains Mono, monospace',
                                            fontSize:      '0.7rem',
                                            fontWeight:    700,
                                            letterSpacing: '0.09em',
                                            padding:       '10px 18px',
                                            width:         '100%',
                                            background:    'transparent',
                                            color:         ecgColor,
                                            border:        `1px solid ${ecgColor}40`,
                                            borderRadius:  '2px',
                                            cursor:        'pointer',
                                            textTransform: 'uppercase',
                                            transition:    'background 0.2s, border-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background  = `${ecgColor}12`;
                                            e.currentTarget.style.borderColor = ecgColor;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background  = 'transparent';
                                            e.currentTarget.style.borderColor = `${ecgColor}40`;
                                        }}
                                    >
                                        ← SEND ANOTHER MESSAGE
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form — hidden after successful send */}
                        {!isComplete && <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                            {/* Name + Email */}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={labelStyle}>NAME</label>
                                    <input className="hud-input" type="text" name="name" value={formData.name} onChange={handleInput} placeholder="Your name" required maxLength={100} />
                                </div>
                                <div>
                                    <label style={labelStyle}>EMAIL</label>
                                    <input className="hud-input" type="email" name="email" value={formData.email} onChange={handleInput} placeholder="your@email.com" required maxLength={254} />
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label style={labelStyle}>SUBJECT</label>
                                <input className="hud-input" type="text" name="subject" value={formData.subject} onChange={handleInput} placeholder="What do you want to build?" maxLength={200} />
                            </div>

                            {/* Message */}
                            <div>
                                <label style={labelStyle}>MESSAGE</label>
                                <textarea className="hud-input" name="message" value={formData.message} onChange={handleInput} placeholder="Describe what you're building..." required rows={5} style={{ resize: 'vertical' }} maxLength={5000} />
                            </div>

                            {/* Turnstile Widget */}
                            {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                                <div style={{ minHeight: '65px', display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                                    <Turnstile
                                        ref={turnstileRef}
                                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                        onSuccess={(token) => setTurnstileToken(token)}
                                        onError={() => setTurnstileToken('')}
                                        onExpire={() => setTurnstileToken('')}
                                        options={{
                                            theme: isDark ? 'dark' : 'light',
                                        }}
                                    />
                                </div>
                            )}

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                style={{
                                    fontFamily:    'JetBrains Mono, monospace',
                                    fontSize:      '0.8rem',
                                    fontWeight:    700,
                                    letterSpacing: '0.1em',
                                    padding:       '14px 28px',
                                    width:         '100%',
                                    background:    status === 'sending' ? `${accentColor}55` : accentColor,
                                    color:         btnColor,
                                    border:        'none',
                                    borderRadius:  '2px',
                                    cursor:        status === 'sending' ? 'not-allowed' : 'pointer',
                                    textTransform: 'uppercase',
                                    transition:    'all 0.2s ease',
                                    boxShadow:     `0 0 20px ${accentGlow}`,
                                }}
                                onMouseEnter={(e) => {
                                    if (status !== 'sending') {
                                        e.currentTarget.style.transform  = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow  = `0 4px 28px ${accentGlow}`;
                                        e.currentTarget.style.background = accentHover;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform  = 'translateY(0)';
                                    e.currentTarget.style.boxShadow  = `0 0 20px ${accentGlow}`;
                                    e.currentTarget.style.background = status === 'sending' ? `${accentColor}55` : accentColor;
                                }}
                            >
                                {status === 'sending' ? 'TRANSMITTING...' : 'SEND MESSAGE →'}
                            </button>
                        </form>}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
