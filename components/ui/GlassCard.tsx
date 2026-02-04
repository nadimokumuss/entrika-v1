import { ReactNode } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { glass, colors, borderRadius, shadows } from "@/constants/theme";

// Fallback for web build compatibility
const glassStyles = glass || {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

interface GlassCardProps {
  children: ReactNode;
  style?: object;
  highlight?: boolean;
}

export default function GlassCard({ children, style, highlight }: GlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        highlight && styles.cardHighlight,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: glassStyles.background,
    borderWidth: 1,
    borderColor: glassStyles.border,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
    overflow: "hidden",
  },
  cardHighlight: {
    borderColor: glassStyles.borderHighlight,
  },
});
