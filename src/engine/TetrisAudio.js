let actx = null;
let muted = true; // Default muted — consent-first audio

const initContext = () => {
    if (!actx) {
        actx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (actx && actx.state === 'suspended') {
        actx.resume();
    }
};

export const playTone = (freq, type, dur, vol = 0.05) => {
    if (muted) return;
    try {
        initContext();
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
        
        // Clean up connections immediately to avoid memory leaks
        o.onended = () => {
            o.disconnect();
            g.disconnect();
        };
    } catch (e) {
        console.warn('Audio play failure:', e);
    }
};

export const TetrisAudio = {
    get isMuted() {
        return muted;
    },
    set isMuted(val) {
        muted = val;
        if (!muted) {
            initContext();
            // Confirmation chirp
            playTone(660, 'square', 0.06, 0.04);
        }
    },
    init() {
        initContext();
    },
    SFX: {
        move: () => playTone(330, 'square', 0.02, 0.02),
        rotate: () => playTone(550, 'square', 0.02, 0.02),
        softDrop: (() => {
            let lastPlay = 0;
            return () => {
                const now = performance.now();
                // Throttle drop sound to prevent high-frequency buzz machine gun sound
                if (now - lastPlay > 60) {
                    lastPlay = now;
                    playTone(120, 'triangle', 0.04, 0.015);
                }
            };
        })(),
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
        levelUp: () => {
            [440, 880, 1320].forEach((f, i) => {
                setTimeout(() => playTone(f, 'square', 0.1, 0.05), i * 100);
            });
        },
        gameOver: () => {
            [350, 280, 210, 130].forEach((f, i) => {
                setTimeout(() => playTone(f, 'sawtooth', 0.2, 0.05), i * 150);
            });
        }
    }
};
