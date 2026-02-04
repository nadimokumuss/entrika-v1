// Entrika Renk Paleti - Dark Premium
export const colors = {
  // Ana arka plan - Derin koyu
  background: "#0A0A0F",
  // Kart arka plani - Koyu gri-mavi
  card: "#16161F",
  // Elevated kart
  cardElevated: "#1E1E2A",
  // Marka rengi - Mor
  primary: "#A855F7",
  // Primary acik ton
  primaryLight: "#C084FC",
  // Accent - Pembe
  accent: "#F472B6",
  // Tehlike - Kirmizi
  danger: "#EF4444",
  // Guven - Yesil
  success: "#22C55E",
  // Uyari - Amber
  warning: "#F59E0B",
  // Metin renkleri (Dark mode icin acik)
  text: "#F1F1F6",
  textLight: "#A1A1B5",
  textMuted: "#5A5A72",
  // Border
  border: "#2A2A3C",
  borderLight: "#1E1E2A",
  // Beyaz (sabit)
  white: "#FFFFFF",
  // Karanlik tema icin white tonlari
  white90: "#F1F1F6",
  white70: "#C4C4D4",
  white50: "#A1A1B5",
  white40: "#7A7A92",
  white30: "#5A5A72",
  white20: "#2A2A3C",
  white10: "#1E1E2A",
  white05: "#16161F",
};

export const gradients: Record<string, [string, string, ...string[]]> = {
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

export const glass = {
  background: "rgba(22, 22, 31, 0.6)",
  backgroundLight: "rgba(22, 22, 31, 0.4)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
  blur: 20,
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
