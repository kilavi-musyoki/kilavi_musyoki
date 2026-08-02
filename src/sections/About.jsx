import React from 'react';
import { motion } from 'framer-motion';
import { getTheme } from '../theme.js';

const SPECS = [
  { name: 'Embedded Systems', value: 69 },
  { name: 'Networking',       value: 80 },
  { name: 'Digital Logic',    value: 95 },
  { name: 'Software Dev',     value: 78 },
  { name: 'System Design',    value: 71 },
  { name: 'Cybersecurity',    value: 50 },
];

const About = ({ isDark }) => {
  const t           = getTheme(isDark);
  const textColor   = t.textColor;
  const dimColor    = t.dimColor;
  const accentColor = t.accentColor;
  const borderColor = t.borderColor;
  const bgCard      = t.cardBg;

  return (
    <section id="about" className="section-base">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            color: dimColor,
            letterSpacing: '0.15em',
            marginBottom: '6px',
          }}>
            01 — ABOUT
          </div>

          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            color: textColor,
            marginBottom: '30px',
          }}>
            Engineering Datasheet
          </h2>
        </motion.div>

        {/* Datasheet card */}
        <div style={{
          border: `1px solid ${borderColor}`,
          background: bgCard,
          borderRadius: '4px',
          overflow: 'hidden',
        }}>

          {/* Part header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                color: textColor,
              }}>
                MUSYOKI-KM
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                color: dimColor,
              }}>
                Human Engineering Module
              </div>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              color: dimColor,
              textAlign: 'right',
            }}>
              REV 2.1<br />ACTIVE
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px' }}>

            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              color: dimColor,
              marginBottom: '10px',
              letterSpacing: '0.1em',
            }}>
              GENERAL DESCRIPTION
            </div>

            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              color: textColor,
              lineHeight: 1.8,
              marginBottom: '28px',
            }}>
              Multidisciplinary engineering student specializing in systems that integrate electronics, software, communication networks and cybersecurity. Design approach emphasizes reliability, clarity, measurable performance, and secure by design principles, from embedded microcontrollers to distributed software platforms. Focused on building practical, resilient solutions grounded in engineering fundamentals, with attention to threat modeling, system hardening, and data integrity rather than trends.

            </p>

            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              color: dimColor,
              marginBottom: '10px',
              letterSpacing: '0.1em',
            }}>
              KEY FEATURES
            </div>

            <ul style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              color: textColor,
              marginBottom: '30px',
              lineHeight: 1.8,
            }}>
              <li>Hardware–software co-design</li>
              <li>Embedded microcontroller systems</li>
              <li>Network-aware applications</li>
              <li>Simulation-driven engineering</li>
              <li>Rapid prototyping</li>
              <li>IAM system integration and Malware analysis</li>
              <li>Cryptography</li>
            </ul>

            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              color: dimColor,
              marginBottom: '6px',
              letterSpacing: '0.1em',
            }}>
              ELECTRICAL CHARACTERISTICS
            </div>

            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6rem',
              color: dimColor,
              marginBottom: '14px',
            }}>
              TA = 25°C · Nominal Conditions
            </div>

            <div>
              {SPECS.map((spec) => (
                <motion.div
                  key={spec.name}
                  whileHover={{ background: borderColor }}
                  style={{
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: `1px solid ${borderColor}`,
                  }}
                >
                  <span style={{
                    minWidth: '100px',
                    maxWidth: '50%',
                    flexShrink: 0,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    color: textColor,
                  }}>
                    {spec.name}
                  </span>

                  <div style={{
                    flex: 1,
                    height: '6px',
                    background: borderColor,
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${spec.value}%` }}
                      transition={{ duration: 1 }}
                      style={{
                        height: '100%',
                        background: accentColor,
                        opacity: 0.85,
                      }}
                    />
                  </div>

                  <span style={{
                    width: '40px',
                    textAlign: 'right',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.7rem',
                    color: dimColor,
                  }}>
                    {spec.value}%
                  </span>
                </motion.div>
              ))}
            </div>

          </div>

          {/* Bottom accent strip */}
          <div style={{
            height: '4px',
            background: `linear-gradient(90deg, transparent, ${textColor}, transparent)`,
          }} />
        </div>

      </div>
    </section>
  );
};

export default About;
