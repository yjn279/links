// Typography presets for Yellow v2 — Sunlit Editorial
// Font names are centralised here; screens must not hard-code fontFamily strings.

import { fontSizes, letterSpacings, lineHeights } from './tokens';

// ─── Font family names ───────────────────────────────────────────────────────
// Kept in sync with useFonts map in app/_layout.tsx.
// The string values must match the asset keys used in useFonts().

export const fontFamilies = {
  display: 'PlayfairDisplay-Regular',
  displayBold: 'PlayfairDisplay-Bold',
  body: 'Manrope-Regular',
  bodySemiBold: 'Manrope-SemiBold',
  bodyBold: 'Manrope-Bold',
} as const;

// ─── Style presets ───────────────────────────────────────────────────────────

export const type = {
  displayHero: {
    fontFamily: fontFamilies.displayBold,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  displayTitle: {
    fontFamily: fontFamilies.displayBold,
    fontSize: fontSizes.xxl,
    lineHeight: fontSizes.xxl * lineHeights.snug,
    letterSpacing: letterSpacings.tight,
  },
  displaySmall: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.snug,
    letterSpacing: letterSpacings.normal,
  },
  sectionHeading: {
    fontFamily: fontFamilies.displayBold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.snug,
    letterSpacing: letterSpacings.wide,
  },
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: letterSpacings.wider,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.snug,
    letterSpacing: letterSpacings.wide,
  },
  button: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.tight,
    letterSpacing: letterSpacings.wide,
  },
} as const;
