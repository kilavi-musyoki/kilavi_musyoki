import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Initialize scroll-driven deconstruction of the PCB board.
 *
 * Maps normalized scroll progress (0 → 1) of the whole page to
 * conceptual hardware layers (actual thresholds match the LAYERS array below):
 *
 * 0.00–0.02 → casing
 * 0.02–0.03 → thermal
 * 0.03–0.04 → pcb
 * 0.04–0.07 → traces
 * 0.07–0.12 → components
 * 0.12–0.15 → die      (Board.jsx has no renderer — falls back silently to default)
 * 0.15–1.00 → quantum  (Board.jsx has no renderer — falls back silently to default)
 *
 * Crossing a region boundary triggers a brief 300ms glitch flash.
 *
 * @param {(layer: string) => void} setLayer
 * @param {(active: boolean) => void} setGlitch
 * @returns {() => void} cleanup function
 */
export function initScroll(setLayer, setGlitch) {
  const LAYERS = [
    { name: 'casing', from: 0.0, to: 0.02 },
    { name: 'thermal', from: 0.02, to: 0.03 },
    { name: 'pcb', from: 0.03, to: 0.04 },
    { name: 'traces', from: 0.04, to: 0.07 },
    { name: 'components', from: 0.07, to: 0.12 },
    { name: 'die', from: 0.12, to: 0.15 },
    { name: 'quantum', from: 0.15, to: 1.01 },
  ];

  let currentLayer = 'casing';
  let glitchTimeout = null;

  const findLayer = (progress) =>
    LAYERS.find((l) => progress >= l.from && progress < l.to) || LAYERS[0];

  const triggerGlitch = () => {
    if (glitchTimeout) {
      clearTimeout(glitchTimeout);
    }
    setGlitch(true);
    glitchTimeout = setTimeout(() => {
      setGlitch(false);
    }, 100); // 100ms — crisp frame-skip feel, not a prolonged visual jank
  };

  const st = ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.5,
    onUpdate: (self) => {
      const progress = self.progress; // 0 → 1
      const { name } = findLayer(progress);
      if (name !== currentLayer) {
        currentLayer = name;
        setLayer(name);
        triggerGlitch();
      }
    },
  });

  // Initialize with current scroll position
  const initialProgress = ScrollTrigger.maxScroll(window) === 0
    ? 0
    : window.scrollY / ScrollTrigger.maxScroll(window);
  const { name } = findLayer(initialProgress);
  currentLayer = name;
  setLayer(name);

  return () => {
    st.kill();
    if (glitchTimeout) {
      clearTimeout(glitchTimeout);
    }
  };
}

