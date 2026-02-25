import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  MoreHorizontal,
  Star,
  Flag,
  ShieldBan,
  MapPin,
  Briefcase,
  MessageCircle,
  Flame,
  Heart,
} from "lucide-react-native";
import {
  borderRadius,
  spacing,
  fontSize,
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase, UserReview } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { blockUser } from "@/lib/blocking";
import { CATEGORIES, REACTIONS, type PostCategory, type ReactionType } from "@/constants/categories";
import GradientBackground from "@/components/ui/GradientBackground";
import { useFollow } from "@/contexts/FollowContext";
import { UserPlus, UserMinus } from "lucide-react-native";

type TabType = "paylaSimlar" | "yorumlar" | "tepkiler" | "aldigi" | "verdigi";

interface ReviewWithReviewer extends UserReview {
  reviewer?: { username: string } | null;
}

interface UserPost {
  id: string;
  content: string;
  category: PostCategory;
  created_at: string;
}

interface PublicProfile {
  id: string;
  username: string;
  avatar_url: string;
  reputation_score: number;
  created_at: string;
  bio: string | null;
  full_name: string | null;
  city: string | null;
  occupation: string | null;
  relationship_status?: string | null;
}

const POSITIVE_TAGS = [
  "Nazik",
  "Guvenilir",
  "Eglenceli",
  "Samimi",
  "Ilgili",
  "Saygili",
  "Durust",
];

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

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { colors, gradients, glass } = useTheme();
  const { followUser, unfollowUser, isFollowing: checkIsFollowing } = useFollow();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("paylaSimlar");
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [userReactions, setUserReactions] = useState<any[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [reactionsLoaded, setReactionsLoaded] = useState(false);
  const [reviewsGivenLoaded, setReviewsGivenLoaded] = useState(false);

  const isOwnProfile = user?.id === userId;
  const isFollowing = userId ? checkIsFollowing(userId) : false;

  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, reputation_score, created_at, bio, full_name, city, occupation")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // Fetch relationship status from dating_profiles
      const { data: datingProfile } = await supabase
        .from("dating_profiles")
        .select("relationship_status")
        .eq("user_id", userId)
        .single();

      setProfile({
        ...profileData,
        relationship_status: datingProfile?.relationship_status || null,
      });

      // Fetch non-anonymous posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, content, category, created_at")
        .eq("author_id", userId)
        .eq("is_anonymous", false)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      setPostCount(postsData?.length || 0);
      setUserPosts(
        (postsData || []).map((p) => ({
          id: p.id,
          content: p.content,
          category: p.category as PostCategory,
          created_at: p.created_at,
        }))
      );

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from("user_reviews")
        .select(
          "*, reviewer:profiles!user_reviews_reviewer_id_fkey(username)"
        )
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false });

      const reviewsList = (reviewsData as ReviewWithReviewer[]) || [];
      setReviews(reviewsList);
      setReviewCount(reviewsList.length);

      // Fetch follow counts
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);
      setFollowersCount(followersResult.count || 0);
      setFollowingCount(followingResult.count || 0);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setCommentsLoaded(false);
      setReactionsLoaded(false);
      setReviewsGivenLoaded(false);
      fetchUserData();
    }, [fetchUserData])
  );

  const fetchUserComments = useCallback(async () => {
    if (!userId || commentsLoaded) return;
    try {
      const { data } = await supabase
        .from("comments")
        .select("id, content, created_at, post_id, posts(id, content)")
        .eq("author_id", userId)
        .eq("is_anonymous", false)
        .order("created_at", { ascending: false })
        .limit(50);
      setUserComments(data || []);
      setCommentsLoaded(true);
    } catch (e) {
      console.error("Error fetching user comments:", e);
    }
  }, [userId, commentsLoaded]);

  const fetchUserReactions = useCallback(async () => {
    if (!userId || reactionsLoaded) return;
    try {
      const { data } = await supabase
        .from("post_reactions")
        .select("id, reaction_type, created_at, post_id, posts(id, content)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      setUserReactions(data || []);
      setReactionsLoaded(true);
    } catch (e) {
      console.error("Error fetching user reactions:", e);
    }
  }, [userId, reactionsLoaded]);

  const fetchReviewsGiven = useCallback(async () => {
    if (!userId || reviewsGivenLoaded) return;
    try {
      const { data } = await supabase
        .from("user_reviews")
        .select("*, target:profiles!user_reviews_target_user_id_fkey(username)")
        .eq("reviewer_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      setReviewsGiven(data || []);
      setReviewsGivenLoaded(true);
    } catch (e) {
      console.error("Error fetching reviews given:", e);
    }
  }, [userId, reviewsGivenLoaded]);

  // Lazy load tabs
  useEffect(() => {
    if (activeTab === "yorumlar") fetchUserComments();
    if (activeTab === "tepkiler") fetchUserReactions();
    if (activeTab === "verdigi") fetchReviewsGiven();
  }, [activeTab, fetchUserComments, fetchUserReactions, fetchReviewsGiven]);

  const handleReport = () => {
    setShowMenu(false);
    if (!profile) return;
    router.push({
      pathname: "/report-content",
      params: {
        type: "user",
        targetId: profile.id,
        targetName: `@${profile.username}`,
      },
    });
  };

  const handleBlockUser = () => {
    setShowMenu(false);
    if (!user || !profile) return;
    Alert.alert(
      "Kullaniciyi Engelle",
      `@${profile.username} adli kullaniciyi engellemek istediginize emin misiniz? Bu kullanicinin paylasimlarini ve profilini goremezsiniz.`,
      [
        { text: "Iptal", style: "cancel" },
        {
          text: "Engelle",
          style: "destructive",
          onPress: async () => {
            const success = await blockUser(user.id, profile.id);
            if (success) {
              Alert.alert(
                "Engellendi",
                `@${profile.username} engellendi.`
              );
              router.back();
            } else {
              Alert.alert("Hata", "Kullanici engellenemedi.");
            }
          },
        },
      ]
    );
  };

  const handleReview = () => {
    if (!profile) return;
    router.push({
      pathname: "/review-user",
      params: { userId: profile.id, username: profile.username },
    });
  };

  const handleFollow = async () => {
    if (!profile || !userId) return;
    await followUser(userId);
    // Refresh follow counts
    try {
      const { data } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
      setFollowersCount(data?.length || 0);
    } catch (e) {
      console.error("Error updating follower count:", e);
    }
  };

  const handleUnfollow = async () => {
    if (!profile || !userId) return;
    await unfollowUser(userId);
    // Refresh follow counts
    try {
      const { data } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
      setFollowersCount(data?.length || 0);
    } catch (e) {
      console.error("Error updating follower count:", e);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return "#EAB308";
    if (score >= 4) return colors.warning;
    return colors.danger;
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

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: glass.background,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
    },
    backButton: {
      padding: spacing.sm,
      marginLeft: -spacing.sm,
    },
    headerTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "600",
      marginLeft: spacing.sm,
      flex: 1,
    },
    menuButton: {
      padding: spacing.sm,
    },

    // Profile Section
    profileSection: {
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl,
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
      color: colors.text,
      fontSize: fontSize.xl,
      fontWeight: "bold",
      marginTop: spacing.lg,
    },
    usernameSmall: {
      fontSize: fontSize.md,
      fontWeight: "600",
      color: colors.textLight,
      marginTop: spacing.xs,
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
    bio: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      textAlign: "center",
      marginTop: spacing.sm,
      lineHeight: 20,
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

    // Stats
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

    // Action Buttons Row
    actionButtonsRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.lg,
      width: "100%",
    },

    // Follow Button
    followButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.lg,
      gap: spacing.xs,
    },
    followButtonText: {
      color: colors.white,
      fontWeight: "600",
      fontSize: fontSize.sm,
    },
    followingButton: {
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
    },
    followingButtonText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: fontSize.sm,
    },

    // Review Button
    reviewButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      backgroundColor: glass.background,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
      gap: spacing.xs,
    },
    reviewButtonText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: fontSize.sm,
    },

    // Tabs
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
      fontSize: fontSize.xs,
    },
    tabTextActive: {
      color: colors.primary,
    },

    // Content
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

    // Reviews
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

    // Menu Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.xxl,
    },
    menuContainer: {
      width: "100%",
      backgroundColor: colors.cardElevated,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: glass.border,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    menuItemText: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: "500",
    },
    menuDivider: {
      height: 1,
      backgroundColor: glass.border,
    },
    bottomSpacer: {
      height: 80,
    },
  }), [colors, glass]);

  if (loading || !profile) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profil</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const scoreColor = getScoreColor(profile.reputation_score);

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>@{profile.username}</Text>
            {!isOwnProfile && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenu(true)}
              >
                <MoreHorizontal size={22} color={colors.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {/* Avatar with gradient ring */}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={gradients.premiumShimmer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  <Image
                    source={{
                      uri:
                        profile.avatar_url ||
                        "https://api.dicebear.com/7.x/lorelei/png?seed=default",
                    }}
                    style={styles.avatar}
                  />
                </View>
              </LinearGradient>
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: scoreColor },
                ]}
              >
                <Text style={styles.scoreBadgeText}>
                  {profile.reputation_score.toFixed(1)}
                </Text>
              </View>
            </View>

            {/* Full Name */}
            {profile.full_name && (
              <Text style={styles.fullName}>{profile.full_name}</Text>
            )}

            {/* Username */}
            <Text style={[styles.username, profile.full_name ? styles.usernameSmall : null]}>@{profile.username}</Text>

            {/* Bio */}
            {profile.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}

            {/* Relationship Status Badge */}
            {profile.relationship_status && profile.relationship_status !== "single" && (
              <View style={styles.relationshipBadge}>
                <Heart size={12} color={colors.accent} />
                <Text style={styles.relationshipText}>
                  {profile.relationship_status === "in_relationship" ? "Iliskide"
                    : profile.relationship_status === "engaged" ? "Nisanli"
                    : profile.relationship_status === "married" ? "Evli"
                    : profile.relationship_status === "complicated" ? "Karmasik"
                    : profile.relationship_status}
                </Text>
              </View>
            )}

            {/* Location & Occupation */}
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

            {/* Reputation Description */}
            <View style={styles.reputationRow}>
              <View
                style={[
                  styles.reputationDot,
                  { backgroundColor: scoreColor },
                ]}
              />
              <Text style={[styles.reputationText, { color: scoreColor }]}>
                {profile.reputation_score >= 8
                  ? "Guvenilir Uye"
                  : profile.reputation_score >= 6
                  ? "Iyi Itibar"
                  : profile.reputation_score >= 4
                  ? "Orta Itibar"
                  : "Dusuk Itibar"}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{postCount}</Text>
                <Text style={styles.statLabel}>Paylasim</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{followersCount}</Text>
                <Text style={styles.statLabel}>Takipci</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{followingCount}</Text>
                <Text style={styles.statLabel}>Takip</Text>
              </View>
            </View>

            {/* Action Buttons (hidden for own profile) */}
            {!isOwnProfile && (
              <View style={styles.actionButtonsRow}>
                {/* Follow Button */}
                {isFollowing ? (
                  <TouchableOpacity
                    style={[styles.followButton, styles.followingButton]}
                    onPress={handleUnfollow}
                  >
                    <UserMinus size={16} color={colors.text} />
                    <Text style={styles.followingButtonText}>Takip Ediliyor</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.followButton}
                    onPress={handleFollow}
                  >
                    <UserPlus size={16} color={colors.white} />
                    <Text style={styles.followButtonText}>Takip Et</Text>
                  </TouchableOpacity>
                )}

                {/* Review Button */}
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={handleReview}
                >
                  <Star size={18} color={colors.primary} />
                  <Text style={styles.reviewButtonText}>Degerlendir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {(["paylaSimlar", "yorumlar", "tepkiler", "aldigi", "verdigi"] as TabType[]).map((tab) => {
              const labels: Record<TabType, string> = {
                "paylaSimlar": "Paylasimlar",
                "yorumlar": "Yorumlar",
                "tepkiler": "Tepkiler",
                "aldigi": "Aldigi",
                "verdigi": "Verdigi",
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

          {/* Content */}
          <View style={styles.contentSection}>
            {activeTab === "paylaSimlar" ? (
              userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postCard}
                    onPress={() => router.push({ pathname: "/post-detail", params: { postId: post.id } })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.postCategoryRow}>
                      <Text
                        style={[
                          styles.postCategoryText,
                          {
                            color:
                              CATEGORIES[post.category]?.color ||
                              colors.textMuted,
                          },
                        ]}
                      >
                        {CATEGORIES[post.category]?.emoji}{" "}
                        {CATEGORIES[post.category]?.label}
                      </Text>
                    </View>
                    <Text style={styles.postContent} numberOfLines={3}>
                      {post.content}
                    </Text>
                    <Text style={styles.postTime}>
                      {formatTimeAgo(post.created_at)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Henuz paylasim yok.
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Anonim paylasimlar burada gorunmez.
                  </Text>
                </View>
              )
            ) : activeTab === "aldigi" ? (
              reviews.length > 0 ? (
                reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View
                        style={[
                          styles.reviewScoreBadge,
                          {
                            backgroundColor:
                              review.score >= 7
                                ? colors.success
                                : review.score >= 4
                                ? "#EAB308"
                                : colors.danger,
                          },
                        ]}
                      >
                        <Text style={styles.reviewScoreText}>
                          {review.score}/10
                        </Text>
                      </View>
                      <Text style={styles.reviewAuthor}>
                        {review.is_anonymous
                          ? "Anonim Kullanici"
                          : review.reviewer?.username
                          ? `@${review.reviewer.username}`
                          : "Bilinmeyen"}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatTimeAgo(review.created_at)}
                      </Text>
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
                      <Text style={styles.reviewContent}>
                        {review.content}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Star size={48} color={colors.border} />
                  <Text style={styles.emptyStateText}>
                    Henuz degerlendirme yok.
                  </Text>
                </View>
              )
            ) : activeTab === "yorumlar" ? (
              !commentsLoaded ? (
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
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
                      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginLeft: 4 }}>Yorum</Text>
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
                  <Text style={styles.emptyStateText}>Henuz yorum yok.</Text>
                </View>
              )
            ) : activeTab === "tepkiler" ? (
              !reactionsLoaded ? (
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
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
                      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginLeft: 4 }}>
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
                  <Text style={styles.emptyStateText}>Henuz tepki yok.</Text>
                </View>
              )
            ) : activeTab === "verdigi" ? (
              !reviewsGivenLoaded ? (
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : reviewsGiven.length > 0 ? (
                reviewsGiven.map((review: any) => (
                  <TouchableOpacity
                    key={review.id}
                    style={styles.reviewCard}
                    onPress={() => review.target?.username && router.push(`/user-profile/${review.target_user_id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reviewHeader}>
                      <View
                        style={[
                          styles.reviewScoreBadge,
                          {
                            backgroundColor:
                              review.score >= 7
                                ? colors.success
                                : review.score >= 4
                                ? "#EAB308"
                                : colors.danger,
                          },
                        ]}
                      >
                        <Text style={styles.reviewScoreText}>
                          {review.score}/10
                        </Text>
                      </View>
                      <Text style={styles.reviewAuthor}>
                        {review.target?.username
                          ? `@${review.target.username}`
                          : "Bilinmeyen"}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {formatTimeAgo(review.created_at)}
                      </Text>
                    </View>
                    {review.tags && review.tags.length > 0 && (
                      <View style={styles.reviewTagsRow}>
                        {review.tags.map((tag: string) => (
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
                      <Text style={styles.reviewContent}>
                        {review.content}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Star size={48} color={colors.border} />
                  <Text style={styles.emptyStateText}>
                    Henuz degerlendirme vermemis.
                  </Text>
                </View>
              )
            ) : null}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Menu Modal */}
        <Modal visible={showMenu} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMenu(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleReport}
              >
                <Flag size={20} color={colors.warning} />
                <Text style={styles.menuItemText}>Raporla</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleBlockUser}
              >
                <ShieldBan size={20} color={colors.danger} />
                <Text
                  style={[styles.menuItemText, { color: colors.danger }]}
                >
                  Kullaniciyi Engelle
                </Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowMenu(false)}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    { color: colors.textMuted, textAlign: "center" },
                  ]}
                >
                  Iptal
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}
