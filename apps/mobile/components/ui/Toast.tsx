import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  borderRadius,
  spacing,
  fontSize,
  shadows,
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onHide: () => void;
  position?: "top" | "bottom" | "center";
}

export function Toast({ toast, onHide, position = "top" }: ToastProps) {
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const TOAST_CONFIG = useMemo(() => ({
    success: {
      icon: CheckCircle,
      color: colors.success,
      bgColor: `${colors.success}15`,
      borderColor: `${colors.success}30`,
    },
    error: {
      icon: AlertCircle,
      color: colors.danger,
      bgColor: `${colors.danger}15`,
      borderColor: `${colors.danger}30`,
    },
    info: {
      icon: Info,
      color: colors.primary,
      bgColor: `${colors.primary}15`,
      borderColor: `${colors.primary}30`,
    },
    warning: {
      icon: AlertTriangle,
      color: colors.warning,
      bgColor: `${colors.warning}15`,
      borderColor: `${colors.warning}30`,
    },
  }), [colors]);

  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;
  const duration = toast.duration || 3000;

  const styles = useMemo(() => StyleSheet.create({
    toastContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 9999,
      paddingHorizontal: spacing.md,
    },
    toastTop: {
      top: 0,
    },
    toastBottom: {
      bottom: 0,
    },
    toastCenter: {
      top: "50%",
      marginTop: -50,
    },
    toastSafeArea: {
      width: "100%",
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      ...shadows.md,
    },
    toastIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    toastContent: {
      flex: 1,
    },
    toastTitle: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.text,
    },
    toastMessage: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      marginTop: 2,
    },
    toastClose: {
      padding: spacing.xs,
      marginLeft: spacing.sm,
    },
    toastProgress: {
      height: 3,
      marginTop: spacing.xs,
      borderRadius: 2,
    },
  }), [colors]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        mass: 1,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      handleHide();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleHide = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getPositionStyle = () => {
    switch (position) {
      case "bottom":
        return styles.toastBottom;
      case "center":
        return styles.toastCenter;
      default:
        return styles.toastTop;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <SafeAreaView edges={["top"]} style={styles.toastSafeArea}>
        <View
          style={[
            styles.toast,
            {
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.toastIcon,
              { backgroundColor: `${config.color}20` },
            ]}
          >
            <Icon size={20} color={config.color} />
          </View>

          {/* Content */}
          <View style={styles.toastContent}>
            <Text style={[styles.toastTitle, { color: config.color }]}>
              {toast.title}
            </Text>
            {toast.message && (
              <Text style={styles.toastMessage}>{toast.message}</Text>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.toastClose}
            onPress={handleHide}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <Animated.View
          style={[
            styles.toastProgress,
            { backgroundColor: config.color },
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["100%", "0%"],
              }),
            },
          ]}
        />
      </SafeAreaView>
    </Animated.View>
  );
}
