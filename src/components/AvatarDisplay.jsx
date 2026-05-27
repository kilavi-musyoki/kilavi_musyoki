import React, { useRef, useState, useEffect, memo } from 'react';
import TetrusGame from './TetrusGame.jsx';
import logoImg from '../assets/logo.png';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

const W = 120, H = 96;
const CX = 60, CY = 48;

// Node graph topology
const NODES = [
    { x: 60, y: 9, r: 2.0, t: 'top' },
    { x: 38, y: 33, r: 3.0, t: 'eye' },
    { x: 82, y: 33, r: 3.0, t: 'eye' },
    { x: 60, y: 50, r: 1.8, t: 'nose' },
    { x: 44, y: 66, r: 2.0, t: 'mouth' },
    { x: 60, y: 71, r: 2.6, t: 'mouth' },
    { x: 76, y: 66, r: 2.0, t: 'mouth' },
    { x: 20, y: 48, r: 1.6, t: 'cheek' },
    { x: 100, y: 48, r: 1.6, t: 'cheek' },
    { x: 60, y: 84, r: 1.8, t: 'chin' },
];
const EDGES = [
    [0, 1], [0, 2], [1, 2], [1, 4], [2, 6],
    [4, 5], [5, 6], [3, 5], [7, 4], [8, 6],
    [9, 5], [9, 4], [9, 6],
];
const NODE_FILL = {
    eye: '#6FD4FF',
    mouth: '#4BD8A0',
    nose: '#4BD8A0',
    top: '#ced0ce',
    cheek: 'rgba(75,216,160,.55)',
    chin: 'rgba(75,216,160,.65)',
};

export default memo(function AvatarDisplay({ leverValue, mousePosRef, isDark }) {
    const [jitterStyle, setJitterStyle] = useState({});

    useEffect(() => {
        if (leverValue < 0.20 || leverValue > 0.40) {
            setJitterStyle({});
            return;
        }

        let frame = 0;
        let rafId;
        const progress = norm(leverValue, 0.20, 0.35) * (1 - norm(leverValue, 0.35, 0.40));

        const tick = () => {
            frame++;
            if (frame % 4 === 0) {
                const maxTranslateX = progress * 3.5;
                const maxTranslateY = progress * 2.5;
                const maxSkew = progress * 1.2;

                const tx = (Math.random() - 0.5) * maxTranslateX;
                const ty = (Math.random() - 0.5) * maxTranslateY;
                const sk = (Math.random() - 0.5) * maxSkew;

                setJitterStyle({
                    transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) skewX(${sk.toFixed(1)}deg)`,
                });
            }
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [leverValue]);

    // ── Layer opacities — tuned for seamless cross-dissolve ────────────────────
    //  Game (0→0.40 full, 0.40→0.60 fade-out)  overlaps  PCB (0.22→0.55 fade-in)
    //  Node graph peaks mid-range, System overlaps its tail, Logo overlaps System's tail
    const gameOpacity   = Math.max(0, 1 - norm(leverValue, 0.40, 0.60));
    const nodeOpacity   = clamp(1 - Math.abs((leverValue - 0.48) * 2.3), 0, 1);
    const systemOpacity = norm(leverValue, 0.52, 0.72) * (1 - norm(leverValue, 0.78, 0.92));
    const logoOpacity   = norm(leverValue, 0.74, 0.92);
    const bgOpacity     = 1 - norm(leverValue, 0.38, 0.55);
    const bg = `rgba(3, 11, 5, ${bgOpacity})`;

    const faceC = '#4BD8A0';
    const gridC = 'rgba(75,216,160,0.07)';


    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: bg, borderRadius: '3px', overflow: 'hidden' }}>

            {/* CRT vignette */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.52) 100%)',
            }} />

            {/* 3D tilt container */}
            <div style={{
                position: 'absolute', inset: 0,
                transform: 'perspective(260px) rotateX(0deg) rotateY(0deg)',
                transformOrigin: 'center center',
                willChange: 'transform',
                pointerEvents: 'auto',
            }}>
                {/* LAYER 0: TETRUS Arcade Game */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: gameOpacity,
                    zIndex: 1,
                    pointerEvents: gameOpacity > 0.05 ? 'auto' : 'none',
                    ...jitterStyle,
                }}>
                    <TetrusGame glitchLevel={leverValue} isDark={isDark} />
                </div>

                <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 2, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="av-grid" x="0" y="0" width="20" height="16" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="20" y2="0" stroke={gridC} strokeWidth="0.4" />
                            <line x1="0" y1="0" x2="0" y2="16" stroke={gridC} strokeWidth="0.4" />
                        </pattern>
                        <pattern id="av-scan" x="0" y="0" width={W} height="3" patternUnits="userSpaceOnUse">
                            <rect y="2" width={W} height="1" fill="rgba(0,0,0,0.16)" />
                        </pattern>
                        <filter id="av-soft-glow">
                            <feGaussianBlur stdDeviation="1.0" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <style>{`
                            @keyframes av-scanline-move {
                                0% { transform: translateY(-2px); }
                                100% { transform: translateY(98px); }
                            }
                            @keyframes logo-float {
                                0%, 100% { transform: translateY(0px) scale(1); }
                                50% { transform: translateY(-4px) scale(1.03); }
                            }
                            .av-scanline {
                                animation: av-scanline-move 6s linear infinite;
                            }
                        `}</style>
                    </defs>

                    {/* Background grid */}
                    <rect width={W} height={H} fill="url(#av-grid)" opacity={bgOpacity} />

                    {/* ── LAYER 2: NODE GRAPH ── */}
                    <g opacity={nodeOpacity}>
                        {EDGES.map(([a, b], i) => (
                            <line key={i}
                                x1={NODES[a].x} y1={NODES[a].y}
                                x2={NODES[b].x} y2={NODES[b].y}
                                stroke={faceC} strokeWidth="0.5" opacity="0.28"
                            />
                        ))}
                        {NODES.map((n, i) => (
                            <circle key={i} cx={n.x} cy={n.y} r={n.r}
                                fill={NODE_FILL[n.t] || faceC} opacity="0.72"
                            />
                        ))}
                        <text x={W / 2} y={H - 2} fontFamily="JetBrains Mono,monospace"
                            fontSize="3.8" fill="rgba(75,216,160,0.4)" textAnchor="middle">
                            RECONSTRUCTING...
                        </text>
                    </g>


                    {/* ── LAYER 3: SYSTEM STATE ── */}
                    <g opacity={systemOpacity}>
                        <rect x="0" y="0" width={W} height="0.8" fill="#4BD8A0" opacity="0.36" className="av-scanline" style={{ willChange: 'transform' }} />
                        <g stroke="rgba(75,216,160,0.38)" strokeWidth="0.5" fill="none">
                            <circle cx={CX} cy={CY} r="26" />
                            <circle cx={CX} cy={CY} r="13" />
                            <circle cx={CX} cy={CY} r="3.8" />
                            <line x1="0" y1={CY} x2={W} y2={CY} opacity="0.45" />
                            <line x1={CX} y1="0" x2={CX} y2={H} opacity="0.45" />
                        </g>
                        <text x={CX} y={CY + 35} fontFamily="JetBrains Mono,monospace"
                            fontSize="3.8" fill="rgba(75,216,160,0.55)" textAnchor="middle">
                            SYSTEM CALIBRATED
                        </text>
                        <text x={CX} y={CY + 42} fontFamily="JetBrains Mono,monospace"
                            fontSize="2.8" fill="rgba(75,216,160,0.35)" textAnchor="middle">
                            ANALYZING PCB SUBSTRATE...
                        </text>
                    </g>




                    {/* Persistent scanlines — scoped to screen bezel only (global body::after removed) */}
                    <rect x="0" y="0" width={W} height={H}
                        fill="url(#av-scan)" opacity={Math.min(1, bgOpacity * 0.72)} pointerEvents="none"
                        style={{ transition: 'opacity 0.4s' }} />
                    {/* Screen border */}
                    <rect x="0" y="0" width={W} height={H}
                        fill="none" stroke="rgba(75,216,160,0.14)" strokeWidth="0.6" rx="2" />
                </svg>

                {/* LAYER 4: FLOATING CYBERSECURITY LOGO */}
                {logoOpacity > 0.005 && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: logoOpacity,
                        zIndex: 15,
                        pointerEvents: logoOpacity > 0.05 ? 'auto' : 'none',
                    }}>
                        <img 
                            src={logoImg} 
                            alt="Hack. Strategize. Observe." 
                            style={{ 
                                width: '64%',
                                height: 'auto',
                                filter: isDark 
                                    ? 'drop-shadow(0 0 10px rgba(75,216,160,0.52)) brightness(1.08)' 
                                    : 'drop-shadow(0 0 8px rgba(13,148,136,0.36))',
                                animation: 'logo-float 4.2s ease-in-out infinite',
                            }} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
});
