import React from 'react';

const ThemeToggle = ({ isDark, onToggle }) => {
    const labelColor = isDark ? 'rgba(206,208,206,0.7)' : 'rgba(28,34,38,0.52)';
    const accentColor = isDark ? '#ced0ce' : '#0D9488';
    const borderIdle = isDark ? 'rgba(107,113,107,0.5)' : 'rgba(104,112,120,0.4)';
    const bgColor = isDark ? 'rgba(57,65,57,0.8)' : 'rgba(255,255,255,0.45)';

    return (
        <button
            onClick={onToggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                minHeight: '36px',
                borderRadius: 2,
                border: `1px solid ${borderIdle}`,
                background: bgColor,
                cursor: 'pointer',
                transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.boxShadow = `0 0 10px ${isDark ? 'rgba(206,208,206,0.2)' : 'rgba(13,148,136,0.25)'}`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = borderIdle;
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* tiny mode chip */}
            <span
                style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: accentColor,
                    boxShadow: `0 0 6px ${isDark ? 'rgba(206,208,206,0.5)' : 'rgba(13,148,136,0.5)'}`,
                }}
            />
            <span
                style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.55rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: labelColor,
                }}
            >
                {isDark ? 'DARK MODE' : 'LIGHT MODE'}
            </span>
        </button>
    );
};

export default ThemeToggle;
