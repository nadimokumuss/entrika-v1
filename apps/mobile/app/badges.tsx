import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trophy, Lock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { borderRadius, spacing, fontSize, shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirement: any;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export default function BadgesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<Record<string, UserBadge>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [user]);

  const fetchBadges = async () => {
    if (!user) return;

    try {
      const [badgesData, userBadgesData] = await Promise.all([
        supabase.from("badges").select("*"),
        supabase.from("user_badges").select("*").eq("user_id", user.id),
      ]);

      if (badgesData.data) setBadges(badgesData.data as Badge[]);

      if (userBadgesData.data) {
        const map: Record<string, UserBadge> = {};
        userBadgesData.data.forEach((ub) => {
          map[ub.badge_id] = ub;
        });
        setUserBadges(map);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const isEarned = (badgeId: string) => !!userBadges[badgeId];

  const earnedCount = Object.keys(userBadges).length;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: spacing.sm,
      marginLeft: -spacing.sm,
    },
    headerTitle: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      textAlign: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollView: {
      flex: 1,
    },
    statsCard: {
      backgroundColor: `${colors.primary}15`,
      margin: spacing.lg,
      padding: spacing.xl,
      borderRadius: borderRadius.xl,
      alignItems: "center",
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    statsCount: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.primary,
    },
    statsLabel: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      marginTop: spacing.xs,
    },
    badgesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: spacing.md,
      gap: spacing.md,
    },
    badgeCard: {
      width: (Dimensions.get("window").width - spacing.lg * 2 - spacing.md) / 2,
      backgroundColor: "rgba(22, 22, 31, 0.6)",
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      ...shadows.sm,
    },
    badgeCardEarned: {
      borderColor: `${colors.primary}40`,
      backgroundColor: `${colors.primary}10`,
    },
    badgeCardLocked: {
      borderColor: "rgba(255, 255, 255, 0.05)",
      opacity: 0.7,
    },
    badgeEmojiContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
      position: "relative",
    },
    badgeEmoji: {
      fontSize: 28,
    },
    lockOverlay: {
      position: "absolute",
      bottom: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeName: {
      fontSize: fontSize.sm,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    badgeNameLocked: {
      color: colors.textMuted,
    },
    badgeDescription: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      lineHeight: 16,
    },
    badgeDescriptionLocked: {
      color: colors.textMuted,
    },
    earnedDate: {
      fontSize: fontSize.xs,
      color: colors.success,
      marginTop: spacing.sm,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: spacing.xxl * 2,
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
      fontSize: fontSize.lg,
      fontWeight: "600",
      color: colors.text,
      marginTop: spacing.lg,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      textAlign: "center",
      marginTop: spacing.sm,
      lineHeight: 22,
    },
  }), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rozetler</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rozetler</Text>
        <Trophy size={24} color={colors.primary} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCount}>{earnedCount}/{badges.length}</Text>
          <Text style={styles.statsLabel}>Kazanılan Rozet</Text>
        </View>

        {/* Badges Grid */}
        <View style={styles.badgesGrid}>
          {badges.map((badge) => {
            const earned = isEarned(badge.id);
            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  earned ? styles.badgeCardEarned : styles.badgeCardLocked,
                ]}
              >
                <View style={styles.badgeEmojiContainer}>
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  {!earned && (
                    <View style={styles.lockOverlay}>
                      <Lock size={16} color={colors.textMuted} />
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
                <Text style={[styles.badgeDescription, !earned && styles.badgeDescriptionLocked]}>
                  {badge.description}
                </Text>
                {earned && userBadges[badge.id] && (
                  <Text style={styles.earnedDate}>
                    {new Date(userBadges[badge.id].earned_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {earnedCount === 0 && (
          <View style={styles.emptyState}>
            <Trophy size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Henüz rozetin yok</Text>
            <Text style={styles.emptyText}>
              Paylaşım yaparak, yorum yazarak ve değerlendirme yaparak rozet kazanabilirsin!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
