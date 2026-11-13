import { useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { TetrisEngine } from '../engine/TetrisEngine.js';
import { getTetrisLayout, TetrisRenderer } from '../engine/TetrisRenderer.js';
import { TetrisAudio } from '../engine/TetrisAudio.js';

const TetrusGame = memo(function TetrusGame({ isDark, glitchLevel = 0 }) {
    const canvasRef = useRef(null);
    const threeCanvasRef = useRef(null);
    const rafRef = useRef(null);

    const isDarkRef = useRef(isDark);
    const progressRef = useRef(glitchLevel);
    useEffect(() => {
        isDarkRef.current = isDark;
    }, [isDark]);
    useEffect(() => {
        progressRef.current = glitchLevel;
    }, [glitchLevel]);

    // Ensure retro arcade fonts are loaded into the document head
    useEffect(() => {
        if (!document.getElementById('gb-fonts')) {
            const link = document.createElement('link');
            link.id = 'gb-fonts';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap';
            document.head.appendChild(link);
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const engine = new TetrisEngine();
        const renderer = new TetrisRenderer();
        let renderer3D = null;
        let disposed = false;

        let W = 0, H = 0, dpr = 1;

        // Dynamic Resize and Layout calculations
        const updateLayout = () => {
            const rect = canvas.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            W = Math.round(rect.width * dpr);
            H = Math.round(rect.height * dpr);
            canvas.width = W; 
            canvas.height = H;
            renderer3D?.resize(rect.width, rect.height, dpr);
        };

        const load3DRenderer = async () => {
            try {
                const { Tetris3DRenderer } = await import('../engine/Tetris3DRenderer.js');
                if (disposed || !threeCanvasRef.current) return;
                renderer3D = new Tetris3DRenderer(threeCanvasRef.current);
                const rect = canvas.getBoundingClientRect();
                renderer3D.resize(rect.width, rect.height, dpr);
            } catch {
                // Keep the 2D renderer as a safe fallback if WebGL is unavailable.
                if (threeCanvasRef.current) threeCanvasRef.current.style.display = 'none';
            }
        };
        void load3DRenderer();

        const ro = new ResizeObserver(updateLayout);
        ro.observe(canvas);
        updateLayout();

        // ── Input Traps ──
        const onKeyDown = (e) => {
            if (progressRef.current > 0.68) return;
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
            // Prevent Space and Arrow keys from triggering page scrolls
            const blockKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'];
            if (blockKeys.includes(e.key)) {
                e.preventDefault();
            }
            engine.handleInputDown(e.key);
        };

        const onKeyUp = (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
            engine.handleInputUp(e.key);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // Pointer click listener on canvas (tracks mute toggle & screen tap actions)
        const onPointerDown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const px = (e.clientX - rect.left) * dpr;
            const py = (e.clientY - rect.top)  * dpr;
            
            const btn = renderer.muteBtn;
            if (btn && px >= btn.x && px <= btn.x + btn.w &&
                py >= btn.y && py <= btn.y + btn.h) {
                TetrisAudio.isMuted = !TetrisAudio.isMuted;
                return;
            }

            // Screen tap to start / continue / unpause
            if (engine.state === 'menu' || engine.state === 'gameover') {
                engine.handleInputDown('Enter');
            } else if (engine.state === 'paused') {
                engine.handleInputDown('p');
            } else if (engine.state === 'initials_entry') {
                engine.handleInputDown('Enter');
            }
        };
        canvas.addEventListener('pointerdown', onPointerDown);

        // ── Swipe / Touch gesture controls ──
        let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
        const SWIPE_MIN_PX = 24; // minimum pixels to register as a swipe
        const SWIPE_MAX_MS = 400; // maximum ms for a swipe gesture

        const onTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = performance.now();
        };

        const onTouchEnd = (e) => {
            if (e.changedTouches.length !== 1) return;
            if (engine.state !== 'playing') return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            const dt = performance.now() - touchStartTime;
            if (dt > SWIPE_MAX_MS) return;
            const absDx = Math.abs(dx), absDy = Math.abs(dy);
            if (absDx < SWIPE_MIN_PX && absDy < SWIPE_MIN_PX) {
                // Short tap in-game: rotate CW
                engine.handleInputDown('x');
                return;
            }
            if (absDx > absDy) {
                // Horizontal swipe: move left/right
                engine.handleInputDown(dx < 0 ? 'ArrowLeft' : 'ArrowRight');
                engine.handleInputUp(dx < 0 ? 'ArrowLeft' : 'ArrowRight');
            } else {
                if (dy > 0) {
                    // Swipe down: hard drop
                    engine.handleInputDown(' ');
                } else {
                    // Swipe up: hold piece
                    engine.hold();
                }
            }
        };

        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchend', onTouchEnd, { passive: true });

        let lastTime = performance.now();

        // ── Main Game Loop tick ──
        const loop = (time) => {
            const dt = time - lastTime;
            lastTime = time;

            if (progressRef.current <= 0.68) {
                // Update physics & movement logic while the game is visible.
                engine.update(dt);
                window.__tetrusGameState = engine.state;

                const layout = getTetrisLayout(W, H);
                renderer.draw(
                    ctx,
                    engine,
                    W,
                    H,
                    layout.caseX,
                    layout.caseW,
                    dpr,
                    isDarkRef.current,
                    TetrisAudio.isMuted,
                    { skipBlocks: Boolean(renderer3D) },
                );
                renderer3D?.draw(engine, W, H, dpr, progressRef.current, isDarkRef.current);
            }

            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        // Clean up animation loops, layout observers, and active events
        return () => {
            disposed = true;
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
            renderer3D?.dispose();
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchend', onTouchEnd);
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', touchAction: 'none' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'pointer' }}
            />
            <canvas
                ref={threeCanvasRef}
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />
        </div>
    );
});

TetrusGame.propTypes = {
    isDark: PropTypes.bool.isRequired,
    glitchLevel: PropTypes.number,
};

export default TetrusGame;
