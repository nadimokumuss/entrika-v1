import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Sparkles, MessageCircle, X } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, gradients, shadows } from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MatchModalProps {
  visible: boolean;
  matchData: {
    id: string;
    name: string;
    age?: number;
    avatar_url?: string;
    username: string;
  } | null;
  onClose: () => void;
}

export function MatchModal({ visible, matchData, onClose }: MatchModalProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          delay: 50,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Confetti animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      pulseAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible]);

  if (!matchData) return null;

  const handleMessage = () => {
    onClose();
    router.push(`/chat/${matchData.id}`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Pulse Glow Background */}
          <Animated.View
            style={[
              styles.pulseGlow,
              {
                opacity: Animated.add(0.2, Animated.multiply(pulseAnim, 0.3)),
              },
            ]}
          />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Sparkles Icon */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.iconGlow,
                {
                  opacity: pulseAnim,
                },
              ]}
            />
            <Sparkles size={48} color={colors.primary} style={styles.icon} />
          </View>

          {/* Title */}
          <Text style={styles.title}>EŞLEŞME!</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {matchData.name} ile eşleştin
          </Text>

          {/* Match Info */}
          <View style={styles.matchInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={gradients.premiumShimmer}
                style={styles.avatarRing}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>
                    {matchData.avatar_url ? (
                      <Image
                        source={{ uri: matchData.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      matchData.name.charAt(0)
                    )}
                  </Text>
                </View>
              </LinearGradient>
            </View>
            <View style={styles.heartsContainer}>
              <Animated.View
                style={[
                  styles.confetti,
                  {
                    transform: [
                      {
                        translateY: Animated.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 0],
                        }),
                      },
                      {
                        opacity: confettiAnim,
                      },
                    ],
                  },
                ]}
              >
                <Heart size={20} color={colors.primary} fill={colors.primary} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.confetti,
                  {
                    transform: [
                      {
                        translateY: Animated.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 0],
                        }),
                      },
                      {
                        translateX: 30,
                      },
                      {
                        opacity: Animated.delay(
                          confettiAnim,
                          200
                        ).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Heart size={16} color={colors.accent} fill={colors.accent} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.confetti,
                  {
                    transform: [
                      {
                        translateY: Animated.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 0],
                        }),
                      },
                      {
                        translateX: -30,
                      },
                      {
                        opacity: Animated.delay(confettiAnim, 400).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Heart size={24} color={colors.success} fill={colors.success} />
              </Animated.View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.keepButton]}
              onPress={onClose}
            >
              <Text style={styles.keepButtonText}>Keşfetmeye Devam Et</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessage}
            >
              <LinearGradient
                colors={gradients.premiumShimmer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.messageGradient}
              >
                <MessageCircle size={20} color={colors.white} style={styles.messageIcon} />
                <Text style={styles.messageButtonText}>Mesaj At</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    ...shadows.lg,
  },
  pulseGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
  },
  closeButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: glassFallback.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}30`,
  },
  icon: {
    position: "relative",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  matchInfo: {
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 47,
    backgroundColor: glassFallback.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarEmoji: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.primary,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  heartsContainer: {
    position: "relative",
    height: 60,
    width: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  confetti: {
    position: "absolute",
  },
  actions: {
    width: "100%",
    gap: spacing.md,
  },
  actionButton: {
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  keepButton: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
  },
  keepButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  messageButton: {
    overflow: "hidden",
  },
  messageGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  messageIcon: {},
  messageButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.white,
  },
});
