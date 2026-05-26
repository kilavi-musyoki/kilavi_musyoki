import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTheme } from '../theme.js';

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
        color: '#4BD8A0',  // cyber mint
        icon: '🗳️',
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
        color: '#FF5A3C',  // alert red — fire theme
        icon: '🔥',
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
        color: '#D4A843',  // copper-gold
        icon: '🕐',
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
        color: '#6FD4FF',  // neon tech-blue
        icon: '🏠',
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
        color: '#a78bfa',  // soft violet / security theme
        icon: '🔐',
        repo: 'https://github.com/kilavi-musyoki/notes-app.git',
    },
    {
        id: 'p6',
        number: '06',
        title: 'Keysight ADS Microstrip Simulations',
        subtitle: 'RF / microwave line design & validation',
        problem: 'Designing microstrip transmission lines for matching networks requires accounting for substrate permittivity, conductor losses, and frequency-dependent dispersion that analytical formulas approximate poorly above 5 GHz.',
        approach: 'ADS Momentum EM simulations for 50Ω microstrip lines on FR-4 and Rogers RO4003C substrates. Swept S-parameter analysis from 1 GHz to 10 GHz; results compared against LineCalc analytical predictions. Post-processed S2P data in MATLAB for statistical deviation analysis.',
        outcome: '<0.3 dB insertion loss deviation between simulation and theoretical model at 5 GHz. Substrate loss tangent identified as dominant error contributor above 6 GHz; RO4003C outperforms FR-4 by 0.9 dB at 10 GHz.',
        lessons: 'Mesh density in Momentum has non-linear accuracy impact. Too coarse at high frequencies introduces ~1.2 dB error; too fine makes solve time impractical. Frequency-adaptive mesh at 20 cells/wavelength struck the right balance.',
        stack: ['Keysight ADS', 'Momentum EM Solver', 'LineCalc', 'MATLAB', 'S-parameter Analysis'],
        color: '#a3b8cc',  // steel blue-gray
        icon: '📡',
        repo: null,
    },
    
];

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

const ProjectCard = ({ project, isDark, isExpanded, onToggle }) => {
    const t         = getTheme(isDark);
    const textColor = t.textColor;
    const dimColor  = t.dimColor;

    // In light mode, project.color values are dark (e.g. #394139) — use a
    // consistent warm card style instead of deriving from those dark colors.
    const borderColor = isDark
        ? `${project.color}${isExpanded ? '55' : '22'}`
        : isExpanded ? 'rgba(13,148,136,0.55)' : 'rgba(104,112,120,0.35)';
    const bgCard = isDark
        ? `${project.color}${isExpanded ? '0a' : '06'}`
        : isExpanded ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)';

    // Module color badge — must be visible in both modes
    const moduleColor = isDark ? project.color : '#0D9488';


    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="pcb-card"
            style={{
                border: `1px solid ${borderColor}`,
                background: bgCard,
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: isExpanded ? `0 0 24px ${moduleColor}22` : 'none',
                transition: 'all 0.3s ease',
            }}
            onClick={onToggle}
        >
            {/* Card header */}
            <div style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
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
                            padding: '0 24px 20px',
                            borderTop: `1px solid ${moduleColor}22`,
                            paddingTop: '16px',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
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
                        <div style={{ padding: '12px 24px 20px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', justifyContent: 'space-between' }}>
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

const Projects = ({ isDark }) => {
    const [expandedId, setExpandedId] = useState(null);
    const t         = getTheme(isDark);
    const textColor = t.textColor;
    const dimColor  = t.dimColor;

    return (
        <section id="projects" className="section-base" data-debug="projects-section">
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
                    <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: dimColor, marginBottom: '3rem', maxWidth: '500px' }}>
                        Each module represents a complete engineering challenge — click to expand the datasheet.
                    </p>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {PROJECTS.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isDark={isDark}
                            isExpanded={expandedId === project.id}
                            onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
