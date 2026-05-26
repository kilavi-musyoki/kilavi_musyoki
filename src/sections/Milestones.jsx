import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getTheme } from '../theme.js';

const CHANGELOG = [
    {
        version: 'v4.0',
        status: 'Degree',
        title: 'Telecommunications & Information Engineering, DeKUT',
        body: 'BSc programme focused on communications systems, networking, and electronics. 2023–2027.',
        color: '#4BD8A0',   // cyber mint — current / flagship
    },
    {
        version: 'v3.0',
        status: 'Leadership',
        title: 'Class Representative',
        body: 'Elected liaison between students and faculty, coordinating academic communication and schedules.',
        color: '#6FD4FF',   // neon tech-blue
    },
    {
        version: 'v2.0',
        status: 'Community',
        title: 'IEEE Student Branch, DeKUT',
        body: 'Active member — talks, workshops, and standards-focused events around real engineering practice.',
        color: '#D4A843',   // warm copper-gold
    },
    {
        version: 'v1.0',
        status: 'Highlight',
        title: 'Cloud-Connected IoT Pipeline',
        body: 'ESP32 sensors, MQTT, and web dashboard for live monitoring — my first end‑to‑end engineering pipeline.',
        color: '#a3b8cc',   // steel-blue muted
    },
];

const Milestones = ({ isDark }) => {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const t         = getTheme(isDark);
    const textColor = t.textColor;
    const dimColor  = t.dimColor;
    const bodyColor = isDark ? 'rgba(206,212,222,0.72)' : 'rgba(28,34,38,0.65)';

    return (
        <section id="milestones" className="section-base" data-debug="milestones-section">
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: dimColor, letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                        03 — RECOGNITION
                    </div>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: textColor, marginBottom: '0.5rem' }}>
                        Wins &amp; Milestones
                    </h2>
                    <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: dimColor, marginBottom: '3rem', maxWidth: '520px' }}>
                        A few milestones that describe where I am today — kept short and to the point.
                    </p>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {CHANGELOG.map((entry, idx) => (
                        <motion.div
                            key={entry.version}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ duration: 0.5, delay: idx * 0.08 }}
                            className="changelog-entry"
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{
                                borderLeftColor: hoveredIdx === idx ? entry.color : `${entry.color}44`,
                                paddingBottom: '2rem',
                                cursor: 'default',
                                transition: 'border-color 0.3s',
                            }}
                        >
                            {/* Version badge + status */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: '0.7rem',
                                    color: entry.color,
                                    letterSpacing: '0.05em',
                                    minWidth: '60px',
                                }}>
                                    {entry.version}
                                </span>
                                <span style={{
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: '0.6rem',
                                    padding: '2px 8px',
                                    border: `1px solid ${entry.color}55`,
                                    borderRadius: '2px',
                                    color: entry.color,
                                    background: `${entry.color}10`,
                                    letterSpacing: '0.08em',
                                }}>
                                    {entry.status}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 style={{
                                fontFamily: 'Syne, sans-serif',
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                color: textColor,
                                marginBottom: '6px',
                                transition: 'color 0.3s',
                            }}>
                                {entry.title}
                            </h3>

                            {/* Body */}
                            <p style={{
                                fontFamily: 'JetBrains Mono',
                                fontSize: '0.75rem',
                                color: bodyColor,
                                lineHeight: 1.7,
                                maxWidth: '600px',
                            }}>
                                {entry.body}
                            </p>

                            {/* Animated trace line on hover */}
                            {hoveredIdx === idx && (
                                <motion.div
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    animate={{ scaleX: 1, opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        height: '1px',
                                        background: `linear-gradient(90deg, ${entry.color}, transparent)`,
                                        transformOrigin: 'left',
                                    }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Milestones;
