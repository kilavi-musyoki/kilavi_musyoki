import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getTheme } from '../theme.js';

/**
 * CyberCursor — Futuristic Telemetry & Precision Engineering Cursor
 *
 * Action Modes:
 * - 'default': Precision micro-dot with smooth telemetry HUD ring & radar ticks
 * - 'pointer': Target lock-on brackets [ ● ] with pulsing core & calibrated corner reticles
 * - 'text': Cyber laser I-Beam probe for reading and text input inspection
 * - 'grab' / 'grabbing': Caliper gauge with horizontal telemetry arrows for sliders and levers
 * - 'crosshair': Mil-spec circuit probe crosshair for interactive boards, canvas, and oscilloscope
 * - 'disabled': Restricted warning reticle with alert coloration
 */
const CyberCursor = ({ isDark = true }) => {
  const [mode, setMode] = useState('default');
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(true);

  // Position refs for 60/120fps direct DOM manipulation (no React state lag)
  const posRef = useRef({ x: -100, y: -100 });
  const ringRef = useRef({ x: -100, y: -100 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const lastPosRef = useRef({ x: -100, y: -100 });
  const rafId = useRef(null);

  // DOM node refs
  const dotElRef = useRef(null);
  const ringElRef = useRef(null);
  const clickPingRef = useRef(null);

  const t = getTheme(isDark);
  const accent = t.accentColor;
  const glow = t.accentGlow;
  const darkText = isDark ? '#ffffff' : '#2C1F0A';
  const alertColor = isDark ? '#FF5A3C' : '#E04C18';
  const altColor = isDark ? '#6FD4FF' : '#D4AF37';

  // ── Detect pointer capability ──────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsFinePointer(mq.matches);
    const handler = (e) => setIsFinePointer(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Determine cursor mode from hovered DOM element ─────────────────────────
  const updateCursorMode = useCallback((target) => {
    if (!target) {
      setMode('default');
      return;
    }

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

    // 3. Slider / Range input check
    if (
      target.closest?.('input[type="range"], .lever-range-input, [role="slider"]')
    ) {
      setMode('grab');
      return;
    }

    // 4. Text / Input check
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

    // 6. Clickable / Link / Button check
    if (
      target.closest?.(
        'a, button, [role="button"], summary, select, .btn, .hud-btn, .clickable, [onclick], label'
      )
    ) {
      setMode('pointer');
      return;
    }

    // Default ambient mode
    setMode('default');
  }, []);

  // ── Global Mouse Listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isFinePointer) return;

    const handleMouseMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Instant dot positioning
      if (dotElRef.current) {
        dotElRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseOver = (e) => {
      updateCursorMode(e.target);
    };

    const handleMouseDown = (e) => {
      setIsClicking(true);
      // Spawn tactile click shockwave
      if (clickPingRef.current) {
        const ping = clickPingRef.current;
        ping.style.left = `${e.clientX}px`;
        ping.style.top = `${e.clientY}px`;
        ping.style.transform = 'translate(-50%, -50%) scale(0)';
        ping.style.opacity = '0.9';
        ping.style.transition = 'none';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            ping.style.transition = 'transform 0.4s cubic-bezier(0.1, 0.85, 0.3, 1), opacity 0.4s ease-out';
            ping.style.transform = 'translate(-50%, -50%) scale(3.5)';
            ping.style.opacity = '0';
          });
        });
      }
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
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
  }, [isFinePointer, isVisible, updateCursorMode]);

  // ── Physics Loop: Smooth Trailing Telemetry Ring ─────────────────────────────
  useEffect(() => {
    if (!isFinePointer) return;

    const lerpFactor = 0.22; // High-precision responsiveness with silky trailing

    const tick = () => {
      const targetX = posRef.current.x;
      const targetY = posRef.current.y;

      // Calculate velocity
      velRef.current.vx = targetX - lastPosRef.current.x;
      velRef.current.vy = targetY - lastPosRef.current.y;
      lastPosRef.current = { x: targetX, y: targetY };

      // Lerp ring towards mouse pos
      ringRef.current.x += (targetX - ringRef.current.x) * lerpFactor;
      ringRef.current.y += (targetY - ringRef.current.y) * lerpFactor;

      if (ringElRef.current) {
        ringElRef.current.style.transform = `translate3d(${ringRef.current.x}px, ${ringRef.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [isFinePointer]);

  if (!isFinePointer) return null;

  // ── Style & geometry definitions per mode ────────────────────────────────────
  const getRingDimensions = () => {
    if (mode === 'grab') {
      return { width: 68, height: 42, size: 68 };
    }
    if (isClicking) return { width: 24, height: 24, size: 24 };
    switch (mode) {
      case 'pointer':
        return { width: 44, height: 44, size: 44 };
      case 'text':
        return { width: 28, height: 28, size: 28 };
      case 'crosshair':
        return { width: 48, height: 48, size: 48 };
      case 'disabled':
        return { width: 32, height: 32, size: 32 };
      default:
        return { width: 30, height: 30, size: 30 };
    }
  };

  const ringDim = getRingDimensions();
  const currentAccent = mode === 'disabled' ? alertColor : accent;

  return (
    <div
      className="cyber-cursor-portal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.25s ease',
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
          zIndex: 1000001,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mode === 'grab' ? null : mode === 'text' ? (
            /* Cyber I-Beam Probe */
            <div
              style={{
                width: '2px',
                height: '18px',
                background: currentAccent,
                boxShadow: `0 0 8px ${currentAccent}`,
                borderRadius: '1px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '-3px',
                  width: '8px',
                  height: '2px',
                  background: currentAccent,
                  borderRadius: '1px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '-3px',
                  width: '8px',
                  height: '2px',
                  background: currentAccent,
                  borderRadius: '1px',
                }}
              />
            </div>
          ) : (
            /* High-precision Core Dot */
            <div
              style={{
                width: isClicking ? '4px' : mode === 'pointer' ? '6px' : '4px',
                height: isClicking ? '4px' : mode === 'pointer' ? '6px' : '4px',
                borderRadius: '50%',
                background: mode === 'pointer' ? darkText : currentAccent,
                boxShadow: `0 0 ${mode === 'pointer' ? '12px' : '6px'} ${currentAccent}`,
                transition: 'width 0.15s, height 0.15s, background 0.15s, transform 0.15s',
                transform: isClicking ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          )}
        </div>
      </div>

      {/* ── 2. Smooth Trailing Telemetry HUD Ring / Reticle ── */}
      <div
        ref={ringElRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          willChange: 'transform',
          zIndex: 1000000,
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
            transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* ──────── MODE: DEFAULT (Precision Radar HUD Ring) ──────── */}
          {mode === 'default' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `1.2px solid ${currentAccent}66`,
                boxShadow: `0 0 10px ${glow}`,
                position: 'relative',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Cardinal micro-ticks */}
              <div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', width: '1.5px', height: '3px', background: currentAccent }} />
              <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: '1.5px', height: '3px', background: currentAccent }} />
              <div style={{ position: 'absolute', left: '-4px', top: '50%', transform: 'translateY(-50%)', height: '1.5px', width: '3px', background: currentAccent }} />
              <div style={{ position: 'absolute', right: '-4px', top: '50%', transform: 'translateY(-50%)', height: '1.5px', width: '3px', background: currentAccent }} />
            </div>
          )}

          {/* ──────── MODE: POINTER / INTERACTIVE (Target Lock Brackets) ──────── */}
          {mode === 'pointer' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                animation: 'cyber-reticle-spin 14s linear infinite',
              }}
            >
              {/* 4 Corner Locking Brackets */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '8px', borderTop: `2px solid ${currentAccent}`, borderLeft: `2px solid ${currentAccent}` }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', borderTop: `2px solid ${currentAccent}`, borderRight: `2px solid ${currentAccent}` }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '8px', height: '8px', borderBottom: `2px solid ${currentAccent}`, borderLeft: `2px solid ${currentAccent}` }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', borderBottom: `2px solid ${currentAccent}`, borderRight: `2px solid ${currentAccent}` }} />

              {/* Concentric subtle target ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '5px',
                  borderRadius: '50%',
                  border: `1px dashed ${altColor}77`,
                  boxShadow: `0 0 12px ${glow}`,
                }}
              />
            </div>
          )}

          {/* ──────── MODE: TEXT (Diagnostic Scanning Bracket) ──────── */}
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
                  top: '2px',
                  bottom: '2px',
                  left: '2px',
                  right: '2px',
                  borderTop: `1px solid ${currentAccent}88`,
                  borderBottom: `1px solid ${currentAccent}88`,
                  borderLeft: `1px dashed ${currentAccent}44`,
                  borderRight: `1px dashed ${currentAccent}44`,
                  borderRadius: '2px',
                }}
              />
            </div>
          )}

          {/* ──────── MODE: GRAB / SLIDER (Articulated Robotic Calipers) ──────── */}
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
              {/* Telemetry status badge above gripper */}
              <div
                style={{
                  position: 'absolute',
                  top: '-13px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '7.5px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: isClicking ? currentAccent : altColor,
                  whiteSpace: 'nowrap',
                  textShadow: `0 0 8px ${currentAccent}`,
                  transition: 'color 0.15s',
                }}
              >
                {isClicking ? '● CLAMP' : '◀ GRIP ▶'}
              </div>

              <svg
                width="64"
                height="34"
                viewBox="0 0 64 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: 'visible' }}
              >
                {/* Calibration Guide Rail */}
                <line
                  x1="4"
                  y1="17"
                  x2="60"
                  y2="17"
                  stroke={currentAccent}
                  strokeWidth="1.2"
                  strokeDasharray="2 3"
                  opacity={isClicking ? '0.85' : '0.45'}
                />
                {/* Left & Right Limit Stops */}
                <line x1="4" y1="11" x2="4" y2="23" stroke={currentAccent} strokeWidth="1.5" opacity="0.8" />
                <line x1="60" y1="11" x2="60" y2="23" stroke={currentAccent} strokeWidth="1.5" opacity="0.8" />
                <line x1="14" y1="14" x2="14" y2="20" stroke={currentAccent} strokeWidth="1" opacity="0.4" />
                <line x1="50" y1="14" x2="50" y2="20" stroke={currentAccent} strokeWidth="1" opacity="0.4" />

                {/* ── Left Mechanical Caliper Claw ── */}
                <g
                  style={{
                    transform: isClicking ? 'translateX(7.5px)' : 'translateX(0px)',
                    transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <path
                    d="M12 5 L21 9 L21 13 L19 17 L21 21 L21 25 L12 29 L8 25 L10 17 L8 9 Z"
                    fill={isDark ? '#060B12' : '#FFFDE6'}
                    stroke={currentAccent}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
                  />
                  {/* Grip Teeth */}
                  <line x1="21" y1="11" x2="23.5" y2="11" stroke={currentAccent} strokeWidth="1.2" />
                  <line x1="21" y1="17" x2="24" y2="17" stroke={altColor} strokeWidth="1.5" />
                  <line x1="21" y1="23" x2="23.5" y2="23" stroke={currentAccent} strokeWidth="1.2" />
                  <circle cx="12" cy="17" r="1.8" fill={currentAccent} />
                </g>

                {/* ── Right Mechanical Caliper Claw ── */}
                <g
                  style={{
                    transform: isClicking ? 'translateX(-7.5px)' : 'translateX(0px)',
                    transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <path
                    d="M52 5 L43 9 L43 13 L45 17 L43 21 L43 25 L52 29 L56 25 L54 17 L56 9 Z"
                    fill={isDark ? '#060B12' : '#FFFDE6'}
                    stroke={currentAccent}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
                  />
                  {/* Grip Teeth */}
                  <line x1="43" y1="11" x2="40.5" y2="11" stroke={currentAccent} strokeWidth="1.2" />
                  <line x1="43" y1="17" x2="40" y2="17" stroke={altColor} strokeWidth="1.5" />
                  <line x1="43" y1="23" x2="40.5" y2="23" stroke={currentAccent} strokeWidth="1.2" />
                  <circle cx="52" cy="17" r="1.8" fill={currentAccent} />
                </g>

                {/* ── Active Plasma Clamping Arc ── */}
                {isClicking && (
                  <g>
                    <line
                      x1="26"
                      y1="17"
                      x2="38"
                      y2="17"
                      stroke={altColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 8px ${altColor})` }}
                    />
                    <circle
                      cx="32"
                      cy="17"
                      r="3.5"
                      fill={currentAccent}
                      style={{ filter: `drop-shadow(0 0 10px ${currentAccent})` }}
                    />
                  </g>
                )}
              </svg>
            </div>
          )}

          {/* ──────── MODE: CROSSHAIR (PCB & Hardware Mil-Spec Reticle) ──────── */}
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
              {/* Precision Laser Crosshair Lines */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: `${currentAccent}88`, transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: `${currentAccent}88`, transform: 'translateY(-50%)' }} />

              {/* Center Aperture Ring */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `1.5px solid ${currentAccent}`,
                  background: isDark ? 'rgba(4,7,15,0.45)' : 'rgba(253,251,212,0.45)',
                  boxShadow: `0 0 14px ${glow}`,
                }}
              />

              {/* Diagonal 45-degree micro tick markers */}
              <div style={{ position: 'absolute', top: '4px', right: '4px', width: '3px', height: '3px', background: altColor, borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '4px', left: '4px', width: '3px', height: '3px', background: altColor, borderRadius: '50%' }} />
            </div>
          )}

          {/* ──────── MODE: DISABLED (Alert Restricted Reticle) ──────── */}
          {mode === 'disabled' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `1.5px solid ${alertColor}`,
                boxShadow: `0 0 12px ${alertColor}77`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '2px',
                  right: '2px',
                  height: '1.5px',
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
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: `1.5px solid ${currentAccent}`,
          boxShadow: `0 0 15px ${currentAccent}`,
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 999998,
        }}
      />
    </div>
  );
};

export default CyberCursor;
