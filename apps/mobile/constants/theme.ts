// Re-export shared theme values
export {
  APP_VERSION,
  lightColors,
  darkColors,
  lightGradients,
  darkGradients,
  lightGlass,
  darkGlass,
  spacing,
  borderRadius,
  fontSize,
  shadows,
} from "@entrika/shared";

export type {
  ThemeColors,
  ThemeGradients,
  ThemeGlass,
  Theme,
} from "@entrika/shared";

// ─── Mobile-specific: Backward Compatibility (defaults to dark for static imports) ───
import {
  darkColors,
  darkGradients,
  darkGlass,
  shadows as _shadows,
  spacing as _spacing,
  borderRadius as _borderRadius,
  fontSize as _fontSize,
} from "@entrika/shared";

export const colors = darkColors;
export const gradients = darkGradients;
export const glass = darkGlass;

// ─── Mobile-specific: Accessibility constants ───
export const accessibility = {
  minTouchTarget: 44,
  minTouchTargetLarge: 48,
  contrast: {
    normalText: 4.5,
    largeText: 3,
    graphics: 3,
  },
  focusRing: {
    width: 3,
    color: "#A855F7",
    offset: 2,
    borderRadius: 4,
  },
  fontSize: {
    minReadable: 16,
    preferred: 18,
  },
  spacing: {
    compact: 8,
    comfortable: 12,
    spacious: 16,
  },
};

export { glass as defaultGlass };
export default {
  colors,
  gradients,
  glass,
  shadows: _shadows,
  spacing: _spacing,
  borderRadius: _borderRadius,
  fontSize: _fontSize,
};
