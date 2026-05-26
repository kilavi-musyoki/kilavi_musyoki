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
  textColor:    isDark ? '#CED4DE'                : '#0F172A',
  /** High-emphasis text — hero H1, contrast headings */
  textBright:   isDark ? '#ffffff'                : '#020617',
  /** Muted secondary text */
  dimColor:     isDark ? 'rgba(206,212,222,0.55)' : 'rgba(15,23,42,0.55)',
  /** Very subtle tertiary text (hints, footer sub-lines) */
  subtleColor:  isDark ? 'rgba(206,212,222,0.40)' : 'rgba(15,23,42,0.35)',

  // ── Accent ────────────────────────────────────────────────────────────────
  accentColor:  isDark ? '#4BD8A0'                : '#0D9488',
  accentHover:  isDark ? '#6FE8B8'                : '#0F766E',
  accentGlow:   isDark ? 'rgba(75,216,160,0.35)'  : 'rgba(13,148,136,0.35)',

  // ── Borders ───────────────────────────────────────────────────────────────
  borderColor:  isDark ? 'rgba(75,216,160,0.18)'  : 'rgba(148,163,184,0.4)',
  borderStrong: isDark ? 'rgba(75,216,160,0.32)'  : 'rgba(148,163,184,0.6)',
  borderSubtle: isDark ? 'rgba(75,216,160,0.10)'  : 'rgba(148,163,184,0.2)',
  borderHover:  isDark ? 'rgba(75,216,160,0.55)'  : 'rgba(13,148,136,0.5)',

  // ── Surfaces ──────────────────────────────────────────────────────────────
  cardBg:       isDark ? 'rgba(16,20,28,0.45)'    : 'rgba(255,255,255,0.6)',
  cardBgHover:  isDark ? 'rgba(16,20,28,0.72)'    : 'rgba(255,255,255,0.9)',

  // ── Status indicators ─────────────────────────────────────────────────────
  statusGreen:  isDark ? '#4BD8A0'                : '#059669',
  statusRed:    '#FF5A3C',
  statusGold:   '#D4A843',

  // ── Debug / system bar ────────────────────────────────────────────────────
  debugBar:     isDark ? '#4BD8A0'                : '#0D9488',

  // ── Interactive elements ──────────────────────────────────────────────────
  btnTextColor: isDark ? '#0A0C10'                : '#FFFFFF',

  // ── Footer ────────────────────────────────────────────────────────────────
  footerBg:     isDark ? 'rgba(10,12,16,0.95)'    : 'rgba(241,245,249,0.9)',
  footerBorder: isDark ? 'rgba(75,216,160,0.12)'  : 'rgba(148,163,184,0.3)',
  footerSub:    isDark ? 'rgba(206,212,222,0.40)' : 'rgba(15,23,42,0.45)',
});

