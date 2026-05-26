import React, { useEffect, useRef, memo } from 'react';
import { TetrisEngine, VISIBLE_ROWS, COLS } from '../engine/TetrisEngine.js';
import { TetrisRenderer } from '../engine/TetrisRenderer.js';
import { TetrisAudio } from '../engine/TetrisAudio.js';

export default memo(function TetrusGame({ isDark, glitchLevel = 0 }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    const isDarkRef = useRef(isDark);
    useEffect(() => {
        isDarkRef.current = isDark;
    }, [isDark]);

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
        const engine = new TetrisEngine();
        const renderer = new TetrisRenderer();

        let W = 0, H = 0;
        let screenW = 0, caseW = 0, caseX = 0;
        let dpr = window.devicePixelRatio || 1;

        // Dynamic Resize and Layout calculations
        const updateLayout = () => {
            const rect = canvas.getBoundingClientRect();
            W = Math.round(rect.width * dpr);
            H = Math.round(rect.height * dpr);
            canvas.width = W; 
            canvas.height = H;

            screenW = Math.floor(W * 0.58);
            caseW = W - screenW;
            caseX = screenW;
        };

        const ro = new ResizeObserver(updateLayout);
        ro.observe(canvas);
        updateLayout();

        // ── Input Traps ──
        const onKeyDown = (e) => {
            // Prevent Space and Arrow keys from triggering page scrolls
            const blockKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'];
            if (blockKeys.includes(e.key)) {
                e.preventDefault();
            }
            engine.handleInputDown(e.key);
        };

        const onKeyUp = (e) => {
            engine.handleInputUp(e.key);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // Pointer click listener on canvas (tracks mute toggle hit regions)
        const onPointerDown = (e) => {
            const btn = renderer.muteBtn;
            if (!btn) return;
            
            const rect = canvas.getBoundingClientRect();
            const px = (e.clientX - rect.left) * dpr;
            const py = (e.clientY - rect.top)  * dpr;
            
            if (px >= btn.x && px <= btn.x + btn.w &&
                py >= btn.y && py <= btn.y + btn.h) {
                TetrisAudio.isMuted = !TetrisAudio.isMuted;
            }
        };
        canvas.addEventListener('pointerdown', onPointerDown);

        let lastTime = performance.now();

        // ── Main Game Loop tick ──
        const loop = (time) => {
            const dt = time - lastTime;
            lastTime = time;

            // Update physics & movement logic
            engine.update(dt);
            
            // Expose game state globally for DeviceCanvas/PCB components
            window.__tetrusGameState = engine.state;

            // Render updated state to canvas
            renderer.draw(
                ctx, 
                engine, 
                W, 
                H, 
                caseX, 
                caseW, 
                dpr, 
                isDarkRef.current, 
                TetrisAudio.isMuted
            );

            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        // Clean up animation loops, layout observers, and active events
        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            canvas.removeEventListener('pointerdown', onPointerDown);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        />
    );
});
