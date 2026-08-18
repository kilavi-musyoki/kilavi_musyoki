/**
 * src/theme.js — Central design token system.
 *
 * Usage:
 *   import { getTheme } from '../theme.js';
 *   const t = getTheme(isDark);
 *   // → t.accentColor, t.dimColor, t.borderColor, ...
 *
 * Components may keep truly layout-specific local vars
 * (e.g. terminalBg, scopeBg) that only appear in one place.
 */

export const getTheme = (isDark) => ({
  // ── Text ──────────────────────────────────────────────────────────────────
  /** Standard body / nav / card text */
  textColor:    isDark ? '#CED4DE'                : '#2C1F0A',
  /** High-emphasis text — hero H1, contrast headings */
  textBright:   isDark ? '#ffffff'                : '#1A1005',
  /** Muted secondary text */
  dimColor:     isDark ? 'rgba(206,212,222,0.55)' : 'rgba(100,80,30,0.75)',
  /** Very subtle tertiary text (hints, footer sub-lines) */
  subtleColor:  isDark ? 'rgba(206,212,222,0.40)' : 'rgba(100,80,30,0.50)',

  // ── Accent ────────────────────────────────────────────────────────────────
  accentColor:  isDark ? '#4BD8A0'                : '#CE8946',
  accentHover:  isDark ? '#6FE8B8'                : '#B8722E',
  accentGlow:   isDark ? 'rgba(75,216,160,0.35)'  : 'rgba(206,137,70,0.35)',

  // ── Borders ───────────────────────────────────────────────────────────────
  borderColor:  isDark ? 'rgba(75,216,160,0.18)'  : 'rgba(189,183,107,0.45)',
  borderStrong: isDark ? 'rgba(75,216,160,0.32)'  : 'rgba(189,183,107,0.70)',
  borderSubtle: isDark ? 'rgba(75,216,160,0.10)'  : 'rgba(189,183,107,0.22)',
  borderHover:  isDark ? 'rgba(75,216,160,0.55)'  : 'rgba(206,137,70,0.60)',

  // ── Surfaces ──────────────────────────────────────────────────────────────
  cardBg:       isDark ? 'rgba(16,20,28,0.45)'    : 'rgba(255,250,220,0.60)',
  cardBgHover:  isDark ? 'rgba(16,20,28,0.72)'    : 'rgba(255,250,220,0.90)',

  // ── Status indicators ─────────────────────────────────────────────────────
  statusGreen:  isDark ? '#4BD8A0'                : '#059669',
  statusRed:    '#FF5A3C',
  statusGold:   '#D4A843',

  // ── Debug / system bar ────────────────────────────────────────────────────
  debugBar:     isDark ? '#4BD8A0'                : '#CE8946',

  // ── Interactive elements ──────────────────────────────────────────────────
  btnTextColor: isDark ? '#0A0C10'                : '#FFFFFF',

  // ── Footer ────────────────────────────────────────────────────────────────
  footerBg:     isDark ? 'rgba(10,12,16,0.95)'    : 'rgba(253,251,212,0.92)',
  footerBorder: isDark ? 'rgba(75,216,160,0.12)'  : 'rgba(189,183,107,0.35)',
  footerSub:    isDark ? 'rgba(206,212,222,0.40)' : 'rgba(100,80,30,0.55)',
});

