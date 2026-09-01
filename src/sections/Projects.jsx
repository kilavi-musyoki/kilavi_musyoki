import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTheme } from '../theme.js';

// ── Responsive width hook ─────────────────────────────────────────────────────
const useWindowWidth = () => {
    const [width, setWidth] = useState(
        () => (typeof window !== 'undefined' ? window.innerWidth : 1024)
    );
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handler, { passive: true });
        return () => window.removeEventListener('resize', handler);
    }, []);
    return width;
};

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
    { id: 'all',   label: 'All',                emoji: '◈',  short: 'All' },
    { id: 'cyber', label: 'Cybersecurity',       emoji: '🔐', short: 'Security' },
    { id: 'iot',   label: 'IoT & Embedded',      emoji: '🌐', short: 'IoT' },
    { id: 'rf',    label: 'RF & Telecom',        emoji: '📡', short: 'RF' },
    { id: 'sw',    label: 'Software & IS',       emoji: '💻', short: 'Software' },
    { id: 'elec',  label: 'Digital Electronics', emoji: '⚡', short: 'Electronics' },
];

const PROJECTS_PER_PAGE = 6;

// ── Project data ──────────────────────────────────────────────────────────────
const PROJECTS = [
    {
        id: 'p1',
        number: '01',
        title: 'ClubVote Secure Election Platform',
        subtitle: 'Anonymous web-based voting system with cryptographic verification',
        problem:
            'Student clubs and small organizations often run elections using informal methods such as paper ballots or messaging apps, which lack transparency, auditability, and security. A digital system was needed to provide anonymous voting, prevent double voting, and allow administrators to manage elections while maintaining voter privacy.',
        approach:
            'Designed a full-stack election platform using a React + TypeScript frontend and a Node.js/Express backend with PostgreSQL. Authentication is handled using JWT with bcrypt password hashing. Votes are stored anonymously and protected using a cryptographic hash chain to guarantee vote integrity. Prisma ORM manages relational data models for users, elections, positions, and votes. Automated election scheduling is implemented with cron jobs, while Puppeteer generates official PDF election reports. Role-based access control allows Super Admins, Club Admins, Candidates, and Voters to interact with the system securely.',
        outcome:
            'Delivered a secure web platform capable of managing full election cycles including candidate registration, voting, automated opening/closing of elections, and real-time result generation. The system supports hundreds of concurrent voters while maintaining anonymous vote records and a verifiable audit trail.',
        lessons:
            'Separating voter identity from vote data was essential for anonymity while still preventing double voting. Implementing a cryptographic hash chain provided an auditable vote sequence but required careful transaction handling to maintain consistency. Strict TypeScript typing across frontend and backend significantly reduced runtime errors during development.',
        stack: ['React', 'TypeScript', 'Node.js / Express', 'PostgreSQL', 'Prisma ORM', 'JWT Authentication', 'Tailwind CSS', 'Docker'],
        color: '#4BD8A0',
        icon: '🗳️',
        category: 'cyber',
        repo: 'https://github.com/kilavi-musyoki/voting-website.git',
    },
    {
        id: 'p2',
        number: '02',
        title: 'ESP32 / MQTT Fire Detection System',
        subtitle: 'IoT sensor mesh with edge alerting',
        problem: 'Smoke detectors in multi-room buildings operate in isolation with no centralized visibility. A network-aware system was needed for real-time monitoring, automatic threshold alerting, and zone-level escalation.',
        approach: 'Mesh of ESP32 nodes reading MQ-2 gas and DHT22 temperature/humidity sensors. Nodes publish structured MQTT payloads to a Mosquitto broker; Node-RED dashboard aggregates readings and triggers SMS + email alerts on threshold breach. FreeRTOS task architecture separates sensor sampling, Wi-Fi management, and MQTT publishing.',
        outcome: 'Average alert latency under 1.5 seconds from sensor threshold breach to admin notification. Validated across 4 independent zones with 100% detection rate during controlled smoke tests.',
        lessons: 'Wi-Fi reconnection on ESP32 requires a carefully tuned watchdog — naive reconnect loops stall the sensor-read task entirely. FreeRTOS separate tasks eliminated all lockups. MQ-2 sensor warm-up delays are critical for accuracy.',
        stack: ['ESP32 (C++)', 'FreeRTOS', 'MQ-2 / DHT22', 'MQTT / Mosquitto', 'Node-RED', 'Telegram Bot API'],
        color: '#FF5A3C',
        icon: '🔥',
        category: 'iot',
        repo: null,
    },
    {
        id: 'p3',
        number: '03',
        title: 'Digital Clock Converter (24H → 12H)',
        subtitle: 'BCD logic design & Logisim validation',
        problem: 'Embedded display systems operating on 24-hour BCD time need 12-hour format output for user interfaces — including AM/PM detection, tens-digit rollover, and midnight/noon edge cases — all without a microcontroller.',
        approach: 'Combinational and sequential digital logic using comparators, BCD decoders, flip-flops, and a multiplexer network. Tens-of-hours digit conditionally suppressed for hours 01–09. Dedicated comparator block for 12:xx AM/PM toggling; second comparator for 00:xx → 12:xx midnight remapping. Full circuit built and exhaustively simulated in Logisim Evolution with 1,440 test vectors.',
        outcome: 'Verified functional correctness across all 1,440 daily minute-states. All edge cases handled without glitching or invalid BCD output.',
        lessons: "Midnight/noon conversions require separate comparator branches — one threshold comparator can't differentiate both. BCD addition overflow must be corrected explicitly; binary adders produce values above 9 without a correction stage.",
        stack: ['Logisim Evolution', 'BCD Logic', 'Combinational Circuits', 'Flip-Flops', 'Comparators', 'MUX/DEMUX'],
        color: '#D4A843',
        icon: '🕐',
        category: 'elec',
        repo: 'https://github.com/kilavi-musyoki/digital-clock-with-logism.git',
    },
    {
        id: 'p4',
        number: '04',
        title: 'Home Automation System',
        subtitle: 'Microcontroller-based integrated control',
        problem: 'Manual household subsystem control is inefficient and unresponsive. A unified, sensor-driven system was needed for lighting, curtains, and environmental monitoring — without internet connectivity.',
        approach: 'AVR microcontroller integrating PIR motion detection for occupancy-driven lighting, LDR for ambient-light-dependent control, DHT22 for temperature/humidity monitoring. DS3231 RTC for time-based curtain actuation via servo. All readings on 16×2 LCD. Control logic structured as cooperative state machine with interrupt-driven sensor reads for sub-200ms response.',
        outcome: 'Full hardware-software integration across 5 sensor types and 3 actuator subsystems. Sub-200ms response to motion and light changes. Presented as final hardware project to engineering faculty.',
        lessons: 'Polling all sensors in a tight loop introduced 400ms lag. Restructuring into interrupt-driven reads with cooperative scheduler reduced latency to under 200ms and eliminated missed sensor events.',
        stack: ['AVR Microcontroller (C)', 'PIR Sensor', 'LDR', 'DHT22', 'DS3231 RTC', '16×2 LCD', 'Servo', 'Relay'],
        color: '#6FD4FF',
        icon: '🏠',
        category: 'iot',
        repo: null,
    },
    {
        id: 'p5',
        number: '05',
        title: 'LinkUp Notes — Secure Android Notes App',
        subtitle: 'Offline-first notes with AES-256 encryption & biometric lock',
        problem: 'Most note-taking apps either lack meaningful security or require cloud connectivity, exposing sensitive personal notes to data breaches or loss of access offline. A fully local solution was needed with hardware-backed encryption and zero-trust access control at both app and note level.',
        approach: 'Built with Kotlin and Jetpack Compose following MVVM architecture. AES-256-GCM encryption is backed by Android Keystore hardware keys; notes are encrypted before hitting the Room/SQLite layer. Biometric authentication (fingerprint/face with PIN fallback) gates app entry with configurable auto-lock timeouts. Individual notes can be independently locked. A rich text editor with formatting toolbar, tag-based organization, full-text search, and undo/redo round out the feature set. Export to TXT, Markdown, and PDF is supported via FileProvider sharing.',
        outcome: 'Fully functional offline notes app with hardware-backed encryption, per-note locking, multi-select bulk actions, auto-save, crash recovery, and a 30-day soft-delete trash system. All security layers operate without any network dependency.',
        lessons: 'Note-level locking required careful separation between the biometric prompt lifecycle and Compose recomposition — tightly coupling them caused the auth dialog to dismiss unexpectedly on rotation. Android Keystore key invalidation on biometric enrollment changes also needed explicit handling to avoid silent decryption failures.',
        stack: ['Kotlin', 'Jetpack Compose', 'Material 3', 'Room / SQLite', 'AES-256-GCM', 'Android Keystore', 'AndroidX Biometric', 'Kotlin Coroutines'],
        color: '#a78bfa',
        icon: '🔐',
        category: 'cyber',
        repo: 'https://github.com/kilavi-musyoki/notes-app.git',
    },
    {
        id: 'p6',
        number: '06',
        title: 'CyberPath — OWASP Top 10 Lab Platform',
        subtitle: 'Hands-on OWASP Top 10 labs the user works through themselves, step by step',
        problem: "Most security-awareness material for the OWASP Top 10 is read-only — a slide deck or article that explains a vulnerability class without letting anyone actually trigger and fix it. Retention is low because there's nothing to do. A platform was needed where the learner performs the exploit and the fix, not just reads about them.",
        outcome: 'Delivered an interactive learning platform where users work through the OWASP Top 10 via hands-on labs and step-by-step guidance — each vulnerability class becomes an exercise the learner actively completes, not a page they scroll past. Progress is tracked per user through a Google Apps Script backend as a lightweight SCORM alternative. Deployed on Vercel.',
        stack: ['React 18', 'TypeScript', 'Vite', 'Google Apps Script', 'Vercel'],
        color: '#4BD8A0',
        icon: '🛡️',
        category: 'cyber',
        repo: null,
    },
    {
        id: 'p7',
        number: '07',
        title: 'RF Impedance Matching Network',
        subtitle: 'Single-stub shunt matching at 2GHz, solved analytically and via Smith chart',
        problem: 'A complex load impedance mismatched to a 50Ω transmission line causes reflection loss and reduced power transfer at RF frequencies. A matching network was required to bring the load to resonance at 2GHz.',
        outcome: 'Derived the single-stub shunt matching solution analytically, then verified stub length and position graphically using the Smith chart — cross-checking closed-form calculation against graphical RF design method.',
        stack: ['Smith Chart', 'RF/Microwave Theory', 'Transmission Line Analysis'],
        color: '#D4A843',
        icon: '📻',
        category: 'rf',
        repo: null,
    },
    {
        id: 'p8',
        number: '08',
        title: 'Microstrip Transmission Line Simulation',
        subtitle: '50Ω microstrip design on FR-4 and Rogers RO4003C via Keysight ADS',
        problem: 'Microstrip trace geometry directly determines characteristic impedance and signal integrity at RF frequencies, and that relationship shifts with substrate material. A comparative simulation was needed to see how dielectric choice changes the design.',
        outcome: 'Designed and simulated 50Ω microstrip transmission lines using Keysight ADS Momentum EM across two substrates — standard FR-4 and RF-grade Rogers RO4003C — comparing electromagnetic behavior and loss characteristics between them.',
        stack: ['Keysight ADS', 'Momentum EM', 'RF Simulation'],
        color: '#a3b8cc',
        icon: '📡',
        category: 'rf',
        repo: null,
    },
    {
        id: 'p9',
        number: '09',
        title: 'UniDMS — University Document Management System',
        subtitle: 'Departmental document routing with versioning, audit trails, and digital signatures',
        problem: "University departments routinely pass documents for approval through email threads and physical signatures, with no version history, no audit trail, and no way to verify a signature wasn't forged. A structured routing system was needed.",
        outcome: 'Delivered a document management system with departmental inboxes, version control, full audit trails, and digital signature support, wrapped in a Tauri/Rust desktop shell — evolved from an earlier full-stack prototype (SFMS) built on React/TypeScript, Express, Prisma, and PostgreSQL.',
        stack: ['Tauri', 'Rust', 'React', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'Redis'],
        color: '#a78bfa',
        icon: '📋',
        category: 'sw',
        repo: null,
    },
    {
        id: 'p10',
        number: '10',
        title: 'University Management System',
        subtitle: 'Relational university database with CRUD operations via Python/Tkinter GUI',
        problem: 'University administrative data — students, courses, faculty, enrollment — needs relational structure to stay consistent, but end users need a usable interface rather than raw SQL access.',
        outcome: 'Designed a relational university database in Oracle 21c with normalized entity relationships and full CRUD support, then built a Python Tkinter desktop interface so non-technical users can query and manage records directly.',
        stack: ['Oracle 21c', 'SQL', 'Python', 'Tkinter'],
        color: '#6FD4FF',
        icon: '🎓',
        category: 'sw',
        repo: null,
    },
    {
        id: 'p11',
        number: '11',
        title: 'Silicon Soul — Personal Portfolio v4',
        subtitle: 'Hardware diagnostic interface disguised as a personal website',
        problem: "Most developer portfolios are static pages or template clones that say nothing about how the person actually thinks or builds. The goal was to design a portfolio that is itself a demonstration — a living interface that embodies the engineering discipline behind it, without relying on pre-built UI kits or templates.",
        approach: 'Designed and built from scratch in React 19 with Vite. The site opens with a boot sequence terminal, then reveals a 7-layer deconstructable SVG PCB board that reacts to scroll position and cursor movement via GSAP + Framer Motion. A custom cybernetic context-aware cursor reads data attributes from DOM elements to change shape and color. An idle pixel character walks the viewport edge. A full dark/light theme system with iris-wipe transition and localStorage persistence covers every token across all five sections. The contact form integrates EmailJS with a Cloudflare Turnstile CAPTCHA and a Vercel serverless Nodemailer fallback. An oscilloscope waveform responds in real time to typing activity. A debug easter egg (type "debug") exposes FPS, heap, and component bounds.',
        outcome: 'A production-deployed portfolio site that passes Lighthouse with no accessibility warnings, serves under Vercel with hardened security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy), and delivers a sub-3s first contentful paint. Every interactive surface — nav, cards, contact form, cursor, PCB board — is authored without a UI component library.',
        lessons: 'Framer Motion layout animations and AnimatePresence conflict with direct DOM manipulation (GSAP scroll triggers) — they must be carefully separated by layer to avoid competing transform origins. Cloudflare Turnstile token lifecycle requires explicit reset on form re-submission, otherwise the widget silently returns a stale token. CSS backdrop-filter on overlapping elements in Safari requires explicit -webkit- prefixing and a non-transparent background to take effect.',
        stack: ['React 19', 'Vite 7', 'Framer Motion', 'GSAP', 'Tailwind CSS v4', 'EmailJS', 'Cloudflare Turnstile', 'Vercel Serverless', 'Nodemailer', 'JetBrains Mono', 'Syne'],
        color: '#4BD8A0',
        icon: '🖥️',
        category: 'sw',
        repo: 'https://github.com/kilavi-musyoki/portfoliov4.git',
    },
    {
        id: 'p12',
        number: '12',
        title: 'KejaMatch — Lead Full-Stack Engineer',
        subtitle: 'Trust-first rental discovery monorepo with M-Pesa STK push & TrueCost engine',
        problem: 'Off-campus student housing in Nyeri County & DeKUT is plagued by phantom listings, hidden move-in fees, stale rental availability, and deposit scams. A trust-first platform was needed to guarantee listing freshness, provide transparent move-in fee breakdowns, verify landlords, and protect students with automated community safety mechanisms.',
        approach: 'Architected a high-performance monorepo using Turborepo with Next.js 15 App Router on the frontend and NestJS with Prisma ORM and PostgreSQL on the backend. Integrated Safaricom M-Pesa Daraja API for STK push payments, built an automated 7-day SMS listing freshness lifecycle, implemented multi-tier landlord verification workflows, and developed an offline-first PWA service worker with local caching.',
        outcome: 'Architected and delivered a trust-first property discovery monorepo featuring an automated 7-day SMS listing freshness lifecycle, multi-tier landlord verification, and M-Pesa STK push integration. Designed a deterministic TrueCost engine providing move-in cost breakdowns with certainty tagging, reducing hidden rental fees to zero. Implemented community safety mechanisms including multi-category scam reporting with automated quarantine at ≥3 reports and an offline-first PWA service worker.',
        lessons: 'Maintaining listing freshness without overburdening landlords required an automated SMS-based heartbeat verification lifecycle. Eliminating hidden rental costs required building a deterministic engine that tags fees with explicit certainty levels rather than relying on unstructured text descriptions. Designing scam quarantine thresholds at ≥3 reports prevented malicious spam while protecting legitimate listings.',
        stack: ['TypeScript', 'Next.js 15', 'NestJS', 'Prisma', 'PostgreSQL', 'M-Pesa Daraja API', 'Turborepo', 'PWA'],
        color: '#FF5A3C',
        icon: '🏘️',
        category: 'sw',
        repo: null,
    },
];

// ── Repo link ─────────────────────────────────────────────────────────────────
const RepoLink = ({ url, color }) => {
    if (!url) return null;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.6rem',
                color: color,
                textDecoration: 'none',
                padding: '4px 10px',
                border: `1px solid ${color}33`,
                borderRadius: '2px',
                background: `${color}08`,
                letterSpacing: '0.08em',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = `${color}18`;
                e.currentTarget.style.borderColor = `${color}66`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = `${color}08`;
                e.currentTarget.style.borderColor = `${color}33`;
            }}
        >
            {/* GitHub SVG icon */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            VIEW REPOSITORY ↗
        </a>
    );
};

// ── Project card ──────────────────────────────────────────────────────────────
const ProjectCard = ({ project, isDark, isExpanded, onToggle }) => {
    const t         = getTheme(isDark);
    const textColor = t.textColor;
    const dimColor  = t.dimColor;
    const windowWidth = useWindowWidth();
    const isMobile  = windowWidth < 640;

    const borderColor = isDark
        ? `${project.color}${isExpanded ? '55' : '22'}`
        : isExpanded ? 'rgba(13,148,136,0.55)' : 'rgba(104,112,120,0.35)';
    const bgCard = isDark
        ? `${project.color}${isExpanded ? '0a' : '06'}`
        : isExpanded ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)';

    // Module color badge — must be visible in both modes
    const moduleColor = isDark ? project.color : '#CE8946';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="pcb-card"
            data-cursor={isExpanded ? 'project-collapse' : 'project-expand'}
            data-cursor-color={moduleColor}
            style={{
                border: `1px solid ${borderColor}`,
                background: bgCard,
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: isExpanded ? `0 0 24px ${moduleColor}22` : 'none',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
            }}
            onClick={onToggle}
        >
            {/* Card header */}
            <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
            }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
                    {/* Module icon */}
                    <div style={{
                        width: '48px', height: '48px', flexShrink: 0,
                        border: `1px solid ${moduleColor}44`,
                        borderRadius: '3px',
                        background: `${moduleColor}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem',
                    }}>
                        {project.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: moduleColor, letterSpacing: '0.1em' }}>
                                MODULE {project.number}
                            </span>
                            <div style={{ width: '40px', height: '1px', background: `${moduleColor}44` }} />
                        </div>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: textColor, marginBottom: '4px' }}>
                            {project.title}
                        </h3>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: dimColor }}>
                            {project.subtitle}
                        </div>
                    </div>
                </div>

                {/* Expand indicator */}
                <motion.div
                    animate={{ rotate: isExpanded ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ color: moduleColor, fontSize: '1.2rem', flexShrink: 0, marginTop: '4px' }}
                >
                    +
                </motion.div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            padding: '0 20px 20px',
                            borderTop: `1px solid ${moduleColor}22`,
                            paddingTop: '16px',
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.5fr) minmax(0, 1fr)',
                            gap: '16px',
                        }}>
                            <div>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: moduleColor, letterSpacing: '0.1em', marginBottom: '6px', opacity: 0.8 }}>
                                    // OVERVIEW
                                </div>
                                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: textColor, lineHeight: 1.7 }}>
                                    {project.problem}
                                </p>
                            </div>
                            <div>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: moduleColor, letterSpacing: '0.1em', marginBottom: '6px', opacity: 0.8 }}>
                                    // RESULT
                                </div>
                                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: dimColor, lineHeight: 1.7 }}>
                                    {project.outcome}
                                </p>
                            </div>
                        </div>

                        {/* Stack tags + repo link row */}
                        <div style={{ padding: '12px 20px 20px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {project.stack.map((tech) => (
                                    <span key={tech} style={{
                                        fontFamily: 'JetBrains Mono',
                                        fontSize: '0.6rem',
                                        padding: '3px 8px',
                                        border: `1px solid ${moduleColor}44`,
                                        borderRadius: '2px',
                                        color: moduleColor,
                                        background: `${moduleColor}12`,
                                        letterSpacing: '0.04em',
                                    }}>
                                        {tech}
                                    </span>
                                ))}
                            </div>
                            <RepoLink url={project.repo} color={moduleColor} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PCB connector strip */}
            <div style={{
                height: '3px',
                background: `linear-gradient(90deg, ${moduleColor}00 0%, ${moduleColor}55 30%, ${moduleColor}55 70%, ${moduleColor}00 100%)`,
            }} />
        </motion.div>
    );
};

// ── Category filter bar ───────────────────────────────────────────────────────
const CategoryFilter = ({ active, onChange, isDark, counts }) => {
    const windowWidth = useWindowWidth();
    const isNarrow = windowWidth < 700;

    return (
        <div
            role="tablist"
            aria-label="Project categories"
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '1.25rem',
            }}
        >
            {CATEGORIES.map((cat) => {
                const isActive = active === cat.id;
                const accent = isDark ? '#4BD8A0' : '#CE8946';
                return (
                    <button
                        key={cat.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(cat.id)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontFamily: 'JetBrains Mono',
                            fontSize: '0.62rem',
                            letterSpacing: '0.07em',
                            padding: '6px 14px',
                            borderRadius: '2px',
                            border: isActive
                                ? `1px solid ${accent}88`
                                : `1px solid ${isDark ? 'rgba(75,216,160,0.15)' : 'rgba(189,183,107,0.40)'}`,
                            background: isActive ? `${accent}18` : 'transparent',
                            color: isActive
                                ? accent
                                : (isDark ? 'rgba(206,212,222,0.55)' : 'rgba(100,80,30,0.65)'),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.borderColor = `${accent}44`;
                                e.currentTarget.style.color = isDark ? '#CED4DE' : '#2C1F0A';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.borderColor = isDark
                                    ? 'rgba(75,216,160,0.15)'
                                    : 'rgba(189,183,107,0.40)';
                                e.currentTarget.style.color = isDark
                                    ? 'rgba(206,212,222,0.55)'
                                    : 'rgba(100,80,30,0.65)';
                            }
                        }}
                    >
                        <span style={{ fontSize: '0.75rem' }}>{cat.emoji}</span>
                        {isNarrow ? cat.short : cat.label}
                        <span style={{
                            fontSize: '0.55rem',
                            opacity: 0.7,
                            background: isActive ? `${accent}22` : 'transparent',
                            border: `1px solid ${isActive ? accent + '33' : 'transparent'}`,
                            borderRadius: '2px',
                            padding: '1px 5px',
                            minWidth: '18px',
                            textAlign: 'center',
                        }}>
                            {counts[cat.id] ?? 0}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

// ── Pagination bar ────────────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, isDark }) => {
    if (totalPages <= 1) return null;
    const accent = isDark ? '#4BD8A0' : '#CE8946';
    const dim    = isDark ? 'rgba(206,212,222,0.45)' : 'rgba(100,80,30,0.55)';

    const btnBase = {
        fontFamily: 'JetBrains Mono',
        fontSize: '0.62rem',
        letterSpacing: '0.06em',
        border: `1px solid ${isDark ? 'rgba(75,216,160,0.18)' : 'rgba(189,183,107,0.40)'}`,
        borderRadius: '2px',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '32px',
        height: '32px',
        padding: '0 8px',
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: `1px solid ${isDark ? 'rgba(75,216,160,0.10)' : 'rgba(189,183,107,0.25)'}`,
        }}>
            {/* Prev */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    ...btnBase,
                    color: currentPage === 1 ? dim : accent,
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    borderColor: currentPage === 1
                        ? (isDark ? 'rgba(75,216,160,0.08)' : 'rgba(189,183,107,0.20)')
                        : (isDark ? 'rgba(75,216,160,0.18)' : 'rgba(189,183,107,0.40)'),
                }}
            >
                ← PREV
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                    style={{
                        ...btnBase,
                        color: page === currentPage ? accent : dim,
                        background: page === currentPage ? `${accent}14` : 'transparent',
                        borderColor: page === currentPage
                            ? `${accent}55`
                            : (isDark ? 'rgba(75,216,160,0.18)' : 'rgba(189,183,107,0.40)'),
                        fontWeight: page === currentPage ? 700 : 400,
                    }}
                >
                    {String(page).padStart(2, '0')}
                </button>
            ))}

            {/* Next */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    ...btnBase,
                    color: currentPage === totalPages ? dim : accent,
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    borderColor: currentPage === totalPages
                        ? (isDark ? 'rgba(75,216,160,0.08)' : 'rgba(189,183,107,0.20)')
                        : (isDark ? 'rgba(75,216,160,0.18)' : 'rgba(189,183,107,0.40)'),
                }}
            >
                NEXT →
            </button>

            {/* Page info */}
            <span style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.55rem',
                color: dim,
                marginLeft: '8px',
                letterSpacing: '0.06em',
            }}>
                {currentPage}/{totalPages}
            </span>
        </div>
    );
};

// ── Main Projects section ─────────────────────────────────────────────────────
const Projects = ({ isDark }) => {
    const [expandedId,     setExpandedId]     = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentPage,    setCurrentPage]    = useState(1);

    const t         = getTheme(isDark);
    const textColor = t.textColor;
    const dimColor  = t.dimColor;

    // Category counts (computed once — PROJECTS list is static)
    const counts = useMemo(() => {
        const c = { all: PROJECTS.length };
        CATEGORIES.forEach(cat => {
            if (cat.id !== 'all') c[cat.id] = PROJECTS.filter(p => p.category === cat.id).length;
        });
        return c;
    }, []);

    // Filtered list
    const filtered = useMemo(() => {
        if (activeCategory === 'all') return PROJECTS;
        return PROJECTS.filter(p => p.category === activeCategory);
    }, [activeCategory]);

    const totalPages = Math.ceil(filtered.length / PROJECTS_PER_PAGE);

    // Current page slice
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * PROJECTS_PER_PAGE;
        return filtered.slice(start, start + PROJECTS_PER_PAGE);
    }, [filtered, currentPage]);

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        setCurrentPage(1);
        setExpandedId(null);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        setExpandedId(null);
    };

    return (
        <section id="projects" className="section-base" data-debug="projects-section">
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                {/* ── Section header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: dimColor, letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                        02 — WORK
                    </div>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: textColor, marginBottom: '0.5rem' }}>
                        Selected Projects
                    </h2>
                    <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: dimColor, marginBottom: '2.5rem', maxWidth: '500px' }}>
                        Each module represents a complete engineering challenge — click to expand the datasheet.
                    </p>
                </motion.div>

                {/* ── Category filter ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <CategoryFilter
                        active={activeCategory}
                        onChange={handleCategoryChange}
                        isDark={isDark}
                        counts={counts}
                    />
                </motion.div>

                {/* ── Result metadata line ── */}
                <div style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.58rem',
                    color: dimColor,
                    letterSpacing: '0.08em',
                    marginBottom: '1rem',
                    opacity: 0.65,
                }}>
                    {'// '}
                    {filtered.length === PROJECTS.length
                        ? `showing all ${PROJECTS.length} modules`
                        : `${filtered.length} module${filtered.length !== 1 ? 's' : ''} · ${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
                    {totalPages > 1 ? ` · page ${currentPage} of ${totalPages}` : ''}
                </div>

                {/* ── Cards grid with filter/page transition ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${activeCategory}-${currentPage}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                        {paginated.length > 0 ? (
                            paginated.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    isDark={isDark}
                                    isExpanded={expandedId === project.id}
                                    onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
                                />
                            ))
                        ) : (
                            <div style={{
                                fontFamily: 'JetBrains Mono',
                                fontSize: '0.75rem',
                                color: dimColor,
                                padding: '3rem 0',
                                textAlign: 'center',
                                letterSpacing: '0.06em',
                            }}>
                                // no modules in this category
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ── Pagination ── */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    isDark={isDark}
                />
            </div>
        </section>
    );
};

export default Projects;
