import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAnimate, AnimatePresence, motion } from 'framer-motion';

// ── Speech lines ───────────────────────────────────────────────────────────────
const MESSAGES = [
    'M-Pesa API ✓',
    'Deploy done!',
    'ESP32 alive!',
    'Daraja 🔥',
    '5G ready!',
    'npm run dev',
    'All green ✓',
    'git push 🚀',
];

// ── CSS keyframes ─────────────────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes ic-antenna    { 0%,100%{transform:scale(1);opacity:1}    50%{transform:scale(1.7);opacity:.15} }
@keyframes ic-blink      { 0%,86%,100%{transform:scaleY(1)}         90%{transform:scaleY(.07)}             }
@keyframes ic-leg-l      { 0%{transform:rotate(-33deg)} 50%{transform:rotate(33deg)}  100%{transform:rotate(-33deg)} }
@keyframes ic-leg-r      { 0%{transform:rotate(33deg)}  50%{transform:rotate(-33deg)} 100%{transform:rotate(33deg)}  }
@keyframes ic-arm-l      { 0%{transform:rotate(30deg)}  50%{transform:rotate(-30deg)} 100%{transform:rotate(30deg)}  }
@keyframes ic-arm-r      { 0%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)}  100%{transform:rotate(-30deg)} }
@keyframes ic-device     { 0%,100%{opacity:.45} 50%{opacity:1} }
@keyframes ic-wifi-1     { 0%,100%{opacity:.12} 25%{opacity:.9} }
@keyframes ic-wifi-2     { 0%{opacity:.12} 50%{opacity:.9} }
@keyframes ic-wifi-3     { 0%,100%{opacity:.12} 75%{opacity:.9} }
@keyframes ic-led        { 0%,100%{opacity:.8}  50%{opacity:.15} }
@keyframes ic-visor-scan { 0%,100%{transform:translateY(0px);opacity:0} 50%{transform:translateY(4px);opacity:.85} }
@keyframes ic-dust-a     { 0%{transform:scale(0);opacity:.7} 100%{transform:scale(1.7) translate(-9px,5px);opacity:0} }
@keyframes ic-dust-b     { 0%{transform:scale(0);opacity:.5} 100%{transform:scale(1.3) translate(7px,6px);opacity:0}  }
@keyframes ic-wrench     { 0%{transform:rotate(-18deg)} 50%{transform:rotate(18deg)} 100%{transform:rotate(-18deg)} }
@keyframes ic-fw-pop     { 0%{transform:scale(0) rotate(0deg);opacity:1} 60%{opacity:1} 100%{transform:scale(1) rotate(var(--fw-r));opacity:0} }
@keyframes ic-fw-trail   { 0%{opacity:.9;transform:scaleY(1)} 100%{opacity:0;transform:scaleY(0)} }
`;

// ── Fireworks launcher — pure DOM, multi-burst full screen ────────────────────
const launchFireworks = (originX, originY, palette) => {
    const container = document.createElement('div');
    container.style.cssText = [
        'position:fixed',
        'inset:0',
        'pointer-events:none',
        'z-index:999999',
        'overflow:hidden',
    ].join(';');
    document.body.appendChild(container);

    const SHAPES = ['●', '★', '✦', '◆', '✸', '✺', '❋', '⬟'];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Helper: spawn single burst of sparks + ring
    const createBurst = (bx, by, count, maxDist, delayOffset = 0, isOrigin = false) => {
        // Shockwave expansion ring
        setTimeout(() => {
            if (!document.body.contains(container)) return;
            const ring = document.createElement('div');
            const ringColor = palette[Math.floor(Math.random() * palette.length)];
            ring.style.cssText = [
                'position:absolute',
                `left:${bx}px`, `top:${by}px`,
                'width:14px', 'height:14px',
                'border-radius:50%',
                `border:2px solid ${ringColor}`,
                `box-shadow:0 0 20px ${ringColor}`,
                'transform:translate(-50%,-50%) scale(0)',
                'opacity:1',
                'pointer-events:none',
                `transition:transform ${isOrigin ? 0.45 : 0.4}s cubic-bezier(0.1, 0.85, 0.3, 1), opacity 0.45s ease-out`,
            ].join(';');
            container.appendChild(ring);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    ring.style.transform = `translate(-50%,-50%) scale(${isOrigin ? 22 : 12})`;
                    ring.style.opacity = '0';
                });
            });
        }, delayOffset);

        // Particle sparks
        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            const color = palette[Math.floor(Math.random() * palette.length)];
            const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            const size = (isOrigin ? 12 : 9) + Math.random() * (isOrigin ? 14 : 10);
            const angle = Math.random() * 2 * Math.PI;
            const dist = (isOrigin ? 40 : 20) + Math.random() * maxDist;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist + (Math.random() * 20); // slight gravity
            const dur = 600 + Math.random() * 700;
            const delay = delayOffset + Math.random() * 70;
            const rot = (Math.random() - 0.5) * 600;

            el.textContent = shape;
            el.style.cssText = [
                'position:absolute',
                `left:${bx}px`,
                `top:${by}px`,
                `font-size:${size}px`,
                `color:${color}`,
                `text-shadow:0 0 10px ${color}, 0 0 24px ${color}bb`,
                'transform:translate(-50%,-50%) scale(0.2)',
                'pointer-events:none',
                'user-select:none',
                'will-change:transform,opacity',
                `transition:transform ${dur}ms cubic-bezier(0.15, 0.85, 0.35, 1) ${delay}ms, opacity ${dur * 0.55}ms ease-in ${delay + dur * 0.45}ms`,
                'opacity:1',
            ].join(';');
            container.appendChild(el);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    el.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rot}deg) scale(${0.35 + Math.random() * 0.85})`;
                    el.style.opacity = '0';
                });
            });
        }
    };

    // 1. Primary explosion right where character was touched
    createBurst(originX, originY, 70, Math.min(vw, vh) * 0.4, 0, true);

    // Floating comic tag at touch location
    const popTag = document.createElement('div');
    const tagColor = palette[0] || '#4BD8A0';
    popTag.textContent = '💥 BOOM! ✨';
    popTag.style.cssText = [
        'position:absolute',
        `left:${originX}px`, `top:${originY - 30}px`,
        'transform:translate(-50%,-50%) scale(0.5)',
        'font-family:"JetBrains Mono","Syne",monospace',
        'font-weight:900',
        'font-size:16px',
        `color:#ffffff`,
        `background:rgba(0,0,0,0.85)`,
        `border:2px solid ${tagColor}`,
        'border-radius:20px',
        'padding:4px 14px',
        `box-shadow:0 0 25px ${tagColor}`,
        'pointer-events:none',
        'user-select:none',
        'opacity:1',
        'transition:transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease-in 0.6s',
    ].join(';');
    container.appendChild(popTag);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            popTag.style.transform = 'translate(-50%,-80px) scale(1.15)';
            popTag.style.opacity = '0';
        });
    });

    // 2. 8 secondary fireworks bursts filling the rest of the screen
    const secondaryCount = 8;
    for (let b = 0; b < secondaryCount; b++) {
        const rx = vw * 0.12 + Math.random() * (vw * 0.76);
        const ry = vh * 0.10 + Math.random() * (vh * 0.70);
        const delay = 100 + b * 85 + Math.random() * 50;
        const count = 30 + Math.floor(Math.random() * 20);
        const maxDist = 70 + Math.random() * 140;
        createBurst(rx, ry, count, maxDist, delay, false);
    }

    // Cleanup container
    setTimeout(() => {
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }, 2500);
};

const makeBounce = (n, h = 9) =>
    Array.from({ length: n + 1 }, (_, i) => (i % 2 === 0 ? 0 : -h));
const makeTimes = (n) =>
    Array.from({ length: n + 1 }, (_, i) => i / n);

// ── Component ─────────────────────────────────────────────────────────────────
const IdleCharacter = ({ isDark = true }) => {
    const [scope, animate] = useAnimate();
    const [visible,    setVisible]    = useState(false);
    const [showMsg,    setShowMsg]    = useState(false);
    const [msgIdx,     setMsgIdx]     = useState(0);
    const [isJumping,  setIsJumping]  = useState(false);
    const [exploding,  setExploding]  = useState(false);

    const timerRef     = useRef(null);
    const cancelRef    = useRef(false);
    const activityId   = useRef(0);
    const visibleRef   = useRef(visible);
    const explodingRef = useRef(exploding);

    visibleRef.current   = visible;
    explodingRef.current = exploding;

    // ── Palette ───────────────────────────────────────────────────────────────
    const C = isDark ? {
        body: '#4BD8A0',
        bodyShade: '#2aab78',
        dark: '#0a180d',
        helmet: '#1a3020',
        helmetBrim: '#0d1f18',
        leg: '#1a3020',
        boot: '#0a180d',
        accent: '#FF5A3C',
        devGlow: '#00ffcc',
        circuit: 'rgba(75,216,160,.35)',
        badgeBg: 'rgba(0,0,0,.65)',
        eyeGlow: '#00ffcc',
        visorLine: 'rgba(75,216,160,.7)',
        visorFill: 'rgba(75,216,160,.14)',
        dust: 'rgba(75,216,160,.45)',
        glowFx: 'drop-shadow(0 0 10px rgba(75,216,160,.6)) drop-shadow(0 2px 3px rgba(0,0,0,.5))',
        bubbleBg: '#0a1a10',
        bubbleTxt: '#4BD8A0',
    } : {
        body: '#D4874A',
        bodyShade: '#A05f28',
        dark: '#1C2226',
        helmet: '#36424A',
        helmetBrim: '#1C2226',
        leg: '#2D3B42',
        boot: '#1C2226',
        accent: '#E04C18',
        devGlow: '#FF8C00',
        circuit: 'rgba(13,148,136,.35)',
        badgeBg: 'rgba(28,34,38,.65)',
        eyeGlow: '#FF6B00',
        visorLine: 'rgba(220,160,80,.7)',
        visorFill: 'rgba(13,148,136,.14)',
        dust: 'rgba(13,148,136,.45)',
        glowFx: 'drop-shadow(0 0 10px rgba(13,148,136,.5)) drop-shadow(0 2px 3px rgba(0,0,0,.45))',
        bubbleBg: '#FFFFFF',
        bubbleTxt: '#1C2226',
    };

    const gid = isDark ? 'dk' : 'lt';

    // ── Fireworks palette (full-spectrum for wow factor) ──────────────────────
    const FW_PALETTE = isDark
        ? ['#4BD8A0','#6FD4FF','#FF5A3C','#D4A843','#a78bfa','#FF8C00','#ffffff','#00ffcc']
        : ['#D4AF37','#CE8946','#BDB76B','#FF5A3C','#a78bfa','#4BD8A0','#6FD4FF','#B8722E'];

    // ── Explode handler ───────────────────────────────────────────────────────
    const handleExplode = useCallback((e) => {
        if (!visibleRef.current || explodingRef.current || !scope.current) return;
        if (e) {
            e.stopPropagation();
            if (e.preventDefault && e.cancelable) e.preventDefault();
        }

        // Cancel running sequence immediately
        cancelRef.current = true;
        setShowMsg(false);
        setIsJumping(false);
        setExploding(true);

        // Get character centre in viewport coordinates
        const rect = scope.current.getBoundingClientRect();
        const ox = rect.left + rect.width  / 2;
        const oy = rect.top  + rect.height / 2;

        // Flash energy white + squish + vanish
        animate(scope.current, { filter: 'brightness(10) saturate(0) drop-shadow(0 0 30px #ffffff)' }, { duration: 0.05 });
        setTimeout(() => {
            if (scope.current) {
                animate(scope.current,
                    { scaleX: 2.2, scaleY: 0.15, opacity: 0 },
                    { duration: 0.16, ease: [0.8, 0, 1, 1] }
                );
            }
        }, 50);

        // Launch full-screen fireworks
        launchFireworks(ox, oy, FW_PALETTE);

        // Reset after explosion settles
        setTimeout(() => {
            if (!scope.current) return;
            animate(scope.current,
                { filter: C.glowFx, scaleX: 1, scaleY: 1, opacity: 1, x: -200, y: 0 },
                { duration: 0 }
            );
            setExploding(false);
            setVisible(false);
            scheduleAppearance();
        }, 2200);
    }, [C.glowFx, FW_PALETTE, animate, scope]);

    useEffect(() => {
        const s = document.createElement('style');
        s.dataset.icKf = '1';
        s.textContent = KEYFRAMES;
        document.head.appendChild(s);
        return () => { if (document.head.contains(s)) document.head.removeChild(s); };
    }, []);

    // ── Idle scheduling ───────────────────────────────────────────────────────
    const scheduleAppearance = useCallback(() => {
        const id = ++activityId.current;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            if (activityId.current === id) {
                let isForbidden = false;
                const hero = document.getElementById('hero');
                const contact = document.getElementById('contact');
                
                if (hero) {
                    const rect = hero.getBoundingClientRect();
                    if (rect.top <= window.innerHeight && rect.bottom >= 0) isForbidden = true;
                }
                if (contact) {
                    const rect = contact.getBoundingClientRect();
                    if (rect.top <= window.innerHeight && rect.bottom >= 0) isForbidden = true;
                }
                
                if (isForbidden) {
                    scheduleAppearance();
                    return;
                }

                cancelRef.current = false;
                setVisible(true);
            }
        }, 5000);
    }, []);

    const handleActivity = useCallback((e) => {
        if (explodingRef.current) return;
        // If clicking/touching the character itself, don't cancel/dismiss
        if (e && scope.current && scope.current.contains(e.target)) return;

        // While character is visible, allow mousemove so the user can hover / chase / click it!
        if (visibleRef.current && e && e.type === 'mousemove') return;

        cancelRef.current = true;
        setVisible(false);
        setShowMsg(false);
        setIsJumping(false);
        scheduleAppearance();
    }, [scheduleAppearance, scope]);

    useEffect(() => {
        const evts = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
        evts.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
        scheduleAppearance();
        return () => {
            evts.forEach(e => window.removeEventListener(e, handleActivity));
            clearTimeout(timerRef.current);
        };
    }, [handleActivity, scheduleAppearance]);

    // ── Animation sequence ────────────────────────────────────────────────────
    useEffect(() => {
        if (!scope.current) return;

        if (!visible) {
            // Reset off-screen so it doesn't flash in old position on next show
            animate(scope.current, { x: -200, y: 0, rotate: 0, scaleX: 1, scaleY: 1 }, { duration: 0 });
            return;
        }
        cancelRef.current = false;

        const seq = async () => {
            const vw = window.innerWidth;
            const cx = vw / 2 - 35;
            const ok = () => !cancelRef.current && !!scope.current;

            // 0. Instant reset to start position
            animate(scope.current,
                { x: -120, y: 0, rotate: 0, scaleX: 1, scaleY: 1 },
                { duration: 0 }
            );
            if (!ok()) return;

            // 1. RUN IN — left edge → centre
            const N = 12;
            await animate(scope.current, {
                x: cx,
                y: makeBounce(N, 9),
            }, {
                duration: 2.6,
                x: { ease: [0.2, 0.1, 0.25, 1] },
                y: { ease: 'linear', times: makeTimes(N) },
            });
            if (!ok()) return;

            // 2. LOOK-AROUND + speech bubble
            setMsgIdx(i => (i + 1) % MESSAGES.length);
            setShowMsg(true);
            setTimeout(() => setShowMsg(false), 1700);

            await animate(scope.current,
                { rotate: [-6, 6, -4, 0] },
                { duration: 0.5, ease: 'easeInOut', times: [0, 0.35, 0.7, 1] }
            );
            if (!ok()) return;

            // 3. WIND-UP crouch
            await animate(scope.current,
                { scaleY: 0.75, scaleX: 1.18 },
                { duration: 0.11 }
            );

            // 4. LAUNCH
            setIsJumping(true);
            await animate(scope.current,
                { y: -100, scaleY: 1.08, scaleX: 0.93, rotate: -14 },
                { duration: 0.44, ease: [0.08, 0.82, 0.3, 1.05] }
            );

            // 5. FLOAT at apex
            await animate(scope.current, { y: -98 }, { duration: 0.1 });

            // 6. FALL — gravity
            await animate(scope.current,
                { y: 5, rotate: 4, scaleY: 1, scaleX: 1 },
                { duration: 0.26, ease: [0.55, 0, 1.0, 0.7] }
            );

            // 7. LANDING SQUISH
            animate(scope.current,
                { scaleY: 0.62, scaleX: 1.35, rotate: 0, y: 0 },
                { duration: 0 }
            );
            await animate(scope.current, { scaleY: 1.22, scaleX: 0.87 }, { duration: 0.1 });
            await animate(scope.current, { scaleY: 1, scaleX: 1 },
                { duration: 0.3, ease: [0.34, 1.6, 0.64, 1] }
            );
            setIsJumping(false);
            if (!ok()) return;

            // 8. CORKSCREW SPIN — full 360°, ends facing right (scaleX stays 1)
            // A. Wind-up
            await animate(scope.current,
                { scaleY: 0.8, scaleX: 1.12 },
                { duration: 0.1 }
            );

            // B. THE FLIP — coin-spins full circle, returns to scaleX: 1 (facing right)
            await animate(scope.current, {
                y: [0, -72, 0],
                rotate: [0, -180, -360],
                scaleX: [1, 0, 1],   // full coin-flip: returns to facing right
                scaleY: [1, 1.18, 1],
            }, {
                duration: 0.72,
                y: { ease: 'easeInOut', times: [0, 0.42, 1] },
                rotate: { ease: 'easeInOut', times: [0, 0.5, 1] },
                scaleX: { ease: 'linear', times: [0, 0.5, 1] },
                scaleY: { ease: 'easeInOut', times: [0, 0.4, 1] },
            });
            animate(scope.current, { rotate: 0 }, { duration: 0 });

            // C. Post-flip landing squish (scaleX: 1)
            animate(scope.current, { scaleY: 0.72, scaleX: 1.22 }, { duration: 0 });
            await animate(scope.current, { scaleY: 1.14, scaleX: 0.9 }, { duration: 0.1 });
            await animate(scope.current, { scaleY: 1, scaleX: 1 },
                { duration: 0.28, ease: [0.34, 1.5, 0.64, 1] }
            );
            if (!ok()) return;

            // 9. RUN OUT — exits RIGHT side, slower & more leisurely
            //    scaleX: 1 so character faces right as it strolls away
            const M = 20;
            await animate(scope.current, {
                x: vw + 160,
                y: makeBounce(M, 8),
            }, {
                duration: 5.8,              // slower exit (vs 3.8s left-exit before)
                x: { ease: [0.18, 0.1, 0.28, 1] },
                y: { ease: 'linear', times: makeTimes(M) },
            });

            if (ok()) {
                setVisible(false);
                scheduleAppearance();
            }
        };

        seq().catch(() => { });
    }, [visible]);

    // ── CSS animation helpers ─────────────────────────────────────────────────
    const legSt = (side) => ({
        transformOrigin: side === 'l' ? '22px 64px' : '38px 64px',
        animation: isJumping
            ? 'none'
            : `${side === 'l' ? 'ic-leg-l' : 'ic-leg-r'} .38s linear infinite`,
        transform: isJumping ? 'rotate(-28deg)' : undefined,
        transition: 'transform 0.1s ease-out',
    });

    const armSt = (side) => ({
        transformOrigin: side === 'l' ? '17px 42px' : '45px 42px',
        animation: `${side === 'l' ? 'ic-arm-l' : 'ic-arm-r'} .38s linear infinite`,
    });

    return (
        <div
            ref={scope}
            style={{
                position: 'fixed',
                bottom: '3.5rem',
                left: 0,
                zIndex: 99990,
                pointerEvents: 'none',
                userSelect: 'none',
                filter: C.glowFx,
                willChange: 'transform',
                // Hide via opacity rather than returning null — keeps the ref mounted
                // so useAnimate never fires against a null scope
                opacity: visible ? 1 : 0,
                visibility: visible ? 'visible' : 'hidden',
            }}
        >
            <div
                onClick={handleExplode}
                onTouchStart={handleExplode}
                onPointerDown={handleExplode}
                title="Tap to explode!"
                style={{
                    transform: 'scale(0.65)',
                    transformOrigin: 'bottom center',
                    position: 'relative',
                    pointerEvents: (visible && !exploding) ? 'auto' : 'none',
                    cursor: 'pointer',
                }}
            >
            {/* ── Speech bubble ─────────────────────────────────────────── */}
            <AnimatePresence>
                {showMsg && (
                    <motion.div
                        key="bubble"
                        initial={{ opacity: 0, y: 10, scale: 0.7 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.7 }}
                        transition={{ duration: 0.2, ease: [0.34, 1.5, 0.64, 1] }}
                        style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: 9,
                            background: C.bubbleBg,
                            border: `1.5px solid ${C.body}`,
                            borderRadius: 8,
                            padding: '3px 10px',
                            fontSize: 11,
                            fontFamily: '"JetBrains Mono","Fira Code",monospace',
                            color: C.bubbleTxt,
                            whiteSpace: 'nowrap',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            boxShadow: `0 0 12px ${C.body}55`,
                        }}
                    >
                        {MESSAGES[msgIdx]}
                        <span style={{
                            position: 'absolute',
                            bottom: -8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0, height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: `8px solid ${C.body}`,
                            display: 'block',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Character SVG 70×92 ────────────────────────────────────── */}
            <svg width="70" height="92" viewBox="0 0 70 92"
                xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>

                <defs>
                    <linearGradient id={`ic-bg-${gid}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={C.body} />
                        <stop offset="100%" stopColor={C.bodyShade} />
                    </linearGradient>
                    <linearGradient id={`ic-hg-${gid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.helmet} />
                        <stop offset="100%" stopColor={C.helmetBrim} />
                    </linearGradient>
                    <linearGradient id={`ic-lg-${gid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.leg} />
                        <stop offset="100%" stopColor={C.dark} />
                    </linearGradient>
                    <linearGradient id={`ic-vg-${gid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,.18)" />
                        <stop offset="100%" stopColor={C.visorFill} />
                    </linearGradient>
                </defs>

                {/* Ground shadow */}
                <ellipse cx="35" cy="90" rx="20" ry="2.8" fill="rgba(0,0,0,.2)" />

                {/* Dust puffs at feet */}
                <ellipse cx="20" cy="82" rx="5" ry="3" fill={C.dust} opacity="0"
                    style={{ animation: 'ic-dust-a .38s ease-out 0s infinite' }} />
                <ellipse cx="38" cy="84" rx="5" ry="3" fill={C.dust} opacity="0"
                    style={{ animation: 'ic-dust-b .38s ease-out .19s infinite' }} />

                {/* ════ BACKPACK ════ */}
                <rect x="44" y="34" width="11" height="16" rx="3"
                    fill={`url(#ic-hg-${gid})`} opacity=".95" />
                <path d="M44 37 Q40 41 39 48"
                    stroke={C.helmetBrim} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="47" cy="40" r="1.1" fill={C.body}
                    style={{ animation: 'ic-wifi-1 1.1s ease-in-out infinite' }} />
                <circle cx="50" cy="40" r="1.1" fill={C.body}
                    style={{ animation: 'ic-wifi-2 1.1s ease-in-out infinite' }} />
                <circle cx="53" cy="40" r="1.1" fill={C.body}
                    style={{ animation: 'ic-wifi-3 1.1s ease-in-out infinite' }} />
                <line x1="50" y1="34" x2="50" y2="26"
                    stroke={C.body} strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="50" cy="25" r="1.9" fill={C.accent}
                    style={{ animation: 'ic-antenna 1.35s ease-in-out infinite .4s' }} />

                {/* ════ HELMET ════ */}
                <rect x="9" y="5" width="44" height="10" rx="5"
                    fill={`url(#ic-hg-${gid})`} />
                <rect x="7" y="12" width="48" height="4" rx="2"
                    fill={C.dark} opacity=".65" />
                <rect x="11" y="6.5" width="24" height="2.5" rx="1.2"
                    fill="rgba(255,255,255,.12)" />
                <rect x="26" y="7.5" width="10" height="4.5" rx="1"
                    fill={C.body} opacity=".18" />

                {/* ════ HEAD ════ */}
                <rect x="12" y="14" width="38" height="26" rx="10"
                    fill={`url(#ic-bg-${gid})`} />
                {/* head highlight */}
                <rect x="14" y="15" width="22" height="6" rx="4"
                    fill="rgba(255,255,255,.09)" />

                {/* Visor face-shield */}
                <rect x="14" y="19" width="34" height="15" rx="5"
                    fill={`url(#ic-vg-${gid})`}
                    stroke={C.visorLine} strokeWidth=".5" strokeOpacity=".4" />
                {/* Visor scan line */}
                <rect x="14" y="23" width="34" height="2" rx="1"
                    fill={C.visorLine} opacity="0"
                    style={{ animation: 'ic-visor-scan 2.2s ease-in-out infinite' }} />

                {/* Eyes */}
                <rect x="15" y="19" width="12" height="10" rx="4" fill={C.dark} />
                <rect x="35" y="19" width="12" height="10" rx="4" fill={C.dark} />
                <g style={{ transformOrigin: '21px 24px', animation: 'ic-blink 3.8s ease-in-out infinite' }}>
                    <rect x="18.5" y="21.5" width="7" height="5.5" rx="2"
                        fill={C.eyeGlow} opacity=".95" />
                    <rect x="19" y="22" width="2.5" height="2" rx=".8"
                        fill="rgba(255,255,255,.65)" />
                </g>
                <g style={{ transformOrigin: '41px 24px', animation: 'ic-blink 3.8s ease-in-out infinite .18s' }}>
                    <rect x="38.5" y="21.5" width="7" height="5.5" rx="2"
                        fill={C.eyeGlow} opacity=".95" />
                    <rect x="39" y="22" width="2.5" height="2" rx=".8"
                        fill="rgba(255,255,255,.65)" />
                </g>

                {/* Grin */}
                <path d="M18 33 Q31 40.5 44 33"
                    stroke={C.dark} strokeWidth="1.8" strokeLinecap="round"
                    fill="none" opacity=".42" />

                {/* Head antenna */}
                <line x1="31" y1="14" x2="31" y2="5"
                    stroke={C.body} strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="31" cy="4" r="3.2" fill="none"
                    stroke={C.accent} strokeWidth="1" opacity=".35"
                    style={{ animation: 'ic-antenna .88s ease-in-out infinite .2s' }} />
                <circle cx="31" cy="4" r="2.5" fill={C.accent}
                    style={{ animation: 'ic-antenna .88s ease-in-out infinite' }} />

                {/* ════ TORSO ════ */}
                <rect x="15" y="39" width="30" height="24" rx="6"
                    fill={`url(#ic-bg-${gid})`} />
                <rect x="11" y="39" width="7" height="6" rx="3" fill={C.bodyShade} />
                <rect x="42" y="39" width="7" height="6" rx="3" fill={C.bodyShade} />

                {/* Chest badge */}
                <rect x="18" y="42" width="14" height="10" rx="2" fill={C.badgeBg} />
                <rect x="19.5" y="43.5" width="11" height="1.4" rx=".7"
                    fill={C.devGlow} opacity=".82" />
                <rect x="19.5" y="46" width="8" height="1.4" rx=".7"
                    fill={C.devGlow} opacity=".52" />
                <rect x="19.5" y="48.5" width="9" height="1.4" rx=".7"
                    fill={C.devGlow} opacity=".62" />
                <circle cx="30" cy="44" r="1.2" fill={C.eyeGlow}
                    style={{ animation: 'ic-led 1.2s ease-in-out infinite' }} />

                {/* Circuit traces */}
                <line x1="33" y1="46" x2="44" y2="46" stroke={C.circuit} strokeWidth=".8" />
                <line x1="44" y1="46" x2="44" y2="55" stroke={C.circuit} strokeWidth=".8" />
                <circle cx="44" cy="55" r="1.5" fill={C.body} opacity=".38" />
                <path d="M15 52 L11 52 L11 58" stroke={C.circuit} strokeWidth=".8" fill="none" />
                <circle cx="11" cy="58" r="1.2" fill={C.body} opacity=".32" />

                {/* Belt */}
                <rect x="15" y="61" width="30" height="4" rx="2" fill={C.dark} opacity=".35" />
                <rect x="27.5" y="61.5" width="5" height="3" rx="1.2"
                    fill={C.body} opacity=".55" />

                {/* ════ LEFT ARM — wrench ════ */}
                <g style={armSt('l')}>
                    <rect x="7" y="40" width="10" height="16" rx="4.5"
                        fill={`url(#ic-bg-${gid})`} />
                    <ellipse cx="12" cy="57" rx="5.5" ry="4.5"
                        fill={`url(#ic-bg-${gid})`} />
                    <g style={{ transformOrigin: '8px 58px', animation: 'ic-wrench .38s linear infinite' }}>
                        <rect x="5" y="54" width="2.2" height="9" rx="1.1" fill={C.body} opacity=".9" />
                        <rect x="3.5" y="54" width="5.5" height="3" rx="1.2" fill={C.body} />
                        <rect x="4" y="60" width="4.5" height="2.2" rx="1" fill={C.body} opacity=".7" />
                    </g>
                </g>

                {/* ════ RIGHT ARM — PCB device ════ */}
                <g style={armSt('r')}>
                    <rect x="45" y="40" width="10" height="16" rx="4.5"
                        fill={`url(#ic-bg-${gid})`} />
                    <g style={{ animation: 'ic-device .95s ease-in-out infinite' }}>
                        <rect x="46" y="54" width="16" height="11" rx="2.5" fill={C.dark} />
                        <rect x="48" y="55.5" width="12" height="8" rx="1.5"
                            fill={C.devGlow} opacity=".16" />
                        <line x1="49" y1="57.5" x2="59" y2="57.5"
                            stroke={C.devGlow} strokeWidth=".7" opacity=".85" />
                        <line x1="49" y1="60" x2="56" y2="60"
                            stroke={C.devGlow} strokeWidth=".7" opacity=".6" />
                        <line x1="56" y1="60" x2="56" y2="62"
                            stroke={C.devGlow} strokeWidth=".7" opacity=".6" />
                        <circle cx="60" cy="60" r="1.4" fill={C.accent}
                            style={{ animation: 'ic-led 1.2s ease-in-out infinite' }} />
                        <rect x="50" y="61" width="5" height="3" rx=".8"
                            fill={C.devGlow} opacity=".42" />
                    </g>
                </g>

                {/* ════ LEFT LEG ════ */}
                <g style={legSt('l')}>
                    <rect x="16" y="64" width="11" height="18" rx="4.5"
                        fill={`url(#ic-lg-${gid})`} />
                    <rect x="17" y="67" width="9" height="3" rx="1.5"
                        fill="rgba(255,255,255,.07)" />
                    <rect x="13" y="78" width="16" height="8" rx="4" fill={C.boot} />
                    <rect x="13" y="78" width="16" height="3" rx="2" fill={C.leg} opacity=".5" />
                    <rect x="13" y="84" width="16" height="2" rx="1" fill="rgba(255,255,255,.06)" />
                </g>

                {/* ════ RIGHT LEG ════ */}
                <g style={legSt('r')}>
                    <rect x="33" y="64" width="11" height="18" rx="4.5"
                        fill={`url(#ic-lg-${gid})`} />
                    <rect x="34" y="67" width="9" height="3" rx="1.5"
                        fill="rgba(255,255,255,.07)" />
                    <rect x="31" y="78" width="16" height="8" rx="4" fill={C.boot} />
                    <rect x="31" y="78" width="16" height="3" rx="2" fill={C.leg} opacity=".5" />
                    <rect x="31" y="84" width="16" height="2" rx="1" fill="rgba(255,255,255,.06)" />
                </g>

            </svg>
            </div>
        </div>
    );
};

export default IdleCharacter;
