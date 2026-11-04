/* eslint-disable react/prop-types */
import { memo } from 'react';

// Concept artwork based on the Gate 2 floorplan. Signal routes are illustrative
// paths for the explicitly proposed nets; they are not fabrication routing.
const componentDrafts = [
    { id: 'U1', type: 'module', footprint: 'ESP32-WROOM-32', x: 91, y: 4, w: 18, h: 25.5, rot: 0, stages: ['pcb', 'traces', 'components', 'system', 'routes'], group: 'MCU', mark: 'ESP32' },
    { id: 'J1', type: 'header', footprint: '1x10_THT', x: 7, y: 44, w: 3, h: 57, rot: 0, stages: ['components', 'system'], group: 'I/O' },
    { id: 'J2', type: 'connector', footprint: 'USB-C-16P', x: 82, y: 147.5, w: 36, h: 8.5, rot: 0, stages: ['components', 'system'], group: 'USB', mark: 'USB-C' },
    { id: 'J6', type: 'connector', footprint: 'FPC-per-panel', x: 74, y: 43, w: 52, h: 7, rot: 0, stages: ['components', 'system'], group: 'Display', mark: 'DISPLAY · FPC' },
    { id: 'U2', type: 'ic', footprint: 'SOIC-16', x: 130, y: 118, w: 20, h: 16, rot: 0, stages: ['components', 'system'], group: 'USB', mark: 'CH340C' },
    { id: 'U3', type: 'ic', footprint: 'SOT-23-6', x: 91, y: 130, w: 16, h: 7, rot: 0, stages: ['components', 'system'], group: 'USB', mark: 'USBLC6-2' },
    { id: 'VR1', type: 'ic', footprint: 'buck-controller-module', x: 155, y: 116, w: 21, h: 14, rot: 0, stages: ['components', 'system'], group: 'Power', mark: '3V3 REG' },
    { id: 'L1', type: 'passive', footprint: 'inductor', x: 155, y: 108, w: 8, h: 5, rot: 0, stages: ['components', 'system'], group: 'Power', mark: 'L1' },
    { id: 'FB1', type: 'passive', footprint: 'ferrite-bead', x: 107, y: 34, w: 8, h: 3.5, rot: 0, stages: ['components', 'system'], group: 'Power', mark: 'FB1' },
    { id: 'C1', type: 'passive', footprint: '0805', x: 80, y: 33, w: 7, h: 4, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: '10µ' },
    { id: 'C2', type: 'passive', footprint: '0603', x: 89, y: 34, w: 4, h: 3, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: '100n' },
    { id: 'C3', type: 'passive', footprint: 'input-cap', x: 178, y: 121, w: 8, h: 4, rot: 0, stages: ['components', 'system'], group: 'Power', mark: '10µ' },
    { id: 'R1', type: 'passive', footprint: '0603', x: 77, y: 138, w: 7, h: 4, rot: 0, stages: ['components', 'system'], group: 'USB', mark: '5k1' },
    { id: 'R2', type: 'passive', footprint: '0603', x: 116, y: 138, w: 7, h: 4, rot: 0, stages: ['components', 'system'], group: 'USB', mark: '5k1' },
    { id: 'R3', type: 'passive', footprint: '0603', x: 103, y: 91, w: 7, h: 4, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: '10k' },
    { id: 'C4', type: 'passive', footprint: '0603', x: 103, y: 97, w: 7, h: 4, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: '100n' },
    { id: 'R4', type: 'passive', footprint: '0603', x: 131, y: 96, w: 7, h: 4, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: '10k' },
    { id: 'Q1', type: 'ic', footprint: 'SOT-23', x: 112, y: 91, w: 7, h: 5, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: 'Q1' },
    { id: 'Q2', type: 'ic', footprint: 'SOT-23', x: 121, y: 91, w: 7, h: 5, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: 'Q2' },
    { id: 'SW1', type: 'switch', footprint: 'tactile', x: 43, y: 64, w: 8, h: 8, rot: 0, stages: ['components', 'system'], group: 'I/O', mark: '↑' },
    { id: 'SW2', type: 'switch', footprint: 'tactile', x: 35, y: 72, w: 8, h: 8, rot: 0, stages: ['components', 'system'], group: 'I/O', mark: '←' },
    { id: 'SW3', type: 'switch', footprint: 'tactile', x: 51, y: 72, w: 8, h: 8, rot: 0, stages: ['components', 'system'], group: 'I/O', mark: '→' },
    { id: 'SW4', type: 'switch', footprint: 'tactile', x: 43, y: 80, w: 8, h: 8, rot: 0, stages: ['components', 'system'], group: 'I/O', mark: '↓' },
    { id: 'SW5', type: 'switch', footprint: 'tactile', x: 145, y: 66, w: 10, h: 8, rot: 0, stages: ['components', 'system'], group: 'I/O', mark: 'ROT' },
    { id: 'SW6', type: 'switch', footprint: 'tactile', x: 159, y: 78, w: 10, h: 8, rot: 0, stages: ['components', 'system'], group: 'I/O', mark: 'DROP' },
    { id: 'SW7', type: 'switch', footprint: 'tactile', x: 145, y: 90, w: 10, h: 8, rot: 0, stages: ['components', 'system'], group: 'I/O', mark: 'PAUSE' },
    { id: 'SW8', type: 'switch', footprint: 'tactile', x: 119, y: 103, w: 9, h: 8, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: 'BOOT' },
    { id: 'SW9', type: 'switch', footprint: 'tactile', x: 133, y: 103, w: 9, h: 8, rot: 0, stages: ['components', 'system'], group: 'MCU', mark: 'RESET' },
    { id: 'BZ1', type: 'connector', footprint: 'piezo', x: 51, y: 118, w: 12, h: 12, rot: 0, stages: ['components', 'system'], group: 'I/O', mark: 'BZ1' },
    { id: 'LED1', type: 'led', footprint: '0603-red', x: 178, y: 91, w: 6, h: 5, rot: 0, stages: ['components', 'system'], group: 'Power', mark: 'LED1' },
    { id: 'LED2', type: 'led', footprint: '0603-green', x: 178, y: 103, w: 6, h: 5, rot: 0, stages: ['components', 'system'], group: 'Power', mark: 'LED2' },
];
const components = componentDrafts.map(part => ({ ...part, ref: part.id }));

// Point lists follow 45-degree segments. These are visual net hints pending
// panel/controller and header pinout confirmation; no antenna routes are drawn.
const traceDrafts = [
    { id: 't-vbus', net: 'VBUS_5V', width: 1.2, layer: 'F.Cu', points: [[100, 147], [100, 143], [150, 143], [150, 133], [165, 133], [165, 130]], group: 'Power' },
    { id: 't-3v3', net: '+3V3_SYS', width: 1, layer: 'F.Cu', points: [[165, 116], [165, 112], [145, 92], [145, 80]], group: 'Power' },
    { id: 't-uart-rx', net: 'U0RXD', width: .45, layer: 'F.Cu', points: [[130, 124], [125, 124], [125, 112], [117, 104], [114, 104], [114, 75], [108, 69]], group: 'USB' },
    { id: 't-uart-tx', net: 'U0TXD', width: .45, layer: 'F.Cu', points: [[108, 72], [119, 72], [127, 80], [127, 120], [130, 120]], group: 'USB' },
    { id: 't-en', net: 'EN', width: .4, layer: 'F.Cu', points: [[108, 78], [112, 82], [112, 91]], group: 'MCU' },
    { id: 't-io0', net: 'GPIO0', width: .4, layer: 'F.Cu', points: [[105, 78], [105, 86], [125, 86], [125, 91]], group: 'MCU' },
    { id: 't-sw-up', net: 'GPIO32', width: .35, layer: 'F.Cu', points: [[95, 75], [88, 82], [58, 82], [51, 75]], group: 'I/O' },
    { id: 't-sw-down', net: 'GPIO33', width: .35, layer: 'F.Cu', points: [[95, 78], [87, 86], [54, 86], [51, 84]], group: 'I/O' },
];
const traces = traceDrafts.map(trace => ({ ...trace, animate: true }));

const pathFromPoints = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

function Part({ part, ledOn }) {
    const { x, y, w, h, id, type, mark } = part;
    const isChip = ['ic', 'module'].includes(type);
    const silk = '#dce4dc';
    const ledLit = id === 'LED1' ? ledOn : id === 'LED2';
    return <g transform={`rotate(${part.rot} ${x + w / 2} ${y + h / 2})`} filter={type === 'led' && ledLit ? 'url(#led-glow)' : undefined}>
        {type === 'passive' && <>
            <rect x={x - 1.2} y={y + h * .22} width="1.5" height={h * .56} rx=".35" fill="#cba65f" />
            <rect x={x + w - .3} y={y + h * .22} width="1.5" height={h * .56} rx=".35" fill="#cba65f" />
            <rect x={x} y={y} width={w} height={h} rx=".7" fill={id.startsWith('C') ? '#b89262' : '#202522'} stroke="#737d73" strokeWidth=".45" />
        </>}
        {isChip && <>
            <rect x={x} y={y} width={w} height={h} rx="1" fill={type === 'module' ? '#747d79' : '#161b19'} stroke="#c8d0c9" strokeWidth=".65" />
            {type === 'module' && <rect x={x + 1} y={y + 13} width={w - 2} height={h - 14} rx=".7" fill="#303633" stroke="#9aa39c" strokeWidth=".35" />}
            {type === 'module' && Array.from({ length: 11 }, (_, i) => <g key={`cast-${i}`}>
                <rect x={x - .55} y={y + 13.2 + i * 1.05} width=".7" height=".62" rx=".12" fill="#d2ad69" />
                <rect x={x + w - .15} y={y + 13.2 + i * 1.05} width=".7" height=".62" rx=".12" fill="#d2ad69" />
            </g>)}
            <circle cx={x + 1.8} cy={y + 1.8} r=".65" fill="#e8d7a6" />
        </>}
        {type === 'switch' && <><rect x={x} y={y} width={w} height={h} rx="1" fill="#252a27" stroke="#a7b0a8" strokeWidth=".45" /><circle cx={x + w / 2} cy={y + h / 2} r="2" fill="#89918a" /></>}
        {type === 'connector' && <><rect x={x} y={y} width={w} height={h} rx=".8" fill="#101613" stroke="#c7ac73" strokeWidth=".6" /><text x={x + w / 2} y={y + h / 2 + .7} textAnchor="middle" fontSize={id === 'J6' ? 1.8 : 1.6} fill={silk} fontFamily="monospace">{mark}</text></>}
        {type === 'header' && Array.from({ length: 10 }, (_, i) => <g key={i}><circle cx={x + w / 2} cy={y + 2.5 + i * 5.7} r="1.35" fill="#d1ad66" /><circle cx={x + w / 2} cy={y + 2.5 + i * 5.7} r=".58" fill="#121714" /></g>)}
        {type === 'led' && <><rect x={x - 1} y={y + 1} width="1.2" height="3" fill="#cba65f"/><rect x={x + w - .2} y={y + 1} width="1.2" height="3" fill="#cba65f"/><rect x={x} y={y} width={w} height={h} rx="1.2" fill={id === 'LED1' ? '#7d3934' : '#365c42'} stroke="#c5d0c6" strokeWidth=".45"/><circle cx={x + w / 2} cy={y + h / 2} r=".8" fill={id === 'LED1' ? '#dd7668' : '#83b995'} opacity=".75" /></>}
        {type !== 'header' && type !== 'connector' && <text x={x + w / 2} y={y + h / 2 + .65} textAnchor="middle" fontSize={isChip ? 1.9 : 1.45} fill={silk} fontFamily="monospace">{mark}</text>}
        <text x={x + w / 2} y={y - 1.4} textAnchor="middle" fontSize="1.8" fill={silk} fontFamily="monospace">{id}</text>
    </g>;
}

const holes = [[14,14],[186,14],[14,146],[186,146]];
const stages = {
    thermal: { base: 1, traces: 0, parts: 0 },
    pcb: { base: 1, traces: 1, parts: 0 }, traces: { base: 1, traces: 1, parts: 1 },
    components: { base: 1, traces: 1, parts: 1 }, system: { base: 1, traces: 1, parts: 1 },
    routes: { base: .85, traces: 1, parts: 0 },
};

const PCBArtwork = memo(function PCBArtwork({ stage = 'pcb', isDark = true, opacity = 1, tracesOpacity = 1, componentsOpacity = 1, ledOn = true, signalPulseOpacity = 0 }) {
    const visible = stages[stage] || { base: 0, traces: 0, parts: 0 };
    const silk = isDark ? '#dce4dc' : '#eef4ec';
    return <g className="pcb-artwork">
        <defs>
            <linearGradient id="pcb-copper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f0d393" />
                <stop offset=".38" stopColor="#bd9050" />
                <stop offset="1" stopColor="#805d34" />
            </linearGradient>
            <pattern id="pcb-ground-mesh" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M0 2.5H5 M2.5 0V5" stroke="#c5a16a" strokeOpacity=".055" strokeWidth=".25" />
            </pattern>
        </defs>
        <g opacity={visible.base * opacity}>
            <rect x="4" y="4" width="192" height="152" rx="5" fill="#183126" stroke="#aab9ad" strokeWidth=".65" />
            <rect x="4.5" y="4.5" width="191" height="151" rx="4.5" fill="url(#pcb-ground-mesh)" />
            <rect x="4.5" y="4.5" width="191" height="151" rx="4.5" fill="url(#pcb-grain)" opacity=".38" />
            <rect x="87" y="4" width="26" height="24" fill="url(#pcb-keepout)" stroke="#b99459" strokeWidth=".4" strokeDasharray="1.4 1" />
            <text x="100" y="7.2" textAnchor="middle" fontSize="1.9" fill="#e2c47d" fontFamily="monospace">ANT1 · BUILT-IN</text>
            <text x="100" y="11" textAnchor="middle" fontSize="1.35" fill={silk} fontFamily="monospace">NO COPPER / GND / PARTS</text>
            {holes.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="4.8" fill="none" stroke="#c8a566" strokeWidth=".7"/><circle cx={x} cy={y} r="2" fill="#101713" stroke="#c8a566" strokeWidth=".5"/></g>)}
            <text x="22" y="137" fontFamily="monospace" fontSize="2.2" fill={silk}>DeKUT · ELECTRONICS</text>
            <rect x="143" y="135" width="38" height="8" fill="#14231a" stroke="#9aa99d" strokeWidth=".35" />
            <text x="145" y="138.4" fontSize="1.8" fill={silk} fontFamily="monospace">SILICON SOUL v2.0</text>
            <text x="145" y="142" fontSize="1.25" fill={silk} fontFamily="monospace">SN-2024-KM-PORTFOLIO-REV2</text>
            <text x="88" y="154.7" textAnchor="middle" fontFamily="monospace" fontSize="1.75" fill="#d8c38d">USB-C / J2</text>
        </g>
        <g opacity={visible.traces * opacity * (stage === 'routes' ? Math.max(.18, tracesOpacity) : tracesOpacity)} fill="none" strokeLinecap="round" strokeLinejoin="round">
            {traces.map(trace => <g key={trace.id}>
                <path d={pathFromPoints(trace.points)} stroke="#523f2a" strokeWidth={trace.width + .45} opacity=".65" />
                <path d={pathFromPoints(trace.points)} stroke="url(#pcb-copper)" strokeWidth={trace.width} opacity=".92" />
                <path d={pathFromPoints(trace.points)} stroke="#f3dfb3" strokeWidth={Math.max(.12, trace.width * .12)} opacity=".55" />
            </g>)}
            {traces.map(trace => <g key={`via-${trace.id}`}><circle cx={trace.points[Math.floor(trace.points.length / 2)][0]} cy={trace.points[Math.floor(trace.points.length / 2)][1]} r="1.45" fill="#c69c5a" stroke="#eed79a" strokeWidth=".35"/><circle cx={trace.points[Math.floor(trace.points.length / 2)][0]} cy={trace.points[Math.floor(trace.points.length / 2)][1]} r=".55" fill="#15251b"/></g>)}
        </g>
        <g opacity={visible.base * opacity * signalPulseOpacity} pointerEvents="none">
            {traces.filter(trace => trace.animate).map(trace => <circle key={`pulse-${trace.id}`} r=".7" fill="#73d7a5">
                <animateMotion path={pathFromPoints(trace.points)} dur="2.8s" repeatCount="indefinite" />
            </circle>)}
        </g>
        <g opacity={visible.base * opacity}>
            <Part part={components[0]} />
        </g>
        <g opacity={visible.parts * opacity * componentsOpacity}>
            {components.slice(1).map(part => <Part key={part.id} part={part} ledOn={ledOn} />)}
        </g>
    </g>;
});

export default PCBArtwork;
