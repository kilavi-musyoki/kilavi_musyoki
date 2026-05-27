import { useRef, useEffect, memo } from 'react';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm  = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

// ── Procedural crack geometry generator ──────────────────────────────────────
function buildCrackTree(originX, originY, angle, length, depth, segs, rng) {
    if (depth <= 0 || length < 1.5) return;
    const x2 = originX + Math.cos(angle) * length;
    const y2 = originY + Math.sin(angle) * length;
    segs.push({ x1: originX, y1: originY, x2, y2 });
    // Primary continuation
    const jitter = (rng() - 0.5) * 0.55;
    buildCrackTree(x2, y2, angle + jitter, length * (0.62 + rng() * 0.22), depth - 1, segs, rng);
    // Branch
    if (depth >= 2 && rng() > 0.38) {
        const branchAngle = angle + (rng() > 0.5 ? 1 : -1) * (0.4 + rng() * 0.65);
        buildCrackTree(x2, y2, branchAngle, length * (0.38 + rng() * 0.28), depth - 2, segs, rng);
    }
}

function generateCracks(w, h, seed) {
    // Simple seeded PRNG
    let s = seed;
    const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

    const groups = [];
    const origins = [
        { x: w * (0.32 + rng() * 0.12), y: h * (0.28 + rng() * 0.18) },
        { x: w * (0.55 + rng() * 0.12), y: h * (0.42 + rng() * 0.14) },
    ];
    origins.forEach(({ x, y }) => {
        // Radiate 6–9 primary arms
        const arms = 6 + Math.floor(rng() * 4);
        const segs = [];
        for (let a = 0; a < arms; a++) {
            const angle = rng() * Math.PI * 2;
            const len   = w * (0.08 + rng() * 0.16);
            buildCrackTree(x, y, angle, len, 5, segs, rng);
        }
        // Compute cumulative lengths for progressive reveal
        let cum = 0;
        const withDist = segs.map(seg => {
            const d = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
            const start = cum;
            cum += d;
            return { ...seg, start, end: cum };
        });
        groups.push({ segs: withDist, total: cum, ox: x, oy: y });
    });
    return groups;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default memo(function ScreenGlitchOverlay({ leverValue }) {
    const canvasRef  = useRef(null);
    const cracksRef  = useRef(null);   // generated crack geometry
    const rafRef     = useRef(null);
    const frameRef   = useRef(0);

    // Build crack geometry once on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const w = canvas.offsetWidth  || 320;
        const h = canvas.offsetHeight || 256;
        canvas.width  = w * (window.devicePixelRatio || 1);
        canvas.height = h * (window.devicePixelRatio || 1);
        cracksRef.current = generateCracks(canvas.width, canvas.height, 0xdeadbeef);
    }, []);

    // Live param ref so rAF doesn't close over stale leverValue
    const lvRef = useRef(leverValue);
    useEffect(() => { lvRef.current = leverValue; }, [leverValue]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const loop = () => {
            frameRef.current++;
            const lv = lvRef.current;
            const progress = norm(lv, 0.20, 0.35) * (1 - norm(lv, 0.35, 0.40));

            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            if (progress < 0.01) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            // ── 1. Chromatic aberration via R/G/B channel offset ──────────────
            // We read back the pixels already drawn in this frame's parent
            // Instead, paint coloured ghost rectangles with screen blend mode
            const abShift = progress * 5 * (window.devicePixelRatio || 1);
            if (abShift > 0.3) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                // Red channel right + up
                ctx.fillStyle = `rgba(255,0,0,${progress * 0.22})`;
                ctx.fillRect(abShift, -abShift * 0.5, W, H);
                // Cyan (G+B) left + down
                ctx.fillStyle = `rgba(0,255,255,${progress * 0.18})`;
                ctx.fillRect(-abShift, abShift * 0.5, W, H);
                ctx.restore();
            }

            // ── 2. Fracture cracks ────────────────────────────────────────────
            const cracks = cracksRef.current;
            if (cracks && cracks.length) {
                ctx.save();
                ctx.lineCap = 'round';
                cracks.forEach((group, gi) => {
                    const groupProgress = clamp(progress - gi * 0.08, 0, 1);
                    const revealDist = groupProgress * group.total;

                    // Impact origin glow
                    if (groupProgress > 0.05) {
                        const grad = ctx.createRadialGradient(group.ox, group.oy, 0, group.ox, group.oy, 12 * (window.devicePixelRatio || 1));
                        grad.addColorStop(0, `rgba(255,255,255,${groupProgress * 0.55})`);
                        grad.addColorStop(1, 'rgba(255,255,255,0)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(group.ox, group.oy, 12 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
                        ctx.fill();
                    }

                    group.segs.forEach(seg => {
                        if (seg.start >= revealDist) return;
                        const t = clamp((revealDist - seg.start) / (seg.end - seg.start), 0, 1);
                        const ex = seg.x1 + (seg.x2 - seg.x1) * t;
                        const ey = seg.y1 + (seg.y2 - seg.y1) * t;

                        // Outer glow
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255,255,255,${groupProgress * 0.22})`;
                        ctx.lineWidth = 3.5;
                        ctx.moveTo(seg.x1, seg.y1);
                        ctx.lineTo(ex, ey);
                        ctx.stroke();

                        // Core crack line
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(200,220,255,${0.55 + groupProgress * 0.35})`;
                        ctx.lineWidth = 1.2;
                        ctx.moveTo(seg.x1, seg.y1);
                        ctx.lineTo(ex, ey);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }

            // ── 3. Scanline flicker bands ─────────────────────────────────────
            if (progress > 0.12) {
                const scanCount = 2 + Math.floor(progress * 2);
                const speed = 0.6 + progress * 1.4;
                ctx.save();
                for (let i = 0; i < scanCount; i++) {
                    const phase = ((frameRef.current * speed * 0.8 + i * 137) % H);
                    const scanH  = (4 + progress * 8) * (window.devicePixelRatio || 1);
                    const alpha  = (0.12 + progress * 0.28) * (0.5 + 0.5 * Math.sin(frameRef.current * 0.3 + i));
                    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                    ctx.fillRect(0, phase, W, scanH);
                }
                ctx.restore();
            }

            // ── 4. Occasional full-frame flash ───────────────────────────────
            if (progress > 0.22) {
                const flashProb = progress * 0.025;
                if (Math.random() < flashProb) {
                    const flashColor = Math.random() > 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
                    ctx.fillStyle = flashColor;
                    ctx.fillRect(0, 0, W, H);
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    const progress = norm(leverValue, 0.20, 0.35) * (1 - norm(leverValue, 0.35, 0.40));

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: progress > 0 ? 1 : 0,
                mixBlendMode: 'screen',
                zIndex: 15,
            }}
        />
    );
});
