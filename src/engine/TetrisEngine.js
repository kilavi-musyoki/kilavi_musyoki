import { TetrisAudio } from './TetrisAudio.js';

export const COLS = 10;
export const ROWS = 22;
export const VISIBLE_ROWS = 20;

export const PIECES = {
    I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
    O: { shape: [[1,1],[1,1]] },
    T: { shape: [[0,0,0],[1,1,1],[0,1,0]] },
    L: { shape: [[0,0,1],[1,1,1],[0,0,0]] },
    J: { shape: [[1,0,0],[1,1,1],[0,0,0]] },
    S: { shape: [[0,1,1],[1,1,0],[0,0,0]] },
    Z: { shape: [[1,1,0],[0,1,1],[0,0,0]] }
};

export const PIECE_COLORS = {
    I: '#00E5FF',
    O: '#FFD600',
    T: '#E040FB',
    L: '#FF6D00',
    J: '#448AFF',
    S: '#00E676',
    Z: '#FF1744'
};

const GRAVITY = [60, 48, 40, 36, 33, 30, 26, 23, 20, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3];
const getGravityFrames = (level) => GRAVITY[Math.min(level, 20)] || 3;

const DAS = 250; 
const ARR = 60; 
const LOCK_DELAY = 500; // ms
const MAX_LOCK_MOVES = 15;

export class TetrisEngine {
    constructor() {
        this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 0;
        this.state = 'menu'; // 'menu' | 'playing' | 'paused' | 'gameover' | 'initials_entry'
        
        this.bag = [];
        this.current = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.hasHeldThisTurn = false;
        
        this.lockDelayTimer = 0;
        this.lockMoveCount = 0;
        
        this.highScores = JSON.parse(localStorage.getItem('blockdrop_gb_scores') || '[]');
        this.initials = ['A', 'A', 'A'];
        this.initialsCursor = 0;
        
        this.keysPressed = {};
        this.keyTimers = { ArrowLeft: 0, ArrowRight: 0, ArrowDown: 0 };
        this.lastHardDrop = 0;
        this.fallTimer = 0;
    }

    reset() {
        this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 0;
        this.bag = [];
        this.holdPiece = null;
        this.hasHeldThisTurn = false;
        this.current = this.getNextPiece();
        this.nextPiece = this.getNextPiece();
        this.lockDelayTimer = 0;
        this.lockMoveCount = 0;
        this.fallTimer = 0;
        this.state = 'playing';
        TetrisAudio.init();
    }

    getNextPiece() {
        if (this.bag.length === 0) {
            this.bag = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
            // Standard Durstenfeld shuffle
            for (let i = this.bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
        }
        const type = this.bag.pop();
        return {
            type,
            color: PIECE_COLORS[type],
            shape: PIECES[type].shape.map(r => [...r]),
            x: Math.floor((COLS - PIECES[type].shape[0].length) / 2),
            y: type === 'I' ? -1 : 0 
        };
    }

    isValid(cx, cy, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const nx = cx + c;
                    const ny = cy + r;
                    if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
                    if (ny >= 0 && this.board[ny][nx] !== 0) return false;
                }
            }
        }
        return true;
    }

    rotateCW(shape) {
        return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    }

    rotateCCW(shape) {
        return shape[0].map((_, i) => shape.map(row => row[shape[0].length - 1 - i]));
    }

    attemptRotation(clockwise = true) {
        if (this.state !== 'playing' || !this.current) return;
        const rotatedShape = clockwise ? this.rotateCW(this.current.shape) : this.rotateCCW(this.current.shape);
        
        // Lightweight Wall/Floor Kicks
        const kicks = [
            [0, 0],   // Standard rotation
            [-1, 0],  // Kick left 1
            [1, 0],   // Kick right 1
            [0, -1],  // Kick up 1 (floor kick)
            [-2, 0],  // Kick left 2 (specifically for I piece)
            [2, 0]    // Kick right 2
        ];

        for (const [dx, dy] of kicks) {
            if (this.isValid(this.current.x + dx, this.current.y + dy, rotatedShape)) {
                this.current.shape = rotatedShape;
                this.current.x += dx;
                this.current.y += dy;
                TetrisAudio.SFX.rotate();
                this.refreshLockDelay();
                return;
            }
        }
    }

    hold() {
        if (this.state !== 'playing' || !this.current || this.hasHeldThisTurn) return;

        const temp = this.holdPiece;
        this.holdPiece = {
            type: this.current.type,
            color: this.current.color,
            shape: PIECES[this.current.type].shape.map(r => [...r])
        };

        if (temp === null) {
            this.current = this.nextPiece;
            this.nextPiece = this.getNextPiece();
        } else {
            this.current = {
                type: temp.type,
                color: temp.color,
                shape: temp.shape,
                x: Math.floor((COLS - temp.shape[0].length) / 2),
                y: temp.type === 'I' ? -1 : 0
            };
        }

        this.hasHeldThisTurn = true;
        this.lockDelayTimer = 0;
        this.lockMoveCount = 0;
        this.fallTimer = 0;
        TetrisAudio.SFX.move();
    }

    refreshLockDelay() {
        if (this.lockDelayTimer > 0 && this.lockMoveCount < MAX_LOCK_MOVES) {
            this.lockDelayTimer = performance.now();
            this.lockMoveCount++;
        }
    }

    lockPiece() {
        if (!this.current) return;
        for (let r = 0; r < this.current.shape.length; r++) {
            for (let c = 0; c < this.current.shape[r].length; c++) {
                if (this.current.shape[r][c]) {
                    if (this.current.y + r < 0) continue;
                    this.board[this.current.y + r][this.current.x + c] = this.current.color;
                }
            }
        }
        TetrisAudio.SFX.lock();

        let linesCleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.board[r].every(v => v !== 0)) {
                this.board.splice(r, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                r++;
            }
        }

        if (linesCleared > 0) {
            const prevLevel = this.level;
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10);
            const pts = [0, 40, 100, 300, 1200][linesCleared] * (this.level + 1);
            this.score += pts;
            TetrisAudio.SFX.clear(linesCleared);
            if (this.level > prevLevel) TetrisAudio.SFX.levelUp();
        }

        this.current = this.nextPiece;
        this.nextPiece = this.getNextPiece();
        this.hasHeldThisTurn = false;
        this.lockDelayTimer = 0;
        this.lockMoveCount = 0;

        if (!this.isValid(this.current.x, this.current.y, this.current.shape)) {
            this.state = 'gameover';
            TetrisAudio.SFX.gameOver();
            
            // Check if score makes it to top 10
            const qualifies = this.highScores.length < 10 || this.score > this.highScores[this.highScores.length - 1].score;
            if (qualifies) {
                this.state = 'initials_entry';
                this.initials = ['A', 'A', 'A'];
                this.initialsCursor = 0;
            } else {
                this.saveHighScore('???');
            }
        }
    }

    saveHighScore(initialsStr) {
        this.highScores.push({
            score: this.score,
            level: this.level,
            lines: this.lines,
            initials: initialsStr
        });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);
        localStorage.setItem('blockdrop_gb_scores', JSON.stringify(this.highScores));
    }

    handleInitialsInput(key) {
        if (this.state !== 'initials_entry') return;

        if (key === 'ArrowLeft') {
            this.initialsCursor = (this.initialsCursor + 2) % 3; // wrap around left
            TetrisAudio.SFX.move();
        } else if (key === 'ArrowRight') {
            this.initialsCursor = (this.initialsCursor + 1) % 3; // wrap around right
            TetrisAudio.SFX.move();
        } else if (key === 'ArrowUp' || key === 'x') {
            let charCode = this.initials[this.initialsCursor].charCodeAt(0);
            charCode = charCode === 90 ? 65 : charCode + 1; // Z -> A
            this.initials[this.initialsCursor] = String.fromCharCode(charCode);
            TetrisAudio.SFX.rotate();
        } else if (key === 'ArrowDown' || key === 'z') {
            let charCode = this.initials[this.initialsCursor].charCodeAt(0);
            charCode = charCode === 65 ? 90 : charCode - 1; // A -> Z
            this.initials[this.initialsCursor] = String.fromCharCode(charCode);
            TetrisAudio.SFX.rotate();
        } else if (key === 'Enter' || key === ' ') {
            const initialsStr = this.initials.join('');
            this.saveHighScore(initialsStr);
            this.state = 'menu';
            TetrisAudio.SFX.lock();
        }
    }

    handleInputDown(key) {
        if (key === 'p' || key === 'Enter') {
            if (this.state === 'menu') {
                this.reset();
            } else if (this.state === 'playing') {
                this.state = 'paused';
            } else if (this.state === 'paused') {
                this.state = 'playing';
            } else if (this.state === 'gameover') {
                this.state = 'menu';
            }
            return;
        }

        if (this.state === 'initials_entry') {
            this.handleInitialsInput(key);
            return;
        }

        if (this.state === 'playing') {
            if (key === 'x' || key === 'ArrowUp') {
                this.attemptRotation(true);
            } else if (key === 'z') {
                this.attemptRotation(false);
            } else if (key === 'c' || key === 'Shift') {
                this.hold();
            } else if (key === ' ' && performance.now() - this.lastHardDrop > 200) {
                this.lastHardDrop = performance.now();
                while (this.isValid(this.current.x, this.current.y + 1, this.current.shape)) {
                    this.current.y++;
                    this.score += 2;
                }
                this.lockPiece();
            } else if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowDown') {
                this.keysPressed[key] = performance.now();
                this.keyTimers[key] = 0; // trigger immediate move
            }
        }
    }

    handleInputUp(key) {
        if (this.keysPressed[key] !== undefined) {
            delete this.keysPressed[key];
            if (this.keyTimers[key] !== undefined) {
                this.keyTimers[key] = 0;
            }
        }
    }

    getGhostY() {
        if (!this.current) return 0;
        let ghostY = this.current.y;
        while (this.isValid(this.current.x, ghostY + 1, this.current.shape)) {
            ghostY++;
        }
        return ghostY;
    }

    update(dt) {
        if (this.state !== 'playing' || !this.current) return;

        // ── 1. DAS / ARR continuous movement triggers ──
        const handleDirection = (key, dx, dy) => {
            if (this.keysPressed[key]) {
                if (this.keyTimers[key] === 0) {
                    if (this.isValid(this.current.x + dx, this.current.y + dy, this.current.shape)) {
                        this.current.x += dx;
                        this.current.y += dy;
                        if (dy > 0) {
                            this.score += 1;
                            TetrisAudio.SFX.softDrop();
                        } else {
                            TetrisAudio.SFX.move();
                        }
                        this.refreshLockDelay();
                    }
                    this.keyTimers[key] += dt;
                } else {
                    this.keyTimers[key] += dt;
                    if (this.keyTimers[key] >= DAS) {
                        const extra = this.keyTimers[key] - DAS;
                        const moves = Math.floor(extra / ARR);
                        for (let i = 0; i < moves; i++) {
                            if (this.isValid(this.current.x + dx, this.current.y + dy, this.current.shape)) {
                                this.current.x += dx;
                                this.current.y += dy;
                                if (dy > 0) {
                                    this.score += 1;
                                    TetrisAudio.SFX.softDrop();
                                } else {
                                    TetrisAudio.SFX.move();
                                }
                                this.refreshLockDelay();
                            }
                        }
                        if (moves > 0) {
                            this.keyTimers[key] -= (moves * ARR);
                        }
                    }
                }
            }
        };

        handleDirection('ArrowLeft', -1, 0);
        handleDirection('ArrowRight', 1, 0);
        handleDirection('ArrowDown', 0, 1);

        // ── 2. Gravity Fall Cycles ──
        this.fallTimer += dt;
        const msPerFrame = 1000 / 60;
        const dropInterval = getGravityFrames(this.level) * msPerFrame;

        if (this.fallTimer >= dropInterval) {
            this.fallTimer -= dropInterval;
            if (this.isValid(this.current.x, this.current.y + 1, this.current.shape)) {
                this.current.y++;
                this.lockDelayTimer = 0; // reset lock delay if falling succeeds
                this.lockMoveCount = 0;
            } else {
                // Ground contacted: start lock delay
                if (this.lockDelayTimer === 0) {
                    this.lockDelayTimer = performance.now();
                }
            }
        }

        // ── 3. Lock Delay Resolution ──
        if (this.lockDelayTimer > 0 && performance.now() - this.lockDelayTimer >= LOCK_DELAY) {
            this.lockPiece();
        }
    }
}
