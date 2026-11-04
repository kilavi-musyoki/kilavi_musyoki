import { memo } from 'react';
import PropTypes from 'prop-types';
import TetrusGame from './TetrusGame.jsx';
import logoImg from '../assets/logo.png';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
};

const W = 120, H = 96;
const gridC = 'rgba(75,216,160,0.07)';

const AvatarDisplay = memo(function AvatarDisplay({ leverValue, isDark }) {
    const gameOpacity = 1 - smoothstep(0.42, 0.66, leverValue);
    const logoProgress = smoothstep(0.79, 0.96, leverValue);
    const logoOpacity = logoProgress;
    const bgOpacity = 1 - smoothstep(0.38, 0.58, leverValue) * 0.46;
    const bg = `rgba(3, 11, 5, ${bgOpacity})`;

    const transform = `perspective(700px) rotateY(${(1 - logoProgress) * 52}deg) scale(${0.76 + logoProgress * 0.24}) translateY(${(1 - logoProgress) * 7}px)`;
    const logoGlow = isDark ? 'rgba(75,216,160,0.56)' : 'rgba(13,148,136,0.38)';


    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: bg, borderRadius: '3px', overflow: 'hidden' }}>

            {/* CRT vignette */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.52) 100%)',
            }} />

            {/* 3D tilt container */}
            <div style={{
                position: 'absolute', inset: 0,
                transform: 'perspective(260px) rotateX(0deg) rotateY(0deg)',
                transformOrigin: 'center center',
                willChange: 'transform',
                pointerEvents: 'auto',
            }}>
                {/* LAYER 0: TETRUS Arcade Game */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: gameOpacity,
                    zIndex: 1,
                    pointerEvents: gameOpacity > 0.05 ? 'auto' : 'none',
                }}>
                    <TetrusGame glitchLevel={leverValue} isDark={isDark} />
                </div>

                <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 2, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="av-grid" x="0" y="0" width="20" height="16" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="20" y2="0" stroke={gridC} strokeWidth="0.4" />
                            <line x1="0" y1="0" x2="0" y2="16" stroke={gridC} strokeWidth="0.4" />
                        </pattern>
                        <pattern id="av-scan" x="0" y="0" width={W} height="3" patternUnits="userSpaceOnUse">
                            <rect y="2" width={W} height="1" fill="rgba(0,0,0,0.16)" />
                        </pattern>
                    </defs>

                    {/* Background grid */}
                <rect width={W} height={H} fill="url(#av-grid)" opacity={bgOpacity * 0.7} />

                    {/* Persistent scanlines — scoped to screen bezel only (global body::after removed) */}
                    <rect x="0" y="0" width={W} height={H}
                    fill="url(#av-scan)" opacity={Math.min(1, bgOpacity * 0.5)} pointerEvents="none" />
                    {/* Screen border */}
                    <rect x="0" y="0" width={W} height={H}
                        fill="none" stroke="rgba(75,216,160,0.14)" strokeWidth="0.6" rx="2" />
                </svg>

                {/* LAYER 4: FLOATING CYBERSECURITY LOGO */}
                {logoOpacity > 0.005 && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: logoOpacity,
                        zIndex: 15,
                        pointerEvents: logoOpacity > 0.05 ? 'auto' : 'none',
                    }}>
                        <img
                            src={logoImg}
                            alt="Hack. Strategize. Observe."
                            style={{
                                width: '64%',
                                height: 'auto',
                                transform,
                                transformOrigin: 'center',
                                filter: `drop-shadow(0 0 ${6 + logoProgress * 9}px ${logoGlow}) brightness(${1 + logoProgress * 0.08})`,
                                backfaceVisibility: 'hidden',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});

AvatarDisplay.propTypes = {
    leverValue: PropTypes.number.isRequired,
    isDark: PropTypes.bool.isRequired,
};

export default AvatarDisplay;
