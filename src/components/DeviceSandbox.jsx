import React, { useState, useEffect } from 'react';
import DeviceCanvas from './DeviceCanvas.jsx';
import LeverControl from './LeverControl.jsx';

export default function DeviceSandbox({ isDark, mousePosRef, glitch }) {
    const [leverValue, setLeverValue] = useState(0);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler, { passive: true });
        return () => window.removeEventListener('resize', handler);
    }, []);

    return (
        <div
            style={{
                flex: '1 1 300px',
                maxWidth: '580px',
                position: 'relative',
                paddingRight: isMobile ? '0' : '70px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                width: '100%',
            }}
        >
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
                    top:   '5%',
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
        </div>
    );
}
