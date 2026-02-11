export const APP_VERSION = "1.0.0";

// ─── Type Definitions ───

export type ThemeColors = {
  background: string;
  card: string;
  cardElevated: string;
  primary: string;
  primaryLight: string;
  accent: string;
  danger: string;
  success: string;
  warning: string;
  text: string;
  textLight: string;
  textMuted: string;
  border: string;
  borderLight: string;
  white: string;
  text90: string;
  text70: string;
  text50: string;
  text40: string;
  text30: string;
  text20: string;
  text10: string;
  text05: string;
};

export type ThemeGradients = Record<string, [string, string, ...string[]]>;

export type ThemeGlass = {
  background: string;
  backgroundLight: string;
  border: string;
  borderHighlight: string;
  blur: number;
};

export type Theme = {
  colors: ThemeColors;
  gradients: ThemeGradients;
  glass: ThemeGlass;
};

// ─── Light Theme ───

export const lightColors: ThemeColors = {
  background: "#F5FBE6",
  card: "#E2E8CE",
  cardElevated: "#D8DFC4",
  primary: "#FF7F11",
  primaryLight: "#FFA04D",
  accent: "#FF7F11",
  danger: "#C93A2B",
  success: "#4A7856",
  warning: "#D9822B",
  text: "#262626",
  textLight: "#4A4A4A",
  textMuted: "#7A7A7A",
  border: "#ACBFA4",
  borderLight: "#C8D4BE",
  white: "#FFFFFF",
  text90: "#262626",
  text70: "#4A4A4A",
  text50: "#7A7A7A",
  text40: "#999999",
  text30: "#ACBFA4",
  text20: "#C8D4BE",
  text10: "#E2E8CE",
  text05: "#EDF2DD",
};

export const lightGradients: ThemeGradients = {
  screenBg: ["#F5FBE6", "#EDF2DD", "#F5FBE6"],
  authBg: ["#EDF2DD", "#E2E8CE", "#F5FBE6"],
  primaryButton: ["#FF7F11", "#E06A00"],
  accentButton: ["#FFA04D", "#FF7F11"],
  premiumShimmer: ["#FF7F11", "#FFA04D", "#FF7F11"],
  skeletonShimmer: ["#E2E8CE", "#D8DFC4", "#E2E8CE"],
  tabBar: ["rgba(245,251,230,0)", "rgba(245,251,230,0.8)", "#F5FBE6"],
  cardOverlay: ["transparent", "rgba(245,251,230,0.9)"],
  glassOverlay: ["rgba(226,232,206,0.6)", "rgba(226,232,206,0.8)"],
};

export const lightGlass: ThemeGlass = {
  background: "rgba(226, 232, 206, 0.6)",
  backgroundLight: "rgba(226, 232, 206, 0.4)",
  border: "rgba(172, 191, 164, 0.3)",
  borderHighlight: "rgba(255, 127, 17, 0.2)",
  blur: 20,
};

// ─── Dark Theme ───

export const darkColors: ThemeColors = {
  background: "#0A0A0F",
  card: "#16161F",
  cardElevated: "#1E1E2A",
  primary: "#A855F7",
  primaryLight: "#C084FC",
  accent: "#F472B6",
  danger: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  text: "#F1F1F6",
  textLight: "#A1A1B5",
  textMuted: "#5A5A72",
  border: "#2A2A3C",
  borderLight: "#1E1E2A",
  white: "#FFFFFF",
  text90: "#F1F1F6",
  text70: "#C4C4D4",
  text50: "#A1A1B5",
  text40: "#7A7A92",
  text30: "#5A5A72",
  text20: "#2A2A3C",
  text10: "#1E1E2A",
  text05: "#16161F",
};

export const darkGradients: ThemeGradients = {
  screenBg: ["#0A0A0F", "#12101F", "#0A0A0F"],
  authBg: ["#0F0A1E", "#1A0B2E", "#0A0A0F"],
  primaryButton: ["#A855F7", "#9333EA"],
  accentButton: ["#F472B6", "#EC4899"],
  premiumShimmer: ["#A855F7", "#F472B6", "#A855F7"],
  skeletonShimmer: ["#1E1E2A", "#2A2A3C", "#1E1E2A"],
  tabBar: ["rgba(10,10,15,0)", "rgba(10,10,15,0.8)", "#0A0A0F"],
  cardOverlay: ["transparent", "rgba(10,10,15,0.9)"],
  glassOverlay: ["rgba(22,22,31,0.6)", "rgba(22,22,31,0.8)"],
};

export const darkGlass: ThemeGlass = {
  background: "rgba(22, 22, 31, 0.6)",
  backgroundLight: "rgba(22, 22, 31, 0.4)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
  blur: 20,
};

// ─── Theme-independent constants ───

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};
