import React, { useEffect, useRef, memo } from 'react';

const PALETTE = {
    bg: '#050808',
    empty: '#0f1714',
    grid: '#1a2e25',
    highlight: '#4BD8A0',
    text: '#4BD8A0',
    textDim: '#2a7558',
    panel: '#0a1410',
    border: '#2a7558'
};

const PIECE_COLORS = {
    I: '#00E5FF',
    O: '#FFD600',
    T: '#E040FB',
    L: '#FF6D00',
    J: '#448AFF',
    S: '#00E676',
    Z: '#FF1744'
};

const COLS = 10, ROWS = 22; 
const VISIBLE_ROWS = 20;

const PIECES = {
    I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
    O: { shape: [[1,1],[1,1]] },
    T: { shape: [[0,0,0],[1,1,1],[0,1,0]] },
    L: { shape: [[0,0,1],[1,1,1],[0,0,0]] },
    J: { shape: [[1,0,0],[1,1,1],[0,0,0]] },
    S: { shape: [[0,1,1],[1,1,0],[0,0,0]] },
    Z: { shape: [[1,1,0],[0,1,1],[0,0,0]] }
};

const GRAVITY = [60, 48, 40, 36, 33, 30, 26, 23, 20, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3];
const getGravityFrames = (level) => GRAVITY[Math.min(level, 20)] || 3;

let actx = null;
let isMuted = false;

const playTone = (freq, type, dur, vol = 0.05) => {
    if (isMuted) return;
    try {
        if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.connect(g);
        g.connect(actx.destination);
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
        o.start();
        o.stop(actx.currentTime + dur);
    } catch (e) {}
};

const SFX = {
    move: () => playTone(330, 'square', 0.02, 0.02),
    rotate: () => playTone(550, 'square', 0.02, 0.02),
    softDrop: () => playTone(200, 'square', 0.01, 0.01),
    lock: () => playTone(130, 'triangle', 0.08, 0.05),
    clear: (lines) => {
        const freqs = [523, 659, 784, 1047]; 
        for (let i = 0; i < lines; i++) {
            setTimeout(() => playTone(freqs[i], 'square', 0.1, 0.05), i * 60);
        }
        if (lines === 4) {
            setTimeout(() => playTone(1319, 'square', 0.2, 0.05), 240);
        }
    },
    levelUp: () => [440, 880, 1320].forEach((f, i) => setTimeout(() => playTone(f, 'square', 0.1, 0.05), i * 100)),
    gameOver: () => [350, 280, 210, 130].forEach((f, i) => setTimeout(() => playTone(f, 'sawtooth', 0.2, 0.05), i * 150))
};

// Fire real browser keyboard events — picked up by TetrusGame's window listeners
const fireDown = (key) => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const fireUp   = (key) => window.dispatchEvent(new KeyboardEvent('keyup',   { key, bubbles: true, cancelable: true }));

export default memo(function TetrusGame({ isDark, glitchLevel = 0 }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    const isDarkRef = useRef(isDark);
    useEffect(() => {
        isDarkRef.current = isDark;
    }, [isDark]);

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
        const setCtxFont = (fontStr) => {
            if (ctx.font !== fontStr) ctx.font = fontStr;
        };
        let W = 0, H = 0;
        let screenW = 0, caseW = 0, caseX = 0;
        let gameW = 0, gameH = 0, cellSize = 0, boardX = 0, boardY = 0;
        let statsW = 0, statsX = 0, statsY = 0, statsH = 0;
        let dpr = window.devicePixelRatio || 1;

        const updateLayout = () => {
            const rect = canvas.getBoundingClientRect();
            W = Math.round(rect.width * dpr);
            H = Math.round(rect.height * dpr);
            canvas.width = W; canvas.height = H;

            screenW = Math.floor(W * 0.58);
            caseW = W - screenW;
            caseX = screenW;

            const bezel = Math.max(4, Math.floor(Math.min(W, H) * 0.04));
            const screenAreaW = screenW - bezel * 2;
            const screenAreaH = H - bezel * 2;

            statsW = Math.floor(screenAreaW * 0.38);
            gameW = screenAreaW - statsW;
            gameH = screenAreaH;
            
            const cellH = Math.floor(gameH / VISIBLE_ROWS);
            const cellW = Math.floor(gameW / COLS);
            cellSize = Math.min(cellH, cellW);

            boardX = bezel + Math.floor((gameW - COLS * cellSize) / 2);
            boardY = bezel + Math.floor((gameH - VISIBLE_ROWS * cellSize) / 2);

            statsX = bezel + gameW;
            statsY = bezel;
            statsH = screenAreaH;
        };

        const ro = new ResizeObserver(updateLayout);
        ro.observe(canvas);
        updateLayout();

        let state = 'menu';
        let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        let score = 0, lines = 0, level = 0;
        let bag = [];
        let current = null;
        let nextPiece = null;
        let highScores = JSON.parse(localStorage.getItem('blockdrop_gb_scores') || '[]');

        const getNextPiece = () => {
            if (bag.length === 0) {
                bag = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
                for (let i = bag.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [bag[i], bag[j]] = [bag[j], bag[i]];
                }
            }
            const type = bag.pop();
            return {
                type,
                color: PIECE_COLORS[type],
                shape: PIECES[type].shape.map(r => [...r]),
                x: Math.floor((COLS - PIECES[type].shape[0].length) / 2),
                y: type === 'I' ? -1 : 0 
            };
        };

        const resetGame = () => {
            board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
            score = 0; lines = 0; level = 0;
            bag = [];
            current = getNextPiece();
            nextPiece = getNextPiece();
            state = 'playing';
            if (!actx) {
                try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
            }
        };

        const isValid = (cx, cy, shape) => {
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const nx = cx + c;
                        const ny = cy + r;
                        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
                        if (ny >= 0 && board[ny][nx] !== 0) return false;
                    }
                }
            }
            return true;
        };

        const rotateCW = (shape) => shape[0].map((_, i) => shape.map(row => row[i]).reverse());
        const rotateCCW = (shape) => shape[0].map((_, i) => shape.map(row => row[shape[0].length - 1 - i]));

        const lockPiece = () => {
            for (let r = 0; r < current.shape.length; r++) {
                for (let c = 0; c < current.shape[r].length; c++) {
                    if (current.shape[r][c]) {
                        if (current.y + r < 0) continue;
                        board[current.y + r][current.x + c] = current.color;
                    }
                }
            }
            SFX.lock();

            let linesCleared = 0;
            for (let r = ROWS - 1; r >= 0; r--) {
                if (board[r].every(v => v !== 0)) {
                    board.splice(r, 1);
                    board.unshift(Array(COLS).fill(0));
                    linesCleared++;
                    r++;
                }
            }

            if (linesCleared > 0) {
                const prevLevel = level;
                lines += linesCleared;
                level = Math.floor(lines / 10);
                const pts = [0, 40, 100, 300, 1200][linesCleared] * (level + 1);
                score += pts;
                SFX.clear(linesCleared);
                if (level > prevLevel) SFX.levelUp();
            }

            current = nextPiece;
            nextPiece = getNextPiece();

            if (!isValid(current.x, current.y, current.shape)) {
                state = 'gameover';
                SFX.gameOver();
                highScores.push({ score, level, lines, initials: 'AAA' });
                highScores.sort((a, b) => b.score - a.score);
                highScores = highScores.slice(0, 10);
                localStorage.setItem('blockdrop_gb_scores', JSON.stringify(highScores));
            }
        };

        const keys = { ArrowLeft: 0, ArrowRight: 0, ArrowDown: 0, x: 0, z: 0, ' ': 0, Enter: 0 };
        const keyTimers = { ArrowLeft: 0, ArrowRight: 0, ArrowDown: 0 };
        const DAS = 250; 
        const ARR = 60; 
        let lastTime = performance.now();
        let fallTimer = 0;
        let lastHardDrop = 0;

        const onKeyDown = (e) => {
            if (keys[e.key] !== undefined) {
                if (!keys[e.key]) keys[e.key] = performance.now();
                e.preventDefault(); // prevent Space/Arrow keys from scrolling the page
            }
            if (e.key === 'p' || e.key === 'Enter') {
                if (state === 'menu') resetGame();
                else if (state === 'playing') state = 'paused';
                else if (state === 'paused') state = 'playing';
                else if (state === 'gameover') state = 'menu';
            }
            if (state === 'playing') {
                if (e.key === 'x') {
                    const rot = rotateCW(current.shape);
                    if (isValid(current.x, current.y, rot)) {
                        current.shape = rot;
                        SFX.rotate();
                    }
                }
                if (e.key === 'z') {
                    const rot = rotateCCW(current.shape);
                    if (isValid(current.x, current.y, rot)) {
                        current.shape = rot;
                        SFX.rotate();
                    }
                }
                if (e.key === ' ' && performance.now() - lastHardDrop > 250) {
                    lastHardDrop = performance.now();
                    while (isValid(current.x, current.y + 1, current.shape)) {
                        current.y++;
                        score += 2;
                    }
                    lockPiece();
                }
            }
        };

        const onKeyUp = (e) => {
            if (keys[e.key] !== undefined) {
                keys[e.key] = 0;
                if (keyTimers[e.key] !== undefined) keyTimers[e.key] = 0;
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        const activeTouches = {};

        const update = (dt) => {
            if (state !== 'playing') return;

            const handleDirection = (key, dx, dy) => {
                if (keys[key] || Object.values(activeTouches).includes(key)) {
                    if (keyTimers[key] === 0) {
                        if (isValid(current.x + dx, current.y + dy, current.shape)) {
                            current.x += dx;
                            current.y += dy;
                            if (dy > 0) { score += 1; SFX.softDrop(); }
                            else SFX.move();
                        }
                        keyTimers[key] += dt;
                    } else {
                        keyTimers[key] += dt;
                        if (keyTimers[key] >= DAS) {
                            const extra = keyTimers[key] - DAS;
                            const moves = Math.floor(extra / ARR);
                            for (let i = 0; i < moves; i++) {
                                if (isValid(current.x + dx, current.y + dy, current.shape)) {
                                    current.x += dx;
                                    current.y += dy;
                                    if (dy > 0) { score += 1; SFX.softDrop(); }
                                    else SFX.move();
                                }
                            }
                            if (moves > 0) keyTimers[key] -= (moves * ARR);
                        }
                    }
                }
            };

            handleDirection('ArrowLeft', -1, 0);
            handleDirection('ArrowRight', 1, 0);
            handleDirection('ArrowDown', 0, 1);

            fallTimer += dt;
            const msPerFrame = 1000 / 60;
            const dropInterval = getGravityFrames(level) * msPerFrame;
            
            if (fallTimer >= dropInterval) {
                fallTimer -= dropInterval;
                if (isValid(current.x, current.y + 1, current.shape)) {
                    current.y++;
                } else {
                    lockPiece();
                }
            }
        };

        const drawCell = (ctx, x, y, size, color) => {
            if (color && color !== 0) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, size, size);
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(x, y, size - 2, 2); 
                ctx.fillRect(x, y, 2, size - 2); 
            }
        };

        const drawBox = (txt, val, x, y, w, h) => {
            ctx.fillStyle = PALETTE.panel;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = PALETTE.border;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            
            ctx.fillStyle = PALETTE.textDim;
            let titleSize = Math.max(6, Math.floor(w * 0.12));
            setCtxFont(`${titleSize}px "Press Start 2P", monospace`);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(txt, x + w/2, y + h * 0.15);
            
            ctx.fillStyle = PALETTE.text;
            let valSize = Math.max(8, Math.floor(w * 0.18));
            setCtxFont(`${valSize}px "Press Start 2P", monospace`);
            ctx.fillText(val, x + w/2, y + h * 0.55);
        };

        const draw = () => {
            ctx.fillStyle = isDarkRef.current ? '#0b120f' : '#D1D5DB';
            ctx.fillRect(caseX, 0, caseW, H);

            ctx.fillStyle = PALETTE.bg;
            ctx.fillRect(0, 0, caseX, H);

            const bezelPad = Math.max(8, Math.floor(Math.min(W, H) * 0.04));
            
            ctx.strokeStyle = PALETTE.highlight;
            ctx.lineWidth = 2;
            ctx.strokeRect(bezelPad, bezelPad, caseX - bezelPad * 2, H - bezelPad * 2);

            if (!cellSize) return;

            // 1. Draw solid background grid area once (optimized batched draw)
            ctx.fillStyle = PALETTE.empty;
            ctx.fillRect(boardX, boardY, COLS * cellSize, VISIBLE_ROWS * cellSize);

            // 2. Stroke all grid lines in a single batched path (1 draw call vs. 200)
            ctx.beginPath();
            ctx.strokeStyle = PALETTE.grid;
            ctx.lineWidth = 1;
            // Vertical lines
            for (let c = 0; c <= COLS; c++) {
                const x = boardX + c * cellSize;
                ctx.moveTo(x, boardY);
                ctx.lineTo(x, boardY + VISIBLE_ROWS * cellSize);
            }
            // Horizontal lines
            for (let r = 0; r <= VISIBLE_ROWS; r++) {
                const y = boardY + r * cellSize;
                ctx.moveTo(boardX, y);
                ctx.lineTo(boardX + COLS * cellSize, y);
            }
            ctx.stroke();

            // 3. Draw filled board cells on top of the pre-rendered grid
            for (let r = 2; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cellVal = board[r][c];
                    if (cellVal !== 0) {
                        drawCell(ctx, boardX + c * cellSize, boardY + (r - 2) * cellSize, cellSize, cellVal);
                    }
                }
            }

            if (state === 'playing' || state === 'paused') {
                if (current) {
                    let ghostY = current.y;
                    while (isValid(current.x, ghostY + 1, current.shape)) {
                        ghostY++;
                    }
                    ctx.globalAlpha = 0.2;
                    for (let r = 0; r < current.shape.length; r++) {
                        for (let c = 0; c < current.shape[r].length; c++) {
                            if (current.shape[r][c] && ghostY + r >= 2) {
                                drawCell(ctx, boardX + (current.x + c) * cellSize, boardY + (ghostY + r - 2) * cellSize, cellSize, current.color);
                            }
                        }
                    }
                    ctx.globalAlpha = 1.0;

                    for (let r = 0; r < current.shape.length; r++) {
                        for (let c = 0; c < current.shape[r].length; c++) {
                            if (current.shape[r][c] && current.y + r >= 2) {
                                drawCell(ctx, boardX + (current.x + c) * cellSize, boardY + (current.y + r - 2) * cellSize, cellSize, current.color);
                            }
                        }
                    }
                }
            }

            // Draw HUD
            const boxW = statsW * 0.8;
            const boxX = statsX + (statsW - boxW) / 2;
            const boxH = Math.min(statsH * 0.15, 60 * dpr);
            let curY = statsY + statsH * 0.05;
            const gap = statsH * 0.04;

            drawBox('SCORE', score.toString(), boxX, curY, boxW, boxH);
            curY += boxH + gap;
            drawBox('LEVEL', level.toString(), boxX, curY, boxW, boxH);
            curY += boxH + gap;
            drawBox('LINES', lines.toString(), boxX, curY, boxW, boxH);
            curY += boxH + gap;

            // Draw Next box
            ctx.fillStyle = PALETTE.panel;
            ctx.fillRect(boxX, curY, boxW, boxH * 1.5);
            ctx.strokeStyle = PALETTE.border;
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, curY, boxW, boxH * 1.5);
            
            ctx.fillStyle = PALETTE.textDim;
            let titleSize = Math.max(6, Math.floor(boxW * 0.12));
            setCtxFont(`${titleSize}px "Press Start 2P", monospace`);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('NEXT', boxX + boxW/2, curY + boxH * 0.15);

            if (nextPiece) {
                const pSize = Math.floor(cellSize * 0.8);
                const pW = nextPiece.shape[0].length * pSize;
                const pH = nextPiece.shape.length * pSize;
                const npX = boxX + boxW/2 - pW/2;
                const npY = curY + boxH * 0.5 + (boxH - pH)/2;
                
                for (let r = 0; r < nextPiece.shape.length; r++) {
                    for (let c = 0; c < nextPiece.shape[r].length; c++) {
                        if (nextPiece.shape[r][c]) {
                            drawCell(ctx, npX + c * pSize, npY + r * pSize, pSize, nextPiece.color);
                        }
                    }
                }
            }

            if (state === 'menu') {
                ctx.fillStyle = 'rgba(5, 8, 8, 0.85)';
                ctx.fillRect(boardX, boardY, COLS * cellSize, VISIBLE_ROWS * cellSize);
                ctx.fillStyle = PALETTE.highlight;
                ctx.textAlign = 'center';
                setCtxFont(`${Math.floor(cellSize * 0.9)}px "Press Start 2P", monospace`);
                ctx.fillText('BLOCKDROP', boardX + (COLS * cellSize)/2, boardY + VISIBLE_ROWS * cellSize * 0.3);
                setCtxFont(`${Math.floor(cellSize * 0.45)}px "Press Start 2P", monospace`);
                
                if (Math.floor(performance.now() / 500) % 2 === 0) {
                    ctx.fillText('CLICK START', boardX + (COLS * cellSize)/2, boardY + VISIBLE_ROWS * cellSize * 0.7);
                }
            } else if (state === 'paused') {
                ctx.fillStyle = 'rgba(5, 8, 8, 0.85)';
                ctx.fillRect(boardX, boardY, COLS * cellSize, VISIBLE_ROWS * cellSize);
                ctx.fillStyle = PALETTE.highlight;
                ctx.textAlign = 'center';
                setCtxFont(`${Math.floor(cellSize * 0.8)}px "Press Start 2P", monospace`);
                ctx.fillText('PAUSED', boardX + (COLS * cellSize)/2, boardY + VISIBLE_ROWS * cellSize * 0.5);
            } else if (state === 'gameover') {
                ctx.fillStyle = 'rgba(5, 8, 8, 0.85)';
                ctx.fillRect(boardX, boardY, COLS * cellSize, VISIBLE_ROWS * cellSize);
                ctx.fillStyle = '#FF1744';
                ctx.textAlign = 'center';
                setCtxFont(`${Math.floor(cellSize * 0.8)}px "Press Start 2P", monospace`);
                ctx.fillText('GAME OVER', boardX + (COLS * cellSize)/2, boardY + VISIBLE_ROWS * cellSize * 0.5);
            }


        };

        const loop = (time) => {
            const dt = time - lastTime;
            lastTime = time;
            window.__tetrusGameState = state; // expose for DeviceCanvas buttons
            update(dt);
            draw();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
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
