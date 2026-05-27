import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceSandbox from '../components/DeviceSandbox.jsx';
import { getTheme } from '../theme.js';

// ── Boot sequence ────────────────────────────────────────────────────────────
const BOOT_LINES = [
    { text: 'SILICON SOUL v2.0 — INITIALIZING...',         delay: 0    },
    { text: 'POST CHECK: RAM .................. OK',        delay: 300  },
    { text: 'POST CHECK: GPU .................. OK',        delay: 600  },
    { text: 'POST CHECK: PORTFOLIO.EXE ........ LOADED',   delay: 900  },
    { text: 'POST CHECK: ESP32_CORE ........... ONLINE',   delay: 1200 },
    { text: 'POST CHECK: RF_MODULE ............ CALIBRATED',delay: 1500 },
    { text: 'POST CHECK: EGO_MODULE ........... WARN (within limits)', delay: 1800 },
    { text: 'MOUNTING INTERFACE ...............',            delay: 2100 },
    { text: 'SIGNAL ACQUIRED. WELCOME, OPERATOR.',         delay: 2400 },
];

const LINE_COLOR_INDEX = [0, 1, 1, 1, 1, 1, 2, 3, 4];
const UPTIME_START = Date.now();

// ── Premium easing curves ─────────────────────────────────────────────────────
const EXPO_OUT = [0.16, 1, 0.3, 1];
const SMOOTH_OUT = [0.25, 1, 0.5, 1];
const FADE_EASE = [0.4, 0, 0.2, 1];

// ─────────────────────────────────────────────────────────────────────────────
const Hero = ({ isDark, glitch = false, bootDone, setBootDone }) => {
    // ── State ─────────────────────────────────────────────────────────────────
    const [visibleLines, setVisibleLines] = useState(0);
    const [progress,     setProgress]     = useState(0);
    const [uptime,       setUptime]       = useState('00:00:00');
    const mousePosRef                     = useRef({ x: 0.5, y: 0.5 });
    const [isMobile,     setIsMobile]     = useState(() => window.innerWidth < 640);

    // ── Responsive detection ──────────────────────────────────────────────────
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler, { passive: true });
        return () => window.removeEventListener('resize', handler);
    }, []);

    // ── Mouse tracking for canvas tilt ───────────────────────────────────────
    const handleMouseMove = useCallback((e) => {
        mousePosRef.current = {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
        };
    }, []);

    // ── Palette ───────────────────────────────────────────────────────────────
    const t = getTheme(isDark);
    const { dimColor, accentColor, accentGlow, accentHover, btnTextColor } = t;
    const textColor    = t.textBright;
    const statusOnline = t.statusGreen;
    const statusTemp   = t.statusRed;

    // Component-specific tokens
    const tagBorder      = isDark ? 'rgba(75,216,160,0.35)'   : 'rgba(104,112,120,0.4)';
    const tagBg          = isDark ? 'rgba(75,216,160,0.07)'   : 'rgba(255,255,255,0.35)';
    const statusBg       = isDark ? 'rgba(10,12,16,0.55)'     : 'rgba(255,255,255,0.25)';
    const statusBorder   = isDark ? 'rgba(75,216,160,0.18)'   : 'rgba(104,112,120,0.25)';
    const progressTrack  = isDark ? 'rgba(75,216,160,0.15)'   : 'rgba(13,148,136,0.15)';
    const progressFill   = isDark
        ? 'linear-gradient(90deg,#4BD8A0,#6FD4FF)'
        : 'linear-gradient(90deg,#0D9488,#D4A843)';
    const terminalBg     = isDark ? '#04060A'                 : '#E8EAE7';
    const terminalBorder = isDark ? 'rgba(75,216,160,0.3)'    : 'rgba(13,148,136,0.35)';
    const terminalLabel  = isDark ? 'rgba(75,216,160,0.5)'    : 'rgba(13,148,136,0.6)';

    const lineColors = {
        0: dimColor,
        1: isDark ? '#b0ffcc' : accentColor,
        2: isDark ? '#D4A843' : accentColor,
        3: isDark ? 'rgba(163,184,204,0.75)' : 'rgba(104,112,120,0.6)',
        4: textColor,
    };

    // ── Scroll lock during boot ───────────────────────────────────────────────
    useEffect(() => {
        if (!bootDone) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [bootDone]);

    // ── Boot sequence timers ──────────────────────────────────────────────────
    useEffect(() => {
        const ids = BOOT_LINES.map((line, i) =>
            setTimeout(() => {
                setVisibleLines(i + 1);
                setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100));
            }, line.delay)
        );
        const doneId = setTimeout(() => setBootDone(true), 2800);
        return () => {
            ids.forEach(clearTimeout);
            clearTimeout(doneId);
        };
    }, [setBootDone]);

    // ── Real-time uptime counter ──────────────────────────────────────────────
    useEffect(() => {
        const tick = () => {
            const elapsed = Math.floor((Date.now() - UPTIME_START) / 1000);
            const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
            const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
            const ss = String(elapsed % 60).padStart(2, '0');
            setUptime(`${hh}:${mm}:${ss}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <section
            id="hero"
            style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}
            onMouseMove={handleMouseMove}
            data-debug="hero-section"
        >
            {/* ── Boot terminal overlay — fades out while hero fades in ── */}
            <AnimatePresence>
                {!bootDone && (
                    <motion.div
                        key="boot"
                        initial={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.01 }}
                        transition={{ duration: 1.0, ease: FADE_EASE }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9990,
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                            background: terminalBg,
                        }}
                    >
                        <div style={{
                            width: '100%',
                            maxWidth: '620px',
                            padding: '0 1.5rem',
                        }}>
                            {/* Terminal chrome */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 14px',
                                borderBottom: `1px solid ${terminalBorder}`,
                                marginBottom: '20px',
                            }}>
                                {['#FF5F57','#FFBD2E','#28CA41'].map((c) => (
                                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
                                ))}
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: terminalLabel, marginLeft: '8px' }}>
                                    SILICON_SOUL_BIOS v2.0
                                </span>
                            </div>

                            {/* Boot lines */}
                            <div style={{ minHeight: '200px' }}>
                                {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                                    <div key={i} className="boot-line" style={{
                                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem',
                                        color: lineColors[LINE_COLOR_INDEX[i]],
                                        marginBottom: '6px', lineHeight: 1.4,
                                    }}>
                                        {line.text}
                                        {i === visibleLines - 1 && (
                                            <span style={{ animation: 'blink-slow 0.6s step-end infinite' }}>▋</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Progress bar */}
                            <div style={{ marginTop: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: terminalLabel }}>LOADING INTERFACE</span>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: accentColor }}>{progress}%</span>
                                </div>
                                <div style={{ height: '2px', background: progressTrack, borderRadius: '1px' }}>
                                    <div style={{
                                        height: '100%', width: `${progress}%`,
                                        background: progressFill, borderRadius: '1px',
                                        transition: 'width 0.3s ease',
                                        boxShadow: `0 0 8px ${accentGlow}`,
                                    }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Hero content — mounts concurrently, fades & slides in ── */}
            <AnimatePresence>
                {bootDone && (
                    <motion.div
                        key="hero-content"
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.2, ease: SMOOTH_OUT, delay: 0.15 }}
                        style={{
                            width: '100%',
                            padding: isMobile ? '0 1.25rem' : '0 2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '1.5rem' : '3rem',
                            maxWidth: '1400px',
                            margin: '0 auto',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* ────────────── LEFT: text ────────────── */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.9, ease: SMOOTH_OUT, delay: 0.3 }}
                            style={{ flex: '0 0 45%', minWidth: '280px' }}
                        >
                            {/* Greeting */}
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: accentColor, marginBottom: '0.5rem' }}>
                                herro dΨ`.dΨ`&lt;
                            </div>

                            {/* Name */}
                            <h1 style={{
                                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                                fontSize: 'clamp(2.5rem, 5vw, 5.5rem)',
                                color: textColor, lineHeight: 1.0,
                                marginBottom: '0.75rem', letterSpacing: '-0.02em',
                            }}>
                                Kilavi<br />Musyoki
                            </h1>

                            {/* Role */}
                            <div style={{
                                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem',
                                color: dimColor, marginBottom: '1rem', letterSpacing: '0.02em',
                            }}>
                                Telecommunications &amp; Information Engineering Student
                            </div>

                            {/* Tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                                {['Embedded Systems', 'RF Engineering', 'IoT', 'Networking', 'PCB Design'].map((tag) => (
                                    <span key={tag} style={{
                                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                                        padding: '3px 10px',
                                        border: `1px solid ${tagBorder}`,
                                        borderRadius: '2px', color: accentColor, background: tagBg,
                                        letterSpacing: '0.05em',
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* System status */}
                            <div style={{
                                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                                padding: '10px 14px',
                                border: `1px solid ${statusBorder}`,
                                borderRadius: '3px', background: statusBg, color: dimColor,
                                marginBottom: '1.5rem', letterSpacing: '0.04em', lineHeight: 1.6,
                            }}>
                                <span style={{ color: statusOnline }}>SYSTEM: ONLINE</span>
                                {' | '}
                                <span>UPTIME: {uptime}</span>
                                {' | '}
                                <span style={{ color: statusTemp }}>TEMP: 42°C</span>
                                {' | '}
                                <span>LOC: Machakos, KE</span>
                            </div>

                            {/* Stats strip */}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? '1rem 0.5rem' : '0.5rem', marginBottom: '2rem' }}>
                                {[
                                    { val: '1000+', label: 'Hours Building'   },
                                    { val: '10+',   label: 'Projects'         },
                                    { val: '4+',    label: 'Systems Designed' },
                                    { val: 'Daily', label: 'Learning Rate'    },
                                    { val: '∞',     label: 'Problems Left'    },
                                ].map((stat) => (
                                    <div key={stat.label} style={{ textAlign: 'center', padding: '0.4rem 0' }}>
                                        <div style={{
                                            fontFamily: 'Syne, sans-serif', fontWeight: 700,
                                            fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)',
                                            color: accentColor, lineHeight: 1,
                                        }}>
                                            {stat.val}
                                        </div>
                                        <div style={{
                                            fontFamily: 'JetBrains Mono, monospace',
                                            fontSize: 'clamp(0.45rem, 2vw, 0.6rem)',
                                            color: dimColor, marginTop: '3px',
                                            letterSpacing: '0.04em', textTransform: 'uppercase',
                                        }}>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <a
                                href="#about"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem',
                                    padding: '12px 28px',
                                    background: accentColor, color: btnTextColor,
                                    borderRadius: '2px', textDecoration: 'none', fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
                                    boxShadow: `0 0 20px ${accentGlow}`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform  = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow  = `0 4px 30px ${accentGlow}`;
                                    e.currentTarget.style.background = accentHover;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform  = 'translateY(0)';
                                    e.currentTarget.style.boxShadow  = `0 0 20px ${accentGlow}`;
                                    e.currentTarget.style.background = accentColor;
                                }}
                            >
                                Explore my work <span>→</span>
                            </a>
                        </motion.div>

                        {/* ────────────── RIGHT: device + lever ────────────── */}
                        <motion.div
                            initial={{ x: 20, opacity: 0, scale: 0.98 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            transition={{ duration: 1.0, ease: SMOOTH_OUT, delay: 0.4 }}
                            style={{ flex: '1 1 300px', maxWidth: '580px', display: 'flex' }}
                        >
                            <DeviceSandbox isDark={isDark} mousePosRef={mousePosRef} glitch={glitch} />
                        </motion.div>

                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Hero;
