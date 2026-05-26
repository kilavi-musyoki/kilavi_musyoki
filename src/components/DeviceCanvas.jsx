import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import PCBBoard from './Board.jsx';
import ProductShell from './ProductShell.jsx';
import AvatarDisplay from './AvatarDisplay.jsx';
import LayerLabel from './LayerLabel.jsx';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

// Zone boundaries where transitions happen
const ZONE_EDGES = [0.22, 0.44, 0.62, 0.80];

const leverToLayer = (lv) => {
    if (lv < 0.22) return 'pcb';
    if (lv < 0.44) return 'traces';
    if (lv < 0.62) return 'components';
    if (lv < 0.80) return 'system';
    return 'routes';
};

// ── Particle system ──────────────────────────────────────────────────────────
const MAX_PARTICLES = 60;

function createParticle(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.025,
        size: 1.2 + Math.random() * 2.8,
        color,
        trail: Math.random() > 0.5,
    };
}

function emitBurst(particles, count, cx, cy, color) {
    for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        // Scatter around center with some spread
        const px = cx + (Math.random() - 0.5) * 80;
        const py = cy + (Math.random() - 0.5) * 30;
        particles.push(createParticle(px, py, color));
    }
}

function updateParticles(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.vx *= 0.985; // drag
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles(ctx, particles, w, h) {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
        const alpha = p.life * 0.85;

        // Faux Glow - outer soft circle (extremely fast, zero shadowBlur CPU overhead)
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.28;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Core - inner solid circle
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();

        // Trail line
        if (p.trail && p.life > 0.3) {
            ctx.globalAlpha = alpha * 0.4;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
}

// ── Noise/static texture generator ───────────────────────────────────────────
function drawNoise(ctx, w, h, intensity, buffer) {
    if (intensity < 0.01) return;
    const imageData = buffer || ctx.createImageData(w, h);
    const data = imageData.data;
    const step = Math.max(1, Math.floor(4 / intensity)); // skip pixels for perf
    for (let i = 0; i < data.length; i += 4 * step) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = Math.floor(intensity * 60 * Math.random());
    }
    ctx.putImageData(imageData, 0, 0);
}

// ── Helper: fire real keyboard events so TetrusGame's window listeners respond ─
const _kd = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const _ku = (key) => window.dispatchEvent(new KeyboardEvent('keyup',   { key, bubbles: true, cancelable: true }));

// ── Shared button press/release with 3-D visual feedback ──────────────────────
function btnDown(key, el) {
    const gs = window.__tetrusGameState || 'menu';
    if (gs === 'menu' || gs === 'gameover' || gs === 'paused') _kd('Enter');
    _kd(key);
    if (el) { el.style.transform = 'translateY(2px) scale(0.93)'; el.style.filter = 'brightness(1.5)'; el.style.boxShadow = el.dataset.ps || 'none'; }
}
function btnUp(key, el) {
    _ku(key);
    if (el) { el.style.transform = ''; el.style.filter = ''; el.style.boxShadow = el.dataset.ns || ''; }
}

// Casing occupies SVG x:108-174, y:26-128 within viewBox 200×160
// As % of device container: left:54%, top:16.25%, width:33%, height:63.75%
const CASING = { left: '54%', top: '16.25%', width: '33%', height: '63.75%' };

function Btn({ gameKey, children, style: s, ns, ps, elRef }) {
    const ref = React.useRef(null);
    const setRef = (el) => { ref.current = el; if (elRef) elRef.current = el; };
    return (
        <div
            ref={setRef}
            data-ns={ns} data-ps={ps} data-tetrus-btn="true"
            onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); btnDown(gameKey, ref.current); }}
            onPointerUp={(e)   => { e.preventDefault(); e.currentTarget.releasePointerCapture(e.pointerId); btnUp(gameKey, ref.current); }}
            onPointerLeave={()  => btnUp(gameKey, ref.current)}
            onPointerCancel={()=> btnUp(gameKey, ref.current)}
            style={{
                position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', userSelect: 'none', touchAction: 'none', pointerEvents: 'auto',
                WebkitTapHighlightColor: 'transparent', transition: 'filter 0.05s',
                boxShadow: ns, ...s,
            }}
        >{children}</div>
    );
}

const dpadBase = {
    background: 'linear-gradient(145deg, #1e2d22, #0d1612)',
    border: '1.5px solid #2d5a42',
    color: '#4BD8A0', fontSize: 'clamp(7px,1.8vw,13px)', fontWeight: 'bold',
};
const dNS = '0 3px 0 #040d05, 0 0 7px rgba(75,216,160,0.18)';
const dPS = 'inset 0 2px 5px rgba(0,0,0,0.55), 0 1px 0 #040d05';

function CasingControls() {
    return (
        <div style={{
            position: 'absolute', zIndex: 5, pointerEvents: 'none',
            left: CASING.left, top: CASING.top,
            width: CASING.width, height: CASING.height,
        }}>
            {/* PAUSE — top center, maps to SVG translate(156,42) ≈ 36%,24% of casing */}
            <Btn gameKey="Enter" ns="0 2px 0 #3a2800, 0 0 8px rgba(212,168,67,0.25)" ps="inset 0 2px 4px rgba(0,0,0,0.5),0 1px 0 #3a2800"
                style={{ top:'4%', left:'10%', width:'80%', height:'10%', borderRadius:'999px', background:'linear-gradient(145deg,#2a1e00,#181200)', border:'1.5px solid #D4A843', color:'#D4A843', fontSize:'clamp(4px,1vw,9px)', fontFamily:'"Press Start 2P",monospace', letterSpacing:'0.08em' }}>
                ⏸ PAUSE
            </Btn>

            {/* D-pad UP — maps to SVG (126,60) ≈ center-27% of casing */}
            <Btn gameKey="x" ns={dNS} ps={dPS}
                style={{ ...dpadBase, top:'24%', left:'28%', width:'24%', height:'13%', borderRadius:'5px 5px 2px 2px' }}>▲</Btn>
            {/* D-pad LEFT */}
            <Btn gameKey="ArrowLeft" ns={dNS} ps={dPS}
                style={{ ...dpadBase, top:'38%', left:'6%', width:'24%', height:'13%', borderRadius:'5px 2px 2px 5px' }}>◀</Btn>
            {/* D-pad center hub (non-interactive) */}
            <div style={{ position:'absolute', top:'38%', left:'30%', width:'20%', height:'13%', background:'#0d1612', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#1a3020', border:'1px solid #2d5a42' }} />
            </div>
            {/* D-pad RIGHT */}
            <Btn gameKey="ArrowRight" ns={dNS} ps={dPS}
                style={{ ...dpadBase, top:'38%', left:'50%', width:'24%', height:'13%', borderRadius:'2px 5px 5px 2px' }}>▶</Btn>
            {/* D-pad DOWN */}
            <Btn gameKey="ArrowDown" ns={dNS} ps={dPS}
                style={{ ...dpadBase, top:'52%', left:'28%', width:'24%', height:'13%', borderRadius:'2px 2px 5px 5px' }}>▼</Btn>

            {/* ROT-CW — green circle, right side */}
            <Btn gameKey="x" ns="0 3px 0 #040d05,0 0 9px rgba(75,216,160,0.22)" ps="inset 0 2px 5px rgba(0,0,0,0.55),0 1px 0 #040d05"
                style={{ top:'26%', right:'2%', width:'22%', height:'12%', borderRadius:'50%', background:'radial-gradient(ellipse at 35% 30%,rgba(75,216,160,0.18),#0a1410)', border:'1.5px solid #4BD8A0', color:'#4BD8A0', fontSize:'clamp(9px,2vw,15px)', fontWeight:'bold' }}>↻</Btn>

            {/* ROT-CCW — cyan circle */}
            <Btn gameKey="z" ns="0 3px 0 #040d05,0 0 9px rgba(111,212,255,0.22)" ps="inset 0 2px 5px rgba(0,0,0,0.55),0 1px 0 #040d05"
                style={{ top:'40%', right:'2%', width:'22%', height:'12%', borderRadius:'50%', background:'radial-gradient(ellipse at 35% 30%,rgba(111,212,255,0.18),#0a1410)', border:'1.5px solid #6FD4FF', color:'#6FD4FF', fontSize:'clamp(9px,2vw,15px)', fontWeight:'bold' }}>↺</Btn>

            {/* HARD DROP — large magenta bar at bottom */}
            <Btn gameKey=" " ns="0 3px 0 #1a0030,0 0 12px rgba(224,64,251,0.22)" ps="inset 0 2px 6px rgba(0,0,0,0.6),0 1px 0 #1a0030"
                style={{ top:'74%', left:'6%', width:'88%', height:'11%', borderRadius:'7px', background:'linear-gradient(145deg,#2a0840,#150420)', border:'1.5px solid #E040FB', color:'#E040FB', fontSize:'clamp(4px,1vw,9px)', fontFamily:'"Press Start 2P",monospace', letterSpacing:'0.06em' }}>⬇ DROP</Btn>
        </div>
    );
}

export default memo(function DeviceCanvas({ leverValue, isDark, mousePosRef, glitch = false }) {

    const [smoothLever, setSmoothLever] = useState(leverValue);
    const [zoneFlash, setZoneFlash] = useState(0);
    const [scanDistort, setScanDistort] = useState(0);

    const tvRef = useRef(leverValue);
    const rafRef = useRef(null);
    const containerRef = useRef(null);
    const beamRef = useRef(null);
    const canvasRef = useRef(null);
    const noiseRef = useRef(null);
    const particlesRef = useRef([]);
    const prevZoneRef = useRef(leverToLayer(leverValue));
    const prevLeverRef = useRef(leverValue);
    const velocityRef = useRef(0);
    const flashDecayRef = useRef(0);
    const distortPhaseRef = useRef(0);
    const noiseDataRef = useRef(null);

    useEffect(() => { tvRef.current = leverValue; }, [leverValue]);

    // ── Detect zone crossings → emit particles + flash ───────────────────────
    useEffect(() => {
        const newZone = leverToLayer(leverValue);
        if (newZone !== prevZoneRef.current) {
            prevZoneRef.current = newZone;
            // Flash
            setZoneFlash(1);
            flashDecayRef.current = 1;
            // Distortion burst
            distortPhaseRef.current = 1;

            // Emit particle burst from center
            const canvas = canvasRef.current;
            if (canvas) {
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const color = isDark ? '#4BD8A0' : '#0D9488';
                emitBurst(particlesRef.current, 18, cx, cy, color);
                // Secondary burst with accent color
                const color2 = isDark ? '#6FD4FF' : '#D4A843';
                emitBurst(particlesRef.current, 8, cx, cy, color2);
            }
        }
        prevLeverRef.current = leverValue;
    }, [leverValue, isDark]);

    // ── Master animation loop ────────────────────────────────────────────────
    useEffect(() => {
        const loop = () => {
            const target = tvRef.current;

            setSmoothLever(prev => {
                const next = lerp(prev, target, 0.75);
                return Math.abs(next - target) < 0.001 ? target : next;
            });

            // Velocity tracking (direct ref, no state)
            velocityRef.current = Math.abs(target - prevLeverRef.current);

            // Flash decay
            if (flashDecayRef.current > 0) {
                flashDecayRef.current = Math.max(0, flashDecayRef.current - 0.04);
                setZoneFlash(flashDecayRef.current);
            }

            // Distortion decay
            if (distortPhaseRef.current > 0) {
                distortPhaseRef.current = Math.max(0, distortPhaseRef.current - 0.025);
                setScanDistort(distortPhaseRef.current);
            }

            // Mouse tilt (disabled tilt per user request)
            if (mousePosRef && mousePosRef.current) {
                const mp = mousePosRef.current;
                const tiltX = 0; // (mp.y - 0.5) * -18;
                const tiltY = 0; // (mp.x - 0.5) * 18;
                const beamX = (mp.x - 0.5) * 38;
                const beamY = (mp.y - 0.5) * 18;

                if (containerRef.current) {
                    containerRef.current.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
                }
                if (beamRef.current) {
                    beamRef.current.style.bottom = `${-42 + beamY}px`;
                    beamRef.current.style.left = `calc(50% + ${beamX}px)`;
                }
            }

            // Update & draw particles
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                updateParticles(particlesRef.current);

                // Continuous micro-sparks during fast movement
                const vel = velocityRef.current;
                if (vel > 0.004) {
                    const count = Math.min(3, Math.floor(vel * 120));
                    const cx = canvas.width / 2;
                    const cy = canvas.height / 2;
                    const color = isDark ? 'rgba(75,216,160,0.8)' : 'rgba(13,148,136,0.8)';
                    for (let i = 0; i < count; i++) {
                        if (particlesRef.current.length < MAX_PARTICLES) {
                            const px = cx + (Math.random() - 0.5) * canvas.width * 0.6;
                            const py = cy + (Math.random() - 0.5) * canvas.height * 0.4;
                            particlesRef.current.push(createParticle(px, py, color));
                        }
                    }
                }

                drawParticles(ctx, particlesRef.current, canvas.width, canvas.height);
            }

            // Draw noise/static during movement (highly optimized offscreen imageData buffer)
            const noiseCanvas = noiseRef.current;
            if (noiseCanvas) {
                const nctx = noiseCanvas.getContext('2d');
                const noiseIntensity = clamp(velocityRef.current * 18 + distortPhaseRef.current * 0.3, 0, 1);
                if (noiseIntensity > 0.01) {
                    const nw = noiseCanvas.width;
                    const nh = noiseCanvas.height;
                    if (!noiseDataRef.current || noiseDataRef.current.width !== nw || noiseDataRef.current.height !== nh) {
                        noiseDataRef.current = nctx.createImageData(nw, nh);
                    }
                    drawNoise(nctx, nw, nh, noiseIntensity, noiseDataRef.current);
                } else {
                    nctx.clearRect(0, 0, noiseCanvas.width, noiseCanvas.height);
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [mousePosRef, isDark]);

    // ── Derived values ────────────────────────────────────────────────────────
    const pcbFadeIn  = norm(smoothLever, 0.22, 0.55);
    const pcbFadeOut = 1 - norm(smoothLever, 0.74, 0.88);
    const pcbOpacity = pcbFadeIn * pcbFadeOut;
    const shellVisible = smoothLever < 0.58;
    const boardLayer = leverToLayer(leverValue);

    const velocity = Math.abs(leverValue - smoothLever);
    const chromAb = velocity * 55;

    const shadowFade = Math.max(0, Math.min(1, (smoothLever - 0.45) / 0.15));
    const shadowAlpha = 1 - shadowFade;

    const beamColor = isDark ? 'rgba(0,255,136,0.18)' : 'rgba(13,148,136,0.14)';
    const accentRgb = isDark ? '75,216,160' : '13,148,136';
    const screenShadow = `
        0 0 22px rgba(75,216,160,${Math.max(0, 0.16 + (1 - smoothLever) * 0.18 - shadowFade)}),
        inset 0 0 12px rgba(0,0,0,${0.82 * shadowAlpha}),
        inset 0 0 36px rgba(0,0,0,${0.58 * shadowAlpha})
    `;

    // Zone-crossing flash overlay intensity
    const flashAlpha = zoneFlash * 0.22;

    // Scan distortion — horizontal lines offset during transition
    const distortLines = scanDistort > 0.05;

    // Enhanced chromatic aberration with both horizontal and vertical offsets
    const chromFilter = chromAb > 0.05
        ? `drop-shadow(${chromAb}px 0 0 rgba(255,0,0,0.28)) drop-shadow(-${chromAb}px 0 0 rgba(0,255,255,0.28)) drop-shadow(0 ${chromAb * 0.5}px 0 rgba(0,255,0,0.14))`
        : 'none';

    return (
        <div
            ref={containerRef}
            className={glitch ? 'glitch-flash' : ''}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '200 / 160',
                animation: 'levitate 4s ease-in-out infinite',
                transform: `perspective(900px) rotateX(0deg) rotateY(0deg)`,
                transition: 'transform 0.06s linear',
                willChange: 'transform',
            }}
        >
            {/* Tractor beam glow */}
            <div
                ref={beamRef}
                style={{
                position: 'absolute',
                bottom: '-42px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '150px', height: '52px',
                background: `radial-gradient(ellipse at top, ${beamColor} 0%, transparent 70%)`,
                pointerEvents: 'none', zIndex: 0,
            }} />

            {/* LAYER 1: PCB Board */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                opacity: pcbOpacity,
            }}>
                <PCBBoard layer={boardLayer} isDark={isDark} />
            </div>

            {/* LAYER 2: Avatar Display — expanded screen area (with optimized chromatic aberration filter) */}
            <div style={{
                position: 'absolute',
                left: '12%',
                top: '10%',
                width: '76%',
                height: '80%',
                zIndex: 3,
                borderRadius: shadowAlpha > 0.05 ? '3px' : '0px',
                overflow: shadowAlpha > 0.05 ? 'hidden' : 'visible',
                boxShadow: shadowAlpha > 0.02 ? screenShadow : 'none',
                filter: chromFilter,
            }}>

                {/* Glass reflection — fades with shadow */}
                {shadowAlpha > 0.05 && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
                        background: `linear-gradient(135deg, rgba(255,255,255,${0.055 * shadowAlpha}) 0%, rgba(255,255,255,0) 45%)`,
                    }} />
                )}

                {/* Scan distortion lines — appear during zone transitions */}
                {distortLines && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 22, pointerEvents: 'none',
                        overflow: 'hidden',
                    }}>
                        {[0.15, 0.35, 0.55, 0.72, 0.88].map((yPct, i) => {
                            const offset = Math.sin(scanDistort * 12 + i * 2.1) * scanDistort * 12;
                            const height = 1.5 + scanDistort * 3;
                            return (
                                <div key={i} style={{
                                    position: 'absolute',
                                    top: `${yPct * 100}%`,
                                    left: `${offset}px`,
                                    right: `${-offset}px`,
                                    height: `${height}px`,
                                    background: `rgba(${accentRgb},${scanDistort * 0.25})`,
                                    transform: `translateX(${offset}px)`,
                                    mixBlendMode: 'screen',
                                }} />
                            );
                        })}
                    </div>
                )}

                <AvatarDisplay leverValue={smoothLever} mousePosRef={mousePosRef} isDark={isDark} />
            </div>

            {/* LAYER 3: Product Shell */}
            {shellVisible && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
                    <ProductShell leverValue={smoothLever} isDark={isDark} />
                </div>
            )}

            {/* LAYER 3b: Interactive game controls — z-index 5, above ProductShell */}
            {shellVisible && (
                <CasingControls />
            )}


            {/* LAYER 4: Particle canvas — sparks & discharge effects */}
            <canvas
                ref={canvasRef}
                width={400}
                height={320}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                    pointerEvents: 'none',
                }}
            />

            {/* LAYER 5: Noise/static overlay — appears during fast movement */}
            <canvas
                ref={noiseRef}
                width={120}
                height={96}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 11,
                    pointerEvents: 'none',
                    opacity: 0.35,
                    mixBlendMode: 'screen',
                    imageRendering: 'pixelated',
                }}
            />

            {/* LAYER 6: Zone transition flash — brief pulse of light */}
            {flashAlpha > 0.005 && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 12,
                    pointerEvents: 'none',
                    background: `radial-gradient(ellipse at center, rgba(${accentRgb},${flashAlpha}) 0%, transparent 65%)`,
                    transition: 'opacity 0.05s',
                }} />
            )}

            {/* LAYER 7: Edge energy glow — pulses during transition */}
            {scanDistort > 0.1 && (
                <div style={{
                    position: 'absolute',
                    inset: '-2px',
                    zIndex: 13,
                    pointerEvents: 'none',
                    borderRadius: '8px',
                    boxShadow: `
                        0 0 ${scanDistort * 20}px rgba(${accentRgb},${scanDistort * 0.3}),
                        inset 0 0 ${scanDistort * 15}px rgba(${accentRgb},${scanDistort * 0.15})
                    `,
                }} />
            )}

            {/* HUD layer label */}
            <LayerLabel leverValue={smoothLever} isDark={isDark} />
        </div>
    );
});
