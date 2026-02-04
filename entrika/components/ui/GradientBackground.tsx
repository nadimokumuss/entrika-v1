import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "@/constants/theme";

interface GradientBackgroundProps {
  variant?: "screen" | "auth";
  children: ReactNode;
  style?: object;
}

export default function GradientBackground({
  variant = "screen",
  children,
  style,
}: GradientBackgroundProps) {
  const colorSet = variant === "auth" ? gradients.authBg : gradients.screenBg;

  return (
    <LinearGradient
      colors={colorSet}
      style={[styles.container, style]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
