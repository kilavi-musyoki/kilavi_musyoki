import React, { useRef, useState, useEffect, memo } from 'react';

const calculateSignalDot = (dist) => {
    const segs = [
        { x1: 12, y1: 80, x2: 22, y2: 80 }, { x1: 22, y1: 80, x2: 22, y2: 68 }, { x1: 22, y1: 68, x2: 90, y2: 68 },
        { x1: 90, y1: 68, x2: 90, y2: 103 }, { x1: 90, y1: 103, x2: 100, y2: 103 }, { x1: 100, y1: 103, x2: 100, y2: 120 },
        { x1: 100, y1: 120, x2: 114, y2: 120 }, { x1: 114, y1: 120, x2: 114, y2: 135 }, { x1: 114, y1: 135, x2: 85, y2: 135 },
        { x1: 85, y1: 135, x2: 85, y2: 148 },
    ];
    let rem = dist;
    for (const seg of segs) {
        const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
        if (rem <= len) {
            const t = rem / len;
            return { x: seg.x1 + (seg.x2 - seg.x1) * t, y: seg.y1 + (seg.y2 - seg.y1) * t };
        }
        rem -= len;
    }
    return { x: 85, y: 148 };
};

const PCBBoard = memo(({ layer = 'casing', className = '', isDark = true, componentsOpacityMult = 1, tracesOpacityMult = 1, pcbOpacityMult = 1 }) => {
    const [tooltip, setTooltip] = useState(null);
    const signalDotRef = useRef(null);
    const [ledOn, setLedOn] = useState(true);
    const tooltipTimer = useRef(null);
    const rafRef = useRef(null);
    const ledTimerRef = useRef(null);

    // ── Palette ──────────────────────────────────────────────────────────────
    const traceColor = isDark ? '#4BD8A0' : '#00CC66';
    const padColor = '#D4A843';
    const padColorDim = isDark ? 'rgba(212,168,67,0.4)' : 'rgba(212,168,67,0.5)';
    const pcbSubstrate = isDark ? '#1a2e1a' : '#0d2b1a';
    const pcbBorder = isDark ? 'rgba(75,216,160,0.38)' : 'rgba(0,204,102,0.48)';
    const casingFill = isDark ? '#2a2a2a' : '#1e2e1e';
    const casingStroke = isDark ? '#444' : '#2e4a2e';
    const casingInner = isDark ? '#222' : '#152415';
    const casingLine = isDark ? '#2f2f2f' : '#1a301a';
    const screwFill = isDark ? '#1a1a1a' : '#0d1f0d';
    const screwStroke = isDark ? '#555' : '#3a5a3a';
    const screwCross = isDark ? '#777' : '#5a8a5a';
    const silkAccent = isDark ? 'rgba(75,216,160,0.55)' : 'rgba(0,255,120,0.75)';
    const silkDim = isDark ? 'rgba(75,216,160,0.32)' : 'rgba(0,255,120,0.45)';
    const silkLabel = isDark ? 'rgba(255,255,255,0.17)' : 'rgba(255,255,255,0.22)';
    const serialColor = isDark ? 'rgba(75,216,160,0.55)' : 'rgba(0,255,120,0.65)';
    const serialColorDim = isDark ? 'rgba(75,216,160,0.3)' : 'rgba(0,255,120,0.38)';
    const usbFill = isDark ? '#333' : '#1a3a1a';
    const esp32Fill = isDark ? '#1a1a1a' : '#162616';
    const esp32Inner = isDark ? '#0d0d0d' : '#0a1a0a';
    const esp32Label = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.75)';
    const esp32Sub = isDark ? 'rgba(75,216,160,0.4)' : 'rgba(0,204,102,0.65)';
    const tooltipPartC = '#D4A843';
    const tooltipOwner = isDark ? 'rgba(75,216,160,0.5)' : 'rgba(0,204,102,0.7)';
    const resistorColor = '#8a6cd4';
    const capColor = '#D4A843';
    const capBodyColor = '#c8a82a';
    const vregColor = isDark ? '#2a4a2a' : '#0d2e0d';
    const glowStop = isDark ? '#4BD8A0' : '#00CC66';
    const thermalLabel = 'rgba(255,170,0,0.8)';
    const copperPour = isDark ? 'rgba(75,216,160,0.04)' : 'rgba(0,204,102,0.05)';
    const copperHatch = isDark ? 'rgba(75,216,160,0.06)' : 'rgba(0,204,102,0.08)';
    const solderMask = isDark ? 'rgba(20,60,30,0.55)' : 'rgba(10,50,20,0.6)';
    const diodeColor = '#333';
    const diodeBand = '#c0c0c0';

    // ── Signal pulse animation ────────────────────────────────────────────────
    useEffect(() => {
        if (!['traces', 'components', 'routes'].includes(layer)) {
            cancelAnimationFrame(rafRef.current);
            return;
        }
        let t = 0;
        const totalLen = 340;
        const animate = () => {
            t = (t + 0.003) % 1;
            const dist = t * totalLen;
            const dot = calculateSignalDot(dist);
            if (signalDotRef.current) {
                const circles = signalDotRef.current.getElementsByTagName('circle');
                if (circles.length >= 2) {
                    circles[0].setAttribute('cx', dot.x);
                    circles[0].setAttribute('cy', dot.y);
                    circles[1].setAttribute('cx', dot.x);
                    circles[1].setAttribute('cy', dot.y);
                }
            }
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [layer]);

    // ── LED blink ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const schedule = () => {
            const delay = 1500 + Math.random() * 2500;
            ledTimerRef.current = setTimeout(() => {
                setLedOn(false);
                setTimeout(() => { setLedOn(true); schedule(); }, 120);
            }, delay);
        };
        schedule();
        return () => clearTimeout(ledTimerRef.current);
    }, []);

    const components = [
        { id: 'C1', x: 25, y: 30, w: 8, h: 5, label: 'C1 100nF', func: 'Decoupling cap', rating: '50V X7R', color: capColor },
        { id: 'C2', x: 38, y: 30, w: 8, h: 5, label: 'C2 10uF', func: 'Bulk capacitor', rating: '16V', color: capColor },
        { id: 'C3', x: 25, y: 50, w: 8, h: 5, label: 'C3 100nF', func: 'Decoupling cap', rating: '50V X7R', color: capColor },
        { id: 'C4', x: 38, y: 50, w: 8, h: 5, label: 'C4 4.7uF', func: 'Filter cap', rating: '25V', color: capColor },
        { id: 'C5', x: 51, y: 30, w: 7, h: 5, label: 'C5 220uF', func: 'Bulk electrolytic', rating: '16V', color: capBodyColor },
        { id: 'C6', x: 51, y: 50, w: 7, h: 5, label: 'C6 470nF', func: 'Filter cap', rating: '50V', color: capColor },
        { id: 'R1', x: 25, y: 72, w: 10, h: 5, label: 'R1 10kΩ', func: 'Pull-up resistor', rating: '0402 1/16W', color: resistorColor },
        { id: 'R2', x: 40, y: 72, w: 10, h: 5, label: 'R2 4.7kΩ', func: 'Pull-up resistor', rating: '0402 1/16W', color: resistorColor },
        { id: 'R3', x: 25, y: 82, w: 10, h: 5, label: 'R3 330Ω', func: 'LED current limit', rating: '0402 1/16W', color: resistorColor },
        { id: 'R4', x: 40, y: 82, w: 10, h: 5, label: 'R4 1kΩ', func: 'Base resistor', rating: '0402 1/16W', color: resistorColor },
        { id: 'R5', x: 25, y: 92, w: 10, h: 5, label: 'R5 2.2kΩ', func: 'Pulldown resistor', rating: '0402 1/16W', color: resistorColor },
        { id: 'R6', x: 40, y: 92, w: 10, h: 5, label: 'R6 100kΩ', func: 'Bias resistor', rating: '0402 1/16W', color: resistorColor },
    ];

    const handleHover = (e, comp) => {
        clearTimeout(tooltipTimer.current);
        const rect = e.currentTarget.closest('svg').getBoundingClientRect();
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 70, comp });
    };
    const handleLeave = () => {
        tooltipTimer.current = setTimeout(() => setTooltip(null), 200);
    };

    const layerVis = {
        casing: { casing: 1, thermal: 0, pcb: 0, traces: 0, components: 0, },
        thermal: { casing: 0, thermal: 1, pcb: 1, traces: 0, components: 0, },
        pcb: { casing: 0, thermal: 0, pcb: 1, traces: 1, components: 0, },
        traces: { casing: 0, thermal: 0, pcb: 1, traces: 1, components: 1, },
        components: { casing: 0, thermal: 0, pcb: 1, traces: 1, components: 1, },
        system: { casing: 0, thermal: 0, pcb: 1, traces: 1, components: 0, },
        routes: { casing: 0, thermal: 0, pcb: 0.9, traces: 1, components: 0, },
    };
    const vis = layerVis[layer] || layerVis.casing;



    // ── Helpers ────────────────────────────────────────────────────────────────
    const screwGroup = (cx, cy, i) => (
        <g key={i}>
            <circle cx={cx} cy={cy} r="4" fill="rgba(0,0,0,0.38)" />
            <circle cx={cx} cy={cy} r="3.4" fill={screwFill} stroke={screwStroke} strokeWidth="0.65" />
            <circle cx={cx - 1.1} cy={cy - 1.1} r="0.6" fill="#fff" opacity="0.2" />
            <line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} stroke={screwCross} strokeWidth="0.75" />
            <line x1={cx} y1={cy - 2} x2={cx} y2={cy + 2} stroke={screwCross} strokeWidth="0.75" />
            <circle cx={cx} cy={cy} r="3.4" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.3" />
        </g>
    );

    // Thermal relief: 4 spokes connecting pad to ground pour
    const thermalRelief = (cx, cy, r, key) => (
        <g key={key}>
            <circle cx={cx} cy={cy} r={r + 1.5} fill="none" stroke={copperHatch} strokeWidth="0.3" strokeDasharray="1.5 2" />
            {[0, 90, 180, 270].map(angle => {
                const rad = (angle * Math.PI) / 180;
                const x1 = cx + Math.cos(rad) * (r + 0.3);
                const y1 = cy + Math.sin(rad) * (r + 0.3);
                const x2 = cx + Math.cos(rad) * (r + 1.8);
                const y2 = cy + Math.sin(rad) * (r + 1.8);
                return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={traceColor} strokeWidth="0.5" opacity="0.35" />;
            })}
        </g>
    );

    // Via with thermal relief
    const via = (cx, cy, key, small = false) => {
        const r = small ? 1.6 : 2.8;
        const innerR = small ? 0.7 : 1.5;
        const dotR = small ? 0.5 : 0.9;
        return (
            <g key={key}>
                {!small && thermalRelief(cx, cy, r, `tr-${key}`)}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={padColor} strokeWidth={small ? "0.7" : "1.1"} />
                <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={padColor} strokeWidth={small ? "0.3" : "0.4"} strokeOpacity="0.5" />
                <circle cx={cx} cy={cy} r={dotR} fill={padColor} opacity="0.72" />
            </g>
        );
    };

    // Test point
    const testPoint = (cx, cy, label, key) => (
        <g key={key}>
            <circle cx={cx} cy={cy} r="2.2" fill="none" stroke={padColor} strokeWidth="0.9" />
            <circle cx={cx} cy={cy} r="1.2" fill={padColor} opacity="0.5" />
            <text x={cx} y={cy - 3.2} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.6" fill={silkDim}>{label}</text>
        </g>
    );

    // Fiducial mark
    const fiducial = (cx, cy, key) => (
        <g key={key}>
            <circle cx={cx} cy={cy} r="1.8" fill={padColor} opacity="0.6" />
            <circle cx={cx} cy={cy} r="3.2" fill="none" stroke={padColor} strokeWidth="0.4" opacity="0.35" />
            <circle cx={cx} cy={cy} r="0.6" fill={pcbSubstrate} />
        </g>
    );

    return (
        <div className={`relative board-container ${className}`}>
            <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                    <radialGradient id="board-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={glowStop} stopOpacity="0.14" />
                        <stop offset="100%" stopColor={glowStop} stopOpacity="0" />
                    </radialGradient>
                    <filter id="pcb-glow">
                        <feGaussianBlur stdDeviation="1.4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="led-glow">
                        <feGaussianBlur stdDeviation="2.2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="signal-glow">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="comp-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0.3" dy="0.5" stdDeviation="0.6" floodColor="rgba(0,0,0,0.4)" />
                    </filter>
                    <linearGradient id="thermal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0000FF" stopOpacity="0.28" />
                        <stop offset="30%" stopColor="#00FF00" stopOpacity="0.22" />
                        <stop offset="60%" stopColor="#FFAA00" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#FF0000" stopOpacity="0.38" />
                    </linearGradient>
                    {/* PCB substrate texture — fine solder mask stipple */}
                    <pattern id="pcb-texture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="0.28" fill="rgba(75,216,160,0.055)" />
                    </pattern>
                    {/* Copper pour cross-hatch */}
                    <pattern id="copper-hatch" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="6" stroke={copperHatch} strokeWidth="0.4" />
                    </pattern>
                    {/* Ground pour — denser fill */}
                    <pattern id="gnd-pour" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
                        <rect width="3" height="3" fill={copperPour} />
                        <circle cx="1.5" cy="1.5" r="0.2" fill={copperHatch} />
                    </pattern>
                    {/* Solder mask texture overlay */}
                    <pattern id="solder-mask" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
                        <rect width="2" height="2" fill={solderMask} />
                        <circle cx="1" cy="1" r="0.12" fill="rgba(255,255,255,0.015)" />
                    </pattern>
                    {/* Gradient for IC packages */}
                    <linearGradient id="ic-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(60,60,60,1)" />
                        <stop offset="50%" stopColor="rgba(20,20,20,1)" />
                        <stop offset="100%" stopColor="rgba(40,40,40,1)" />
                    </linearGradient>
                    {/* Capacitor body gradient */}
                    <linearGradient id="cap-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#b89840" />
                        <stop offset="50%" stopColor="#D4A843" />
                        <stop offset="100%" stopColor="#b89840" />
                    </linearGradient>
                    {/* Resistor body gradient */}
                    <linearGradient id="res-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6a50b0" />
                        <stop offset="50%" stopColor="#8a6cd4" />
                        <stop offset="100%" stopColor="#6a50b0" />
                    </linearGradient>
                </defs>

                {/* ══════ CASING ══════ */}
                <g opacity={vis.casing} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="2" y="2" width="196" height="156" rx="6" fill={casingFill} stroke={casingStroke} strokeWidth="1" />
                    <rect x="8" y="8" width="184" height="144" rx="4" fill={casingInner} stroke="rgba(0,0,0,.2)" strokeWidth="0.5" />
                    {[...Array(13)].map((_, i) => (
                        <line key={i} x1="8" y1={14 + i * 10} x2="192" y2={14 + i * 10} stroke={casingLine} strokeWidth="0.28" />
                    ))}
                    {[[14, 14], [186, 14], [14, 146], [186, 146]].map(([cx, cy], i) => screwGroup(cx, cy, i))}
                    <text x="100" y="86" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="5" fill={serialColor} letterSpacing="0.28">
                        SN-2024-KM-PORTFOLIO-REV2
                    </text>
                    <text x="100" y="94" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="3.2" fill={serialColorDim} letterSpacing="0.1">
                        SILICON SOUL · KILAVI MUSYOKI · DEKUT
                    </text>
                </g>

                {/* ══════ THERMAL ══════ */}
                <g opacity={vis.thermal} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="2" y="2" width="196" height="156" rx="6" fill="url(#thermal-grad)" />
                    <text x="100" y="85" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="3.8" fill={thermalLabel}>
                        THERMAL PROFILE — ACTIVE
                    </text>
                    <circle cx="114" cy="84" r="22" fill="rgba(255,60,0,0.22)" />
                    <circle cx="114" cy="84" r="11" fill="rgba(255,120,0,0.18)" />
                    {/* Hot spots at major ICs */}
                    <circle cx="164" cy="115" r="8" fill="rgba(255,80,0,0.15)" />
                    <circle cx="170" cy="55" r="6" fill="rgba(255,40,0,0.12)" />
                    <circle cx="164" cy="85" r="6" fill="rgba(255,100,0,0.1)" />
                </g>

                {/* ══════ PCB BASE ══════ */}
                <g opacity={vis.pcb * pcbOpacityMult} style={{ transition: 'opacity 0.3s ease' }}>
                    {/* Board substrate */}
                    <rect x="4" y="4" width="192" height="152" rx="5" fill={pcbSubstrate} />

                    {/* Copper ground pour — cross-hatched fill */}
                    <rect x="4" y="4" width="192" height="152" rx="5" fill="url(#copper-hatch)" />
                    <rect x="4" y="4" width="192" height="152" rx="5" fill="url(#gnd-pour)" />

                    {/* Solder mask texture */}
                    <rect x="4" y="4" width="192" height="152" rx="5" fill="url(#pcb-texture)" />

                    {/* Board outline */}
                    <rect x="4" y="4" width="192" height="152" rx="5" fill="none" stroke={pcbBorder} strokeWidth="0.55" />

                    {/* Edge plating — small copper tabs on edges */}
                    {[30, 60, 90, 120, 150].map((y, i) => (
                        <g key={`ep-${i}`}>
                            <rect x="4" y={y - 1} width="1.2" height="2" fill={padColor} opacity="0.35" />
                            <rect x="194.8" y={y - 1} width="1.2" height="2" fill={padColor} opacity="0.35" />
                        </g>
                    ))}
                    {[40, 80, 120, 160].map((x, i) => (
                        <g key={`eph-${i}`}>
                            <rect x={x - 1} y="4" width="2" height="1.2" fill={padColor} opacity="0.35" />
                        </g>
                    ))}

                    {/* ── V-Score line (panelization mark) ── */}
                    <line x1="4" y1="4" x2="4" y2="156" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" strokeDasharray="2 1" />

                    {/* ── Chamfered corner indicator (pin 1 orientation) ── */}
                    <path d="M4 10 L4 4 L10 4" fill="none" stroke={traceColor} strokeWidth="0.6" opacity="0.3" />

                    {/* Mounting holes with thermal relief spokes */}
                    {[[14, 14], [186, 14], [14, 146], [186, 146]].map(([cx, cy], i) => (
                        <g key={`mh-${i}`}>
                            {/* Thermal relief spokes */}
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
                                const rad = (angle * Math.PI) / 180;
                                return <line key={angle}
                                    x1={cx + Math.cos(rad) * 3} y1={cy + Math.sin(rad) * 3}
                                    x2={cx + Math.cos(rad) * 6.5} y2={cy + Math.sin(rad) * 6.5}
                                    stroke={traceColor} strokeWidth="0.35" opacity="0.2" />;
                            })}
                            {/* Copper annular ring */}
                            <circle cx={cx} cy={cy} r="6" fill="none" stroke={padColor} strokeWidth="0.6" opacity="0.25" />
                            {/* Pad */}
                            <circle cx={cx} cy={cy} r="5" fill="none" stroke={padColor} strokeWidth="1.4" />
                            {/* Inner ring */}
                            <circle cx={cx} cy={cy} r="2.8" fill={pcbSubstrate} stroke={padColor} strokeWidth="0.65" />
                            {/* Center hole */}
                            <circle cx={cx} cy={cy} r="1" fill={padColor} opacity="0.62" />
                        </g>
                    ))}

                    {/* ── Fiducial marks (3 corners for pick-and-place alignment) ── */}
                    {fiducial(10, 8, 'fid-1')}
                    {fiducial(190, 8, 'fid-2')}
                    {fiducial(10, 152, 'fid-3')}

                    {/* GPIO header — 10 pairs with detailed pin rendering */}
                    {[...Array(10)].map((_, i) => (
                        <g key={i}>
                            {/* Pad pair */}
                            <rect x="5" y={20 + i * 6} width="6" height="4" rx=".5" fill={padColor} />
                            {/* Pin hole */}
                            <rect x="6.5" y={21 + i * 6} width="3" height="2" rx="0" fill="#111" />
                            {/* Pin number silk */}
                            <text x="12.5" y={23.5 + i * 6} fontFamily="JetBrains Mono,monospace" fontSize="1.4" fill={silkDim}>{i + 1}</text>
                        </g>
                    ))}
                    {/* Pin 1 marker — filled triangle */}
                    <polygon points="4,19 4,25 7,22" fill={silkAccent} opacity="0.4" />
                    <text x="13" y="10" fontFamily="JetBrains Mono,monospace" fontSize="2.8" fill={silkAccent}>GPIO</text>

                    {/* USB-C with shield detail */}
                    <rect x="86" y="148" width="28" height="8" rx="2" fill={usbFill} stroke={padColor} strokeWidth="0.75" />
                    <rect x="90" y="150" width="20" height="4" rx="1" fill="#040404" />
                    {/* USB shield tabs */}
                    <rect x="87" y="149" width="2" height="2" rx=".3" fill={padColor} opacity="0.6" />
                    <rect x="111" y="149" width="2" height="2" rx=".3" fill={padColor} opacity="0.6" />
                    {/* USB data pins */}
                    {[93, 96, 99, 102, 105, 108].map((x, i) => (
                        <rect key={`usb-${i}`} x={x} y="154.5" width="1.2" height="1.5" rx=".2" fill={padColor} opacity="0.5" />
                    ))}
                    <text x="100" y="155" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2.4" fill={padColor}>USB-C</text>

                    {/* RF antenna — improved inverted-F with matching network */}
                    <g stroke={traceColor} strokeWidth="1.4" fill="none" opacity="0.68" filter="url(#pcb-glow)">
                        <path d="M150 8 L160 8 L160 20 L175 20 L175 8 L185 8" />
                        <path d="M160 12 L167 12" />
                        <path d="M168 12 L175 12" />
                    </g>
                    {/* Antenna keepout zone (dotted) */}
                    <rect x="148" y="5" width="40" height="20" fill="none" stroke={silkDim} strokeWidth="0.3" strokeDasharray="1.5 1" opacity="0.4" />
                    <text x="167" y="7" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2.4" fill={silkDim}>ANT1</text>
                    <text x="189" y="22" fontFamily="JetBrains Mono,monospace" fontSize="1.5" fill={silkDim} opacity="0.6">KEEPOUT</text>

                    {/* Crystal 8MHz with load caps */}
                    <g>
                        <rect x="155" y="60" width="12" height="6" rx="1" fill="#b8a060" stroke={padColor} strokeWidth="0.55" />
                        {/* Crystal can marking */}
                        <line x1="157" y1="61" x2="165" y2="61" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3" />
                        <rect x="155" y="65" width="3" height="3" rx=".3" fill={padColor} opacity="0.8" />
                        <rect x="164" y="65" width="3" height="3" rx=".3" fill={padColor} opacity="0.8" />
                        <text x="161" y="65" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2" fill="rgba(0,0,0,0.65)">8M</text>
                        <text x="161" y="59" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2" fill={silkDim}>Y1</text>
                        {/* Load capacitors for crystal (tiny 0201) */}
                        <rect x="153" y="62" width="2" height="1.2" rx=".2" fill={capColor} opacity="0.6" />
                        <rect x="153" y="64.5" width="2" height="1.2" rx=".2" fill={capColor} opacity="0.6" />
                        <text x="152" y="62" fontFamily="JetBrains Mono,monospace" fontSize="1.2" fill={silkDim} textAnchor="end">CL1</text>
                        <text x="152" y="65" fontFamily="JetBrains Mono,monospace" fontSize="1.2" fill={silkDim} textAnchor="end">CL2</text>
                    </g>

                    {/* Voltage regulator with heatsink pattern */}
                    <g>
                        <rect x="155" y="80" width="18" height="10" rx="1" fill={vregColor} stroke={traceColor} strokeWidth="0.45" strokeOpacity="0.55" />
                        {/* Thermal pad underneath (exposed) */}
                        <rect x="158" y="82" width="12" height="5" rx=".5" fill={padColor} opacity="0.18" />
                        {/* Heat dissipation lines */}
                        {[0, 1, 2, 3].map(i => (
                            <line key={`hl-${i}`} x1={159 + i * 3} y1="82.5" x2={159 + i * 3} y2="86.5" stroke={padColor} strokeWidth="0.2" opacity="0.25" />
                        ))}
                        {/* Output pads */}
                        <rect x="156" y="89" width="4" height="3" rx=".3" fill={padColor} opacity="0.8" />
                        <rect x="161" y="89" width="4" height="3" rx=".3" fill={padColor} opacity="0.8" />
                        <rect x="166" y="89" width="4" height="3" rx=".3" fill={padColor} opacity="0.8" />
                        {/* Pin labels */}
                        <text x="158" y="93.5" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.2" fill={silkDim}>IN</text>
                        <text x="163" y="93.5" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.2" fill={silkDim}>GND</text>
                        <text x="168" y="93.5" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.2" fill={silkDim}>OUT</text>
                        <text x="164" y="87" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2" fill={silkAccent}>VR1</text>
                        <text x="164" y="83" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.8" fill="rgba(75,216,160,0.38)">AMS1117</text>
                    </g>

                    {/* DIP-8 IC with pin 1 dot and package detail */}
                    <g>
                        <rect x="155" y="105" width="18" height="20" rx="1" fill="#1a1a2a" stroke={padColor} strokeWidth="0.45" />
                        {/* Mold mark / notch */}
                        <path d="M162 105 a3,3 0 0,0 6,0" fill="#111" />
                        {/* Pin 1 dot */}
                        <circle cx="158" cy="108" r="0.8" fill={silkAccent} opacity="0.6" />
                        {/* Package texture lines */}
                        {[0, 1, 2].map(i => (
                            <line key={`pkg-${i}`} x1="156" y1={110 + i * 5} x2="172" y2={110 + i * 5} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
                        ))}
                        {/* Pins with solder fillets */}
                        {[0, 1, 2, 3].map(i => (
                            <g key={`dip-${i}`}>
                                <rect x="153" y={108 + i * 4} width="3" height="2" rx=".3" fill={padColor} opacity="0.8" />
                                <rect x="174" y={108 + i * 4} width="3" height="2" rx=".3" fill={padColor} opacity="0.8" />
                                {/* Solder fillet hint */}
                                <ellipse cx="155.5" cy={109 + i * 4} rx="0.6" ry="0.8" fill={padColor} opacity="0.2" />
                                <ellipse cx="174.5" cy={109 + i * 4} rx="0.6" ry="0.8" fill={padColor} opacity="0.2" />
                            </g>
                        ))}
                        <text x="164" y="117" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2.4" fill="rgba(255,255,255,0.38)">U2</text>
                        <text x="164" y="121" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2" fill="rgba(75,216,160,0.32)">NE555</text>
                    </g>

                    {/* ── NEW: Schottky diode D1 (SOD-323) ── */}
                    <g>
                        <rect x="75" y="25" width="6" height="3.5" rx=".5" fill={diodeColor} stroke={padColor} strokeWidth="0.35" />
                        {/* Cathode band */}
                        <rect x="79" y="25" width="1.5" height="3.5" rx=".2" fill={diodeBand} opacity="0.55" />
                        {/* Pads */}
                        <rect x="73" y="25.5" width="2.5" height="2.5" rx=".2" fill={padColor} opacity="0.7" />
                        <rect x="81" y="25.5" width="2.5" height="2.5" rx=".2" fill={padColor} opacity="0.7" />
                        <text x="78" y="24" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.6" fill={silkDim}>D1</text>
                        {/* Polarity arrow silk */}
                        <path d="M74 30 L78 30 L77 29 M78 30 L77 31" fill="none" stroke={silkAccent} strokeWidth="0.3" opacity="0.5" />
                    </g>

                    {/* ── NEW: TVS Diode D2 (protection) ── */}
                    <g>
                        <rect x="75" y="38" width="6" height="3.5" rx=".5" fill={diodeColor} stroke={padColor} strokeWidth="0.35" />
                        <rect x="79" y="38" width="1.5" height="3.5" rx=".2" fill={diodeBand} opacity="0.55" />
                        <rect x="73" y="38.5" width="2.5" height="2.5" rx=".2" fill={padColor} opacity="0.7" />
                        <rect x="81" y="38.5" width="2.5" height="2.5" rx=".2" fill={padColor} opacity="0.7" />
                        <text x="78" y="37" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.6" fill={silkDim}>D2</text>
                    </g>

                    {/* ── NEW: N-MOSFET Q1 (SOT-23) ── */}
                    <g>
                        <rect x="62" y="100" width="8" height="5" rx=".5" fill="#2a2a3a" stroke={padColor} strokeWidth="0.35" />
                        {/* 3 pads */}
                        <rect x="63" y="104.5" width="2" height="2" rx=".2" fill={padColor} opacity="0.7" />
                        <rect x="67" y="104.5" width="2" height="2" rx=".2" fill={padColor} opacity="0.7" />
                        <rect x="65" y="98.5" width="2" height="2" rx=".2" fill={padColor} opacity="0.7" />
                        {/* Pin 1 mark */}
                        <circle cx="63.5" cy="101" r="0.5" fill={silkAccent} opacity="0.5" />
                        <text x="66" y="99" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.6" fill={silkDim}>Q1</text>
                        <text x="66" y="103" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.3" fill="rgba(255,255,255,0.2)">2N7002</text>
                    </g>

                    {/* ── NEW: Ferrite beads (FB1, FB2) ── */}
                    <g>
                        <rect x="62" y="25" width="12" height="6" rx="3" fill="#2a2a3a" stroke={traceColor} strokeWidth="0.45" strokeOpacity="0.55" />
                        {/* Winding texture */}
                        {[0, 1, 2].map(i => (
                            <line key={`fb1-${i}`} x1={64.5 + i * 3} y1="25.5" x2={64.5 + i * 3} y2="30.5" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
                        ))}
                        <line x1="59" y1="28" x2="62" y2="28" stroke={traceColor} strokeWidth=".75" />
                        <line x1="74" y1="28" x2="77" y2="28" stroke={traceColor} strokeWidth=".75" />
                        <text x="68" y="23" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2" fill={silkDim}>FB1</text>
                    </g>

                    {/* Electrolytic caps (through-hole) with polarity marks */}
                    {[[63, 130], [72, 130], [81, 130]].map(([cx, cy], i) => (
                        <g key={`elec-${i}`}>
                            <circle cx={cx} cy={cy} r="4.8" fill={capBodyColor} stroke={padColor} strokeWidth="0.45" />
                            {/* Inner ring */}
                            <circle cx={cx} cy={cy} r="3.6" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.4" />
                            <circle cx={cx} cy={cy} r="2.8" fill="#8a7020" />
                            {/* Cross vent marks */}
                            <line x1={cx - 1} y1={cy} x2={cx + 1} y2={cy} stroke="rgba(255,255,255,.45)" strokeWidth=".7" />
                            <line x1={cx} y1={cy - 1} x2={cx} y2={cy + 1} stroke="rgba(255,255,255,.45)" strokeWidth=".7" />
                            {/* Polarity — negative stripe */}
                            <path d={`M${cx + 3.5} ${cy - 3} A4.8 4.8 0 0 1 ${cx + 3.5} ${cy + 3}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                            {/* Minus symbol */}
                            <line x1={cx + 3} y1={cy - 4.5} x2={cx + 5} y2={cy - 4.5} stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
                            {/* Plus symbol */}
                            <line x1={cx - 4} y1={cy - 4.5} x2={cx - 2} y2={cy - 4.5} stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
                            <line x1={cx - 3} y1={cy - 5.5} x2={cx - 3} y2={cy - 3.5} stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
                            <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.8" fill={silkAccent}>{`C${7 + i}`}</text>
                            <line x1={cx - 1.4} y1={cy + 5} x2={cx - 1.4} y2={cy + 8} stroke={padColor} strokeWidth=".7" />
                            <line x1={cx + 1.4} y1={cy + 5} x2={cx + 1.4} y2={cy + 8} stroke={padColor} strokeWidth=".7" />
                        </g>
                    ))}

                    {/* ── Test points ── */}
                    {testPoint(145, 30, 'TP1', 'tp1')}
                    {testPoint(145, 40, 'TP2', 'tp2')}
                    {testPoint(145, 50, 'TP3', 'tp3')}
                    {testPoint(22, 110, 'TP4', 'tp4')}

                    {/* Silk screen labels */}
                    <text x="100" y="155" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2" fill={silkLabel}>SN-2024-KM-PORTFOLIO-REV2</text>
                    <text x="5" y="140" fontFamily="JetBrains Mono,monospace" fontSize="2" fill={silkLabel}>UART</text>
                    <text x="5" y="17" fontFamily="JetBrains Mono,monospace" fontSize="2" fill={silkLabel}>J1</text>

                    {/* ── Revision block (bottom-right) ── */}
                    <g>
                        <rect x="150" y="140" width="42" height="14" fill="none" stroke={silkDim} strokeWidth="0.3" />
                        <line x1="150" y1="145" x2="192" y2="145" stroke={silkDim} strokeWidth="0.2" />
                        <line x1="150" y1="149" x2="192" y2="149" stroke={silkDim} strokeWidth="0.2" />
                        <text x="152" y="144" fontFamily="JetBrains Mono,monospace" fontSize="1.5" fill={silkDim}>REV: 2.1</text>
                        <text x="152" y="148" fontFamily="JetBrains Mono,monospace" fontSize="1.5" fill={silkDim}>DATE: 2024-04</text>
                        <text x="152" y="152" fontFamily="JetBrains Mono,monospace" fontSize="1.5" fill={silkDim}>DWG: KM-001</text>
                        <text x="176" y="144" fontFamily="JetBrains Mono,monospace" fontSize="1.5" fill={silkDim}>4-LAYER</text>
                        <text x="176" y="148" fontFamily="JetBrains Mono,monospace" fontSize="1.5" fill={silkDim}>FR4 1.6mm</text>
                        <text x="176" y="152" fontFamily="JetBrains Mono,monospace" fontSize="1.5" fill={silkDim}>HASL LF</text>
                    </g>

                    {/* ── Silkscreen footprints with polarity/pin1 markers ── */}
                    <g>
                        {/* ESP32 footprint outline */}
                        <rect x="90" y="60" width="48" height="48" fill="none" stroke={silkAccent} strokeWidth="0.75" opacity="0.45" />
                        {/* Pin 1 corner chamfer */}
                        <path d="M90 64 L90 60 L94 60" fill="none" stroke={silkAccent} strokeWidth="0.8" opacity="0.6" />
                        <text x="114" y="84" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="3.2" fill={silkAccent} opacity="0.38">U1: ESP32</text>
                        <text x="114" y="89" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2.5" fill={silkAccent} opacity="0.38">WROOM-32</text>
                        {/* Top pads footprint */}
                        {[...Array(8)].map((_, i) => <rect key={`ftp-${i}`} x={93 + i * 5.5} y="59" width="2.8" height="2.8" fill="none" stroke={padColor} strokeWidth="0.45" />)}
                        {/* Bottom pads footprint */}
                        {[...Array(8)].map((_, i) => <rect key={`fbp-${i}`} x={93 + i * 5.5} y="106" width="2.8" height="2.8" fill="none" stroke={padColor} strokeWidth="0.45" />)}
                        {/* Right pads footprint */}
                        {[...Array(5)].map((_, i) => <rect key={`frp-${i}`} x="137" y={63 + i * 8} width="2.8" height="2.8" fill="none" stroke={padColor} strokeWidth="0.45" />)}
                        {/* Component footprints with polarity markers */}
                        {components.map(comp => (
                            <g key={`ft-${comp.id}`}>
                                <rect x={comp.x} y={comp.y} width={comp.w} height={comp.h} fill="none" stroke={silkAccent} strokeWidth="0.35" opacity="0.55" />
                                <text x={comp.x + comp.w / 2} y={comp.y - 1} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.7" fill={silkAccent} opacity="0.65">{comp.id}</text>
                                {/* Pad lands */}
                                <rect x={comp.x - 0.5} y={comp.y} width="1.8" height={comp.h} fill="none" stroke={padColor} strokeWidth="0.35" />
                                <rect x={comp.x + comp.w - 1.3} y={comp.y} width="1.8" height={comp.h} fill="none" stroke={padColor} strokeWidth="0.35" />
                                {/* Polarity dot for caps */}
                                {comp.id.startsWith('C') && (
                                    <circle cx={comp.x + 0.5} cy={comp.y + comp.h / 2} r="0.5" fill={silkAccent} opacity="0.4" />
                                )}
                            </g>
                        ))}
                    </g>
                </g>

                {/* ══════ TRACES ══════ */}
                <g opacity={vis.traces * tracesOpacityMult} style={{ transition: 'opacity 0.3s ease' }}>
                    <g stroke={traceColor} fill="none" filter="url(#pcb-glow)">
                        {/* ── POWER RAIL: VCC (top horizontal bus) — thicker trace ── */}
                        <path d="M14 25 L85 25 L88 22 L88 60" strokeWidth="1.6" opacity="0.72" />
                        {/* VCC branch down to caps — 45° elbows */}
                        <path d="M55 25 L55 28 L53 30" strokeWidth="1.2" opacity="0.62" />
                        <path d="M38 25 L38 28 L36 30" strokeWidth="1.2" opacity="0.62" />
                        <path d="M25 25 L25 28 L23 30" strokeWidth="1.2" opacity="0.62" />

                        {/* ── GROUND RAIL: (bottom horizontal bus) — wide pour ── */}
                        <path d="M14 118 L188 118" strokeWidth="1.6" opacity="0.72" />
                        {/* Secondary ground line */}
                        <path d="M14 120 L188 120" strokeWidth="0.4" opacity="0.25" />
                        {/* GND drops to USB */}
                        <path d="M87 118 L87 145 L89 148" strokeWidth="1.2" opacity="0.62" />
                        {/* GND taps from components — 45° entry */}
                        <path d="M30 97 L30 115 L32 118" strokeWidth="0.9" opacity="0.58" />
                        <path d="M45 97 L45 115 L47 118" strokeWidth="0.9" opacity="0.58" />
                        <path d="M63 135 L63 121 L61 118" strokeWidth="0.9" opacity="0.55" />
                        <path d="M72 135 L72 121 L70 118" strokeWidth="0.9" opacity="0.55" />
                        <path d="M81 135 L81 121 L79 118" strokeWidth="0.9" opacity="0.55" />

                        {/* ── MAIN SIGNAL BUS: GPIO → ESP32 (45° routing) ── */}
                        <path d="M14 22 L56 22 L60 26 L60 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 28 L58 28 L62 32 L62 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 34 L60 34 L64 38 L64 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 40 L62 40 L66 44 L66 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 46 L64 46 L68 50 L68 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 52 L66 52 L70 56 L70 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 58 L68 58 L72 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 64 L70 64 L74 60 L74 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 70 L72 70 L76 66 L76 59" strokeWidth="0.6" opacity="0.55" />
                        <path d="M14 76 L74 76 L78 72 L78 59" strokeWidth="0.6" opacity="0.55" />

                        {/* ── CAPS → ESP32 connection traces — 45° bends ── */}
                        <path d="M33 35 L33 47 L36 50 L90 50" strokeWidth="0.75" opacity="0.52" />
                        <path d="M46 35 L46 52 L49 55 L90 55" strokeWidth="0.75" opacity="0.52" />
                        <path d="M33 55 L33 57 L36 60 L90 60" strokeWidth="0.75" opacity="0.52" />
                        <path d="M46 55 L85 55 L88 55" strokeWidth="0.75" opacity="0.48" />

                        {/* ── RESISTOR NETWORK → ESP32 — 45° entry ── */}
                        <path d="M35 72 L77 72 L80 69 L80 65" strokeWidth="0.7" opacity="0.5" />
                        <path d="M50 72 L79 72 L82 69 L82 59" strokeWidth="0.7" opacity="0.5" />
                        <path d="M35 82 L77 82 L80 79 L80 74 L90 74" strokeWidth="0.7" opacity="0.5" />
                        <path d="M50 82 L81 82 L84 79 L84 59" strokeWidth="0.7" opacity="0.5" />
                        <path d="M35 92 L83 92 L86 89 L86 59" strokeWidth="0.7" opacity="0.5" />
                        <path d="M50 92 L85 92 L88 89 L88 59" strokeWidth="0.7" opacity="0.5" />

                        {/* ── ESP32 RIGHT PADS → Peripherals — 45° routing ── */}
                        {/* To crystal Y1 */}
                        <path d="M138 63 L148 63 L150 61 L155 61" strokeWidth="0.75" opacity="0.52" />
                        <path d="M138 71 L146 71 L148 69 L148 68" strokeWidth="0.75" opacity="0.52" />
                        {/* To voltage reg VR1 */}
                        <path d="M138 79 L152 79 L155 82 L155 83" strokeWidth="0.9" opacity="0.58" />
                        {/* Output from VR1 → VCC rail — wide power trace */}
                        <path d="M164 80 L164 28 L161 25 L88 25" strokeWidth="1.1" opacity="0.65" />
                        {/* To DIP IC U2 */}
                        <path d="M138 87 L150 87 L152 89 L152 108" strokeWidth="0.75" opacity="0.52" />
                        <path d="M138 95 L154 95 L156 97 L156 108" strokeWidth="0.75" opacity="0.52" />

                        {/* ── Differential pair (USB D+ / D-) — tightly coupled ── */}
                        <path d="M98 108 L98 116 L96 118" strokeWidth="0.9" opacity="0.58" />
                        <path d="M103 108 L103 118 L105 120 L105 145 L103 148" strokeWidth="0.9" opacity="0.58" />
                        <path d="M114 108 L114 118 L112 120 L112 145 L110 148" strokeWidth="0.9" opacity="0.58" />
                        {/* Diff pair coupling indicator */}
                        <path d="M104 125 L111 125" strokeWidth="0.3" opacity="0.3" strokeDasharray="0.8 0.8" />
                        <path d="M104 130 L111 130" strokeWidth="0.3" opacity="0.3" strokeDasharray="0.8 0.8" />
                        <path d="M104 135 L111 135" strokeWidth="0.3" opacity="0.3" strokeDasharray="0.8 0.8" />

                        {/* ── UART signals (SDA/SCL bus) ── */}
                        <path d="M14 82 L20 82 L22 80 L90 80" strokeWidth="1.3" opacity="0.65" />
                        <path d="M14 94 L20 94 L22 95 L90 95" strokeWidth="1.1" opacity="0.62" />

                        {/* ── FERRITE BEAD traces ── */}
                        <path d="M59 28 L59 27 L57 25" strokeWidth="0.9" opacity="0.55" />
                        <path d="M74 28 L86 28 L88 26" strokeWidth="0.9" opacity="0.55" />

                        {/* ── ANT FEED: Crystal → Antenna — impedance-controlled 50Ω ── */}
                        <path d="M163 60 L163 24 L161 22 L154 22 L152 20 L152 8" strokeWidth="0.7" opacity="0.5" />
                        {/* Guard traces for RF */}
                        <path d="M160 60 L160 24 L158 22 L151 22 L149 20 L149 8" strokeWidth="0.25" opacity="0.2" strokeDasharray="1 1.5" />
                        <path d="M166 60 L166 24 L164 22 L157 22 L155 20 L155 8" strokeWidth="0.25" opacity="0.2" strokeDasharray="1 1.5" />

                        {/* ── Diode connections ── */}
                        <path d="M83 27 L86 27 L88 25" strokeWidth="0.6" opacity="0.5" />
                        <path d="M83 40 L86 40 L88 42 L88 55" strokeWidth="0.6" opacity="0.5" />

                        {/* ── MOSFET Q1 connections ── */}
                        <path d="M66 98 L66 97 L68 95 L90 95" strokeWidth="0.6" opacity="0.45" />
                        <path d="M64 105 L64 115 L62 118" strokeWidth="0.6" opacity="0.45" />
                        <path d="M68 105 L68 110 L72 114 L72 118" strokeWidth="0.6" opacity="0.45" />
                    </g>

                    {/* Via pads at key junctions — with thermal relief */}
                    {via(88, 25, 'v1')}
                    {via(14, 118, 'v2')}
                    {via(87, 148, 'v3')}
                    {via(98, 118, 'v4')}
                    {via(103, 118, 'v5')}
                    {via(164, 25, 'v6')}
                    {via(59, 28, 'v7')}
                    {via(80, 82, 'v8')}
                    {/* Additional small stitching vias */}
                    {via(20, 118, 'sv1', true)}
                    {via(50, 118, 'sv2', true)}
                    {via(130, 118, 'sv3', true)}
                    {via(160, 118, 'sv4', true)}
                    {via(188, 118, 'sv5', true)}
                    {via(88, 42, 'sv6', true)}
                    {via(72, 114, 'sv7', true)}
                    {via(152, 20, 'sv8', true)}

                    {/* Signal dot */}
                    {['traces', 'components', 'routes'].includes(layer) && (
                        <g filter="url(#signal-glow)" ref={signalDotRef}>
                            <circle cx="12" cy="80" r="2.4" fill="#00FFAA" opacity="0.9" />
                            <circle cx="12" cy="80" r="1.1" fill="#ffffff" opacity="0.95" />
                        </g>
                    )}
                </g>

                {/* ══════ COMPONENTS ══════ */}
                <g opacity={vis.components * componentsOpacityMult} style={{ transition: 'opacity 0.3s ease' }}>
                    {/* ESP32 Module — enhanced with shield mesh and die detail */}
                    <g onMouseEnter={e => handleHover(e, { id: 'U1', label: 'ESP32-WROOM-32', func: 'Core Processing Unit', rating: '240MHz dual-core Xtensa LX6' })}
                        onMouseLeave={handleLeave} style={{ cursor: 'crosshair' }}>
                        {/* Package body */}
                        <rect x="90" y="60" width="48" height="48" rx="2" fill={esp32Fill} stroke={padColor} strokeWidth="0.95" filter="url(#comp-shadow)" />
                        {/* RF shield can */}
                        <rect x="92" y="62" width="44" height="44" rx="1" fill={esp32Inner} />
                        {/* Shield mesh pattern */}
                        {[...Array(8)].map((_, i) => (
                            <line key={`smv-${i}`} x1={97 + i * 5} y1="62" x2={97 + i * 5} y2="106" stroke="rgba(255,255,255,0.015)" strokeWidth="0.4" />
                        ))}
                        {[...Array(8)].map((_, i) => (
                            <line key={`smh-${i}`} x1="92" y1={67 + i * 5} x2="136" y2={67 + i * 5} stroke="rgba(255,255,255,0.015)" strokeWidth="0.4" />
                        ))}
                        {/* Die window hint */}
                        <rect x="104" y="72" width="20" height="20" rx="1" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
                        {/* Top pads */}
                        {[...Array(8)].map((_, i) => <rect key={`tp-${i}`} x={93 + i * 5.5} y="59" width="2.8" height="2.8" rx=".4" fill={padColor} />)}
                        {/* Bottom pads */}
                        {[...Array(8)].map((_, i) => <rect key={`bp-${i}`} x={93 + i * 5.5} y="106" width="2.8" height="2.8" rx=".4" fill={padColor} />)}
                        {/* Right pads */}
                        {[...Array(5)].map((_, i) => <rect key={`rp-${i}`} x="137" y={63 + i * 8} width="2.8" height="2.8" rx=".4" fill={padColor} />)}
                        {/* Thermal pad (exposed pad underneath) */}
                        <rect x="106" y="96" width="16" height="10" rx=".5" fill={padColor} opacity="0.15" />
                        {/* Labels */}
                        <text x="114" y="84" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="3.4" fill={esp32Label}>ESP32</text>
                        <text x="114" y="89" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2.4" fill={esp32Sub}>WROOM-32</text>
                        {/* Lot/date code */}
                        <text x="114" y="94" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.6" fill="rgba(255,255,255,0.12)">2024W14</text>
                        <text x="96" y="58" fontFamily="JetBrains Mono,monospace" fontSize="2.8" fill={silkAccent}>U1</text>
                    </g>

                    {/* SMD components with enhanced rendering */}
                    {components.map(comp => (
                        <g key={comp.id} onMouseEnter={e => handleHover(e, comp)} onMouseLeave={handleLeave} style={{ cursor: 'crosshair' }}>
                            {/* Component body with gradient */}
                            <rect x={comp.x} y={comp.y} width={comp.w} height={comp.h} rx="1"
                                fill={comp.id.startsWith('R') ? 'url(#res-grad)' : 'url(#cap-grad)'}
                                stroke={padColorDim} strokeWidth="0.45"
                                filter="url(#comp-shadow)" />
                            {/* Resistor color bands */}
                            {comp.id.startsWith('R') && (
                                <>
                                    <rect x={comp.x + 2} y={comp.y} width="1" height={comp.h} rx=".1" fill="rgba(255,200,0,0.65)" />
                                    <rect x={comp.x + 4} y={comp.y} width="1" height={comp.h} rx=".1" fill="rgba(255,100,0,0.65)" />
                                    <rect x={comp.x + 6} y={comp.y} width="1" height={comp.h} rx=".1" fill="rgba(200,0,0,0.55)" />
                                    <rect x={comp.x + 8} y={comp.y} width="0.8" height={comp.h} rx=".1" fill="rgba(212,168,67,0.55)" />
                                </>
                            )}
                            {/* Capacitor marking */}
                            {comp.id.startsWith('C') && (
                                <text x={comp.x + comp.w / 2} y={comp.y + comp.h - 1} textAnchor="middle"
                                    fontFamily="JetBrains Mono,monospace" fontSize="1.3" fill="rgba(0,0,0,0.45)">
                                    {comp.label.split(' ')[1]}
                                </text>
                            )}
                            {/* Solder fillets */}
                            <ellipse cx={comp.x + 0.3} cy={comp.y + comp.h / 2} rx="0.8" ry={comp.h / 2 - 0.3} fill={padColor} opacity="0.15" />
                            <ellipse cx={comp.x + comp.w - 0.3} cy={comp.y + comp.h / 2} rx="0.8" ry={comp.h / 2 - 0.3} fill={padColor} opacity="0.15" />
                            <text x={comp.x + comp.w / 2} y={comp.y - 1} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="1.8" fill={silkAccent}>{comp.id}</text>
                        </g>
                    ))}

                    {/* LED1 (red, blinks) — enhanced with lens detail */}
                    <g filter="url(#led-glow)">
                        <circle cx="170" cy="55" r="4.2"
                            fill={ledOn ? '#FF5A3C' : 'rgba(255,90,60,0.22)'} opacity={ledOn ? 0.9 : 0.48}
                            style={{ transition: 'fill 0.05s,opacity 0.05s' }} />
                        {/* Lens dome highlight */}
                        <circle cx="170" cy="55" r="1.8" fill={ledOn ? '#FF8060' : 'rgba(255,128,96,0.28)'} style={{ transition: 'fill 0.05s' }} />
                        <ellipse cx="168.5" cy="53.5" rx="1" ry="0.8" fill="rgba(255,255,255,0.18)" transform="rotate(-25 168.5 53.5)" />
                        {/* Lead frame */}
                        <rect x="167.5" y="58" width="5" height="3" rx=".5" fill="rgba(255,90,60,0.28)" />
                        {/* Anode indicator */}
                        <line x1="170" y1="59.5" x2="170" y2="60.5" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
                        <text x="174" y="54" fontFamily="JetBrains Mono,monospace" fontSize="2.4" fill="rgba(255,90,60,0.65)">LED1</text>
                    </g>

                    {/* LED2 (green, status) — enhanced */}
                    <g filter="url(#led-glow)">
                        <circle cx="170" cy="70" r="2.8" fill={traceColor} opacity="0.82" />
                        <circle cx="170" cy="70" r="1.4" fill="#aaffcc" opacity="0.9" />
                        <ellipse cx="169" cy="69" rx="0.6" ry="0.5" fill="rgba(255,255,255,0.15)" transform="rotate(-25 169 69)" />
                        <text x="174" y="69" fontFamily="JetBrains Mono,monospace" fontSize="2.4" fill={silkDim}>LED2</text>
                    </g>

                    {/* Silk screen header */}
                    <text x="22" y="17" fontFamily="JetBrains Mono,monospace" fontSize="2.4" fill={silkLabel}>KILAVI MUSYOKI</text>
                    <text x="22" y="13" fontFamily="JetBrains Mono,monospace" fontSize="2" fill={silkDim}>DeKUT · ELECTRONICS</text>

                    {/* ── NEW: Board logo/branding ── */}
                    <g opacity="0.25">
                        <circle cx="78" cy="115" r="3" fill="none" stroke={traceColor} strokeWidth="0.4" />
                        <text x="78" y="116.5" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2.5" fill={traceColor} fontWeight="bold">K</text>
                    </g>
                </g>

                {/* Board ambient glow */}
                <ellipse cx="100" cy="160" rx="68" ry="18" fill="url(#board-glow)" />
            </svg>

            {/* Tooltip */}
            {tooltip && (
                <div style={{
                    position: 'absolute', left: tooltip.x + 10, top: tooltip.y,
                    background: 'rgba(0,0,0,0.88)', border: `1px solid rgba(75,216,160,0.4)`,
                    padding: '6px 8px', borderRadius: '3px',
                    fontFamily: 'JetBrains Mono,monospace', fontSize: '9px', color: '#ced0ce',
                    pointerEvents: 'none', zIndex: 20, whiteSpace: 'nowrap',
                }}>
                    <div style={{ color: tooltipPartC, marginBottom: '2px' }}>PART: {tooltip.comp.id}</div>
                    <div>FUNCTION: {tooltip.comp.label || tooltip.comp.func}</div>
                    {tooltip.comp.rating && <div>RATING: {tooltip.comp.rating}</div>}
                    <div style={{ color: tooltipOwner, marginTop: '2px' }}>OWNER: Kilavi Musyoki</div>
                </div>
            )}
        </div>
    );
});

export default PCBBoard;
