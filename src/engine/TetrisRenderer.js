import { COLS, ROWS, VISIBLE_ROWS } from './TetrisEngine.js';

export const PALETTE = {
    bg: '#050808',
    empty: '#0f1714',
    grid: '#1a2e25',
    highlight: '#4BD8A0',
    text: '#4BD8A0',
    textDim: '#2a7558',
    panel: '#0a1410',
    border: '#2a7558'
};

export class TetrisRenderer {
    constructor() {
        this.muteBtn = null; // { x, y, w, h }
        this.boardX = 0;
        this.boardY = 0;
        this.cellSize = 0;
    }

    setCtxFont(ctx, fontStr) {
        if (ctx.font !== fontStr) {
            ctx.font = fontStr;
        }
    }

    drawCell(ctx, x, y, size, color) {
        if (color && color !== 0) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, size, size);
            // Highlight shine for retro 3D feel
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(x, y, size - 2, 2); 
            ctx.fillRect(x, y, 2, size - 2); 
            // Shadow borders
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(x + size - 2, y + 2, 2, size - 2);
            ctx.fillRect(x + 2, y + size - 2, size - 2, 2);
        }
    }

    drawBox(ctx, txt, val, x, y, w, h) {
        ctx.fillStyle = PALETTE.panel;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = PALETTE.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = PALETTE.textDim;
        const titleSize = Math.max(5, Math.floor(w * 0.12));
        this.setCtxFont(ctx, `${titleSize}px "Press Start 2P", monospace`);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(txt, x + w / 2, y + h * 0.14);
        
        ctx.fillStyle = PALETTE.text;
        const valSize = Math.max(6, Math.floor(w * 0.17));
        this.setCtxFont(ctx, `${valSize}px "Press Start 2P", monospace`);
        ctx.fillText(val, x + w / 2, y + h * 0.55);
    }

    drawMuteBtn(ctx, isMuted, x, y, w, h) {
        this.muteBtn = { x, y, w, h };
        const isM = isMuted;
        ctx.fillStyle = isM ? 'rgba(255,90,60,0.18)' : 'rgba(75,216,160,0.14)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = isM ? 'rgba(255,90,60,0.55)' : 'rgba(75,216,160,0.55)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        const icon = isM ? '\u{1F507}' : '\u{1F50A}';
        const fontSize = Math.max(8, Math.floor(h * 0.52));
        this.setCtxFont(ctx, `${fontSize}px monospace`);
        ctx.fillStyle = isM ? 'rgba(255,90,60,0.9)' : 'rgba(75,216,160,0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x + w / 2, y + h * 0.40);
        
        const labelSize = Math.max(4, Math.floor(h * 0.18));
        this.setCtxFont(ctx, `${labelSize}px "Press Start 2P", monospace`);
        ctx.fillStyle = isM ? 'rgba(255,90,60,0.6)' : 'rgba(75,216,160,0.6)';
        ctx.fillText(isM ? 'MUTED' : 'SFX ON', x + w / 2, y + h * 0.80);
    }

    draw(ctx, engine, W, H, caseX, caseW, dpr, isDark, isMuted) {
        // Clear canvas context
        ctx.clearRect(0, 0, W, H);

        // 1. Right Shell casing backplane
        ctx.fillStyle = isDark ? '#0b120f' : '#D1D5DB';
        ctx.fillRect(caseX, 0, caseW, H);

        // 2. Left Game Screen border/screen casing
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, caseX, H);

        const bezelPad = Math.max(8, Math.floor(Math.min(W, H) * 0.04));
        ctx.strokeStyle = PALETTE.highlight;
        ctx.lineWidth = 2;
        ctx.strokeRect(bezelPad, bezelPad, caseX - bezelPad * 2, H - bezelPad * 2);

        // 3. Grid Coordinates setup
        const screenW = caseX;
        const screenAreaW = screenW - bezelPad * 2;
        const screenAreaH = H - bezelPad * 2;

        const statsW = Math.floor(screenAreaW * 0.38);
        const gameW = screenAreaW - statsW;
        const gameH = screenAreaH;
        
        const cellH = Math.floor(gameH / VISIBLE_ROWS);
        const cellW = Math.floor(gameW / COLS);
        this.cellSize = Math.min(cellH, cellW);

        this.boardX = bezelPad + Math.floor((gameW - COLS * this.cellSize) / 2);
        this.boardY = bezelPad + Math.floor((gameH - VISIBLE_ROWS * this.cellSize) / 2);

        const statsX = bezelPad + gameW;
        const statsY = bezelPad;
        const statsH = screenAreaH;

        if (!this.cellSize) return;

        const boardW = COLS * this.cellSize;
        const boardH = VISIBLE_ROWS * this.cellSize;

        // Draw solid background grid area
        ctx.fillStyle = PALETTE.empty;
        ctx.fillRect(this.boardX, this.boardY, boardW, boardH);

        // Stroke grid lines in a single batched path
        ctx.beginPath();
        ctx.strokeStyle = PALETTE.grid;
        ctx.lineWidth = 1;
        // Vertical lines
        for (let c = 0; c <= COLS; c++) {
            const x = this.boardX + c * this.cellSize;
            ctx.moveTo(x, this.boardY);
            ctx.lineTo(x, this.boardY + boardH);
        }
        // Horizontal lines
        for (let r = 0; r <= VISIBLE_ROWS; r++) {
            const y = this.boardY + r * this.cellSize;
            ctx.moveTo(this.boardX, y);
            ctx.lineTo(this.boardX + boardW, y);
        }
        ctx.stroke();

        // Draw Board Cells
        for (let r = 2; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cellVal = engine.board[r][c];
                if (cellVal !== 0) {
                    this.drawCell(ctx, this.boardX + c * this.cellSize, this.boardY + (r - 2) * this.cellSize, this.cellSize, cellVal);
                }
            }
        }

        // Draw active falling piece and ghost guide (only if playing or paused)
        if ((engine.state === 'playing' || engine.state === 'paused') && engine.current) {
            const current = engine.current;
            
            // ── A. Render Ghost Piece (Global Alpha 0.22) ──
            const ghostY = engine.getGhostY();
            ctx.globalAlpha = 0.22;
            for (let r = 0; r < current.shape.length; r++) {
                for (let c = 0; c < current.shape[r].length; c++) {
                    if (current.shape[r][c] && ghostY + r >= 2) {
                        this.drawCell(ctx, this.boardX + (current.x + c) * this.cellSize, this.boardY + (ghostY + r - 2) * this.cellSize, this.cellSize, current.color);
                    }
                }
            }
            ctx.globalAlpha = 1.0;

            // ── B. Render Falling Piece ──
            for (let r = 0; r < current.shape.length; r++) {
                for (let c = 0; c < current.shape[r].length; c++) {
                    if (current.shape[r][c] && current.y + r >= 2) {
                        this.drawCell(ctx, this.boardX + (current.x + c) * this.cellSize, this.boardY + (current.y + r - 2) * this.cellSize, this.cellSize, current.color);
                    }
                }
            }
        }

        // ── HUD Panel (Right Side Stats HUD) ──
        const boxW = statsW * 0.8;
        const boxX = statsX + (statsW - boxW) / 2;
        const boxH = Math.min(statsH * 0.12, 50 * dpr);
        const nextHoldH = Math.min(statsH * 0.16, 64 * dpr);
        const gap = statsH * 0.024;
        let curY = statsY + statsH * 0.03;

        // Score, Level, Lines
        this.drawBox(ctx, 'SCORE', engine.score.toString(), boxX, curY, boxW, boxH);
        curY += boxH + gap;
        this.drawBox(ctx, 'LEVEL', engine.level.toString(), boxX, curY, boxW, boxH);
        curY += boxH + gap;
        this.drawBox(ctx, 'LINES', engine.lines.toString(), boxX, curY, boxW, boxH);
        curY += boxH + gap;

        // Next Piece Preview Box
        ctx.fillStyle = PALETTE.panel;
        ctx.fillRect(boxX, curY, boxW, nextHoldH);
        ctx.strokeStyle = PALETTE.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, curY, boxW, nextHoldH);
        
        ctx.fillStyle = PALETTE.textDim;
        let hudTitleSize = Math.max(5, Math.floor(boxW * 0.12));
        this.setCtxFont(ctx, `${hudTitleSize}px "Press Start 2P", monospace`);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('NEXT', boxX + boxW / 2, curY + nextHoldH * 0.08);

        if (engine.nextPiece) {
            const pSize = Math.floor(this.cellSize * 0.72);
            const shape = engine.nextPiece.shape;
            const pW = shape[0].length * pSize;
            const pH = shape.length * pSize;
            const npX = boxX + boxW / 2 - pW / 2;
            const npY = curY + nextHoldH * 0.46 - pH / 2;
            
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        this.drawCell(ctx, npX + c * pSize, npY + r * pSize, pSize, engine.nextPiece.color);
                    }
                }
            }
        }
        curY += nextHoldH + gap;

        // Hold Piece Box
        ctx.fillStyle = PALETTE.panel;
        ctx.fillRect(boxX, curY, boxW, nextHoldH);
        ctx.strokeStyle = PALETTE.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, curY, boxW, nextHoldH);
        
        ctx.fillStyle = PALETTE.textDim;
        this.setCtxFont(ctx, `${hudTitleSize}px "Press Start 2P", monospace`);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('HOLD', boxX + boxW / 2, curY + nextHoldH * 0.08);

        if (engine.holdPiece) {
            const pSize = Math.floor(this.cellSize * 0.72);
            const shape = engine.holdPiece.shape;
            const pW = shape[0].length * pSize;
            const pH = shape.length * pSize;
            const npX = boxX + boxW / 2 - pW / 2;
            const npY = curY + nextHoldH * 0.46 - pH / 2;
            
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        this.drawCell(ctx, npX + c * pSize, npY + r * pSize, pSize, engine.holdPiece.color);
                    }
                }
            }
        }
        curY += nextHoldH + gap;

        // Mute Button below HOLD Box
        const muteH = Math.min(statsH * 0.10, 42 * dpr);
        this.drawMuteBtn(ctx, isMuted, boxX, curY, boxW, muteH);

        // ── Full-Screen Overlay Drawing based on Game State ──
        if (engine.state === 'menu') {
            ctx.fillStyle = 'rgba(5, 8, 8, 0.88)';
            ctx.fillRect(this.boardX, this.boardY, boardW, boardH);

            ctx.fillStyle = PALETTE.highlight;
            ctx.textAlign = 'center';
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.85)}px "Press Start 2P", monospace`);
            ctx.fillText('BLOCKDROP', this.boardX + boardW / 2, this.boardY + boardH * 0.16);

            // Retro style high scores list
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.42)}px "Press Start 2P", monospace`);
            ctx.fillStyle = PALETTE.textDim;
            ctx.fillText('HIGH SCORES', this.boardX + boardW / 2, this.boardY + boardH * 0.32);

            ctx.textAlign = 'left';
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.38)}px "Press Start 2P", monospace`);
            const topScores = engine.highScores.slice(0, 5);
            if (topScores.length === 0) {
                ctx.textAlign = 'center';
                ctx.fillText('NO SCORES YET', this.boardX + boardW / 2, this.boardY + boardH * 0.45);
            } else {
                topScores.forEach((s, idx) => {
                    const rowY = this.boardY + boardH * (0.40 + idx * 0.07);
                    ctx.fillStyle = idx === 0 ? PALETTE.highlight : PALETTE.textDim;
                    ctx.fillText(`${idx + 1}.`, this.boardX + boardW * 0.12, rowY);
                    ctx.fillText(`${s.initials}`, this.boardX + boardW * 0.24, rowY);
                    ctx.textAlign = 'right';
                    ctx.fillText(`${s.score}`, this.boardX + boardW * 0.88, rowY);
                    ctx.textAlign = 'left';
                });
            }

            ctx.textAlign = 'center';
            ctx.fillStyle = PALETTE.highlight;
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.45)}px "Press Start 2P", monospace`);
            if (Math.floor(performance.now() / 450) % 2 === 0) {
                ctx.fillText('CLICK START', this.boardX + boardW / 2, this.boardY + boardH * 0.82);
            }
            
        } else if (engine.state === 'paused') {
            ctx.fillStyle = 'rgba(5, 8, 8, 0.85)';
            ctx.fillRect(this.boardX, this.boardY, boardW, boardH);
            ctx.fillStyle = PALETTE.highlight;
            ctx.textAlign = 'center';
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.8)}px "Press Start 2P", monospace`);
            ctx.fillText('PAUSED', this.boardX + boardW / 2, this.boardY + boardH * 0.5);
            
        } else if (engine.state === 'gameover') {
            ctx.fillStyle = 'rgba(5, 8, 8, 0.88)';
            ctx.fillRect(this.boardX, this.boardY, boardW, boardH);
            ctx.fillStyle = '#FF1744';
            ctx.textAlign = 'center';
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.8)}px "Press Start 2P", monospace`);
            ctx.fillText('GAME OVER', this.boardX + boardW / 2, this.boardY + boardH * 0.44);
            
            ctx.fillStyle = PALETTE.highlight;
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.45)}px "Press Start 2P", monospace`);
            ctx.fillText(`SCORE: ${engine.score}`, this.boardX + boardW / 2, this.boardY + boardH * 0.56);
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.35)}px "Press Start 2P", monospace`);
            ctx.fillText('PRESS START TO CONTINUE', this.boardX + boardW / 2, this.boardY + boardH * 0.68);
            
        } else if (engine.state === 'initials_entry') {
            ctx.fillStyle = 'rgba(5, 8, 8, 0.92)';
            ctx.fillRect(this.boardX, this.boardY, boardW, boardH);

            ctx.fillStyle = PALETTE.highlight;
            ctx.textAlign = 'center';
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.6)}px "Press Start 2P", monospace`);
            ctx.fillText('NEW HIGH SCORE!', this.boardX + boardW / 2, this.boardY + boardH * 0.22);
            
            ctx.fillStyle = PALETTE.textDim;
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.38)}px "Press Start 2P", monospace`);
            ctx.fillText('ENTER INITIALS', this.boardX + boardW / 2, this.boardY + boardH * 0.34);

            // Display initials letters
            const size = Math.floor(this.cellSize * 1.2);
            const startX = this.boardX + boardW / 2 - size;
            const letterY = this.boardY + boardH * 0.56;

            for (let i = 0; i < 3; i++) {
                const charX = startX + i * size;
                ctx.fillStyle = engine.initialsCursor === i ? PALETTE.highlight : PALETTE.textDim;
                this.setCtxFont(ctx, `${Math.floor(this.cellSize * 1.3)}px "Press Start 2P", monospace`);
                ctx.fillText(engine.initials[i], charX, letterY);

                // Flash selection indicator arrow above current cursor letter
                if (engine.initialsCursor === i) {
                    this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.62)}px "Press Start 2P", monospace`);
                    ctx.fillText('▲', charX, letterY - this.cellSize * 1.6);
                    ctx.fillText('▼', charX, letterY + this.cellSize * 1.3);
                }
            }

            ctx.fillStyle = PALETTE.textDim;
            this.setCtxFont(ctx, `${Math.floor(this.cellSize * 0.30)}px "Press Start 2P", monospace`);
            ctx.fillText('UP/DOWN: SELECT  SPACE/ENTER: COMMMIT', this.boardX + boardW / 2, this.boardY + boardH * 0.85);
        }
    }
}
