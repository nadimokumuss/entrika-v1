import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal as RNModal,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { X } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, glass } from "@/constants/theme";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: any;
  animationType?: "fade" | "slide" | "scale";
  showCloseButton?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  style,
  animationType = "slide",
  showCloseButton = true,
}: ModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      if (animationType === "fade") {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (animationType === "slide") {
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          useNativeDriver: true,
        }).start();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          delay: 50,
          useNativeDriver: true,
        }).start();
      } else if (animationType === "scale") {
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          useNativeDriver: true,
        }).start();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    } else {
      // Exit animation
      if (animationType === "fade") {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      } else if (animationType === "slide") {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (animationType === "scale") {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [visible, animationType]);

  const overlayStyle = {
    opacity: fadeAnim,
  };

  const contentStyle: any = {
    transform:
      animationType === "slide"
        ? [{ translateY: slideAnim }]
        : animationType === "scale"
        ? [{ scale: scaleAnim }]
        : undefined,
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="transparent" barStyle="light-content" />
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Animated.View style={[styles.container, contentStyle, style]}>
          {/* Header */}
          {(title || showCloseButton) && (
            <View style={styles.header}>
              {title && <Text style={styles.title}>{title}</Text>}
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={24} color={colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          {children}
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  container: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: glass.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
});
