import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, MapPin, UserPlus, Crown, Sparkles, Shield, TrendingUp, Briefcase } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { borderRadius, spacing, fontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";

import GradientBackground from "@/components/ui/GradientBackground";
import AnimatedHeader from "@/components/ui/AnimatedHeader";
import GlassCard from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

type ExploreTab = "suggested" | "new" | "trusted" | "nearby";

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  reputation_score: number;
  created_at: string;
  is_verified?: boolean;
  bio: string | null;
  city: string | null;
}

function UserProfileCard({
  profile,
  onFollowToggle,
}: {
  profile: UserProfile;
  isFollowing?: boolean; // Optional, deprecated - component now uses FollowContext directly
  onFollowToggle: () => void;
}) {
  const { colors, gradients, glass } = useTheme();
  const router = useRouter();
  const { isFollowing: checkIsFollowing } = useFollow();

  // Use FollowContext directly for real-time sync
  const isCurrentlyFollowing = checkIsFollowing(profile.id);

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return "#EAB308";
    if (score >= 4) return colors.warning;
    return colors.danger;
  };

  const scoreColor = getScoreColor(profile.reputation_score);

  const styles = useMemo(() => StyleSheet.create({
    profileCard: {
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    profileContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarContainer: {
      position: "relative",
      marginRight: spacing.md,
    },
    avatarRing: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.borderLight,
    },
    scoreBadge: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    scoreBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: "bold",
    },
    profileInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    username: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "600",
    },
    verifiedIcon: {
      marginLeft: spacing.xs,
    },
    bioText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      lineHeight: 16,
      marginTop: spacing.xs,
    },
    cityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: spacing.xs,
    },
    cityText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    statsRow: {
      flexDirection: "row",
      marginTop: spacing.xs,
    },
    statText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    statValue: {
      fontWeight: "600",
    },
    joinDate: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.xs,
    },
    followButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: `${colors.primary}15`,
    },
    followButtonText: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    followingButton: {
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
    },
    followingButtonText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
  }), [colors, glass]);

  return (
    <GlassCard style={styles.profileCard}>
      <TouchableOpacity
        onPress={() => router.push(`/user-profile/${profile.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.profileContent}>
          {/* Avatar with gradient ring */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={gradients.premiumShimmer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <Image
                source={{ uri: profile.avatar_url || "https://api.dicebear.com/7.x/lorelei/png?seed=default" }}
                style={styles.avatar}
              />
            </LinearGradient>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
              <Text style={styles.scoreBadgeText}>
                {profile.reputation_score.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>@{profile.username}</Text>
              {profile.is_verified && (
                <Sparkles size={14} color={colors.primary} style={styles.verifiedIcon} />
              )}
            </View>

            {profile.bio && (
              <Text style={styles.bioText} numberOfLines={2}>
                {profile.bio}
              </Text>
            )}

            {profile.city && (
              <View style={styles.cityRow}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={styles.cityText}>{profile.city}</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                Puan: <Text style={[styles.statValue, { color: scoreColor }]}>{profile.reputation_score.toFixed(1)}</Text>
              </Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            style={[
              styles.followButton,
              isCurrentlyFollowing && styles.followingButton,
            ]}
            onPress={onFollowToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isCurrentlyFollowing ? (
              <Text style={styles.followingButtonText}>Takip</Text>
            ) : (
              <>
                <UserPlus size={14} color={colors.primary} />
                <Text style={styles.followButtonText}>Takip Et</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { followUser, unfollowUser, isFollowing: checkIsFollowing } = useFollow();
  const { colors, glass } = useTheme();

  const [activeTab, setActiveTab] = useState<ExploreTab>("suggested");
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: "network" | "server" | "general"; message?: string } | null>(null);

  const fetchProfiles = useCallback(async (tab: ExploreTab, query?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get users that current user is NOT following
      const { data: followingData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = new Set((followingData || []).map((f) => f.following_id));
      followingIds.add(user.id); // Don't show current user

      let queryBuilder = supabase
        .from("profiles")
        .select("id, username, avatar_url, reputation_score, created_at, bio, city")
        .not("id", "in", `(${Array.from(followingIds).join(",")})`)
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply search filter
      if (query && query.trim()) {
        queryBuilder = queryBuilder.ilike("username", `%${query.trim()}%`);
      }

      const { data: profilesData, error: profilesError } = await queryBuilder;

      if (profilesError) throw profilesError;

      // Filter by tab type
      let filteredProfiles = profilesData || [];

      if (tab === "new") {
        // Sort by newest (already done by order)
        filteredProfiles = filteredProfiles.slice(0, 20);
      } else if (tab === "suggested") {
        // Sort by reputation score (highest first)
        filteredProfiles = [...filteredProfiles].sort((a, b) => b.reputation_score - a.reputation_score).slice(0, 20);
      } else if (tab === "trusted") {
        // Filter by reputation >= 7, sort highest first
        filteredProfiles = [...filteredProfiles]
          .filter((p) => p.reputation_score >= 7)
          .sort((a, b) => b.reputation_score - a.reputation_score)
          .slice(0, 20);
      }
      // "nearby" would require location data - for now showing newest

      setProfiles(filteredProfiles);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      // Determine error type
      if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
        setError({ type: "network" });
      } else if (error?.code?.startsWith("5")) {
        setError({ type: "server" });
      } else {
        setError({ type: "general", message: error?.message });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfiles(activeTab);
  }, [fetchProfiles, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles(activeTab, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, fetchProfiles]);

  const handleFollowToggle = (profileId: string) => {
    if (checkIsFollowing(profileId)) {
      unfollowUser(profileId);
    } else {
      followUser(profileId);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    headerTitle: {
      color: colors.text,
      fontSize: fontSize.xl,
      fontWeight: "bold",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      marginLeft: spacing.md,
      fontSize: fontSize.md,
    },
    tabsContainer: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      backgroundColor: glass.backgroundLight,
      borderRadius: borderRadius.md,
    },
    tabActive: {
      backgroundColor: `${colors.primary}20`,
    },
    tabText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    tabTextActive: {
      color: colors.primary,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyText: {
      color: colors.textMuted,
      textAlign: "center",
    },
    bottomSpacer: {
      height: 80,
    },
  }), [colors, glass]);

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <AnimatedHeader>
          <View style={styles.headerTop}>
            <Logo size={24} />
            <Text style={styles.headerTitle}>Keşfet</Text>
          </View>

          {/* Arama */}
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Kullanıcı ara..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "suggested" && styles.tabActive]}
              onPress={() => setActiveTab("suggested")}
            >
              <TrendingUp size={14} color={activeTab === "suggested" ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === "suggested" && styles.tabTextActive]}>
                Populer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "new" && styles.tabActive]}
              onPress={() => setActiveTab("new")}
            >
              <Sparkles size={14} color={activeTab === "new" ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === "new" && styles.tabTextActive]}>
                Yeni
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "trusted" && styles.tabActive]}
              onPress={() => setActiveTab("trusted")}
            >
              <Shield size={14} color={activeTab === "trusted" ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === "trusted" && styles.tabTextActive]}>
                Guvenilir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "nearby" && styles.tabActive]}
              onPress={() => setActiveTab("nearby")}
            >
              <MapPin size={14} color={activeTab === "nearby" ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === "nearby" && styles.tabTextActive]}>
                Yakinim
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedHeader>

        {/* Sonuclar */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <ErrorState
              type={error.type}
              message={error.message}
              onRetry={() => fetchProfiles(activeTab, searchQuery)}
            />
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : profiles.length > 0 ? (
            profiles.map((profile) => (
              <UserProfileCard
                key={profile.id}
                profile={profile}
                onFollowToggle={() => handleFollowToggle(profile.id)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? "Sonuç bulunamadı" : "Keşfetmek için yeni üyeler yok"}
              </Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
