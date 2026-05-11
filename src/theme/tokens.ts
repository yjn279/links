/**
 * Links Design System — Tokens
 * Source of truth: design-spec/colors_and_type.css
 */

// ---------- COLOR — Brand ----------
export const color = {
  amber:        '#F5C518',
  amberHover:   '#FFD335',
  amberPress:   '#E2B400',
  amberSoft:    '#FFF4C7',
  amberRing:    'rgba(245, 197, 24, 0.25)',

  // Neutrals (warm)
  paper:        '#F8F4EC',
  paper2:       '#F2EDE2',
  card:         '#FEFCF7',
  white:        '#FFFFFF',
  ink:          '#1F1A14',
  ink2:         '#4A4238',
  ink3:         '#837C6F',
  ink4:         '#B8B0A1',
  line:         'rgba(31, 26, 20, 0.06)',
  line2:        'rgba(31, 26, 20, 0.10)',

  // Category dots
  catTech:      '#F5C518',
  catDesign:    '#B8541C',
  catRecipes:   '#E76F2C',
  catTravel:    '#2DA47A',
  catLearning:  '#2F6BE0',
} as const;

// ---------- COLOR — Liquid Glass ----------
export const glass = {
  tint:       'rgba(255, 252, 247, 0.72)',
  tintStrong: 'rgba(255, 252, 247, 0.88)',
  border:     'rgba(255, 255, 255, 0.65)',
  blurAmount: 24,
  saturate:   1.4,
} as const;

// ---------- TYPE — Families ----------
export const fontFamily = {
  serif: 'DMSerifDisplay_400Regular',
  sans:  'Inter_400Regular',
  sans500: 'Inter_500Medium',
  sans600: 'Inter_600SemiBold',
  sans700: 'Inter_700Bold',
} as const;

// ---------- TYPE — Semantic scale ----------
export const typeScale = {
  display:  { fontSize: 56, lineHeight: 56 * 1.05, fontFamily: fontFamily.serif },
  h1:       { fontSize: 40, lineHeight: 40 * 1.10, fontFamily: fontFamily.serif },
  h2:       { fontSize: 28, lineHeight: 28 * 1.15, fontFamily: fontFamily.serif },
  h3:       { fontSize: 18, lineHeight: 18 * 1.30, fontFamily: fontFamily.sans600, fontWeight: '600' as const },
  stat:     { fontSize: 44, lineHeight: 44,        fontFamily: fontFamily.sans700, fontWeight: '700' as const },
  body:     { fontSize: 15, lineHeight: 15 * 1.50, fontFamily: fontFamily.sans },
  bodySm:   { fontSize: 13, lineHeight: 13 * 1.45, fontFamily: fontFamily.sans },
  label:    { fontSize: 11, lineHeight: 11 * 1.20, fontFamily: fontFamily.sans600, fontWeight: '600' as const },
  caption:  { fontSize: 12, lineHeight: 12 * 1.40, fontFamily: fontFamily.sans },
  button:   { fontSize: 14, lineHeight: 14 * 1.20, fontFamily: fontFamily.sans600, fontWeight: '600' as const },
} as const;

type FontRole = keyof typeof typeScale;
type FontResult = (typeof typeScale)[FontRole];

export function getFont(role: FontRole): FontResult {
  return typeScale[role];
}

// ---------- SPACING ----------
export const sp = {
  1:   4,
  2:   8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  32,
  8:  40,
  9:  56,
  10: 80,
} as const;

// ---------- RADIUS ----------
export const radius = {
  xs:   6,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  pill: 999,
} as const;

// ---------- ELEVATION (shadow objects for RN) ----------
export const elevation = {
  e1: {
    shadowColor: '#1F1A14',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  e2: {
    shadowColor: '#1F1A14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  e3: {
    shadowColor: '#1F1A14',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 8,
  },
} as const;

// ---------- MOTION ----------
export const motion = {
  dFast: 120,
  dBase: 200,
  dSlow: 320,
} as const;

// ---------- THUMB GRADIENTS (for BookmarkCard) ----------
export const THUMB_GRADIENTS = {
  violet: ['#5847C4', '#2F2A6B'] as const,
  paper:  ['#FAF6EE', '#E9DEC8'] as const,
  indigo: ['#3D2DA0', '#1B1448'] as const,
  orange: ['#F1A86A', '#B8541C'] as const,
  teal:   ['#7BC9AE', '#1F6E55'] as const,
} as const;

export type ThumbKey = keyof typeof THUMB_GRADIENTS;
export const THUMB_KEYS = Object.keys(THUMB_GRADIENTS) as ThumbKey[];

/** Pick a gradient key deterministically from a bookmark id */
export function pickThumb(id: string): ThumbKey {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return THUMB_KEYS[hash % THUMB_KEYS.length];
}

// ---------- SIDEBAR COLLECTIONS (static data) ----------
export const SIDEBAR_COLLECTIONS = [
  { id: 'tech',     name: 'Technology', count: 34, color: color.catTech },
  { id: 'design',   name: 'Design',     count: 28, color: color.catDesign },
  { id: 'recipes',  name: 'Recipes',    count: 45, color: color.catRecipes },
  { id: 'travel',   name: 'Travel',     count: 19, color: color.catTravel },
  { id: 'learning', name: 'Learning',   count: 30, color: color.catLearning },
] as const;
