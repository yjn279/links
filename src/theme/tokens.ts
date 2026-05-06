// Design tokens for Yellow v2 — Sunlit Editorial theme
// Single source of truth. All screens and components must reference these
// constants instead of inline hex/number literals.

// ─── Color ──────────────────────────────────────────────────────────────────

export const colors = {
  // Base (dominant)
  honeyCream: '#FFF6D6',   // primary background
  buttermilk: '#FFE7A0',   // secondary surface

  // Accent
  amber: '#F4B400',        // primary CTA, FAB
  deepGold: '#C8860D',     // emphasis, selected state, links

  // Ink
  warmBlack: '#1B1608',    // body text
  greige: '#5C5547',       // secondary / hint text

  // Destructive
  terracotta: '#C0392B',

  // Surfaces
  cream: '#FFFCF0',        // card background
  goldHairline: '#E9D49B', // thin border / divider
  amberShadow: 'rgba(196, 132, 13, 0.15)',

  // Utility
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
  circle: 9999,
} as const;

// ─── Shadow ──────────────────────────────────────────────────────────────────

export const shadows = {
  card: {
    shadowColor: '#C4840D',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fab: {
    shadowColor: '#C4840D',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
} as const;

// ─── Typography scale ────────────────────────────────────────────────────────

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const lineHeights = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const letterSpacings = {
  tighter: -0.5,
  tight: -0.2,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.2,
} as const;

// ─── Motion ──────────────────────────────────────────────────────────────────

export const motion = {
  staggerDelay: 50,       // ms between each list-item stagger
  fadeInDuration: 300,    // ms for item fade-in
  fadeInTranslateY: 8,    // px upward slide on appear
  fabScaleDown: 0.96,     // FAB press scale
  fabScaleDuration: 120,  // ms
} as const;
