import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';

const ZONES = [
    { value: 0.0, label: 'PRODUCT', color: '#ced0ce', status: 'ONLINE' },
    { value: 0.2, label: 'TENSION', color: '#D4A843', status: 'WARN' },
    { value: 0.4, label: 'TEARDOWN', color: '#FF8C42', status: 'UNSTABLE' },
    { value: 0.6, label: 'SYSTEM', color: '#4BD8A0', status: 'CALIBRATED' },
    { value: 0.8, label: 'SIGNAL', color: '#6FD4FF', status: 'RAW' },
];

const SNAP_THRESHOLD = 0.055;

// AudioContext is lazy-created once per page load, hidden inside the closure
// so it can't be accidentally shared or mutated from outside this module.
const playTick = (() => {
    let ctx = null;
    return (freq = 660, type = 'sine', duration = 0.028) => {
        try {
            if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const g   = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            g.gain.setValueAtTime(0.05, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (_) { /* ignore */ }
    };
})();

const getZoneIdx = (lv) => Math.min(4, Math.floor((lv + 1e-9) / 0.2));
const getZone = (lv) => ZONES[getZoneIdx(lv)];

export default function LeverControl({ leverValue, onChange, isDark, isMobile = false }) {
    const railRef = useRef(null);
    const dragging = useRef(false);
    const startY = useRef(0);
    const startVal = useRef(0);
    const lastZoneIdx = useRef(getZoneIdx(leverValue));
    const [hintPulse, setHintPulse] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const reduceMotion = useReducedMotion();

    const activeZone = getZone(leverValue);
    const activeColor = activeZone.color;
    const handlePct = leverValue;

    const railBorder = isDark ? 'rgba(206,208,206,0.18)' : 'rgba(104,112,120,0.2)';
    const labelDim = isDark ? 'rgba(206,208,206,0.3)' : 'rgba(28,34,38,0.3)';
    const handleGrad = isDark
        ? 'linear-gradient(150deg,#4e4e4e 0%,#222 55%,#353535 100%)'
        : 'linear-gradient(150deg,#d0d4d0 0%,#a5a9a5 55%,#babcba 100%)';

    const snap = (val) => {
        const nearest = ZONES.reduce((a, b) =>
            Math.abs(val - a.value) < Math.abs(val - b.value) ? a : b
        );
        return Math.abs(val - nearest.value) < SNAP_THRESHOLD ? nearest.value : val;
    };

    const onPointerDown = (e) => {
        setHintPulse(false);
        dragging.current = true;
        setIsDragging(true);
        startY.current = e.clientY;
        startVal.current = leverValue;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
        playTick(400, 'triangle', 0.05);
    };

    const onPointerMove = (e) => {
        if (!dragging.current) return;
        const railH = railRef.current?.getBoundingClientRect().height || 300;
        const dy = e.clientY - startY.current;
        const newVal = Math.max(0, Math.min(1, startVal.current + dy / railH));
        onChange(newVal);
        const zi = getZoneIdx(newVal);
        if (zi !== lastZoneIdx.current) {
            lastZoneIdx.current = zi;
            playTick(880, 'square', 0.02);
        } else if (Math.random() < 0.1) {
            playTick(1200, 'sine', 0.01);
        }
    };

    const onPointerUp = () => {
        if (!dragging.current) return;
        dragging.current = false;
        setIsDragging(false);
        const snapped = snap(leverValue);
        if (snapped !== leverValue) {
            onChange(snapped);
            playTick(660, 'triangle', 0.06);
        }
    };

    const onMobileChange = (e) => {
        setHintPulse(false);
        const val = Number(e.target.value) / 100;
        onChange(val);
        const zi = getZoneIdx(val);
        if (zi !== lastZoneIdx.current) { lastZoneIdx.current = zi; playTick(); }
    };

    const onRailKeyDown = (e) => {
        const steps = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05, PageUp: 0.1, PageDown: -0.1 };
        if (e.key === 'Home') { e.preventDefault(); onChange(0); return; }
        if (e.key === 'End') { e.preventDefault(); onChange(1); return; }
        if (!(e.key in steps)) return;
        e.preventDefault();
        onChange(Math.max(0, Math.min(1, leverValue + steps[e.key])));
    };

    // Ticks every 5%
    const ticks = Array.from({ length: 21 }).map((_, i) => i * 0.05);

    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingInline: '2px' }}>
                    {ZONES.map(z => (
                        <span key={z.label} style={{
                            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.46rem',
                            color: Math.abs(leverValue - z.value) < 0.11 ? z.color : labelDim,
                            letterSpacing: '0.05em', transition: 'color 0.3s',
                        }}>
                            {z.label}
                        </span>
                    ))}
                </div>
                <input
                    type="range" min="0" max="100"
                    value={Math.round(leverValue * 100)}
                    onChange={onMobileChange}
                    className="lever-range-input"
                    style={{ accentColor: activeColor, width: '100%' }}
                />
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '0.5rem', height: '100%', justifyContent: 'center',
            userSelect: 'none',
        }}>
            <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.46rem',
                color: labelDim, letterSpacing: '0.15em', fontWeight: 700,
            }}>CTRL</div>

            {/* Hint arrow */}
            {hintPulse && !reduceMotion && (
                <motion.div
                    animate={{ y: [0, 4, 0], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ color: activeColor, fontSize: '0.58rem', marginTop: '-0.3rem', marginBottom: '-0.2rem' }}
                >
                    ▼
                </motion.div>
            )}

            {/* Rail */}
            <div
                ref={railRef}
                className="lever-rail-control"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onRailKeyDown}
                role="slider"
                tabIndex={0}
                aria-label="Deconstruction stage"
                aria-orientation="vertical"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(leverValue * 100)}
                aria-valuetext={`${activeZone.label}, ${activeZone.status}`}
                style={{
                    flex: 1, width: '26px', position: 'relative',
                    background: 'linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.3) 100%)',
                    border: `1px solid ${railBorder}`,
                    borderRadius: '13px',
                    '--lever-focus': activeColor,
                    boxShadow: `inset 0 0 10px rgba(0,0,0,.8), 0 0 14px ${activeColor}1a`,
                    cursor: 'crosshair',
                    transition: 'box-shadow 0.4s',
                }}
            >
                {/* Calibration ticks */}
                {ticks.map((val, i) => {
                    const isMajor = i % 4 === 0;
                    return (
                        <div key={i} style={{
                            position: 'absolute', top: `${val * 100}%`,
                            left: isMajor ? '2px' : '6px',
                            right: isMajor ? '2px' : '6px',
                            height: '1px',
                            background: val <= handlePct
                                ? `rgba(75,216,160,${isMajor ? 0.38 : 0.14})`
                                : `rgba(255,255,255,${isMajor ? 0.13 : 0.04})`,
                            pointerEvents: 'none',
                        }} />
                    );
                })}

                {/* Filled track */}
                <div style={{
                    position: 'absolute', top: '4px', left: '30%', right: '30%',
                    height: `calc(${handlePct * 100}% - 24px)`,
                    background: `linear-gradient(180deg,rgba(206,208,206,.08),${activeColor}88)`,
                    borderRadius: '4px',
                    transition: 'background 0.4s',
                    pointerEvents: 'none',
                    boxShadow: `0 0 10px ${activeColor}38`,
                }} />

                {/* Zone lines + labels */}
                {ZONES.map((zone, idx) => {
                    const isActive = getZoneIdx(leverValue) === idx;
                    const topPct = zone.value * 100;
                    return (
                        <React.Fragment key={zone.label}>
                            <div style={{
                                position: 'absolute', top: `${topPct}%`,
                                left: '-7px', right: '-7px', height: '1.5px',
                                background: isActive ? zone.color : (isDark ? 'rgba(206,208,206,.12)' : 'rgba(104,112,120,.12)'),
                                boxShadow: isActive ? `0 0 7px ${zone.color}` : 'none',
                                transition: 'background 0.3s, box-shadow 0.3s',
                            }} />
                            <span style={{
                                position: 'absolute', top: `calc(${topPct}% - 5px)`, left: '33px',
                                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.44rem',
                                fontWeight: isActive ? 700 : 400,
                                color: isActive ? zone.color : labelDim,
                                letterSpacing: '0.1em', whiteSpace: 'nowrap',
                                transition: 'color 0.3s, font-weight 0.3s',
                                textShadow: isActive ? `0 0 7px ${zone.color}75` : 'none',
                            }}>
                                {zone.label}
                            </span>
                        </React.Fragment>
                    );
                })}

                {/* Handle */}
                <motion.div
                    style={{
                        position: 'absolute', left: '-8px', right: '-8px',
                        top: `calc(${handlePct * 100}% - 18px)`, height: '36px',
                        background: handleGrad,
                        border: `1.5px solid ${activeColor}`,
                        borderRadius: '6px',
                        boxShadow: `0 0 15px ${activeColor}55, inset 0 2px 0 rgba(255,255,255,0.17), 0 4px 10px rgba(0,0,0,.62)`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                    }}
                    whileHover={reduceMotion ? undefined : { scaleX: 1.1, boxShadow: `0 0 22px ${activeColor}75, 0 4px 10px rgba(0,0,0,.62)` }}
                    whileTap={reduceMotion ? undefined : { scaleX: 0.95 }}
                >
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: '13px', height: '1.5px',
                            background: isDark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.22)',
                            borderRadius: '1px', boxShadow: '0 1px 0 rgba(0,0,0,.38)',
                        }} />
                    ))}
                </motion.div>
            </div>

            {/* Readout */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
                    color: activeColor, letterSpacing: '0.08em', fontWeight: 700,
                    transition: 'color 0.3s', textShadow: `0 0 7px ${activeColor}55`,
                }}>
                    {Math.round(leverValue * 100)}%
                </div>
            </div>
        </div>
    );
}

LeverControl.propTypes = {
    leverValue: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    isDark: PropTypes.bool.isRequired,
    isMobile: PropTypes.bool,
};
