import React, { memo } from 'react';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

export default memo(function ProductShell({ leverValue, isDark }) {
    const sep = norm(leverValue, 0.1, 0.56);
    const shellOpacity = 1 - norm(leverValue, 0.0, 0.52);
    const seamGlow = norm(leverValue, 0.1, 0.42) * (1 - norm(leverValue, 0.42, 0.6));

    const topDy = -sep * 26;
    const botDy = sep * 20;
    const leftDx = -sep * 15;
    const rightDx = sep * 15;

    // ── Colors ────────────────────────────────────────────────────────────────
    const shellBody = '#14171e';
    const shellBodyDark = '#0e1015';
    const shellHighlight = 'rgba(255,255,255,0.028)';
    const bevelLight = 'rgba(255,255,255,0.045)';
    const bevelDark = 'rgba(0,0,0,0.45)';
    const bevelMid = 'rgba(255,255,255,0.02)';
    const bezelC = `rgba(75,216,160,${0.34 + shellOpacity * 0.2})`;
    const seamC = `rgba(75,216,160,${seamGlow * 0.82})`;
    const padColor = '#D4A843';
    const silkColor = 'rgba(206,208,206,0.18)';
    const brandColor = 'rgba(206,208,206,0.5)';
    const brandSub = 'rgba(206,208,206,0.2)';
    const screwSlot = 'rgba(255,255,255,0.13)';
    const faderSlot = 'rgba(0,0,0,0.52)';
    const faderBorder = 'rgba(206,208,206,0.09)';
    const faderInner = 'rgba(75,216,160,0.05)';
    const shellEdge = '#262934';
    const ventColor = 'rgba(0,0,0,0.55)';
    const ventBorder = 'rgba(255,255,255,0.025)';
    const rubberColor = '#0a0a0e';
    const rubberEdge = 'rgba(255,255,255,0.04)';
    const speakerHole = 'rgba(0,0,0,0.65)';
    const speakerRim = 'rgba(255,255,255,0.03)';
    const antennaColor = '#1e2128';
    const antennaEdge = 'rgba(255,255,255,0.06)';
    const certColor = 'rgba(206,208,206,0.08)';
    const portLabel = 'rgba(206,208,206,0.12)';
    const gripColor = 'rgba(0,0,0,0.2)';

    // ── Screw helper ──────────────────────────────────────────────────────────
    const screwGroup = (cx, cy, i) => (
        <g key={i}>
            <circle cx={cx} cy={cy} r="4" fill="rgba(0,0,0,0.36)" />
            <circle cx={cx} cy={cy} r="3.4" fill="#0b0b0e" stroke={shellEdge} strokeWidth="0.65" />
            <circle cx={cx - 1.1} cy={cy - 1.1} r="0.6" fill="#fff" opacity="0.2" />
            <line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} stroke={screwSlot} strokeWidth="0.75" />
            <line x1={cx} y1={cy - 2} x2={cx} y2={cy + 2} stroke={screwSlot} strokeWidth="0.75" />
            <circle cx={cx} cy={cy} r="3.4" fill="none" stroke="rgba(255,255,255,0.065)" strokeWidth="0.28" />
        </g>
    );

    // ── Ventilation grille: row of slots ──────────────────────────────────────
    const ventGrille = (x, y, w, count, spacing, key) => (
        <g key={key}>
            {Array.from({ length: count }, (_, i) => (
                <g key={i}>
                    <rect
                        x={x} y={y + i * spacing}
                        width={w} height={spacing * 0.45}
                        rx="0.5"
                        fill={ventColor}
                        stroke={ventBorder}
                        strokeWidth="0.2"
                    />
                    {/* Inner shadow/depth illusion */}
                    <rect
                        x={x + 0.3} y={y + i * spacing + 0.2}
                        width={w - 0.6} height={spacing * 0.45 - 0.4}
                        rx="0.3"
                        fill="rgba(0,0,0,0.3)"
                    />
                </g>
            ))}
        </g>
    );

    // ── Speaker hole grid ─────────────────────────────────────────────────────
    const speakerGrid = (cx, cy, rows, cols, spacing, key) => (
        <g key={key}>
            {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                    const hx = cx + (c - (cols - 1) / 2) * spacing;
                    const hy = cy + (r - (rows - 1) / 2) * spacing;
                    return (
                        <g key={`${r}-${c}`}>
                            <circle cx={hx} cy={hy} r={spacing * 0.28} fill={speakerHole} />
                            <circle cx={hx} cy={hy} r={spacing * 0.28} fill="none" stroke={speakerRim} strokeWidth="0.15" />
                        </g>
                    );
                })
            )}
        </g>
    );

    // ── Rubber foot ───────────────────────────────────────────────────────────
    const rubberFoot = (cx, cy, key) => (
        <g key={key}>
            {/* Shadow */}
            <ellipse cx={cx} cy={cy + 1} rx="4.5" ry="1.6" fill="rgba(0,0,0,0.25)" />
            {/* Foot body */}
            <rect x={cx - 4} y={cy - 1.5} width="8" height="3" rx="1.5" fill={rubberColor} stroke={rubberEdge} strokeWidth="0.4" />
            {/* Grip texture lines */}
            {[-2, 0, 2].map(dx => (
                <line key={dx} x1={cx + dx} y1={cy - 1} x2={cx + dx} y2={cy + 1} stroke={gripColor} strokeWidth="0.4" />
            ))}
        </g>
    );

    return (
        <svg
            viewBox="0 0 200 160"
            style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <filter id="seam-glow-filter">
                    <feGaussianBlur stdDeviation="1.6" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="panel-shadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.38" />
                </filter>
                {/* Brushed metal texture */}
                <pattern id="shell-texture" x="0" y="0" width="200" height="4" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="1" x2="200" y2="1" stroke="rgba(255,255,255,0.008)" strokeWidth="0.5" />
                    <line x1="0" y1="3" x2="200" y2="3" stroke="rgba(0,0,0,0.02)" strokeWidth="0.5" />
                </pattern>
                {/* Grip texture for side panels */}
                <pattern id="grip-dots" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="0.4" fill="rgba(255,255,255,0.015)" />
                </pattern>
            </defs>

            <g filter="url(#panel-shadow)">
                {/* ══════════════════════════════════════════════════════════════
                    TOP PANEL — brand face with antenna, vent, and indicators
                   ═══════════════════════════════════════════════════════════ */}
                <g transform={`translate(0,${topDy})`} opacity={shellOpacity}>
                    {/* Main panel body */}
                    <path d="M5 2 Q5 2 9 2 L191 2 Q195 2 195 6 L195 27 L5 27 Z"
                        fill={shellBody} stroke={bevelLight} strokeWidth="0.5" />
                    {/* Brushed texture overlay */}
                    <path d="M5 2 Q5 2 9 2 L191 2 Q195 2 195 6 L195 27 L5 27 Z"
                        fill="url(#shell-texture)" />
                    {/* Top edge bevel highlight */}
                    <path d="M7 2.5 L193 2.5 Q195 2.5 195 4.5 L195 11 L7 11 Q5 11 5 9 L5 4.5 Q5 2.5 7 2.5"
                        fill={shellHighlight} />
                    {/* Bottom edge bevel shadow */}
                    <line x1="5" y1="27" x2="195" y2="27" stroke={bevelDark} strokeWidth="0.6" />
                    {/* Inner chamfer line */}
                    <line x1="8" y1="25" x2="192" y2="25" stroke={bevelMid} strokeWidth="0.3" />

                    {/* ── Antenna stub (WiFi/BT) ── */}
                    <g>
                        {/* Antenna housing */}
                        <rect x="19" y="4" width="8" height="12" rx="2"
                            fill={antennaColor} stroke={antennaEdge} strokeWidth="0.5" />
                        {/* Antenna stripe */}
                        <rect x="19" y="4" width="8" height="2.5" rx="2"
                            fill="rgba(255,255,255,0.015)" />
                        {/* Antenna signal icon */}
                        <g transform="translate(23,10)" stroke="rgba(75,216,160,0.35)" fill="none" strokeWidth="0.5" strokeLinecap="round">
                            <path d="M-2 1 A3 3 0 0 1 2 1" />
                            <path d="M-3.5 2.5 A5 5 0 0 1 3.5 2.5" opacity="0.5" />
                            <circle cx="0" cy="0" r="0.8" fill="rgba(75,216,160,0.4)" stroke="none" />
                        </g>
                        <text x="23" y="19" textAnchor="middle"
                            fontFamily="JetBrains Mono,monospace" fontSize="1.5"
                            fill={portLabel}>ANT</text>
                    </g>

                    {/* ── Top vent grille (heat exhaust) ── */}
                    {ventGrille(55, 5, 18, 5, 3.2, 'top-vent')}

                    {/* Brand text */}
                    <text x="112" y="13.5" textAnchor="middle"
                        fontFamily="Syne,sans-serif" fontSize="5" fontWeight="700"
                        fill={brandColor} letterSpacing="0.26">
                        SILICON SOUL
                    </text>
                    <text x="112" y="22" textAnchor="middle"
                        fontFamily="JetBrains Mono,monospace" fontSize="2.2"
                        fill={brandSub} letterSpacing="0.16">
                        v2.0 — KILAVI MUSYOKI
                    </text>

                    {/* Power indicator LED (top-right) */}
                    <circle cx="180" cy="8" r="1.5" fill="#4BD8A0" opacity="0.75"
                        style={{ animation: 'led-green-pulse 2.2s ease-in-out infinite' }} />
                    <text x="180" y="14" textAnchor="middle"
                        fontFamily="JetBrains Mono,monospace" fontSize="1.4"
                        fill={portLabel}>PWR</text>

                    {/* Microphone hole */}
                    <circle cx="178" cy="22" r="1.2" fill="rgba(0,0,0,0.6)" stroke={bevelLight} strokeWidth="0.2" />
                    <circle cx="178" cy="22" r="0.4" fill="rgba(0,0,0,0.8)" />
                    <text x="173" y="23" textAnchor="end"
                        fontFamily="JetBrains Mono,monospace" fontSize="1.4"
                        fill={portLabel}>MIC</text>

                    {/* Decorative notch indicators */}
                    <circle cx="11" cy="11" r="1.8" fill={shellEdge} />
                    <circle cx="189" cy="11" r="1.8" fill={shellEdge} />

                    {/* Screws */}
                    {[[14, 14], [186, 14]].map(([cx, cy], i) => screwGroup(cx, cy, i))}
                </g>

                {/* ══════════════════════════════════════════════════════════════
                    BOTTOM PANEL — USB-C, LEDs, speaker, rubber feet, certs
                   ═══════════════════════════════════════════════════════════ */}
                <g transform={`translate(0,${botDy})`} opacity={shellOpacity * 0.95}>
                    {/* Main panel body */}
                    <path d="M5 127 L195 127 L195 154 Q195 158 191 158 L9 158 Q5 158 5 154 Z"
                        fill={shellBody} stroke={bevelLight} strokeWidth="0.5" />
                    {/* Brushed texture */}
                    <path d="M5 127 L195 127 L195 154 Q195 158 191 158 L9 158 Q5 158 5 154 Z"
                        fill="url(#shell-texture)" />
                    {/* Top edge highlight */}
                    <path d="M5 127 L195 127 L195 129 L5 129 Z" fill={shellHighlight} />
                    {/* Bottom edge shadow */}
                    <path d="M5 156 L195 156" stroke={bevelDark} strokeWidth="0.75" />
                    {/* Inner chamfer */}
                    <line x1="8" y1="129" x2="192" y2="129" stroke={bevelMid} strokeWidth="0.3" />

                    {/* ── USB-C port ── */}
                    <g>
                        {/* Port recess */}
                        <rect x="82" y="147.5" width="36" height="8.5" rx="2.5"
                            fill={shellBodyDark} stroke="rgba(255,255,255,0.03)" strokeWidth="0.4" />
                        {/* Port body */}
                        <rect x="84" y="148" width="32" height="7.5" rx="2" fill="#080808" stroke={padColor} strokeWidth="0.58" />
                        {/* Inner connector */}
                        <rect x="88" y="149.5" width="24" height="4" rx="1" fill="#040404" />
                        {/* Contact pins */}
                        {[91, 94, 97, 100, 103, 106, 109].map((px, i) => (
                            <rect key={`upin-${i}`} x={px} y="150.2" width="1.5" height="2.4" rx=".2"
                                fill={padColor} opacity="0.4" />
                        ))}
                        <text x="100" y="154" textAnchor="middle"
                            fontFamily="JetBrains Mono,monospace" fontSize="2.3" fill={padColor}>
                            USB-C
                        </text>
                    </g>

                    {/* ── Serial number strip ── */}
                    <text x="100" y="134" textAnchor="middle"
                        fontFamily="JetBrains Mono,monospace" fontSize="2.1"
                        fill="rgba(206,208,206,0.15)" letterSpacing="0.1">
                        SN-2024-KM-PORTFOLIO-REV2
                    </text>

                    {/* ── Status LEDs ── */}
                    <g>
                        <circle cx="144" cy="144" r="2.2" fill="#4BD8A0" opacity="0.88"
                            style={{ animation: 'led-green-pulse 2.2s ease-in-out infinite' }} />
                        {/* LED lens highlight */}
                        <ellipse cx="143" cy="143" rx="0.7" ry="0.5" fill="rgba(255,255,255,0.15)" />
                        <circle cx="151" cy="144" r="2.2" fill="#FF5A3C" opacity="0.8"
                            style={{ animation: 'blink-slow 1.9s ease-in-out infinite' }} />
                        <ellipse cx="150" cy="143" rx="0.7" ry="0.5" fill="rgba(255,255,255,0.12)" />
                        <text x="147.5" y="156" textAnchor="middle"
                            fontFamily="JetBrains Mono,monospace" fontSize="1.8" fill={silkColor}>
                            STATUS
                        </text>
                    </g>

                    {/* ── Speaker grille (left of USB) ── */}
                    {speakerGrid(35, 143, 3, 5, 2.8, 'spk-l')}
                    <text x="35" y="155" textAnchor="middle"
                        fontFamily="JetBrains Mono,monospace" fontSize="1.4" fill={portLabel}>SPKR</text>

                    {/* ── Bottom vent grille (right side) ── */}
                    {ventGrille(158, 131, 14, 4, 3.5, 'bot-vent')}

                    {/* ── Rubber feet (4 corners) ── */}
                    {rubberFoot(14, 157, 'rf-bl')}
                    {rubberFoot(186, 157, 'rf-br')}

                    {/* ── Certification marks ── */}
                    <g>
                        {/* CE mark */}
                        <text x="56" y="152" fontFamily="sans-serif" fontSize="4.5"
                            fill={certColor} fontWeight="bold" letterSpacing="-0.3">CE</text>
                        {/* FCC mark */}
                        <text x="66" y="152" fontFamily="sans-serif" fontSize="3.2"
                            fill={certColor} letterSpacing="0.05">FCC</text>
                        {/* RoHS */}
                        <g transform="translate(77,147)">
                            <circle cx="2.5" cy="2.5" r="2.5" fill="none" stroke={certColor} strokeWidth="0.3" />
                            <text x="2.5" y="3.5" textAnchor="middle" fontFamily="sans-serif"
                                fontSize="1.8" fill={certColor} fontWeight="bold">Pb</text>
                            <line x1="0.5" y1="4.5" x2="4.5" y2="0.5" stroke={certColor} strokeWidth="0.3" />
                        </g>
                    </g>

                    {/* Screws */}
                    {[[14, 151], [186, 151]].map(([cx, cy], i) => screwGroup(cx, cy, i))}
                </g>

                {/* ══════════════════════════════════════════════════════════════
                    LEFT PANEL — ventilation, grip texture, port cutouts
                   ═══════════════════════════════════════════════════════════ */}
                <g transform={`translate(${leftDx},0)`} opacity={shellOpacity * 0.9}>
                    {/* Panel body — slimmed to 24px */}
                    <rect x="2" y="26" width="24" height="102" fill={shellBody} stroke={bevelLight} strokeWidth="0.5" />
                    <rect x="2" y="26" width="24" height="102" fill="url(#shell-texture)" />
                    <line x1="2" y1="26" x2="2" y2="128" stroke={bevelLight} strokeWidth="0.9" />
                    <line x1="26" y1="26" x2="26" y2="128" stroke={bevelDark} strokeWidth="0.4" />
                    <line x1="4" y1="26" x2="4" y2="128" stroke={bevelMid} strokeWidth="0.2" />

                    {/* ── Ventilation grille ── */}
                    {ventGrille(6, 48, 14, 6, 4.2, 'left-vent')}
                    <rect x="4" y="46" width="18" height="28" rx="1"
                        fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.4" />

                    {/* ── Grip texture ── */}
                    <rect x="4" y="28" width="18" height="10" rx="1" fill="url(#grip-dots)" />
                    {[0, 1, 2, 3].map(i => (
                        <line key={`gl-${i}`} x1="5" y1={29.5 + i * 2.2} x2="21" y2={29.5 + i * 2.2}
                            stroke="rgba(255,255,255,0.012)" strokeWidth="0.6" />
                    ))}

                    {/* ── Reset button ── */}
                    <g>
                        <circle cx="13" cy="108" r="2" fill={shellBodyDark} stroke={shellEdge} strokeWidth="0.35" />
                        <circle cx="13" cy="108" r="1" fill="rgba(0,0,0,0.6)" />
                        <circle cx="13" cy="108" r="0.6" fill="rgba(60,60,60,0.8)" />
                        <text x="13" y="113" textAnchor="middle"
                            fontFamily="JetBrains Mono,monospace" fontSize="1.4" fill={portLabel}>RST</text>
                    </g>

                    {[0, 1].map(i => (
                        <line key={`ldiv-${i}`} x1="4" y1={42 + i * 46} x2="23" y2={42 + i * 46}
                            stroke={shellEdge} strokeWidth="0.35" />
                    ))}

                    {[[12, 33], [12, 121]].map(([cx, cy], i) => screwGroup(cx, cy, i))}
                </g>

                {/* ══════════════════════════════════════════════════════════════
                    RIGHT PANEL — fader slot, vents, I/O labels
                   ═══════════════════════════════════════════════════════════ */}
                <g transform={`translate(${rightDx},0)`} opacity={shellOpacity * 0.9}>
                    {/* Panel body — slimmed to 24px, starts at x:174 */}
                    <rect x="174" y="26" width="24" height="102" fill={shellBody} stroke={bevelLight} strokeWidth="0.5" />
                    <rect x="174" y="26" width="24" height="102" fill="url(#shell-texture)" />
                    <line x1="197" y1="26" x2="197" y2="128" stroke={bevelDark} strokeWidth="0.9" />
                    <line x1="174" y1="26" x2="174" y2="128" stroke={bevelLight} strokeWidth="0.3" />

                    {/* ── Fader slot channel ── */}
                    <g>
                        <rect x="186" y="30" width="9" height="92" rx="4.5"
                            fill="rgba(0,0,0,0.15)" />
                        <rect x="187" y="32" width="8" height="88" rx="4"
                            fill={faderSlot} stroke={faderBorder} strokeWidth="0.65" />
                        <rect x="187.5" y="32.5" width="7" height="87" rx="3.5"
                            fill="none" stroke="rgba(0,0,0,.75)" strokeWidth="0.75" />
                        <rect x="189" y="35" width="3" height="82" rx="1.5" fill={faderInner} />
                        {[0, 1, 2, 3, 4].map(i => (
                            <g key={`notch-${i}`}>
                                <line x1="184" y1={42 + i * 16} x2="186" y2={42 + i * 16}
                                    stroke="rgba(206,208,206,0.08)" strokeWidth="0.4" />
                                <line x1="195" y1={42 + i * 16} x2="197" y2={42 + i * 16}
                                    stroke="rgba(206,208,206,0.08)" strokeWidth="0.4" />
                            </g>
                        ))}
                        <text x="183" y="79" textAnchor="middle"
                            fontFamily="JetBrains Mono,monospace" fontSize="1.6"
                            fill="rgba(206,208,206,0.16)"
                            transform="rotate(-90,183,79)">
                            LAYER CTRL
                        </text>
                        <text x="191" y="30" textAnchor="middle"
                            fontFamily="JetBrains Mono,monospace" fontSize="1.4"
                            fill={portLabel}>SYS</text>
                        <text x="191" y="126" textAnchor="middle"
                            fontFamily="JetBrains Mono,monospace" fontSize="1.4"
                            fill={portLabel}>SIG</text>
                    </g>

                    {/* ── Vent grilles ── */}
                    {ventGrille(176, 40, 8, 3, 3.6, 'right-vent-top')}
                    {ventGrille(176, 102, 8, 4, 3.6, 'right-vent-bot')}

                    {[[185, 33], [185, 121]].map(([cx, cy], i) => screwGroup(cx, cy, i))}
                </g>
            </g>

            {/* ══════════════════════════════════════════════════════════════
                SEAM GLOW — reveals during panel separation
               ═══════════════════════════════════════════════════════════ */}
            {seamGlow > 0.04 && (
                <g filter="url(#seam-glow-filter)">
                    <line x1="5" y1="27" x2="195" y2="27" stroke={seamC} strokeWidth="0.85" />
                    <line x1="5" y1="127" x2="195" y2="127" stroke={seamC} strokeWidth="0.85" />
                    <line x1="26" y1="27" x2="26" y2="127" stroke={seamC} strokeWidth="0.55" opacity="0.62" />
                    <line x1="174" y1="27" x2="174" y2="127" stroke={seamC} strokeWidth="0.55" opacity="0.62" />
                </g>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SCREEN BEZEL FRAME — layered bevels for depth
               ═══════════════════════════════════════════════════════════ */}
            {/* Outer bezel shadow — widened to match slimmer panels */}
            <rect x="23.5" y="24.5" width="153" height="105" rx="4"
                fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1"
                opacity={shellOpacity} />
            {/* Main bezel ring */}
            <rect x="24" y="25" width="152" height="104" rx="3.5"
                fill="none" stroke={bezelC} strokeWidth="1.4"
                style={{ transition: 'stroke 0.3s' }} />
            {/* Inner bezel shadow (depth illusion) */}
            <rect x="25" y="26" width="150" height="102" rx="2.5"
                fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" opacity={shellOpacity} />
            {/* Top bezel reflection */}
            <rect x="25.5" y="26.5" width="149" height="13" rx="2.5"
                fill={shellHighlight} opacity={shellOpacity} />
            {/* Bottom bezel darker edge */}
            <line x1="26" y1="128.5" x2="174" y2="128.5"
                stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" opacity={shellOpacity} />

            {/* Device outer glow ring */}
            <rect x="2" y="2" width="196" height="156" rx="6"
                fill="none"
                stroke={isDark ? 'rgba(206,208,206,0.065)' : 'rgba(104,112,120,0.075)'}
                strokeWidth="1"
                opacity={shellOpacity} />
        </svg>
    );
});
