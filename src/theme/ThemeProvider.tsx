// ThemeProvider — Yellow v2
// Provides the theme context. v2 is light-only; the hook is structured for
// future dark-mode support without breaking the public API.

import React, { createContext, useContext } from 'react';
import { colors, fontSizes, letterSpacings, lineHeights, motion, radii, shadows, spacing } from './tokens';
import { fontFamilies, type } from './typography';

export interface Theme {
  colors: typeof colors;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  fontSizes: typeof fontSizes;
  lineHeights: typeof lineHeights;
  letterSpacings: typeof letterSpacings;
  fontFamilies: typeof fontFamilies;
  type: typeof type;
  motion: typeof motion;
  dark: false;
}

const lightTheme: Theme = {
  colors,
  spacing,
  radii,
  shadows,
  fontSizes,
  lineHeights,
  letterSpacings,
  fontFamilies,
  type,
  motion,
  dark: false,
};

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // In a future iteration, resolve theme based on device color scheme here.
  return <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
