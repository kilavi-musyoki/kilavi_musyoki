import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import portraitImg from '../assets/portrait.jpg';
import { getTheme } from '../theme.js';
import ComicBubble from './ComicBubble.jsx';

export default function PortraitHub({ onLaunchGame, hasPlayed = false, isDark = true }) {
  const [showBubble, setShowBubble] = useState(false);
  const t = getTheme(isDark);
  const { accentColor, accentGlow, dimColor, textColor } = t;

  // Conversational delay: wait 2.2 seconds before showing the chat bubble
  useEffect(() => {
    setShowBubble(false);
    const timer = setTimeout(() => {
      setShowBubble(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, [hasPlayed]);

  const cardBorder = isDark ? 'rgba(75, 216, 160, 0.35)' : 'rgba(13, 148, 136, 0.4)';
  const cardBg = isDark ? 'rgba(10, 14, 20, 0.88)' : 'rgba(255, 255, 255, 0.88)';

  return (
    <div className="portrait-hub-container">
      {/* Premium Cyber Portrait Card */}
      <motion.div
        className="portrait-card-wrapper"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="portrait-card"
          style={{
            background: cardBg,
            borderColor: cardBorder,
            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px ${accentGlow}`,
          }}
        >
          {/* Layered ambient glow ring */}
          <div
            className="portrait-ambient-glow"
            style={{
              boxShadow: `inset 0 0 25px ${isDark ? 'rgba(75,216,160,0.12)' : 'rgba(13,148,136,0.12)'}`,
            }}
          />

          {/* Corner tech reticles */}
          <div className="corner-reticle reticle-tl" style={{ borderColor: accentColor }} />
          <div className="corner-reticle reticle-tr" style={{ borderColor: accentColor }} />
          <div className="corner-reticle reticle-bl" style={{ borderColor: accentColor }} />
          <div className="corner-reticle reticle-br" style={{ borderColor: accentColor }} />

          {/* Header HUD Strip */}
          <div
            className="portrait-card-header"
            style={{ borderBottomColor: isDark ? 'rgba(75,216,160,0.15)' : 'rgba(13,148,136,0.15)' }}
          >
            <div className="status-pill">
              <span
                className="status-dot-pulsing"
                style={{ background: accentColor, boxShadow: `0 0 8px ${accentGlow}` }}
              />
              <span className="status-text" style={{ color: dimColor }}>
                AVATAR // KILAVI MUSYOKI
              </span>
            </div>
            <div
              className="hud-badge"
              style={{
                color: accentColor,
                borderColor: isDark ? 'rgba(75,216,160,0.3)' : 'rgba(13,148,136,0.3)',
              }}
            >
              ONLINE
            </div>
          </div>

          {/* Portrait Image Container */}
          <div className="portrait-image-wrapper">
            <img
              src={portraitImg}
              alt="Kilavi Musyoki - Portrait"
              className="portrait-img"
              loading="eager"
            />

            {/* CRT scanlines & subtle ambient gradient vignette */}
            <div className="portrait-scanlines" />
            <div
              className="portrait-glow-overlay"
              style={{
                background: `radial-gradient(circle at 50% 35%, transparent 45%, ${
                  isDark ? 'rgba(4,6,10,0.65)' : 'rgba(232,234,231,0.45)'
                } 100%)`,
              }}
            />

            {/* Speech Chat Bubble — Anchored naturally near character face */}
            <AnimatePresence>
              {showBubble && (
                <motion.div
                  className="speech-bubble-anchor"
                  initial={{ opacity: 0, y: 16, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ComicBubble>
                    {!hasPlayed ? (
                      <span>
                        WANT TO PLAY A{' '}
                        <span
                          style={{
                            color: '#8B0000',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                            fontWeight: 900,
                            transition: 'color 0.2s ease',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLaunchGame();
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#b91c1c'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#8B0000'; }}
                          title="Click to launch game"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              onLaunchGame();
                            }
                          }}
                        >
                          GAME
                        </span>
                        ?
                      </span>
                    ) : (
                      <span>
                        WANT TO PLAY{' '}
                        <span
                          style={{
                            color: '#8B0000',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                            fontWeight: 900,
                            transition: 'color 0.2s ease',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLaunchGame();
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#b91c1c'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#8B0000'; }}
                          title="Click to launch game again"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              onLaunchGame();
                            }
                          }}
                        >
                          AGAIN
                        </span>
                        ?
                      </span>
                    )}
                  </ComicBubble>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer info bar */}
          <div
            className="portrait-card-footer"
            style={{ borderTopColor: isDark ? 'rgba(75,216,160,0.15)' : 'rgba(13,148,136,0.15)' }}
          >
            <span
              style={{
                color: dimColor,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                letterSpacing: '0.08em',
              }}
            >
              [CLICK HIGHLIGHTED &quot;GAME&quot; TO ENTER]
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
