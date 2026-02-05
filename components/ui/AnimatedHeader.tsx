import { ReactNode } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { colors, spacing, shadows } from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
};

interface AnimatedHeaderProps {
  children: ReactNode;
  style?: object;
}

export default function AnimatedHeader({ children, style }: AnimatedHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: glassFallback.background,
    borderBottomWidth: 1,
    borderBottomColor: glassFallback.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
});
