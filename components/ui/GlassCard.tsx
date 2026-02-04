import { ReactNode } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { glass, colors, borderRadius, shadows } from "@/constants/theme";

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
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
    overflow: "hidden",
  },
  cardHighlight: {
    borderColor: glass.borderHighlight,
  },
});
