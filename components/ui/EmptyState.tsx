import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, borderRadius, spacing, fontSize, gradients, shadows } from "@/constants/theme";

interface EmptyStateProps {
  type: "feed" | "match" | "explore" | "notifications" | "messages" | "profile" | "following";
  style?: any;
}

const EMPTY_STATES = {
  feed: {
    emoji: "👻",
    title: "Henüz kimse konuşmuyor",
    description: "İlk paylaşımı sen yap ve gizemi başlat",
    actionText: "Paylaşım Oluştur",
    actionRoute: "/new-post",
  },
  match: {
    emoji: "🔮",
    title: "Eşleşme yok... henüz",
    description: "Gizli profilleri keşfetmeye başla",
    actionText: "Swipe'e Başla",
    actionRoute: "/match",
  },
  explore: {
    emoji: "🕵️",
    title: "Gizemli profiller yok",
    description: "Anonim olarak değerlendirmeler yap",
    actionText: "Profilleri Keşfet",
    actionRoute: "/explore",
  },
  notifications: {
    emoji: "🔕",
    title: "Bildirim yok",
    description: "Bir şeyler olduğunda haber vereceğiz",
    actionText: null,
    actionRoute: null,
  },
  messages: {
    emoji: "💬",
    title: "Mesaj yok",
    description: "Eşleşmelerine mesaj atarak başla",
    actionText: "Match'e Git",
    actionRoute: "/match",
  },
  profile: {
    emoji: "👤",
    title: "Profil boş",
    description: "Kendini tanıt, değerlendirmeleri al",
    actionText: "Profili Düzenle",
    actionRoute: "/edit-profile",
  },
  following: {
    emoji: "👥",
    title: "Henüz kimseyi takip etmiyorsun",
    description: "İlgi çekici kullanıcıları keşfet ve takip et",
    actionText: "Keşfet",
    actionRoute: "/explore",
  },
};

export function EmptyState({ type, style }: EmptyStateProps) {
  const router = useRouter();
  const config = EMPTY_STATES[type];

  const handleAction = () => {
    if (config.actionRoute) {
      router.push(config.actionRoute);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Mystery Glow Effect */}
      <View style={styles.glowContainer}>
        <View style={styles.glow} />
      </View>

      {/* Emoji */}
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{config.emoji}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{config.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{config.description}</Text>

      {/* Action Button */}
      {config.actionText && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradients.premiumShimmer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.actionText}>{config.actionText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Mystery Dots */}
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, { opacity: 0.3 }]} />
        <View style={[styles.dot, { opacity: 0.5 }]} />
        <View style={[styles.dot, { opacity: 0.7 }]} />
        <View style={[styles.dot, { opacity: 0.5 }]} />
        <View style={[styles.dot, { opacity: 0.3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    minHeight: 400,
  },
  glowContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  emojiContainer: {
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  gradient: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  actionText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  dotsContainer: {
    position: "absolute",
    bottom: spacing.xl,
    flexDirection: "row",
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
