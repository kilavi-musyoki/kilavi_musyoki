import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Projects from './sections/Projects.jsx';
import Milestones from './sections/Milestones.jsx';
import Contact from './sections/Contact.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import DebugOverlay from './components/DebugOverlay.jsx';
import IdleCharacter from './components/IdleCharacter.jsx';
import { initScroll } from './scrollSetup.js';
import { useFocusTrap } from './hooks/useFocusTrap';
import { getTheme } from './theme.js';

// Spark particle effect on click
const createSparks = (x, y, isDark) => {
  const color = isDark ? '#9ca09c' : '#50b1ce';
  const glow  = isDark ? '#9ca09c' : '#79bfc9';
  for (let i = 0; i < 10; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const angle    = (i / 10) * Math.PI * 2;
    const distance = 30 + Math.random() * 40;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    spark.style.cssText = `
      left: ${x}px; top: ${y}px;
      background: ${color};
      box-shadow: 0 0 4px ${glow};
      position: fixed; width: 4px; height: 4px;
      border-radius: 50%; pointer-events: none; z-index: 99997;
      animation: none; transition: all 0.5s ease-out;
    `;
    document.body.appendChild(spark);
    requestAnimationFrame(() => {
      spark.style.transform = `translate(${dx}px, ${dy}px)`;
      spark.style.opacity   = '0';
      spark.style.width     = '2px';
      spark.style.height    = '2px';
    });
    setTimeout(() => spark.remove(), 500);
  }
};

const NAV_LINKS = [
  { href: '#about',      label: '01 — About'   },
  { href: '#projects',   label: '02 — Work'    },
  { href: '#milestones', label: '03 — Wins'    },
  { href: '#contact',    label: '04 — Contact' },
];

function App() {
  const [isDark,       setIsDark]       = useState(true);
  const [debugMode,    setDebugMode]    = useState(false);
  const [fps,          setFps]          = useState(60);
  const [navVisible,   setNavVisible]   = useState(true);
  const [debugBuffer,  setDebugBuffer]  = useState('');
  const [boardLayer,   setBoardLayer]   = useState('casing');
  const [boardGlitch,  setBoardGlitch]  = useState(false);
  const [status,       setStatus]       = useState({ available: true });
  const [navOpen,      setNavOpen]      = useState(false);
  const drawerRef = useRef(null);
  useFocusTrap(drawerRef, navOpen);
  const lastScrollY = useRef(0);
  const fpsRef      = useRef({ last: performance.now(), frames: 0 });

  // ── Palette ──────────────────────────────────────────────────────────────
  const t             = getTheme(isDark);
  const { dimColor, accentColor, accentGlow, footerBg, footerBorder, footerSub } = t;
  const textColor     = t.textColor;
  const statusBorder  = t.borderColor;
  const debugBarColor = t.debugBar;
  // debugBarColor is used for both background and glow (they were always identical)

  // ── Detect system / saved theme ──────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') {
        setIsDark(stored === 'dark');
        return;
      }
    } catch { /* ignore */ }
    if (window.matchMedia) {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // ── Apply theme to body ──────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // ── Scroll-driven PCB deconstruction ────────────────────────────────────
  useEffect(() => {
    const cleanup = initScroll(setBoardLayer, setBoardGlitch);
    return cleanup;
  }, []);

  // ── Fetch live status ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch('/api/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data === 'object') {
          setStatus((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => { /* silent fail */ });
    return () => { cancelled = true; };
  }, []);

  // ── FPS counter ──────────────────────────────────────────────────────────
  useEffect(() => {
    let rafId;
    const countFPS = () => {
      fpsRef.current.frames++;
      const now = performance.now();
      if (now - fpsRef.current.last >= 1000) {
        setFps(fpsRef.current.frames);
        fpsRef.current.frames = 0;
        fpsRef.current.last   = now;
      }
      rafId = requestAnimationFrame(countFPS);
    };
    rafId = requestAnimationFrame(countFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Debug mode: type "debug" anywhere ───────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key.length === 1) {
        setDebugBuffer((prev) => {
          const next = (prev + key).slice(-5);
          if (next === 'debug') { setDebugMode((d) => !d); return ''; }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Nav hide on scroll down ──────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setNavVisible(y < lastScrollY.current || y < 100);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Global click sparks ──────────────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      // Don't spawn sparks if clicking inside the game controls
      if (e.target.closest('[data-tetrus-btn]') || e.target.closest('canvas')) return;
      
      const tag = e.target.tagName.toLowerCase();
      if (!['input', 'textarea', 'button', 'a', 'select'].includes(tag)) {
        createSparks(e.clientX, e.clientY, isDark);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isDark]);

  // ── Close mobile nav on resize to desktop ────────────────────────────────
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 640) setNavOpen(false); };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Lock body scroll when mobile nav is open ─────────────────────────────
  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [navOpen]);

  return (
    <>
  {/* Skip to main content link for accessibility */}
  <a href="#main" className="skip-link">Skip to content</a>
      <nav
        className="nav-glass"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease',
          padding: '0 2rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <a
          href="#hero"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            color: accentColor,
            textDecoration: 'none',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{
            width: 8, height: 8,
            background: accentColor,
            borderRadius: '50%',
            boxShadow: `0 0 8px ${accentGlow}`,
          }} />
          KM — SILICON SOUL
        </a>

        {/* Desktop nav links */}
        <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}

          {/* Status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px',
            border: `1px solid ${statusBorder}`,
            borderRadius: '2px',
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: accentColor, boxShadow: `0 0 6px ${accentGlow}`,
              animation: 'blink-slow 2s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: dimColor, letterSpacing: '0.08em' }}>
              {`SYSTEM: ONLINE | SEEKING: ${status.seeking?.toUpperCase() || 'N/A'}`}
            </span>
          </div>

          <ThemeToggle
            isDark={isDark}
            onToggle={() => {
              setIsDark((prev) => {
                const next = !prev;
                try { window.localStorage.setItem('theme', next ? 'dark' : 'light'); }
                catch { /* ignore */ }
                return next;
              });
            }}
          />
        </div>

        {/* Mobile: theme toggle + hamburger (shown only on mobile via CSS) */}
        <div className="mobile-nav-controls">
          <ThemeToggle
            isDark={isDark}
            onToggle={() => {
              setIsDark((prev) => {
                const next = !prev;
                try { window.localStorage.setItem('theme', next ? 'dark' : 'light'); }
                catch { /* ignore */ }
                return next;
              });
            }}
          />
          <button
            className={`hamburger-btn${navOpen ? ' is-open' : ''}`}
            onClick={() => setNavOpen((o) => !o)}
            aria-controls="mobile-drawer"
            aria-pressed={navOpen}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </div>
      </nav>

      {/* ── Mobile nav drawer ── */}
      {/* Two separate AnimatePresence wrappers required by Framer Motion v12
          (fragments as direct AP children are no longer supported)          */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            key="mob-overlay"
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setNavOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {navOpen && (
          <motion.nav
            key="mob-drawer"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            ref={drawerRef}
            style={{
              position: 'fixed',
              top: '56px', left: 0, right: 0,
              zIndex: 999,
              background: isDark ? 'rgba(40,46,40,0.98)' : 'rgba(232,234,231,0.97)',
              borderBottom: `1px solid ${isDark ? 'rgba(107,113,107,0.6)' : 'rgba(104,112,120,0.3)'}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '0.5rem 1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="mobile-drawer-link"
                onClick={() => setNavOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {/* Status strip */}
            <div style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: `1px solid ${isDark ? 'rgba(107,113,107,0.35)' : 'rgba(104,112,120,0.2)'}`,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: accentColor, boxShadow: `0 0 6px ${accentGlow}`,
                animation: 'blink-slow 2s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: dimColor, letterSpacing: '0.08em' }}>
                {`SYSTEM: ONLINE | SEEKING: ${status.seeking?.toUpperCase() || 'N/A'}`}
              </span>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Main sections ── */}
      <main id="main" style={{ paddingTop: '56px' }}>
        <Hero       isDark={isDark} layer={boardLayer} glitch={boardGlitch} />
        <About      isDark={isDark} />
        <Projects   isDark={isDark} />
        <Milestones isDark={isDark} />
        <Contact    isDark={isDark} />
      </main>

      {/* ── Footer ── */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: `1px solid ${footerBorder}`,
        background: footerBg,
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.7rem',
          color: dimColor,
          marginBottom: '4px',
        }}>
          © 2026 Kilavi Musyoki — SN-2024-KM-PORTFOLIO-REV2
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.6rem',
          color: footerSub,
          letterSpacing: '0.1em',
        }}>
          Engineered with intent. Built for impact.
        </div>
      </footer>

      {/* ── Debug overlay easter egg ── */}
      <DebugOverlay visible={debugMode} fps={fps} isDark={isDark} />

      {/* ── Debug mode top edge indicator ── */}
      {debugMode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: debugBarColor,
          zIndex: 99998,
          boxShadow: `0 0 10px ${debugBarColor}`,
        }} />
      )}

      {/* ── Idle character ── */}
      <IdleCharacter isDark={isDark} />
    </>
  );
}

export default App;
