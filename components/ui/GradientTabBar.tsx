import { View, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, gradients, spacing, fontSize, shadows } from "@/constants/theme";

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export default function GradientTabBar({ state, descriptors, navigation }: TabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];

          // Skip hidden tabs
          if (options.href === null) return null;

          const isFocused = state.index === index;
          const label = options.title || route.name;
          const TabIcon = options.tabBarIcon;

          const onPress = () => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Special add button
          if (route.name === "new-post-tab") {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.addButtonWrapper}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={gradients.primaryButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButton}
                >
                  {TabIcon && TabIcon({ color: colors.white, size: 28, focused: true })}
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          const iconColor = isFocused ? colors.primary : colors.textMuted;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {TabIcon && TabIcon({ color: iconColor, size: 24, focused: isFocused })}
              <Text
                style={[
                  styles.label,
                  { color: iconColor },
                  isFocused && styles.labelActive,
                ]}
              >
                {label}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const glass = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: glass.background,
    borderTopWidth: 1,
    borderTopColor: glass.border,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    position: "relative",
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "500",
    marginTop: spacing.xs,
  },
  labelActive: {
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    top: -spacing.sm,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  addButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow,
  },
});
