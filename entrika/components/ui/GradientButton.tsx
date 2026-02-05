import { ReactNode } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  colors,
  gradients,
  borderRadius,
  spacing,
  fontSize,
  shadows,
} from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

interface GradientButtonProps {
  onPress: () => void;
  children?: ReactNode;
  label?: string;
  variant?: "primary" | "accent" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

export default function GradientButton({
  onPress,
  children,
  label,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: GradientButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  if (variant === "outline") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={disabled || loading}
        style={[
          styles.outline,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : children ? (
          children
        ) : (
          <Text style={styles.outlineText}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  const gradientColors =
    variant === "accent" ? gradients.accentButton : gradients.primaryButton;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        variant === "primary" ? shadows.glow : shadows.md,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : children ? (
          children
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    color: colors.white,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  outline: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: glassFallback.borderHighlight,
    backgroundColor: glassFallback.background,
  },
  outlineText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  disabled: {
    opacity: 0.6,
  },
});
