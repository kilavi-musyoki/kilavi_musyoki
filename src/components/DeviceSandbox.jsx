import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DeviceCanvas from './DeviceCanvas.jsx';
import LeverControl from './LeverControl.jsx';
import PortraitHub from './PortraitHub.jsx';

export default function DeviceSandbox({ isDark, mousePosRef, glitch }) {
    const [viewMode, setViewMode] = useState('portrait'); // 'portrait' | 'game'
    const [hasPlayed, setHasPlayed] = useState(false);
    const [leverValue, setLeverValue] = useState(0);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler, { passive: true });
        return () => window.removeEventListener('resize', handler);
    }, []);

    const handleLaunchGame = useCallback(() => {
        setViewMode('game');
    }, []);

    const handleReturnToPortrait = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.__tetrusGameState = 'menu';
        }
        setLeverValue(0);
        setHasPlayed(true);
        setViewMode('portrait');
    }, []);

    return (
        <div
            style={{
                flex: '1 1 300px',
                maxWidth: '580px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                minHeight: isMobile ? '420px' : '480px',
                justifyContent: 'center',
            }}
        >
            <AnimatePresence mode="wait">
                {viewMode === 'portrait' ? (
                    <motion.div
                        key="portrait-view"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ width: '100%' }}
                    >
                        <PortraitHub
                            onLaunchGame={handleLaunchGame}
                            hasPlayed={hasPlayed}
                            isDark={isDark}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="game-view"
                        initial={{ opacity: 0, scale: 0.88, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            position: 'relative',
                            paddingRight: isMobile ? '0' : '70px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            width: '100%',
                        }}
                    >
                        {/* Return to Portrait Top Bar */}
                        <div className="back-hub-bar">
                            <button
                                type="button"
                                className="back-hub-btn"
                                onClick={handleReturnToPortrait}
                                title="Return to Portrait Hub"
                            >
                                <span>← Return to Portrait</span>
                            </button>
                            <span
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.6rem',
                                    color: isDark ? 'rgba(75,216,160,0.6)' : 'rgba(13,148,136,0.6)',
                                    letterSpacing: '0.08em',
                                }}
                            >
                                SYSTEM: INTERACTIVE GAME
                            </span>
                        </div>

                        {/* Device canvas */}
                        <DeviceCanvas
                            leverValue={leverValue}
                            isDark={isDark}
                            mousePosRef={mousePosRef}
                            glitch={glitch}
                        />

                        {/* Desktop Lever */}
                        {!isMobile && (
                            <div style={{
                                position: 'absolute',
                                right: '0',
                                top:   '12%',
                                bottom:'5%',
                                width: '62px',
                                zIndex: 20,
                                display: 'flex',
                                alignItems: 'stretch',
                            }}>
                                <LeverControl
                                    leverValue={leverValue}
                                    onChange={setLeverValue}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                        {/* Mobile lever below the device */}
                        {isMobile && (
                            <div style={{ width: '100%', padding: '0 0.25rem' }}>
                                <LeverControl
                                    leverValue={leverValue}
                                    onChange={setLeverValue}
                                    isDark={isDark}
                                    isMobile
                                />
                            </div>
                        )}

                        {/* Hint text */}
                        <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.52rem',
                            color: isDark ? 'rgba(206,208,206,0.28)' : 'rgba(28,34,38,0.28)',
                            textAlign: 'center',
                            letterSpacing: '0.08em',
                            marginTop: isMobile ? '0.25rem' : '-0.5rem',
                        }}>
                            {isMobile ? '← DRAG SLIDER TO DECONSTRUCT →' : '↑ DRAG LEVER TO DECONSTRUCT ↓'}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

