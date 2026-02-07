import { ReactNode, useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { spacing, shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

interface AnimatedHeaderProps {
  children: ReactNode;
  style?: object;
}

export default function AnimatedHeader({ children, style }: AnimatedHeaderProps) {
  const { colors, glass } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    header: {
      backgroundColor: glass.background,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      ...shadows.sm,
    },
  }), [colors, glass]);

  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}
