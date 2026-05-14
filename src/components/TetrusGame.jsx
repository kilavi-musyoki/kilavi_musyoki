import React, { useEffect, useRef, memo } from 'react';

// ── Tetrominoes ───────────────────────────────────────────────────────────────
const TETROMINOES = [
    { cells: [[1,1,1,1]],        color: '#00E5FF' },
    { cells: [[1,1],[1,1]],      color: '#FFD600' },
    { cells: [[0,1,0],[1,1,1]], color: '#E040FB' },
    { cells: [[0,1,1],[1,1,0]], color: '#00E676' },
    { cells: [[1,1,0],[0,1,1]], color: '#FF1744' },
    { cells: [[1,0,0],[1,1,1]], color: '#448AFF' },
    { cells: [[0,0,1],[1,1,1]], color: '#FF6D00' },
];

const COLS = 10, ROWS = 20;
const SCORE_TABLE  = [0, 100, 300, 500, 800];
const LEVEL_LINES  = 10;
const DROP_INTERVALS = [820,700,600,500,400,300,220,150,100,80,60];

const GLITCH_LIGHT  = 0.20;
const GLITCH_HEAVY  = 0.40;
const GLITCH_RESUME = 0.06;
const CTRL_ZONE_RATIO = 0.34; // bottom 34% = controls

// ── Button definitions ────────────────────────────────────────────────────────
// Left cluster: D-Pad  |  Right cluster: Action buttons
const BTN_DEFS = [
    { id:'left',   icon:'◄', label:'',     key:'ArrowLeft',  color:'#4BD8A0', repeat:true,  xFrac:0.11 },
    { id:'down',   icon:'▼', label:'',     key:'ArrowDown',  color:'#4BD8A0', repeat:true,  xFrac:0.26 },
    { id:'right',  icon:'►', label:'',     key:'ArrowRight', color:'#4BD8A0', repeat:true,  xFrac:0.41 },
    { id:'rotate', icon:'↺', label:'ROT',  key:'ArrowUp',    color:'#6FD4FF', repeat:false, xFrac:0.65, big:true },
    { id:'drop',   icon:'⬇', label:'DROP', key:' ',          color:'#E040FB', repeat:false, xFrac:0.84, big:true },
];
const DIVIDER_FRAC = 0.54; // visual divider between D-pad and action

// ── Audio ─────────────────────────────────────────────────────────────────────
let _isMuted = false;
const _arc = (() => {
    let actx = null;
    return (freq, type='sine', dur=0.05, vol=0.04) => {
        if(_isMuted) return;
        try {
            if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
            if (actx.state === 'suspended') actx.resume();
            const o = actx.createOscillator(), g = actx.createGain();
            o.connect(g); g.connect(actx.destination);
            o.type = type; o.frequency.value = freq;
            g.gain.setValueAtTime(vol, actx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
            o.start(); o.stop(actx.currentTime + dur);
        } catch(_) {}
    };
})();
const SFX = {
    move:    ()  => _arc(330,'square',0.018,0.022),
    rotate:  ()  => _arc(550,'triangle',0.025,0.026),
    drop:    ()  => _arc(130,'sine',0.09,0.055),
    line:    (n) => [523,659,784,1047].slice(0,n).forEach((f,i)=>setTimeout(()=>_arc(f,'sine',0.1,0.07),i*55)),
    tetris:  ()  => [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>_arc(f,'sine',0.12,0.09),i*45)),
    levelUp: ()  => [440,880,1320].forEach((f,i)=>setTimeout(()=>_arc(f,'square',0.08,0.055),i*80)),
    over:    ()  => [350,280,210,130].forEach((f,i)=>setTimeout(()=>_arc(f,'sawtooth',0.14,0.07),i*90)),
    glitch:  ()  => _arc(50+Math.random()*190,'sawtooth',0.038,0.038),
};

// ── Game helpers ──────────────────────────────────────────────────────────────
const makeBoard  = () => Array.from({length:ROWS}, ()=>Array(COLS).fill(null));
const randPiece  = () => {
    const t = TETROMINOES[Math.floor(Math.random()*TETROMINOES.length)];
    return { cells:t.cells.map(r=>[...r]), color:t.color, x:Math.floor((COLS-t.cells[0].length)/2), y:0 };
};
const rotateCW   = cells => {
    const R=cells.length, C=cells[0].length;
    return Array.from({length:C},(_,c)=>Array.from({length:R},(__,r)=>cells[R-1-r][c]));
};
const isValid    = (board,cells,x,y) => {
    for(let r=0;r<cells.length;r++) for(let c=0;c<cells[r].length;c++){
        if(!cells[r][c]) continue;
        const nx=x+c,ny=y+r;
        if(nx<0||nx>=COLS||ny>=ROWS) return false;
        if(ny>=0 && board[ny][nx]) return false;
    }
    return true;
};
const placePiece = (board,piece) => {
    const nb=board.map(r=>[...r]);
    piece.cells.forEach((row,r)=>row.forEach((v,c)=>{if(v&&piece.y+r>=0)nb[piece.y+r][piece.x+c]=piece.color;}));
    return nb;
};
const clearFullLines = board => {
    const kept=board.filter(row=>!row.every(c=>c!==null));
    const count=ROWS-kept.length;
    return { board:[...Array.from({length:count},()=>Array(COLS).fill(null)),...kept], count };
};

// ── High-score persistence ───────────────────────────────────────────────────
const MAX_SCORES = 5;
const LS_KEY = 'tetrus_scores';
const loadScores = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};
const saveScore = (score, level, lines) => {
    const entry = { score, level: level+1, lines, date: new Date().toLocaleDateString() };
    const list = loadScores();
    list.push(entry);
    list.sort((a,b) => b.score - a.score);
    const trimmed = list.slice(0, MAX_SCORES);
    try { localStorage.setItem(LS_KEY, JSON.stringify(trimmed)); } catch {}
    return trimmed.findIndex(e => e === entry); // rank index (0-based), -1 if not found
};

// ── Component ─────────────────────────────────────────────────────────────────
export default memo(function TetrusGame({ glitchLevel=0 }) {
    const canvasRef = useRef(null);
    const rafRef    = useRef(null);

    const stateRef      = useRef('attract');
    const boardRef      = useRef(makeBoard());
    const flashBoardRef = useRef(null);
    const flashRowsRef  = useRef([]);
    const flashEndRef   = useRef(0);
    const curRef        = useRef(randPiece());
    const nextRef       = useRef(randPiece());
    const scoreRef      = useRef(0);
    const levelRef      = useRef(0);
    const linesRef      = useRef(0);
    const lastDropRef   = useRef(0);
    const lastHardDropRef = useRef(0);
    const overTimerRef  = useRef(null);
    const glitchRef     = useRef(0);
    const heavyGlRef    = useRef(false);
    const glitchSndRef  = useRef(0);
    const touchRef      = useRef(null);
    const btnsRef       = useRef([]);
    const pressedBtnRef = useRef(null);
    const btnTimerRef   = useRef(null);
    const btnIntervalRef= useRef(null);
    const pauseMenuRef  = useRef(0);
    const justUnpausedRef = useRef(false);
    const scoreBoardRef = useRef(loadScores()); // persisted top-5
    const lastRankRef   = useRef(-1);           // rank of most recent game-over score

    useEffect(()=>{ glitchRef.current = glitchLevel; }, [glitchLevel]);

    useEffect(()=>{
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const ctx  = canvas.getContext('2d');

        let W=0, H=0, gameH=0, ctrlH=0, cellSize=0, boardX=0, boardY=0;

        // ── Layout ────────────────────────────────────────────────────
        const calcLayout = () => {
            const rect = canvas.getBoundingClientRect();
            W = Math.round(rect.width * dpr);
            H = Math.round(rect.height * dpr);
            canvas.width = W; canvas.height = H;

            ctrlH = Math.floor(H * CTRL_ZONE_RATIO);
            gameH = H - ctrlH;

            // Full-width board (no side HUD stealing space)
            const hPad = Math.max(4, Math.floor(dpr * 3));
            const byHeight = Math.floor(gameH * 0.96 / ROWS);
            const byWidth  = Math.floor((W - hPad * 2) / COLS);
            cellSize = Math.min(byHeight, byWidth);

            // Center board horizontally and vertically in game zone
            boardX = Math.floor((W - COLS * cellSize) / 2);
            boardY = Math.floor((gameH - ROWS * cellSize) / 2);

            // Compute buttons — D-pad smaller, action buttons big
            const cy  = gameH + Math.floor(ctrlH * 0.5);
            const brD = Math.min(Math.floor(ctrlH * 0.30), Math.floor(W * 0.072)); // D-pad radius
            const brA = Math.min(Math.floor(ctrlH * 0.36), Math.floor(W * 0.088)); // Action radius
            btnsRef.current = BTN_DEFS.map(def => ({
                ...def,
                x: Math.round(W * def.xFrac),
                y: Math.round(cy),
                r: def.big ? brA : brD,
            }));
        };

        const ro = new ResizeObserver(calcLayout);
        ro.observe(canvas); calcLayout();

        // ── Reset / Land ──────────────────────────────────────────────────────
        const resetGame = (goToAttract=false) => {
            boardRef.current=makeBoard(); flashBoardRef.current=null; flashRowsRef.current=[]; flashEndRef.current=0;
            curRef.current=randPiece(); nextRef.current=randPiece();
            scoreRef.current=0; levelRef.current=0; linesRef.current=0; lastDropRef.current=0;
            stateRef.current = goToAttract ? 'attract' : 'playing';
            lastRankRef.current = -1;
            if(overTimerRef.current){clearTimeout(overTimerRef.current);overTimerRef.current=null;}
        };

        const startGame = () => {
            resetGame(false);
            justUnpausedRef.current = true;
        };

        const landPiece = (hardDrop=false) => {
            if(hardDrop) SFX.drop();
            const placed = placePiece(boardRef.current, curRef.current);
            const {board:cleared,count} = clearFullLines(placed);
            if(count>0){
                const fr=[];
                for(let r=0;r<ROWS;r++) if(placed[r].every(c=>c!==null)) fr.push(r);
                flashBoardRef.current=placed; flashRowsRef.current=fr; flashEndRef.current=Date.now()+220;
                setTimeout(()=>{boardRef.current=cleared;flashBoardRef.current=null;flashRowsRef.current=[];},220);
                const prev=levelRef.current;
                linesRef.current+=count;
                scoreRef.current+=(SCORE_TABLE[Math.min(count,4)]||0)*(levelRef.current+1);
                levelRef.current=Math.min(10,Math.floor(linesRef.current/LEVEL_LINES));
                if(count===4) SFX.tetris(); else SFX.line(count);
                if(levelRef.current>prev) SFX.levelUp();
            } else { boardRef.current=placed; }
            curRef.current=nextRef.current; nextRef.current=randPiece();
            const chk=count>0?cleared:placed;
            if(!isValid(chk,curRef.current.cells,curRef.current.x,curRef.current.y)){
                // Save score and record rank
                const rank = saveScore(scoreRef.current, levelRef.current, linesRef.current);
                lastRankRef.current = rank;
                scoreBoardRef.current = loadScores();
                stateRef.current='gameover'; SFX.over();
                overTimerRef.current=setTimeout(()=>resetGame(true), 4000);
            }
        };

        // ── Actions ───────────────────────────────────────────────────────────
        const canInput = ()=>stateRef.current==='playing'&&Date.now()>=flashEndRef.current;
        const tryMove  = dx=>{const c=curRef.current;if(isValid(boardRef.current,c.cells,c.x+dx,c.y)){c.x+=dx;SFX.move();}};
        const tryRotate= ()=>{
            const c=curRef.current,rot=rotateCW(c.cells),b=boardRef.current;
            if      (isValid(b,rot,c.x,  c.y)){c.cells=rot;SFX.rotate();}
            else if (isValid(b,rot,c.x-1,c.y)){c.cells=rot;c.x--;SFX.rotate();}
            else if (isValid(b,rot,c.x+1,c.y)){c.cells=rot;c.x++;SFX.rotate();}
        };
        const trySoft  = ()=>{if(isValid(boardRef.current,curRef.current.cells,curRef.current.x,curRef.current.y+1)){curRef.current.y++;scoreRef.current++;}};
        const tryDrop  = ()=>{
            if(Date.now() - lastHardDropRef.current < 250) return;
            lastHardDropRef.current = Date.now();
            const c=curRef.current;
            while(isValid(boardRef.current,c.cells,c.x,c.y+1)){
                c.y++;
                scoreRef.current+=2;
            }
            landPiece(true);
        };

        const PAUSE_ITEMS = ['▶  RESUME','🏆 HIGH SCORES','🔁 RESTART',`🔊 SOUND`,'🏠 QUIT'];

        const togglePause = () => {
            const s = stateRef.current;
            if (s === 'attract') { startGame(); return; }
            if (s === 'playing') { stateRef.current='paused'; pauseMenuRef.current=0; return; }
            if (s === 'paused')  { stateRef.current='playing'; justUnpausedRef.current=true; return; }
        };

        const execBtn = key => {
            const s = stateRef.current;

            // Escape / P always toggles pause or goes to attract
            if (key==='p'||key==='P'||key==='Escape') { togglePause(); return; }

            // ── Attract screen: any action starts game ────────────────────────
            if (s === 'attract') { startGame(); return; }

            // ── Scores screen: any action returns to attract ──────────────────
            if (s === 'scores') { stateRef.current='attract'; SFX.move(); return; }

            // ── Gameover: any action restarts immediately ─────────────────────
            if (s === 'gameover') {
                if(overTimerRef.current){clearTimeout(overTimerRef.current);overTimerRef.current=null;}
                resetGame(true); return;
            }

            // ── Pause menu ────────────────────────────────────────────────────
            if (s === 'paused') {
                const N = PAUSE_ITEMS.length;
                if (key==='ArrowUp')   { pauseMenuRef.current=(pauseMenuRef.current-1+N)%N; SFX.move(); }
                else if (key==='ArrowDown') { pauseMenuRef.current=(pauseMenuRef.current+1)%N; SFX.move(); }
                else if (key===' '||key==='Enter') {
                    SFX.rotate();
                    const sel = pauseMenuRef.current;
                    if (sel===0) { stateRef.current='playing'; justUnpausedRef.current=true; }       // Resume
                    else if (sel===1) { stateRef.current='scores'; }                                  // High Scores
                    else if (sel===2) { startGame(); }                                                 // Restart
                    else if (sel===3) { _isMuted=!_isMuted; }                                         // Sound
                    else if (sel===4) { resetGame(true); }                                             // Quit
                }
                return;
            }

            if(!canInput()) return;
            if     (key==='ArrowLeft')  tryMove(-1);
            else if(key==='ArrowRight') tryMove(1);
            else if(key==='ArrowUp')    tryRotate();
            else if(key==='ArrowDown')  trySoft();
            else if(key===' ')          tryDrop();
        };


        // ── Draw: board cells ─────────────────────────────────────────────────
        const drawCell = (gx, gy, color, alpha=1) => {
            const px=boardX+gx*cellSize, py=boardY+gy*cellSize;
            const pad=Math.max(1,Math.floor(cellSize*0.06));
            const iw=cellSize-pad*2, ih=cellSize-pad*2;
            ctx.save(); ctx.globalAlpha=alpha;
            // Phosphor fill + glow
            ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=Math.floor(cellSize*0.9);
            ctx.fillRect(px+pad, py+pad, iw, ih);
            // Specular top strip
            ctx.shadowBlur=0; ctx.fillStyle='rgba(255,255,255,0.26)';
            ctx.fillRect(px+pad, py+pad, iw, Math.max(1,Math.floor(ih*0.26)));
            // Left edge glint
            ctx.fillStyle='rgba(255,255,255,0.10)';
            ctx.fillRect(px+pad, py+pad, Math.max(1,Math.floor(iw*0.12)), ih);
            ctx.restore();
        };

        const drawGhostCell = (gx, gy, color) => {
            const px=boardX+gx*cellSize, py=boardY+gy*cellSize;
            const pad=Math.max(1,Math.floor(cellSize*0.08));
            ctx.strokeStyle=color+'55'; ctx.lineWidth=Math.max(1,Math.floor(cellSize*0.12));
            ctx.strokeRect(px+pad, py+pad, cellSize-pad*2, cellSize-pad*2);
        };

        // ── Draw: board background + grid + border ────────────────────────────
        const drawBoard = (ts, gl) => {
            const board=flashBoardRef.current||boardRef.current;
            const flashRows=flashRowsRef.current;
            const flashing=flashEndRef.current>Date.now();
            const flashPhase=flashing?1-(flashEndRef.current-Date.now())/220:1;

            // Board BG
            ctx.fillStyle='rgba(0,6,2,0.94)';
            ctx.fillRect(boardX, boardY, COLS*cellSize, ROWS*cellSize);

            // Grid
            ctx.strokeStyle='rgba(75,216,160,0.10)'; ctx.lineWidth=0.6;
            for(let r=0;r<=ROWS;r++){
                ctx.beginPath(); ctx.moveTo(boardX,boardY+r*cellSize);
                ctx.lineTo(boardX+COLS*cellSize,boardY+r*cellSize); ctx.stroke();
            }
            for(let c=0;c<=COLS;c++){
                ctx.beginPath(); ctx.moveTo(boardX+c*cellSize,boardY);
                ctx.lineTo(boardX+c*cellSize,boardY+ROWS*cellSize); ctx.stroke();
            }

            // Cells
            for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
                if(!board[r][c]) continue;
                let drawC=c, drawR=r, drawColor=board[r][c];
                
                if(gl > GLITCH_LIGHT && Math.random() < gl * 2.5) {
                    drawC += (Math.random() - 0.5) * gl * 4;
                    drawR += (Math.random() - 0.5) * gl * 4;
                    if(Math.random() < gl) drawColor = ['#FF1744','#00E5FF','#FFD600', '#E040FB'][Math.floor(Math.random()*4)];
                }
                
                if(flashRows.includes(r)&&flashing)
                    drawCell(drawC,drawR,flashPhase>0.5?'#FFFFFF':drawColor,1);
                else
                    drawCell(drawC,drawR,drawColor);
            }

            // Pulsing phosphor border
            const pulse=0.56+0.44*Math.sin(ts*0.0022);
            ctx.save();
            ctx.strokeStyle=`rgba(75,216,160,${0.55*pulse})`;
            ctx.shadowColor='#4BD8A0'; ctx.shadowBlur=Math.floor(cellSize*0.55)*pulse;
            ctx.lineWidth=Math.max(1.5,Math.floor(cellSize*0.11));
            ctx.strokeRect(boardX, boardY, COLS*cellSize, ROWS*cellSize);
            ctx.shadowBlur=0; ctx.restore();

            // Corner brackets on board
            const bm=Math.max(2,Math.floor(dpr*1.5)), bs=Math.floor(cellSize*0.7);
            ctx.strokeStyle=`rgba(75,216,160,${0.55*pulse})`; ctx.lineWidth=Math.max(1,dpr*1.2);
            ctx.shadowColor='#4BD8A0'; ctx.shadowBlur=4;
            [[boardX,boardY],[boardX+COLS*cellSize,boardY],[boardX,boardY+ROWS*cellSize],[boardX+COLS*cellSize,boardY+ROWS*cellSize]].forEach(([x,y],i)=>{
                const sx=i%2===0?1:-1, sy=i<2?1:-1;
                ctx.beginPath();
                ctx.moveTo(x+sx*bs, y); ctx.lineTo(x,y); ctx.lineTo(x,y+sy*bs);
                ctx.stroke();
            });
            ctx.shadowBlur=0;
        };

        const drawCurrentAndGhost = (gl) => {
            if(Date.now()<flashEndRef.current) return;
            const cur=curRef.current, board=boardRef.current;
            let gy=cur.y;
            while(isValid(board,cur.cells,cur.x,gy+1)) gy++;
            
            if(gy>cur.y) cur.cells.forEach((row,r)=>row.forEach((v,c)=>{
                if(v&&gy+r>=0) drawGhostCell(cur.x+c, gy+r, cur.color);
            }));
            
            cur.cells.forEach((row,r)=>row.forEach((v,c)=>{
                if(v&&cur.y+r>=0) {
                    let drawC = cur.x+c, drawR = cur.y+r, drawColor = cur.color;
                    if(gl > GLITCH_LIGHT && Math.random() < gl * 2) {
                        drawC += (Math.random() - 0.5) * gl * 3;
                        drawR += (Math.random() - 0.5) * gl * 3;
                        if(Math.random() < gl) drawColor = '#FFFFFF';
                    }
                    drawCell(drawC, drawR, drawColor);
                }
            }));
        };

        // ── Draw: HUD panel ───────────────────────────────────────────────────
        // ── Draw: compact HUD overlay (top strip on board) ─────────────────
        const drawHUD = () => {
            if (!cellSize) return;
            const bx = boardX, bw = COLS * cellSize;
            const fSz  = Math.max(7, Math.floor(cellSize * 0.80));
            const barH = Math.floor(fSz * 2.0);
            const by   = boardY;

            // Semi-transparent bar overlaid on top of the board
            ctx.save();
            ctx.fillStyle = 'rgba(0,8,3,0.82)';
            ctx.fillRect(bx, by, bw, barH);
            ctx.strokeStyle = 'rgba(75,216,160,0.20)';
            ctx.lineWidth = 0.7;
            ctx.strokeRect(bx, by, bw, barH);

            const midY = by + barH * 0.62;
            ctx.textBaseline = 'middle';

            // Score (left)
            const scoreSz = Math.max(7, Math.floor(cellSize * 0.82));
            ctx.font = `bold ${scoreSz}px "JetBrains Mono",monospace`;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#FFD600';
            ctx.shadowColor = '#FFD600'; ctx.shadowBlur = scoreSz * 0.55;
            ctx.fillText(String(scoreRef.current).padStart(6,'0'), bx + 4, midY);
            ctx.shadowBlur = 0;

            // Level (center)
            const lblSz = Math.max(5, Math.floor(cellSize * 0.56));
            ctx.font = `${lblSz}px "JetBrains Mono",monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#6FD4FF';
            ctx.fillText(`LV ${levelRef.current + 1}`, bx + bw / 2, midY);

            // NEXT preview (right)
            const next = nextRef.current;
            const pCell = Math.max(3, Math.floor(barH * 0.30));
            const pW    = next.cells[0].length * pCell;
            const pH    = next.cells.length    * pCell;
            const pX    = bx + bw - 4 - pW;
            const pY    = by + (barH - pH) / 2;
            next.cells.forEach((row, r) => row.forEach((v, c) => {
                if (!v) return;
                ctx.save();
                ctx.fillStyle = next.color;
                ctx.shadowColor = next.color; ctx.shadowBlur = pCell * 0.9;
                ctx.fillRect(pX + c * pCell + 1, pY + r * pCell + 1, pCell - 2, pCell - 2);
                ctx.restore();
            }));

            ctx.textBaseline = 'alphabetic';
            ctx.restore();
        };


        // ── Draw: arcade control zone ─────────────────────────────────────────
        const drawControls = (ts) => {
            if(!ctrlH||ctrlH<30) return;
            const btns=btnsRef.current;
            const pressedId=pressedBtnRef.current;

            // ── Panel background ──────────────────────────────────────────────
            const bgGrd=ctx.createLinearGradient(0,gameH,0,H);
            bgGrd.addColorStop(0,'rgba(2,10,5,0.99)');
            bgGrd.addColorStop(1,'rgba(1,6,3,0.99)');
            ctx.fillStyle=bgGrd;
            ctx.fillRect(0,gameH,W,ctrlH);

            // Glowing separator line
            ctx.save();
            ctx.shadowColor='#4BD8A0'; ctx.shadowBlur=8;
            const sepGrd=ctx.createLinearGradient(0,0,W,0);
            sepGrd.addColorStop(0,'transparent');
            sepGrd.addColorStop(0.1,'rgba(75,216,160,0.55)');
            sepGrd.addColorStop(0.9,'rgba(75,216,160,0.55)');
            sepGrd.addColorStop(1,'transparent');
            ctx.fillStyle=sepGrd;
            ctx.fillRect(0,gameH-1,W,2);
            ctx.shadowBlur=0; ctx.restore();

            // ── Vertical divider (D-PAD | ACTION) ────────────────────────────
            const divX=W*DIVIDER_FRAC;
            ctx.save();
            ctx.strokeStyle='rgba(75,216,160,0.18)'; ctx.lineWidth=1;
            ctx.shadowColor='#4BD8A0'; ctx.shadowBlur=4;
            ctx.beginPath();
            ctx.moveTo(divX,gameH+ctrlH*0.08);
            ctx.lineTo(divX,H-ctrlH*0.08);
            ctx.stroke();
            ctx.restore();

            // ── Group labels ──────────────────────────────────────────────────
            const lblSz=Math.max(5,Math.floor(ctrlH*0.075));
            ctx.font=`${lblSz}px "JetBrains Mono",monospace`;
            ctx.textAlign='center'; ctx.textBaseline='top';
            ctx.fillStyle='rgba(75,216,160,0.28)';
            ctx.fillText('D-PAD', W*0.26, gameH+ctrlH*0.05);

            // TETRUS label right of divider (pulsing)
            const pulseT=0.60+0.40*Math.sin((btns[0]&&btns[0]._ts)||0);
            const ttSz=Math.max(6,Math.floor(ctrlH*0.11));
            ctx.font=`bold ${ttSz}px "JetBrains Mono",monospace`;
            ctx.fillStyle=`rgba(75,216,160,${0.55+0.30*Math.sin(Date.now()*0.0025)})`;
            ctx.shadowColor='#4BD8A0'; ctx.shadowBlur=ttSz*0.6;
            ctx.fillText('TETRUS', W*0.785, gameH+ctrlH*0.05);
            ctx.shadowBlur=0;

            ctx.textAlign='left';

            // ── Buttons ───────────────────────────────────────────────────────
            btns.forEach(btn=>{
                const pressed=pressedId===btn.id;
                const {x,y:by,r,color,icon,label}=btn;
                ctx.save();

                // Drop shadow
                if(!pressed && r>8){
                    ctx.beginPath(); ctx.arc(x+r*0.07,by+r*0.20,r*0.94,0,Math.PI*2);
                    ctx.fillStyle='rgba(0,0,0,0.68)';
                    ctx.filter=`blur(${Math.max(2,r*0.18)}px)`;
                    ctx.fill(); ctx.filter='none';
                }

                // Outer base ring
                if(!pressed){
                    ctx.beginPath(); ctx.arc(x,by+r*0.09,r*1.04,0,Math.PI*2);
                    ctx.fillStyle='rgba(0,0,0,0.72)'; ctx.fill();
                }

                // Main face
                const faceY=by+(pressed?r*0.07:0);
                ctx.beginPath(); ctx.arc(x,faceY,r,0,Math.PI*2);
                const grd=ctx.createRadialGradient(x-r*0.28,faceY-r*0.30,r*0.04,x,faceY,r);
                if(pressed){
                    grd.addColorStop(0,'rgba(0,8,3,0.99)');
                    grd.addColorStop(1,'rgba(0,3,1,0.99)');
                } else {
                    grd.addColorStop(0,color+'28');
                    grd.addColorStop(0.40,'rgba(12,22,14,0.97)');
                    grd.addColorStop(1,'rgba(1,5,2,0.99)');
                }
                ctx.fillStyle=grd;
                ctx.shadowColor=color;
                ctx.shadowBlur=pressed?r*0.6:r*2.0;
                ctx.fill();

                // Rim
                ctx.strokeStyle=pressed?color:color+'cc';
                ctx.lineWidth=Math.max(1.5,r*0.13);
                ctx.stroke();
                ctx.shadowBlur=0;

                // Inner ring
                ctx.beginPath(); ctx.arc(x,faceY,r*0.76,0,Math.PI*2);
                ctx.strokeStyle=color+(pressed?'35':'1c');
                ctx.lineWidth=Math.max(0.5,r*0.05); ctx.stroke();

                // Specular dome
                if(!pressed){
                    ctx.beginPath();
                    ctx.arc(x-r*0.06,faceY-r*0.06,r*0.64,Math.PI*1.08,Math.PI*1.92);
                    ctx.strokeStyle='rgba(255,255,255,0.20)';
                    ctx.lineWidth=Math.max(1,r*0.16); ctx.stroke();
                    ctx.beginPath(); ctx.arc(x-r*0.30,faceY-r*0.30,r*0.13,0,Math.PI*2);
                    ctx.fillStyle='rgba(255,255,255,0.14)'; ctx.fill();
                }

                // Icon
                const iSz=Math.max(9,Math.floor(r*0.85));
                ctx.fillStyle=pressed?color+'cc':color;
                ctx.shadowColor=color; ctx.shadowBlur=pressed?iSz*0.5:iSz*1.1;
                ctx.font=`bold ${iSz}px sans-serif`;
                ctx.textAlign='center'; ctx.textBaseline='middle';
                ctx.fillText(icon,x,faceY+(pressed?1.5:0));
                ctx.shadowBlur=0;

                // Label chip below big buttons
                if(label && r>=12){
                    const lSz=Math.max(5,Math.floor(r*0.30));
                    const lY=by+r*(pressed?1.10:1.02)+lSz*1.4;
                    ctx.font=`bold ${lSz}px "JetBrains Mono",monospace`;
                    ctx.fillStyle=color+'a8';
                    ctx.shadowBlur=0;
                    ctx.fillText(label,x,lY);
                }
                ctx.restore();
            });
        };

        // ── Draw: scanlines + vignette ────────────────────────────────────────
        const drawScanlines = () => {
            const step=Math.max(2,Math.floor(dpr*1.4));
            ctx.fillStyle='rgba(0,0,0,0.075)';
            for(let sy=0;sy<H;sy+=step) ctx.fillRect(0,sy,W,1);
        };

        const drawVignette = () => {
            const vGrd=ctx.createRadialGradient(W/2,H*0.44,0,W/2,H*0.44,Math.max(W,H)*0.60);
            vGrd.addColorStop(0,'transparent');
            vGrd.addColorStop(0.55,'rgba(0,0,0,0.02)');
            vGrd.addColorStop(0.82,'rgba(0,0,0,0.22)');
            vGrd.addColorStop(1,'rgba(0,0,0,0.50)');
            ctx.fillStyle=vGrd; ctx.fillRect(0,0,W,H);
        };

        const drawCornerBrackets = () => {
            const m=Math.floor(3*dpr), s=Math.floor(9*dpr);
            ctx.strokeStyle='rgba(75,216,160,0.18)'; ctx.lineWidth=Math.max(1,dpr*0.8);
            ctx.beginPath();
            ctx.moveTo(m,m+s); ctx.lineTo(m,m); ctx.lineTo(m+s,m);
            ctx.moveTo(W-m-s,m); ctx.lineTo(W-m,m); ctx.lineTo(W-m,m+s);
            ctx.moveTo(m,H-m-s); ctx.lineTo(m,H-m); ctx.lineTo(m+s,H-m);
            ctx.moveTo(W-m-s,H-m); ctx.lineTo(W-m,H-m); ctx.lineTo(W-m,H-m-s);
            ctx.stroke();
        };

        // ── Draw: game over results card ──────────────────────────────────────
        const drawGameOver = (ts) => {
            const bx=boardX, bw=COLS*cellSize, bh=ROWS*cellSize;
            const cx=bx+bw/2, cy=boardY+bh/2;
            const fS=Math.max(9,Math.floor(cellSize*1.1));
            const subS=Math.max(6,Math.floor(cellSize*0.72));
            const tinyS=Math.max(5,Math.floor(cellSize*0.52));

            ctx.fillStyle='rgba(0,2,1,0.90)'; ctx.fillRect(bx,boardY,bw,bh);
            ctx.save();
            ctx.strokeStyle='rgba(255,23,68,0.45)'; ctx.lineWidth=Math.max(1.5,dpr);
            ctx.strokeRect(bx+6,boardY+6,bw-12,bh-12);
            ctx.restore();

            ctx.textAlign='center'; ctx.textBaseline='middle';

            // GAME OVER title
            ctx.font=`bold ${fS}px "JetBrains Mono",monospace`;
            ctx.fillStyle='#FF1744'; ctx.shadowColor='#FF1744'; ctx.shadowBlur=fS*1.1;
            ctx.fillText('GAME OVER', cx, boardY + bh*0.18);
            ctx.shadowBlur=0;

            // New high score badge
            const rank = lastRankRef.current;
            if (rank >= 0 && rank < 3) {
                const medals=['🥇','🥈','🥉'];
                const badgeSz=Math.max(7,Math.floor(cellSize*0.80));
                ctx.font=`bold ${badgeSz}px "JetBrains Mono",monospace`;
                const pulse=0.7+0.3*Math.sin(ts*0.006);
                ctx.fillStyle=`rgba(255,214,0,${pulse})`;
                ctx.shadowColor='#FFD600'; ctx.shadowBlur=badgeSz*0.8*pulse;
                ctx.fillText(`${medals[rank]} NEW HIGH SCORE!`, cx, boardY+bh*0.30);
                ctx.shadowBlur=0;
            }

            // Stats table
            const statY = boardY + bh * 0.44;
            const rowH = subS * 2.2;
            const stats = [
                ['SCORE', String(scoreRef.current).padStart(6,'0'), '#FFD600'],
                ['LEVEL', String(levelRef.current+1),              '#6FD4FF'],
                ['LINES', String(linesRef.current),                '#4BD8A0'],
            ];
            stats.forEach(([lbl, val, col], i) => {
                const y = statY + i * rowH;
                ctx.font=`${tinyS}px "JetBrains Mono",monospace`;
                ctx.fillStyle='rgba(75,216,160,0.45)'; ctx.fillText(lbl, cx-bw*0.18, y);
                ctx.font=`bold ${subS}px "JetBrains Mono",monospace`;
                ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=subS*0.4;
                ctx.fillText(val, cx+bw*0.10, y);
                ctx.shadowBlur=0;
            });

            // Tap to continue
            const blink=Math.floor(ts/480)%2===0;
            ctx.font=`${tinyS}px "JetBrains Mono",monospace`;
            ctx.fillStyle=`rgba(255,210,0,${blink?0.75:0.22})`;
            ctx.shadowColor='#FFD600'; ctx.shadowBlur=blink?tinyS*0.7:0;
            ctx.fillText('TAP TO CONTINUE', cx, boardY+bh*0.87);
            ctx.shadowBlur=0;
            ctx.textBaseline='alphabetic'; ctx.textAlign='left';
        };

        // ── Draw: pause / operator menu ───────────────────────────────────────
        const drawPaused = (ts) => {
            const bx=boardX, bw=COLS*cellSize, bh=ROWS*cellSize;
            const cx=bx+bw/2;
            const fS=Math.max(8,Math.floor(cellSize*0.95));
            const subS=Math.max(7,Math.floor(cellSize*0.78));
            const tinyS=Math.max(5,Math.floor(cellSize*0.50));

            ctx.fillStyle='rgba(0,10,4,0.88)'; ctx.fillRect(bx,boardY,bw,bh);
            ctx.strokeStyle='rgba(75,216,160,0.35)'; ctx.lineWidth=Math.max(1.5,dpr);
            ctx.strokeRect(bx+6,boardY+6,bw-12,bh-12);

            ctx.textAlign='center'; ctx.textBaseline='middle';

            // Title
            ctx.font=`bold ${fS}px "JetBrains Mono",monospace`;
            ctx.fillStyle='#00E5FF'; ctx.shadowColor='#00E5FF'; ctx.shadowBlur=fS*0.8;
            ctx.fillText('── PAUSED ──', cx, boardY+bh*0.14);
            ctx.shadowBlur=0;

            // 5-item menu
            const items=[
                '▶  RESUME',
                '🏆 HIGH SCORES',
                '🔁 RESTART',
                `🔊 SOUND: ${_isMuted?'OFF':'ON'}`,
                '🏠 QUIT TO MENU',
            ];
            const menuTop = boardY + bh * 0.26;
            const rowH = subS * 2.4;
            ctx.font=`bold ${subS}px "JetBrains Mono",monospace`;
            items.forEach((item, i) => {
                const y = menuTop + i * rowH;
                const sel = pauseMenuRef.current === i;
                if (sel) {
                    // Selection highlight pill
                    const pillH = subS * 1.8;
                    ctx.save();
                    ctx.fillStyle='rgba(75,216,160,0.10)';
                    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(bx+10,y-pillH/2,bw-20,pillH,4); ctx.fill(); }
                    else { ctx.fillRect(bx+10,y-pillH/2,bw-20,pillH); }
                    ctx.restore();
                    ctx.fillStyle='#FFD600'; ctx.shadowColor='#FFD600'; ctx.shadowBlur=subS*0.55;
                    ctx.fillText(item, cx, y);
                    ctx.shadowBlur=0;
                } else {
                    ctx.fillStyle=i===4?'rgba(255,100,100,0.55)':'rgba(75,216,160,0.58)';
                    ctx.fillText(item, cx, y);
                }
            });

            // Footer hint
            ctx.font=`${tinyS}px "JetBrains Mono",monospace`;
            ctx.fillStyle='rgba(75,216,160,0.28)';
            ctx.fillText('▲▼ NAVIGATE  •  DROP CONFIRM', cx, boardY+bh*0.92);
            ctx.textBaseline='alphabetic'; ctx.textAlign='left';
        };

        // ── Draw: attract / start screen ──────────────────────────────────────
        const drawAttract = (ts) => {
            const bx=boardX, bw=COLS*cellSize, bh=ROWS*cellSize;
            const cx=bx+bw/2;
            const fS=Math.max(10,Math.floor(cellSize*1.18));
            const subS=Math.max(6,Math.floor(cellSize*0.72));
            const tinyS=Math.max(5,Math.floor(cellSize*0.50));

            ctx.fillStyle='rgba(0,6,3,0.97)'; ctx.fillRect(bx,boardY,bw,bh);

            ctx.textAlign='center'; ctx.textBaseline='middle';

            // TETRUS logo
            const pulse=0.65+0.35*Math.sin(ts*0.0025);
            ctx.font=`bold ${fS}px "JetBrains Mono",monospace`;
            ctx.fillStyle=`rgba(75,216,160,${pulse})`;
            ctx.shadowColor='#4BD8A0'; ctx.shadowBlur=fS*0.85*pulse;
            ctx.fillText('TETRUS', cx, boardY+bh*0.14);
            ctx.shadowBlur=0;

            // Subtitle
            ctx.font=`${tinyS}px "JetBrains Mono",monospace`;
            ctx.fillStyle='rgba(75,216,160,0.38)';
            ctx.fillText('◆ SILICON SOUL ARCADE ◆', cx, boardY+bh*0.23);

            // High scores section
            const scores = scoreBoardRef.current;
            const tableTop = boardY + bh * 0.31;
            const rowH = subS * 1.95;

            ctx.font=`bold ${tinyS}px "JetBrains Mono",monospace`;
            ctx.fillStyle='rgba(255,214,0,0.72)';
            ctx.fillText('── HIGH SCORES ──', cx, tableTop);

            if (scores.length === 0) {
                ctx.font=`${tinyS}px "JetBrains Mono",monospace`;
                ctx.fillStyle='rgba(75,216,160,0.35)';
                ctx.fillText('NO RECORDS YET', cx, tableTop + rowH);
            } else {
                const medals=['🥇','🥈','🥉','  4','  5'];
                scores.forEach((s, i) => {
                    const y = tableTop + rowH * (i + 1);
                    const isNew = lastRankRef.current === i;
                    ctx.font=`${Math.max(5,Math.floor(subS*0.85))}px "JetBrains Mono",monospace`;
                    ctx.fillStyle = isNew ? '#FFD600' : (i===0?'rgba(255,214,0,0.80)':'rgba(75,216,160,0.62)');
                    if (isNew) { ctx.shadowColor='#FFD600'; ctx.shadowBlur=tinyS*0.6; }
                    ctx.fillText(
                        `${medals[i]}  ${String(s.score).padStart(6,'0')}  LV${String(s.level).padStart(2,' ')}  ${String(s.lines).padStart(3,' ')}L`,
                        cx, y
                    );
                    ctx.shadowBlur=0;
                });
            }

            // Press any button prompt
            const blink=Math.floor(ts/540)%2===0;
            ctx.font=`bold ${subS}px "JetBrains Mono",monospace`;
            ctx.fillStyle=`rgba(224,64,251,${blink?0.90:0.22})`;
            ctx.shadowColor='#E040FB'; ctx.shadowBlur=blink?subS*0.7:0;
            ctx.fillText('PRESS ANY BUTTON', cx, boardY+bh*0.90);
            ctx.shadowBlur=0;
            ctx.textBaseline='alphabetic'; ctx.textAlign='left';
        };

        // ── Draw: high scores full screen ─────────────────────────────────────
        const drawScores = (ts) => {
            const bx=boardX, bw=COLS*cellSize, bh=ROWS*cellSize;
            const cx=bx+bw/2;
            const fS=Math.max(8,Math.floor(cellSize*0.92));
            const subS=Math.max(6,Math.floor(cellSize*0.72));
            const tinyS=Math.max(5,Math.floor(cellSize*0.50));

            ctx.fillStyle='rgba(0,6,3,0.97)'; ctx.fillRect(bx,boardY,bw,bh);
            ctx.strokeStyle='rgba(255,214,0,0.3)'; ctx.lineWidth=Math.max(1.5,dpr);
            ctx.strokeRect(bx+6,boardY+6,bw-12,bh-12);

            ctx.textAlign='center'; ctx.textBaseline='middle';

            ctx.font=`bold ${fS}px "JetBrains Mono",monospace`;
            ctx.fillStyle='#FFD600'; ctx.shadowColor='#FFD600'; ctx.shadowBlur=fS*0.7;
            ctx.fillText('🏆 HIGH SCORES', cx, boardY+bh*0.12);
            ctx.shadowBlur=0;

            const scores = scoreBoardRef.current;
            const tableTop = boardY + bh * 0.22;
            const rowH = bh * 0.13;

            // Column headers
            ctx.font=`${tinyS}px "JetBrains Mono",monospace`;
            ctx.fillStyle='rgba(75,216,160,0.40)';
            ctx.fillText('RANK      SCORE   LV  LINES   DATE', cx, tableTop);

            if (scores.length === 0) {
                ctx.fillStyle='rgba(75,216,160,0.35)';
                ctx.fillText('NO RECORDS YET — PLAY A GAME!', cx, tableTop+rowH*1.5);
            } else {
                const medals=['🥇','🥈','🥉',' 4',' 5'];
                scores.forEach((s, i) => {
                    const y = tableTop + rowH * (i + 1.4);
                    const isNew = lastRankRef.current === i;
                    ctx.font=`bold ${Math.max(6,Math.floor(subS*0.88))}px "JetBrains Mono",monospace`;
                    ctx.fillStyle = isNew ? '#FFD600' : (i===0?'rgba(255,214,0,0.82)':'rgba(75,216,160,0.68)');
                    if (isNew) { ctx.shadowColor='#FFD600'; ctx.shadowBlur=tinyS*0.5; }
                    const row = `${medals[i]}  ${String(s.score).padStart(6,'0')}  ${String(s.level).padStart(2,' ')}   ${String(s.lines).padStart(4,' ')}   ${s.date}`;
                    ctx.fillText(row, cx, y);
                    ctx.shadowBlur=0;
                    if (isNew) {
                        ctx.font=`${tinyS}px "JetBrains Mono",monospace`;
                        ctx.fillStyle='rgba(255,214,0,0.55)';
                        ctx.fillText('◀ YOU', cx + bw*0.32, y);
                    }
                });
            }

            // Back hint
            const blink=Math.floor(ts/560)%2===0;
            ctx.font=`${tinyS}px "JetBrains Mono",monospace`;
            ctx.fillStyle=`rgba(75,216,160,${blink?0.70:0.28})`;
            ctx.fillText('ANY BUTTON — BACK', cx, boardY+bh*0.93);
            ctx.textBaseline='alphabetic'; ctx.textAlign='left';
        };



        const drawSignalLost = (norm, ts) => {
            const cx=boardX+(COLS*cellSize)/2, cy=boardY+(ROWS*cellSize)/2;
            const t = ts * 0.01;
            const jitterX = Math.sin(t*3) * norm * 6 + (Math.random()-0.5)*norm*6;
            const jitterY = Math.cos(t*4) * norm * 6 + (Math.random()-0.5)*norm*6;
            
            ctx.fillStyle=`rgba(12,2,4,${0.35+norm*0.25})`; // Reduced opacity to see glitching blocks behind
            ctx.fillRect(boardX,boardY,COLS*cellSize,ROWS*cellSize);
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // X_X Eyes
            const eyeSize = Math.max(4, Math.floor(cellSize*0.6));
            ctx.strokeStyle = Math.floor(t)%2===0 ? '#FF1744' : '#00E5FF';
            ctx.lineWidth = Math.max(2, Math.floor(cellSize*0.2));
            
            const drawX = (ex, ey) => {
                ctx.beginPath();
                ctx.moveTo(ex - eyeSize, ey - eyeSize);
                ctx.lineTo(ex + eyeSize, ey + eyeSize);
                ctx.moveTo(ex + eyeSize, ey - eyeSize);
                ctx.lineTo(ex - eyeSize, ey + eyeSize);
                ctx.stroke();
            };
            drawX(cx - 18 + jitterX, cy - 15 + jitterY);
            drawX(cx + 18 + jitterX, cy - 15 + jitterY);
            
            // Cartoon Tongue hanging out
            const mouthY = cy + 5 + jitterY;
            ctx.fillStyle = '#FF1744';
            ctx.beginPath();
            ctx.moveTo(cx - 8 + jitterX, mouthY);
            ctx.bezierCurveTo(cx - 12 + jitterX, mouthY + 22, cx + 12 + jitterX, mouthY + 22, cx + 8 + jitterX, mouthY);
            ctx.fill();
            
            // Mouth line
            ctx.strokeStyle = '#FFD600';
            ctx.beginPath();
            ctx.moveTo(cx - 14 + jitterX, mouthY - 2);
            ctx.lineTo(cx + 14 + jitterX, mouthY + 2);
            ctx.stroke();
            
            // Text rendering
            const fS=Math.max(6,Math.floor(cellSize*0.88));
            ctx.textAlign='center';
            const fontScale = 1 + norm * 0.2 * Math.sin(t*5);
            ctx.font=`bold ${fS * fontScale}px "JetBrains Mono",monospace`;
            ctx.fillStyle= '#E040FB';
            ctx.shadowColor= ctx.fillStyle; 
            ctx.shadowBlur=fS * 1.5;
            
            ctx.fillText('DEAD', cx + jitterX, cy + 34 + jitterY);
            ctx.shadowBlur=0;
            
            // Glitching floating symbols
            for (let i=0; i<4; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#00E5FF' : '#FFD600';
                ctx.fillText(['!','?','*','&'][i], cx + (Math.random()-0.5)*90, cy + (Math.random()-0.5)*90);
            }
            ctx.textAlign='left';
        };

        const applyGlitchDistortion = (intensity) => {
            const slices=Math.floor(2+intensity*9);
            for(let i=0;i<slices;i++){
                const sy=Math.floor(Math.random()*H);
                const sh=Math.max(1,Math.floor(Math.random()*cellSize*1.2));
                const sx=Math.floor((Math.random()-0.5)*intensity*W*0.10);
                if(sx===0||sy+sh>H) continue;
                try{const id=ctx.getImageData(0,sy,W,sh);ctx.putImageData(id,sx,sy);}catch(_){}
            }
            ctx.save(); ctx.globalCompositeOperation='screen';
            ctx.fillStyle=`rgba(255,0,60,${intensity*0.07})`; ctx.fillRect(Math.floor(intensity*7),0,W,H);
            ctx.fillStyle=`rgba(0,220,255,${intensity*0.055})`; ctx.fillRect(-Math.floor(intensity*5),0,W,H);
            ctx.restore();
        };

        const drawCracks = (norm) => {
            if(norm < 0.01) return;
            ctx.save();
            
            // Impact point upper middle
            const ix = boardX + COLS * cellSize * 0.65;
            const iy = boardY + ROWS * cellSize * 0.25;
            
            // Impact point lower left
            const ix2 = boardX + COLS * cellSize * 0.2;
            const iy2 = boardY + ROWS * cellSize * 0.75;

            // LCD Ink Bleed (black blobs)
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, norm * 2)})`;
            ctx.beginPath();
            ctx.arc(ix, iy, Math.max(10, 48 * norm), 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ix - 18, iy + 25, Math.max(5, 30 * norm), 0, Math.PI * 2);
            ctx.arc(ix + 15, iy - 20, Math.max(5, 38 * norm), 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(ix2, iy2, Math.max(15, 68 * norm), 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ix2 + 32, iy2 - 15, Math.max(8, 44 * norm), 0, Math.PI * 2);
            ctx.arc(ix2 - 15, iy2 + 38, Math.max(8, 40 * norm), 0, Math.PI * 2);
            ctx.arc(ix2 + 12, iy2 - 45, Math.max(5, 26 * norm), 0, Math.PI * 2);
            ctx.fill();

            // Glass Shards / Cracks
            ctx.strokeStyle = `rgba(220, 255, 255, ${0.45 * norm})`;
            ctx.lineWidth = Math.max(1, dpr * 1.2);
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = Math.max(2, dpr * 2) * norm;
            ctx.lineJoin = 'miter';
            
            ctx.beginPath();
            
            // Cracks radiating from ix, iy
            ctx.moveTo(ix, iy); ctx.lineTo(ix - 20, iy + 30); ctx.lineTo(ix - 45, iy + 65); ctx.lineTo(ix - 55, boardY + ROWS * cellSize);
            ctx.moveTo(ix - 20, iy + 30); ctx.lineTo(ix - 60, iy + 20); ctx.lineTo(boardX, iy + 35);
            ctx.moveTo(ix, iy); ctx.lineTo(ix + 25, iy - 15); ctx.lineTo(boardX + COLS * cellSize, iy - 20);
            ctx.moveTo(ix, iy); ctx.lineTo(ix - 30, iy - 25); ctx.lineTo(ix - 60, boardY);
            
            // Lower left geometry
            
            ctx.moveTo(ix2, iy2); ctx.lineTo(ix2 + 30, iy2 - 20); ctx.lineTo(ix2 + 80, iy2 - 40);
            ctx.moveTo(ix2 + 30, iy2 - 20); ctx.lineTo(ix2 + 45, iy2 + 25); ctx.lineTo(ix2 + 60, boardY + ROWS * cellSize);
            ctx.moveTo(ix2, iy2); ctx.lineTo(boardX, iy2 - 15);
            
            // Spider web connectors
            ctx.moveTo(ix - 45, iy + 65); ctx.lineTo(ix2 + 80, iy2 - 40);
            ctx.moveTo(ix - 30, iy - 25); ctx.lineTo(ix - 20, iy + 30);
            
            ctx.stroke();
            ctx.restore();
        };

        // ── Input ─────────────────────────────────────────────────────────────
        const hitBtn = (cx,cy) => {
            const rect=canvas.getBoundingClientRect();
            const px=cx*dpr, py=cy*dpr;
            if(py<gameH) return null;
            return btnsRef.current.find(b=>Math.hypot(px-b.x,py-b.y)<=b.r*1.28)||null;
        };
        const releaseBtn = () => {
            pressedBtnRef.current=null;
            clearTimeout(btnTimerRef.current); clearInterval(btnIntervalRef.current);
            btnTimerRef.current=null; btnIntervalRef.current=null;
        };
        const pressBtn = btn => {
            pressedBtnRef.current=btn.id; execBtn(btn.key);
            if(btn.repeat){
                btnTimerRef.current=setTimeout(()=>{
                    btnIntervalRef.current=setInterval(()=>execBtn(btn.key),75);
                },200);
            }
        };

        const handleKey = e => {
            // Don't intercept keys when user is typing in a form field
            const tag = document.activeElement?.tagName?.toLowerCase();
            const isEditable = document.activeElement?.isContentEditable;
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || isEditable) return;

            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape' || e.key === 'Enter') {
                execBtn(e.key);
                e.preventDefault();
                return;
            }
            const s = stateRef.current;
            // Overlay states: any game key dismisses/starts
            if (s==='attract'||s==='scores'||s==='gameover') { execBtn(e.key||' '); return; }

            if (s === 'paused') {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
                    execBtn(e.key);
                    e.preventDefault();
                }
                return;
            }

            if(!canInput()) return;
            switch(e.key){
                case 'ArrowLeft':  tryMove(-1);  e.preventDefault(); break;
                case 'ArrowRight': tryMove(1);   e.preventDefault(); break;
                case 'ArrowDown':  trySoft();    e.preventDefault(); break;
                case 'ArrowUp':    tryRotate();  e.preventDefault(); break;
                case ' ':          tryDrop();    e.preventDefault(); break;
            }
        };

        const handleTouchStart = e => {
            const t=e.touches[0];
            const rect=canvas.getBoundingClientRect();
            const relY=t.clientY-rect.top;
            const s = stateRef.current;
            // Tapping board area on overlay screens: route through execBtn
            if(relY*dpr < gameH) {
                e.preventDefault();
                if(s==='attract'||s==='scores'||s==='gameover'||s==='playing'||s==='paused') {
                    execBtn(' ');
                }
                return;
            }
            const btn=hitBtn(t.clientX-rect.left,relY);
            if(btn){
                e.preventDefault();
                pressBtn(btn);
                touchRef.current=null;
                return;
            }
            touchRef.current={x:t.clientX,y:t.clientY,ts:Date.now()};
        };
        const handleTouchEnd = e => {
            // If a canvas button was released, clean up repeater and bail out.
            // touchRef is null when a button was tapped, so gesture logic is skipped.
            if(pressedBtnRef.current){releaseBtn();touchRef.current=null;return;}
            if(!touchRef.current||!canInput()){touchRef.current=null;return;}
            const t=e.changedTouches[0];
            const dx=t.clientX-touchRef.current.x, dy=t.clientY-touchRef.current.y;
            const dt=Date.now()-touchRef.current.ts;
            const adx=Math.abs(dx),ady=Math.abs(dy);
            if     (adx<14&&ady<14&&dt<250) tryRotate();
            else if(adx>ady&&adx>14){const steps=Math.max(1,Math.round(adx/22));const dir=dx>0?1:-1;for(let i=0;i<steps;i++) tryMove(dir);}
            else if(dy>40) tryDrop();
            touchRef.current=null;
        };
        const handleTouchCancel=()=>{releaseBtn();touchRef.current=null;};
        const handleMouseDown = e => {
            const rect=canvas.getBoundingClientRect();
            const relX=e.clientX-rect.left,relY=e.clientY-rect.top;
            const s = stateRef.current;
            if(relY*dpr < gameH) {
                if(s==='attract'||s==='scores'||s==='gameover') { execBtn(' '); return; }
                togglePause();
                return;
            }
            const btn=hitBtn(relX,relY);
            if(btn){e.preventDefault();pressBtn(btn);}
        };
        const handleMouseUp=()=>{if(pressedBtnRef.current) releaseBtn();};

        window.addEventListener('keydown',handleKey,{passive:false});
        canvas.addEventListener('touchstart',handleTouchStart,{passive:false});
        canvas.addEventListener('touchend',handleTouchEnd,{passive:true});
        canvas.addEventListener('touchcancel',handleTouchCancel,{passive:true});
        canvas.addEventListener('mousedown',handleMouseDown,{passive:false});
        window.addEventListener('mouseup',handleMouseUp,{passive:true});

        // ── Main loop ─────────────────────────────────────────────────────────
        const loop = ts => {
            rafRef.current = requestAnimationFrame(loop);
            if(!W||!H||!cellSize) return;

            const gl=glitchRef.current, state=stateRef.current;

            // Glitch state: recovery goes to attract
            if(gl>GLITCH_HEAVY){
                heavyGlRef.current=true;
                if(state==='playing'){
                    stateRef.current='glitched';
                    if(overTimerRef.current){clearTimeout(overTimerRef.current);overTimerRef.current=null;}
                }
                if(ts-glitchSndRef.current>620){SFX.glitch();glitchSndRef.current=ts;}
            } else if(gl<GLITCH_HEAVY&&heavyGlRef.current){
                heavyGlRef.current=false; resetGame(true);
            }

            // Background
            ctx.clearRect(0,0,W,H);
            ctx.fillStyle='rgba(1,6,3,0.97)'; ctx.fillRect(0,0,W,H);

            // Neon tube top bar
            const barH=Math.max(2,Math.floor(dpr*1.4));
            const barGrd=ctx.createLinearGradient(0,0,W,0);
            barGrd.addColorStop(0,'transparent'); barGrd.addColorStop(0.12,'rgba(75,216,160,0.55)');
            barGrd.addColorStop(0.88,'rgba(75,216,160,0.55)'); barGrd.addColorStop(1,'transparent');
            ctx.save(); ctx.shadowColor='#4BD8A0'; ctx.shadowBlur=5;
            ctx.fillStyle=barGrd; ctx.fillRect(0,0,W,barH);
            ctx.shadowBlur=0; ctx.restore();

            // Attract and scores screens skip game rendering
            if(state==='attract') { drawAttract(ts); drawScanlines(); drawVignette(); drawControls(ts); return; }
            if(state==='scores')  { drawScores(ts);  drawScanlines(); drawVignette(); drawControls(ts); return; }

            drawBoard(ts, gl);

            if(state==='playing' || state==='glitched' || state==='paused'){
                drawCurrentAndGhost(gl);
                if (justUnpausedRef.current) {
                    lastDropRef.current = ts;
                    justUnpausedRef.current = false;
                }
                if(state !== 'paused' && Date.now()>=flashEndRef.current){
                    const interval=DROP_INTERVALS[Math.min(levelRef.current,DROP_INTERVALS.length-1)];
                    if(ts-lastDropRef.current>=interval){
                        lastDropRef.current=ts;
                        const cur=curRef.current;
                        if(isValid(boardRef.current,cur.cells,cur.x,cur.y+1)) cur.y++;
                        else landPiece(false);
                    }
                }
            }

            drawHUD();
            drawControls(ts);
            drawScanlines();
            drawVignette();
            drawCornerBrackets();

            if(gl>GLITCH_LIGHT){
                const norm=Math.min(1,(gl-GLITCH_LIGHT)/(1-GLITCH_LIGHT));
                applyGlitchDistortion(norm*0.72);
                if(stateRef.current==='glitched') {
                    drawSignalLost(norm, ts);
                    drawCracks(norm);
                }
            }
            if(state==='gameover') drawGameOver(ts);
            if(state==='paused') drawPaused(ts);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(rafRef.current); ro.disconnect();
            window.removeEventListener('keydown',handleKey);
            window.removeEventListener('mouseup',handleMouseUp);
            canvas.removeEventListener('touchstart',handleTouchStart);
            canvas.removeEventListener('touchend',handleTouchEnd);
            canvas.removeEventListener('touchcancel',handleTouchCancel);
            canvas.removeEventListener('mousedown',handleMouseDown);
            if(overTimerRef.current) clearTimeout(overTimerRef.current);
            releaseBtn();
        };
    },[]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position:'absolute', inset:0, width:'100%', height:'100%',
                display:'block', imageRendering:'pixelated',
                cursor:'crosshair', touchAction:'none', zIndex:1,
            }}
        />
    );
});
