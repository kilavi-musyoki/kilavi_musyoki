import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getTheme } from '../theme.js';

/**
 * CyberCursor — Compact Precision Telemetry & Engineering Cursor
 *
 * Sized for minimal unobtrusiveness with ultra-crisp engineering feedback:
 * - 'default': 18px micro-radar reticle + 3px precision core dot
 * - 'pointer': 26px corner target brackets [ · ]
 * - 'project-expand': 30px micro-aperture with glowing '+' expand core & corner ticks
 * - 'project-collapse': 30px micro-aperture with glowing '−' collapse core
 * - 'grab': 38×20px sleek robotic caliper claws with tactile hydraulic pinch
 * - 'crosshair': 26px mil-spec circuit inspection crosshair
 * - 'text': 14px slim laser I-beam probe
 * - 'disabled': 20px alert restricted circle
 */
const CyberCursor = ({ isDark = true }) => {
  const [mode, setMode] = useState('default');
  const [isClicking, setIsClicking] = useState(false);
  const [customColor, setCustomColor] = useState(null);

  // High-performance direct DOM references
  const portalRef = useRef(null);
  const dotElRef = useRef(null);
  const ringElRef = useRef(null);
  const clickPingRef = useRef(null);

  const posRef = useRef({ x: -200, y: -200 });
  const ringRef = useRef({ x: -200, y: -200 });
  const isInitRef = useRef(false);
  const rafId = useRef(null);

  const t = getTheme(isDark);
  const accent = customColor || t.accentColor;
  const glow = t.accentGlow;
  const darkText = isDark ? '#ffffff' : '#2C1F0A';
  const alertColor = isDark ? '#FF5A3C' : '#E04C18';
  const altColor = isDark ? '#6FD4FF' : '#D4AF37';

  // ── Determine cursor mode from hovered element ─────────────────────────────
  const updateCursorMode = useCallback((target) => {
    if (!target) {
      setMode('default');
      setCustomColor(null);
      return;
    }

    // Custom color attribute
    const colorEl = target.closest?.('[data-cursor-color]');
    const customCol = colorEl?.getAttribute('data-cursor-color');
    setCustomColor(customCol || null);

    // 1. Explicit data-cursor override
    const explicitEl = target.closest?.('[data-cursor]');
    if (explicitEl) {
      const customMode = explicitEl.getAttribute('data-cursor');
      setMode(customMode || 'pointer');
      return;
    }

    // 2. Disabled check
    if (
      target.closest?.(':disabled, [aria-disabled="true"], .disabled, [style*="not-allowed"]')
    ) {
      setMode('disabled');
      return;
    }

    // 3. Slider / Range / Lever check -> Grab mode
    if (
      target.closest?.('input[type="range"], .lever-range-input, [role="slider"], [data-cursor="grab"]')
    ) {
      setMode('grab');
      return;
    }

    // 4. Text / Input check -> Text mode
    if (
      target.closest?.(
        'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"], .hud-input'
      )
    ) {
      setMode('text');
      return;
    }

    // 5. Interactive crosshair / canvas check (PCB Board, Game, Oscilloscope, SandBox)
    if (
      target.closest?.(
        'canvas, .board-container, .oscilloscope-display, #hero-board, .portrait-card, .idle-character-svg'
      )
    ) {
      setMode('crosshair');
      return;
    }

    // 6. Clickable / Link / Button check -> Pointer mode
    if (
      target.closest?.(
        'a, button, [role="button"], summary, select, .btn, .hud-btn, .clickable, [onclick], label, .status-pill'
      )
    ) {
      setMode('pointer');
      return;
    }

    // Default ambient mode
    setMode('default');
  }, []);

  // ── Stable Global Mouse Listeners ───────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      posRef.current.x = x;
      posRef.current.y = y;

      // On very first movement, snap ring to cursor without fly-in lag
      if (!isInitRef.current) {
        ringRef.current.x = x;
        ringRef.current.y = y;
        isInitRef.current = true;
      }

      // Show cursor portal
      if (portalRef.current) {
        portalRef.current.style.opacity = '1';
      }

      // Instant 0-lag dot tracking
      if (dotElRef.current) {
        dotElRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const handleMouseOver = (e) => {
      updateCursorMode(e.target);
    };

    const handleMouseDown = (e) => {
      setIsClicking(true);
      // Spawn tactile shockwave ping
      if (clickPingRef.current) {
        const ping = clickPingRef.current;
        ping.style.left = `${e.clientX}px`;
        ping.style.top = `${e.clientY}px`;
        ping.style.transform = 'translate(-50%, -50%) scale(0)';
        ping.style.opacity = '0.9';
        ping.style.transition = 'none';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            ping.style.transition = 'transform 0.35s cubic-bezier(0.1, 0.85, 0.3, 1), opacity 0.35s ease-out';
            ping.style.transform = 'translate(-50%, -50%) scale(2.4)';
            ping.style.opacity = '0';
          });
        });
      }
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseLeave = () => {
      if (portalRef.current) {
        portalRef.current.style.opacity = '0';
      }
    };

    const handleMouseEnter = () => {
      if (portalRef.current) {
        portalRef.current.style.opacity = '1';
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [updateCursorMode]);

  // ── Physics Loop: Silky Smooth Trailing HUD Reticle ────────────────────────
  useEffect(() => {
    const lerpFactor = 0.28; // Snappier, compact physics

    const tick = () => {
      const targetX = posRef.current.x;
      const targetY = posRef.current.y;

      ringRef.current.x += (targetX - ringRef.current.x) * lerpFactor;
      ringRef.current.y += (targetY - ringRef.current.y) * lerpFactor;

      if (ringElRef.current) {
        ringElRef.current.style.transform = `translate3d(${ringRef.current.x}px, ${ringRef.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  // ── Compact Size & Dimension Definitions ────────────────────────────────────
  const getRingDimensions = () => {
    if (mode === 'grab') {
      return { width: 38, height: 22, size: 38 };
    }
    if (mode === 'project-expand' || mode === 'project-collapse') {
      return { width: 30, height: 30, size: 30 };
    }
    if (isClicking) return { width: 16, height: 16, size: 16 };
    switch (mode) {
      case 'pointer':
        return { width: 26, height: 26, size: 26 };
      case 'text':
        return { width: 18, height: 18, size: 18 };
      case 'crosshair':
        return { width: 26, height: 26, size: 26 };
      case 'disabled':
        return { width: 20, height: 20, size: 20 };
      default:
        return { width: 18, height: 18, size: 18 };
    }
  };

  const ringDim = getRingDimensions();
  const currentAccent = mode === 'disabled' ? alertColor : accent;

  return (
    <div
      ref={portalRef}
      className="cyber-cursor-portal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999999,
        opacity: 0,
        transition: 'opacity 0.2s ease',
      }}
      aria-hidden="true"
    >
      {/* ── 1. Instant Precision Center Dot / Probe ── */}
      <div
        ref={dotElRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          willChange: 'transform',
          zIndex: 10000001,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mode === 'grab' ? null : mode === 'project-expand' ? (
            /* Glowing Compact Plus */
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                fontWeight: 900,
                color: currentAccent,
                textShadow: `0 0 6px ${currentAccent}`,
                lineHeight: 1,
                transform: isClicking ? 'scale(1.3) rotate(90deg)' : 'scale(1) rotate(0deg)',
                transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              +
            </div>
          ) : mode === 'project-collapse' ? (
            /* Glowing Compact Minus */
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '12px',
                fontWeight: 900,
                color: currentAccent,
                textShadow: `0 0 6px ${currentAccent}`,
                lineHeight: 1,
                transform: isClicking ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
            >
              −
            </div>
          ) : mode === 'text' ? (
            /* Slim Laser I-Beam Probe */
            <div
              style={{
                width: '1.5px',
                height: '14px',
                background: currentAccent,
                boxShadow: `0 0 6px ${currentAccent}`,
                borderRadius: '1px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '-2px',
                  width: '5.5px',
                  height: '1.5px',
                  background: currentAccent,
                  borderRadius: '1px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: '-2px',
                  width: '5.5px',
                  height: '1.5px',
                  background: currentAccent,
                  borderRadius: '1px',
                }}
              />
            </div>
          ) : (
            /* Precision Core Micro-Dot */
            <div
              style={{
                width: isClicking ? '3px' : mode === 'pointer' ? '4px' : '3px',
                height: isClicking ? '3px' : mode === 'pointer' ? '4px' : '3px',
                borderRadius: '50%',
                background: mode === 'pointer' ? darkText : currentAccent,
                boxShadow: `0 0 ${mode === 'pointer' ? '8px' : '4px'} ${currentAccent}`,
                transition: 'width 0.12s, height 0.12s, background 0.12s, transform 0.12s',
                transform: isClicking ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          )}
        </div>
      </div>

      {/* ── 2. Compact Trailing Telemetry Reticle ── */}
      <div
        ref={ringElRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          willChange: 'transform',
          zIndex: 10000000,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${ringDim.width || ringDim.size}px`,
            height: `${ringDim.height || ringDim.size}px`,
            transform: 'translate(-50%, -50%)',
            transition: 'width 0.18s cubic-bezier(0.16, 1, 0.3, 1), height 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* ──────── MODE: DEFAULT (Compact Precision Radar HUD Ring) ──────── */}
          {mode === 'default' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `1px solid ${currentAccent}55`,
                boxShadow: `0 0 6px ${glow}`,
                position: 'relative',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Cardinal micro-ticks */}
              <div style={{ position: 'absolute', top: '-2.5px', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '2px', background: currentAccent }} />
              <div style={{ position: 'absolute', bottom: '-2.5px', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '2px', background: currentAccent }} />
              <div style={{ position: 'absolute', left: '-2.5px', top: '50%', transform: 'translateY(-50%)', height: '1px', width: '2px', background: currentAccent }} />
              <div style={{ position: 'absolute', right: '-2.5px', top: '50%', transform: 'translateY(-50%)', height: '1px', width: '2px', background: currentAccent }} />
            </div>
          )}

          {/* ──────── MODE: PROJECT EXPAND (Compact Aperture Frame) ──────── */}
          {mode === 'project-expand' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isClicking ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                {/* 4 Corner L-Brackets */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '5px', borderTop: `1.5px solid ${currentAccent}`, borderLeft: `1.5px solid ${currentAccent}` }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '5px', height: '5px', borderTop: `1.5px solid ${currentAccent}`, borderRight: `1.5px solid ${currentAccent}` }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '5px', height: '5px', borderBottom: `1.5px solid ${currentAccent}`, borderLeft: `1.5px solid ${currentAccent}` }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '5px', height: '5px', borderBottom: `1.5px solid ${currentAccent}`, borderRight: `1.5px solid ${currentAccent}` }} />

                {/* Rotating micro-aperture ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '50%',
                    border: `1px dashed ${currentAccent}66`,
                    boxShadow: `0 0 8px ${currentAccent}44`,
                    animation: 'cyber-reticle-spin 8s linear infinite',
                  }}
                />
              </div>
            </div>
          )}

          {/* ──────── MODE: PROJECT COLLAPSE (Compact Contraction Frame) ──────── */}
          {mode === 'project-collapse' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isClicking ? 'scale(0.85)' : 'scale(1)',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '5px', borderTop: `1.5px solid ${currentAccent}`, borderLeft: `1.5px solid ${currentAccent}` }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '5px', height: '5px', borderTop: `1.5px solid ${currentAccent}`, borderRight: `1.5px solid ${currentAccent}` }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '5px', height: '5px', borderBottom: `1.5px solid ${currentAccent}`, borderLeft: `1.5px solid ${currentAccent}` }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '5px', height: '5px', borderBottom: `1.5px solid ${currentAccent}`, borderRight: `1.5px solid ${currentAccent}` }} />

                <div
                  style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '50%',
                    border: `1px solid ${currentAccent}`,
                    boxShadow: `0 0 8px ${currentAccent}55`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ──────── MODE: POINTER / INTERACTIVE (Target Lock Brackets) ──────── */}
          {mode === 'pointer' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                animation: 'cyber-reticle-spin 12s linear infinite',
              }}
            >
              {/* 4 Corner Locking Brackets */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '5px', borderTop: `1.5px solid ${currentAccent}`, borderLeft: `1.5px solid ${currentAccent}` }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '5px', height: '5px', borderTop: `1.5px solid ${currentAccent}`, borderRight: `1.5px solid ${currentAccent}` }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '5px', height: '5px', borderBottom: `1.5px solid ${currentAccent}`, borderLeft: `1.5px solid ${currentAccent}` }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '5px', height: '5px', borderBottom: `1.5px solid ${currentAccent}`, borderRight: `1.5px solid ${currentAccent}` }} />

              {/* Concentric subtle target ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '3px',
                  borderRadius: '50%',
                  border: `1px dashed ${altColor}66`,
                  boxShadow: `0 0 8px ${glow}`,
                }}
              />
            </div>
          )}

          {/* ──────── MODE: TEXT (Compact Diagnostic Scan Box) ──────── */}
          {mode === 'text' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '1px',
                  bottom: '1px',
                  left: '1px',
                  right: '1px',
                  borderTop: `1px solid ${currentAccent}66`,
                  borderBottom: `1px solid ${currentAccent}66`,
                  borderLeft: `1px dashed ${currentAccent}33`,
                  borderRight: `1px dashed ${currentAccent}33`,
                  borderRadius: '1px',
                }}
              />
            </div>
          )}

          {/* ──────── MODE: GRAB / SLIDER (Compact Robotic Micro-Calipers) ──────── */}
          {mode === 'grab' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="38"
                height="20"
                viewBox="0 0 38 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: 'visible' }}
              >
                {/* Guide Rail */}
                <line
                  x1="2"
                  y1="10"
                  x2="36"
                  y2="10"
                  stroke={currentAccent}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity={isClicking ? '0.85' : '0.4'}
                />
                {/* Left & Right End Stops */}
                <line x1="2" y1="6" x2="2" y2="14" stroke={currentAccent} strokeWidth="1.2" opacity="0.7" />
                <line x1="36" y1="6" x2="36" y2="14" stroke={currentAccent} strokeWidth="1.2" opacity="0.7" />

                {/* ── Left Micro-Claw ── */}
                <g
                  style={{
                    transform: isClicking ? 'translateX(4.5px)' : 'translateX(0px)',
                    transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <path
                    d="M8 3 L13 6 L13 8 L11 10 L13 12 L13 14 L8 17 L5 14 L7 10 L5 6 Z"
                    fill={isDark ? '#060B12' : '#FFFDE6'}
                    stroke={currentAccent}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <circle cx="8" cy="10" r="1.2" fill={currentAccent} />
                </g>

                {/* ── Right Micro-Claw ── */}
                <g
                  style={{
                    transform: isClicking ? 'translateX(-4.5px)' : 'translateX(0px)',
                    transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <path
                    d="M30 3 L25 6 L25 8 L27 10 L25 12 L25 14 L30 17 L33 14 L31 10 L33 6 Z"
                    fill={isDark ? '#060B12' : '#FFFDE6'}
                    stroke={currentAccent}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <circle cx="30" cy="10" r="1.2" fill={currentAccent} />
                </g>

                {/* ── Active Spark Core ── */}
                {isClicking && (
                  <circle
                    cx="19"
                    cy="10"
                    r="2.5"
                    fill={altColor}
                    style={{ filter: `drop-shadow(0 0 6px ${altColor})` }}
                  />
                )}
              </svg>
            </div>
          )}

          {/* ──────── MODE: CROSSHAIR (Compact Hardware Inspection Reticle) ──────── */}
          {mode === 'crosshair' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: `${currentAccent}77`, transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: `${currentAccent}77`, transform: 'translateY(-50%)' }} />
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: `1.2px solid ${currentAccent}`,
                  background: isDark ? 'rgba(4,7,15,0.45)' : 'rgba(253,251,212,0.45)',
                  boxShadow: `0 0 8px ${glow}`,
                }}
              />
            </div>
          )}

          {/* ──────── MODE: DISABLED (Compact Alert Restricted Reticle) ──────── */}
          {mode === 'disabled' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `1.2px solid ${alertColor}`,
                boxShadow: `0 0 8px ${alertColor}66`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '2px',
                  right: '2px',
                  height: '1px',
                  background: alertColor,
                  transform: 'translateY(-50%) rotate(-45deg)',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Tactile Click Expansion Shockwave ── */}
      <div
        ref={clickPingRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: `1.2px solid ${currentAccent}`,
          boxShadow: `0 0 10px ${currentAccent}`,
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 9999998,
        }}
      />
    </div>
  );
};

export default CyberCursor;
