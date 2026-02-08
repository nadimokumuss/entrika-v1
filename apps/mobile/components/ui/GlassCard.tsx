import { ReactNode, useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { borderRadius, shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

interface GlassCardProps {
  children: ReactNode;
  style?: object;
  highlight?: boolean;
}

export default function GlassCard({ children, style, highlight }: GlassCardProps) {
  const { colors, glass } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
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
  }), [colors, glass]);

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
