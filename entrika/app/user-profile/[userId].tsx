import { useState, useCallback } from "react";
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
} from "lucide-react-native";
import {
  colors,
  borderRadius,
  spacing,
  fontSize,
  glass,
  gradients,
} from "@/constants/theme";
import { supabase, UserReview } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { blockUser } from "@/lib/blocking";
import { CATEGORIES, type PostCategory } from "@/data/mockData";
import GradientBackground from "@/components/ui/GradientBackground";

const glassFallback = glass || {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

type TabType = "paylaşımlar" | "degerlendirmeler";

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
}

const POSITIVE_TAGS = [
  "Nazik",
  "Güvenilir",
  "Eğlenceli",
  "Samimi",
  "İlgili",
  "Saygılı",
  "Dürüst",
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

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("paylaşımlar");
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnProfile = user?.id === userId;

  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, reputation_score, created_at")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

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
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUserData();
    }, [fetchUserData])
  );

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
      "Kullanıcıyı Engelle",
      `@${profile.username} adlı kullanıcıyı engellemek istediğinize emin misiniz? Bu kullanıcının paylaşımlarını ve profilini göremezsiniz.`,
      [
        { text: "İptal", style: "cancel" },
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
              Alert.alert("Hata", "Kullanıcı engellenemedi.");
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return "#EAB308";
    if (score >= 4) return colors.warning;
    return colors.danger;
  };

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

            {/* Username */}
            <Text style={styles.username}>@{profile.username}</Text>

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
                  ? "Güvenilir Üye"
                  : profile.reputation_score >= 6
                  ? "İyi İtibar"
                  : profile.reputation_score >= 4
                  ? "Orta İtibar"
                  : "Düşük İtibar"}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{postCount}</Text>
                <Text style={styles.statLabel}>Paylaşım</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{reviewCount}</Text>
                <Text style={styles.statLabel}>Değerlendirme</Text>
              </View>
            </View>

            {/* Review Button (hidden for own profile) */}
            {!isOwnProfile && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={handleReview}
              >
                <Star size={18} color={colors.primary} />
                <Text style={styles.reviewButtonText}>Değerlendir</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "paylaşımlar" && styles.tabActive,
              ]}
              onPress={() => setActiveTab("paylaşımlar")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "paylaşımlar" && styles.tabTextActive,
                ]}
              >
                Paylaşımlar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "degerlendirmeler" && styles.tabActive,
              ]}
              onPress={() => setActiveTab("degerlendirmeler")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "degerlendirmeler" && styles.tabTextActive,
                ]}
              >
                Değerlendirmeler
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentSection}>
            {activeTab === "paylaşımlar" ? (
              userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <View key={post.id} style={styles.postCard}>
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
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Henüz paylaşım yok.
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Anonim paylaşımlar burada görünmez.
                  </Text>
                </View>
              )
            ) : reviews.length > 0 ? (
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
                        ? "Anonim Kullanıcı"
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
                  Henüz değerlendirme yok.
                </Text>
              </View>
            )}
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
                  Kullanıcıyı Engelle
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
                  İptal
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: glassFallback.background,
    borderBottomWidth: 1,
    borderBottomColor: glassFallback.border,
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
  username: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginTop: spacing.lg,
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
    backgroundColor: glassFallback.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: glassFallback.border,
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
    backgroundColor: glassFallback.border,
  },

  // Review Button
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: glassFallback.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    width: "100%",
  },
  reviewButtonText: {
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: glassFallback.border,
    backgroundColor: glassFallback.background,
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

  // Content
  contentSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  postCard: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
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
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
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
    borderColor: glassFallback.border,
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
    backgroundColor: glassFallback.border,
  },
  bottomSpacer: {
    height: 80,
  },
});
