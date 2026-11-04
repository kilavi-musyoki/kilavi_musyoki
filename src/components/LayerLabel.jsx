import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';

const LAYERS = [
    { threshold: 0.2, name: 'PRODUCT', desc: 'Consumer interface layer', status: 'SYS.ONLINE', color: '#ced0ce' },
    { threshold: 0.4, name: 'TENSION', desc: 'Abstraction layer weakening', status: 'SYS.WARN', color: '#D4A843' },
    { threshold: 0.6, name: 'TEARDOWN', desc: 'Structural breakdown', status: 'SYS.UNSTABLE', color: '#FF8C42' },
    { threshold: 0.8, name: 'SYSTEM', desc: 'Electronic substrate revealed', status: 'SYS.CALIBRATED', color: '#4BD8A0' },
    { threshold: 1.01, name: 'SIGNAL', desc: 'Raw signal domain', status: 'SYS.RAW_DATA', color: '#6FD4FF' },
];

const getLayer = (lv) => LAYERS.find(l => lv < l.threshold) || LAYERS[LAYERS.length - 1];

export default function LayerLabel({ leverValue, isDark }) {
    const layer = getLayer(leverValue);
    const dim = isDark ? 'rgba(206,208,206,0.36)' : 'rgba(28,34,38,0.34)';
    const pct = Math.round(leverValue * 100);

    return (
        <div style={{
            position: 'absolute', top: '0.35rem', left: '10%', right: '10%',
            zIndex: 16, pointerEvents: 'none',
            minHeight: '24px', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center',
            padding: '3px 8px',
            background: 'rgba(8,12,10,0.92)',
            border: '1px solid rgba(206,216,208,0.16)',
            borderRadius: '3px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.24)',
        }}>
            <AnimatePresence mode="wait">
                {leverValue < 0.98 && (
                    <motion.div
                        key={layer.name}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                    {/* Name + status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '7px', width: '100%' }}>
                        <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.58rem',
                            color: layer.color,
                            letterSpacing: '0.15em',
                            fontWeight: 700,
                            textShadow: `0 0 9px ${layer.color}75`,
                        }}>
                            ◈ {layer.name}
                        </div>
                        <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.42rem',
                            padding: '1.5px 4px',
                            background: 'rgba(0,0,0,0.38)',
                            border: `0.5px solid ${layer.color}38`,
                            color: layer.color,
                            borderRadius: '2px',
                            letterSpacing: '0.05em',
                        }}>
                            {layer.status}
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.48rem',
                        color: dim,
                        letterSpacing: '0.04em',
                    }}>
                        {layer.desc}{' '}
                            <span style={{ opacity: 0.7, whiteSpace: 'nowrap' }}>DEPTH {pct}%</span>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

LayerLabel.propTypes = {
    leverValue: PropTypes.number.isRequired,
    isDark: PropTypes.bool.isRequired,
};
