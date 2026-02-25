import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Settings, Share2, Heart, Star, Camera, Edit3, Bookmark, Award, ChevronRight, MessageCircle, Flame, MapPin, Briefcase } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { borderRadius, spacing, fontSize, shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase, UserReview } from "@/lib/supabase";

import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, REACTIONS, type PostCategory, type ReactionType } from "@/constants/categories";
import { pickImage, uploadImage, showImageSourcePicker, extractPathFromUrl, deleteImage } from "@/lib/storage";
import GradientBackground from "@/components/ui/GradientBackground";
import Logo from "@/components/Logo";
import { ErrorState } from "@/components/ui/ErrorState";

type TabType = "paylaşımlar" | "degerlendirmeler" | "yorumlar" | "tepkiler";

interface Badge {
  id: string;
  name: string;
  emoji: string;
}

interface ReviewWithReviewer extends UserReview {
  reviewer?: { username: string } | null;
}

const POSITIVE_TAGS = ["Nazik", "Güvenilir", "Eğlenceli", "Samimi", "İlgili", "Saygılı", "Dürüst"];


interface UserPost {
  id: string;
  content: string;
  category: PostCategory;
  created_at: string;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Az önce";
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();
  const { colors, gradients, glass } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("paylaşımlar");
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [userReactions, setUserReactions] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [reactionsLoaded, setReactionsLoaded] = useState(false);
  const [relationshipStatus, setRelationshipStatus] = useState<string | null>(null);
  const [error, setError] = useState<{ type: "network" | "server" | "general"; message?: string } | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, content, category, created_at, is_anonymous")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      setPostCount(postsData?.length || 0);

      const visiblePosts = (postsData || [])
        .filter((p) => !p.is_anonymous)
        .map((p) => ({
          id: p.id,
          content: p.content,
          category: p.category as PostCategory,
          created_at: p.created_at,
        }));
      setUserPosts(visiblePosts);

      const { data: reviewsData } = await supabase
        .from("user_reviews")
        .select("*, reviewer:profiles!user_reviews_reviewer_id_fkey(username)")
        .eq("target_user_id", user.id)
        .order("created_at", { ascending: false });

      setReviews((reviewsData as ReviewWithReviewer[]) || []);

      // Fetch user badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("badge_id, badges(*)")
        .eq("user_id", user.id)
        .limit(3);

      if (badgesData) {
        setBadges(badgesData.map((ub: any) => ub.badges).filter(Boolean));
      }

      // Fetch relationship status from dating_profiles
      const { data: datingProfile } = await supabase
        .from("dating_profiles")
        .select("relationship_status")
        .eq("user_id", user.id)
        .single();
      setRelationshipStatus(datingProfile?.relationship_status || null);

      // Fetch follow counts
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", user.id),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", user.id),
      ]);
      setFollowersCount(followersResult.count || 0);
      setFollowingCount(followingResult.count || 0);
    } catch (error: any) {
      console.error("Error fetching user data:", error);
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

  const fetchUserComments = useCallback(async () => {
    if (!user || commentsLoaded) return;
    try {
      const { data } = await supabase
        .from("comments")
        .select("id, content, created_at, post_id, posts(id, content)")
        .eq("author_id", user.id)
        .eq("is_anonymous", false)
        .order("created_at", { ascending: false })
        .limit(50);
      setUserComments(data || []);
      setCommentsLoaded(true);
    } catch (e) {
      console.error("Error fetching user comments:", e);
    }
  }, [user, commentsLoaded]);

  const fetchUserReactions = useCallback(async () => {
    if (!user || reactionsLoaded) return;
    try {
      const { data } = await supabase
        .from("post_reactions")
        .select("id, reaction_type, created_at, post_id, posts(id, content)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setUserReactions(data || []);
      setReactionsLoaded(true);
    } catch (e) {
      console.error("Error fetching user reactions:", e);
    }
  }, [user, reactionsLoaded]);

  // Lazy load tabs
  useEffect(() => {
    if (activeTab === "yorumlar") fetchUserComments();
    if (activeTab === "tepkiler") fetchUserReactions();
  }, [activeTab, fetchUserComments, fetchUserReactions]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setCommentsLoaded(false);
      setReactionsLoaded(false);
      fetchUserData();
    }, [fetchUserData])
  );

  const handleAvatarPress = () => {
    if (uploadingAvatar || !user) return;
    showImageSourcePicker(async (source) => {
      try {
        const uri = await pickImage({ source, aspect: [1, 1], quality: 0.8 });
        if (!uri) return;

        setUploadingAvatar(true);

        if (profile?.avatar_url) {
          const oldPath = extractPathFromUrl(profile.avatar_url, "avatars");
          if (oldPath) {
            await deleteImage("avatars", oldPath).catch((e) => {
              console.warn("Failed to delete old avatar:", e);
            });
          }
        }

        const publicUrl = await uploadImage("avatars", user.id, uri);

        if (!publicUrl) {
          throw new Error("Avatar yüklenemedi.");
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", user.id);

        if (updateError) throw updateError;

        await refreshProfile();
      } catch (error: any) {
        console.error("Avatar upload error:", error);
        Alert.alert("Hata", error.message || "Avatar yüklenemedi.");
      } finally {
        setUploadingAvatar(false);
      }
    });
  };

  const handleShare = async () => {
    if (!profile) return;

    const shareUrl = `https://entrika.vercel.app/u/${profile.username}`;
    const shareMessage = `@${profile.username} profiline göz at! Entrika'da tanışmadan önce tanı.`;

    try {
      if (Platform.OS === "web") {
        // Web: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        Alert.alert("Kopyalandı", "Profil linki panoya kopyalandı!");
      } else {
        // Native: Use Share API
        const { Share } = require("react-native");
        await Share.share({
          message: `${shareMessage}\n\n${shareUrl}`,
          url: shareUrl,
        });
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingContent: {
      alignItems: "center",
      paddingVertical: 32,
    },
    headerActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    headerActionsWithLogo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    headerActionsRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconButton: {
      padding: spacing.sm,
    },
    iconButtonMargin: {
      marginLeft: spacing.sm,
    },
    profileSection: {
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    avatarContainer: {
      position: "relative",
    },
    avatarRing: {
      width: 104,
      height: 104,
      borderRadius: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInner: {
      width: 96,
      height: 96,
      borderRadius: 48,
      overflow: "hidden",
      backgroundColor: colors.background,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.borderLight,
    },
    avatarOverlay: {
      position: "absolute",
      top: 4,
      left: 4,
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
    },
    cameraIconBadge: {
      position: "absolute",
      bottom: 4,
      right: 4,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    scoreBadge: {
      position: "absolute",
      bottom: -4,
      right: -4,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.background,
    },
    scoreBadgeText: {
      color: colors.white,
      fontWeight: "bold",
      fontSize: fontSize.sm,
    },
    fullName: {
      color: colors.text,
      fontSize: fontSize.xl,
      fontWeight: "bold",
      marginTop: spacing.lg,
    },
    username: {
      color: colors.textLight,
      fontSize: fontSize.md,
      fontWeight: "600",
    },
    usernameRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.xs,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.sm,
      gap: spacing.lg,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    infoText: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
    },
    relationshipBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: `${colors.accent}15`,
      borderRadius: borderRadius.full,
    },
    relationshipText: {
      color: colors.accent,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    editButton: {
      marginLeft: spacing.sm,
      padding: spacing.xs,
    },
    bio: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      textAlign: "center",
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    reputationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    reputationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.sm,
    },
    reputationText: {
      fontSize: fontSize.sm,
      fontWeight: "500",
    },
    statsContainer: {
      flexDirection: "row",
      marginTop: spacing.xxl,
      backgroundColor: glass.background,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      width: "100%",
      borderWidth: 1,
      borderColor: glass.border,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      color: colors.text,
      fontSize: fontSize.xxl,
      fontWeight: "bold",
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.xs,
    },
    statDivider: {
      width: 1,
      backgroundColor: glass.border,
    },
    badgesRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.md,
      backgroundColor: glass.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
      padding: spacing.md,
      width: "100%",
    },
    badgesInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    badgesText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    badgesList: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    miniBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
    },
    miniBadgeEmoji: {
      fontSize: 14,
    },
    datingProfileButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: glass.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: `${colors.accent}30`,
      width: "100%",
    },
    datingProfileButtonText: {
      color: colors.accent,
      fontWeight: "600",
      marginLeft: spacing.sm,
    },
    tabsContainer: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
      backgroundColor: glass.background,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.lg,
      alignItems: "center",
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontWeight: "500",
      color: colors.textMuted,
    },
    tabTextActive: {
      color: colors.primary,
    },
    contentSection: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    postCard: {
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    postCategoryRow: {
      marginBottom: spacing.sm,
    },
    postCategoryText: {
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    postContent: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    postTime: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.sm,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyStateText: {
      color: colors.textMuted,
      marginTop: spacing.lg,
      textAlign: "center",
      lineHeight: 22,
    },
    emptyStateSubtext: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.xs,
    },
    reviewCard: {
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    reviewHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    reviewScoreBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    reviewScoreText: {
      color: colors.white,
      fontWeight: "bold",
      fontSize: fontSize.xs,
    },
    reviewAuthor: {
      flex: 1,
      color: colors.textLight,
      fontSize: fontSize.sm,
      marginLeft: spacing.sm,
    },
    reviewDate: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    reviewTagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    reviewTag: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    reviewTagPositive: {
      backgroundColor: `${colors.success}20`,
    },
    reviewTagNegative: {
      backgroundColor: `${colors.danger}20`,
    },
    reviewTagText: {
      fontSize: fontSize.xs,
      fontWeight: "500",
    },
    reviewTagTextPositive: {
      color: colors.success,
    },
    reviewTagTextNegative: {
      color: colors.danger,
    },
    reviewContent: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      lineHeight: 20,
      marginTop: spacing.sm,
    },
    bottomSpacer: {
      height: 80,
    },
  }), [colors, glass]);

  if (!profile) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return "#EAB308";
    if (score >= 4) return colors.warning;
    return colors.danger;
  };

  const scoreColor = getScoreColor(profile.reputation_score);

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Actions with Logo */}
          <View style={styles.headerActionsWithLogo}>
            <Logo size={24} />
            <View style={styles.headerActionsRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/bookmarks")}
            >
              <Bookmark size={22} color={colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Share2 size={22} color={colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.iconButtonMargin]}
              onPress={() => router.push("/settings")}
            >
              <Settings size={22} color={colors.textLight} />
            </TouchableOpacity>
            </View>
          </View>

          {/* Profil Bilgileri */}
          <View style={styles.profileSection}>
            {/* Avatar with gradient ring */}
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
            >
              <LinearGradient
                colors={gradients.premiumShimmer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  <Image
                    source={{ uri: profile.avatar_url || "https://api.dicebear.com/7.x/lorelei/png?seed=default" }}
                    style={styles.avatar}
                  />
                </View>
              </LinearGradient>
              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color={colors.white} />
                </View>
              ) : (
                <View style={styles.cameraIconBadge}>
                  <Camera size={14} color={colors.white} />
                </View>
              )}
              <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
                <Text style={styles.scoreBadgeText}>
                  {profile.reputation_score.toFixed(1)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Full Name */}
            {profile.full_name && (
              <Text style={styles.fullName}>{profile.full_name}</Text>
            )}

            {/* Kullanici Adi ve Düzenle Butonu */}
            <View style={styles.usernameRow}>
              <Text style={styles.username}>@{profile.username}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push("/edit-profile")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Edit3 size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Bio */}
            {profile.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}

            {/* City & Occupation */}
            {(profile.city || profile.occupation) && (
              <View style={styles.infoRow}>
                {profile.city && (
                  <View style={styles.infoItem}>
                    <MapPin size={14} color={colors.textMuted} />
                    <Text style={styles.infoText}>{profile.city}</Text>
                  </View>
                )}
                {profile.occupation && (
                  <View style={styles.infoItem}>
                    <Briefcase size={14} color={colors.textMuted} />
                    <Text style={styles.infoText}>{profile.occupation}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Relationship Status Badge */}
            {relationshipStatus && relationshipStatus !== "single" && (
              <View style={styles.relationshipBadge}>
                <Heart size={12} color={colors.accent} />
                <Text style={styles.relationshipText}>
                  {relationshipStatus === "in_relationship" ? "Iliskide"
                    : relationshipStatus === "engaged" ? "Nisanli"
                    : relationshipStatus === "married" ? "Evli"
                    : relationshipStatus === "complicated" ? "Karmasik"
                    : relationshipStatus}
                </Text>
              </View>
            )}

            {/* Itibar Aciklamasi */}
            <View style={styles.reputationRow}>
              <View style={[styles.reputationDot, { backgroundColor: scoreColor }]} />
              <Text style={[styles.reputationText, { color: scoreColor }]}>
                {profile.reputation_score >= 8
                  ? "Güvenilir Üye"
                  : profile.reputation_score >= 6
                  ? "İyi İtibar"
                  : profile.reputation_score >= 4
                  ? "Orta İtibar"
                  : "Düşük İtibar"}
              </Text>
            </View>

            {/* Istatistikler */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{loading ? "-" : postCount}</Text>
                <Text style={styles.statLabel}>Paylaşım</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{loading ? "-" : reviews.length}</Text>
                <Text style={styles.statLabel}>Değerlendirme</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{loading ? "-" : followersCount}</Text>
                <Text style={styles.statLabel}>Takipçi</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{loading ? "-" : followingCount}</Text>
                <Text style={styles.statLabel}>Takip</Text>
              </View>
            </View>

            {/* Rozetler */}
            {badges.length > 0 && (
              <TouchableOpacity
                style={styles.badgesRow}
                onPress={() => router.push("/badges")}
                activeOpacity={0.7}
              >
                <View style={styles.badgesInfo}>
                  <Award size={18} color={colors.primary} />
                  <Text style={styles.badgesText}>Rozetlerim</Text>
                </View>
                <View style={styles.badgesList}>
                  {badges.slice(0, 3).map((badge) => (
                    <View key={badge.id} style={styles.miniBadge}>
                      <Text style={styles.miniBadgeEmoji}>{badge.emoji}</Text>
                    </View>
                  ))}
                  <ChevronRight size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            )}

            {/* Dating Profili Butonu */}
            <TouchableOpacity
              style={styles.datingProfileButton}
              onPress={() => router.push("/edit-dating-profile")}
            >
              <Heart size={18} color={colors.accent} />
              <Text style={styles.datingProfileButtonText}>Dating Profilini Düzenle</Text>
            </TouchableOpacity>
          </View>

          {/* Sekmeler */}
          <View style={styles.tabsContainer}>
            {(["paylaşımlar", "yorumlar", "tepkiler", "degerlendirmeler"] as TabType[]).map((tab) => {
              const labels: Record<TabType, string> = {
                "paylaşımlar": "Paylaşımlar",
                "yorumlar": "Yorumlar",
                "tepkiler": "Tepkiler",
                "degerlendirmeler": "Değerlendirmeler",
              };
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.tabTextActive,
                    ]}
                  >
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Icerik */}
          <View style={styles.contentSection}>
            {error ? (
              <ErrorState
                type={error.type}
                message={error.message}
                onRetry={() => fetchUserData()}
              />
            ) : activeTab === "paylaşımlar" ? (
              loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postCard}
                    onPress={() => router.push({ pathname: "/post-detail", params: { postId: post.id } })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.postCategoryRow}>
                      <Text style={[styles.postCategoryText, { color: CATEGORIES[post.category]?.color || colors.textMuted }]}>
                        {CATEGORIES[post.category]?.emoji} {CATEGORIES[post.category]?.label}
                      </Text>
                    </View>
                    <Text style={styles.postContent} numberOfLines={3}>
                      {post.content}
                    </Text>
                    <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Henuz paylasimin yok.</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Anonim paylasimlar burada gorunmez.
                  </Text>
                </View>
              )
            ) : activeTab === "degerlendirmeler" ? (
              loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={[styles.reviewScoreBadge, {
                        backgroundColor: review.score >= 7 ? colors.success
                          : review.score >= 4 ? "#EAB308"
                          : colors.danger,
                      }]}>
                        <Text style={styles.reviewScoreText}>{review.score}/10</Text>
                      </View>
                      <Text style={styles.reviewAuthor}>
                        {review.is_anonymous
                          ? "Anonim Kullanici"
                          : review.reviewer?.username
                            ? `@${review.reviewer.username}`
                            : "Bilinmeyen"}
                      </Text>
                      <Text style={styles.reviewDate}>{formatTimeAgo(review.created_at)}</Text>
                    </View>
                    {review.tags.length > 0 && (
                      <View style={styles.reviewTagsRow}>
                        {review.tags.map((tag) => (
                          <View
                            key={tag}
                            style={[
                              styles.reviewTag,
                              POSITIVE_TAGS.includes(tag)
                                ? styles.reviewTagPositive
                                : styles.reviewTagNegative,
                            ]}
                          >
                            <Text
                              style={[
                                styles.reviewTagText,
                                POSITIVE_TAGS.includes(tag)
                                  ? styles.reviewTagTextPositive
                                  : styles.reviewTagTextNegative,
                              ]}
                            >
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {review.content && (
                      <Text style={styles.reviewContent}>{review.content}</Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Star size={48} color={colors.border} />
                  <Text style={styles.emptyStateText}>
                    Henuz degerlendirme almadin.
                  </Text>
                </View>
              )
            ) : activeTab === "yorumlar" ? (
              !commentsLoaded ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : userComments.length > 0 ? (
                userComments.map((comment: any) => (
                  <TouchableOpacity
                    key={comment.id}
                    style={styles.postCard}
                    onPress={() => router.push({ pathname: "/post-detail", params: { postId: comment.post_id } })}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
                      <MessageCircle size={14} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginLeft: spacing.xs }}>
                        Yorumun
                      </Text>
                      <Text style={styles.postTime}> · {formatTimeAgo(comment.created_at)}</Text>
                    </View>
                    <Text style={styles.postContent} numberOfLines={2}>
                      {comment.content}
                    </Text>
                    {comment.posts && (
                      <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: glass.border }}>
                        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                          Post: {(comment.posts as any).content}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MessageCircle size={48} color={colors.border} />
                  <Text style={styles.emptyStateText}>
                    Henuz yorum yapilmamis.
                  </Text>
                </View>
              )
            ) : activeTab === "tepkiler" ? (
              !reactionsLoaded ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : userReactions.length > 0 ? (
                userReactions.map((reaction: any) => (
                  <TouchableOpacity
                    key={reaction.id}
                    style={styles.postCard}
                    onPress={() => router.push({ pathname: "/post-detail", params: { postId: reaction.post_id } })}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
                      <Text style={{ fontSize: fontSize.md }}>
                        {REACTIONS[reaction.reaction_type as ReactionType]?.emoji ?? "?"}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginLeft: spacing.xs }}>
                        {REACTIONS[reaction.reaction_type as ReactionType]?.label ?? "Tepki"}
                      </Text>
                      <Text style={styles.postTime}> · {formatTimeAgo(reaction.created_at)}</Text>
                    </View>
                    {reaction.posts && (
                      <Text style={styles.postContent} numberOfLines={2}>
                        {(reaction.posts as any).content}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Flame size={48} color={colors.border} />
                  <Text style={styles.emptyStateText}>
                    Henuz tepki verilmemis.
                  </Text>
                </View>
              )
            ) : null}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
