import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function Logo({ size = 20 }: { size?: number }) {
  const { isDark } = useTheme();

  const barColors = isDark
    ? ["#A855F7", "#F472B6", "#8B5CF6"]
    : ["#FF7F11", "#ACBFA4", "#FFA04D"];

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: barColors[0], width: size }]} />
      <View style={[styles.bar, { backgroundColor: barColors[1], width: size }]} />
      <View style={[styles.bar, { backgroundColor: barColors[2], width: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 3,
    alignItems: "center",
  },
  bar: {
    height: 3,
    borderRadius: 2,
  },
});
