import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Settings, Share2, Users, Heart, Star, Camera } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, borderRadius, spacing, fontSize, glass, gradients, shadows } from "@/constants/theme";
import { supabase, UserReview } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, type PostCategory } from "@/data/mockData";
import { pickImage, uploadImage, showImageSourcePicker, extractPathFromUrl, deleteImage } from "@/lib/storage";
import GradientBackground from "@/components/ui/GradientBackground";

type TabType = "paylaşımlar" | "referanslar" | "degerlendirmeler";

interface ReviewWithReviewer extends UserReview {
  reviewer?: { username: string } | null;
}

const POSITIVE_TAGS = ["Nazik", "Guvenilir", "Eglenceli", "Samimi", "Ilgili", "Saygili", "Durst"];


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
  if (diffMins < 1) return "Az once";
  if (diffMins < 60) return `${diffMins} dk once`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat once`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gun once`;
  return date.toLocaleDateString("tr-TR");
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("paylaşımlar");
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
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

      const { data: inviteData } = await supabase
        .from("invite_codes")
        .select("id")
        .eq("created_by", user.id)
        .eq("is_used", true);

      setReferralCount(inviteData?.length || 0);

      const { data: reviewsData } = await supabase
        .from("user_reviews")
        .select("*, reviewer:profiles!user_reviews_reviewer_id_fkey(username)")
        .eq("target_user_id", user.id)
        .order("created_at", { ascending: false });

      setReviews((reviewsData as ReviewWithReviewer[]) || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
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
            await deleteImage("avatars", oldPath).catch(() => {});
          }
        }

        const publicUrl = await uploadImage("avatars", user.id, uri);

        await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", user.id);

        await refreshProfile();
      } catch (error: any) {
        Alert.alert("Hata", error.message || "Avatar yuklenemedi.");
      } finally {
        setUploadingAvatar(false);
      }
    });
  };

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
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Share2 size={22} color={colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.iconButtonMargin]}
              onPress={() => router.push("/settings")}
            >
              <Settings size={22} color={colors.textLight} />
            </TouchableOpacity>
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

            {/* Kullanici Adi */}
            <Text style={styles.username}>@{profile.username}</Text>

            {/* Itibar Aciklamasi */}
            <View style={styles.reputationRow}>
              <View style={[styles.reputationDot, { backgroundColor: scoreColor }]} />
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

            {/* Istatistikler */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.invite_quota}</Text>
                <Text style={styles.statLabel}>Davetiye</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{loading ? "-" : postCount}</Text>
                <Text style={styles.statLabel}>Paylasim</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{loading ? "-" : referralCount}</Text>
                <Text style={styles.statLabel}>Referans</Text>
              </View>
            </View>

            {/* Dating Profili Butonu */}
            <TouchableOpacity
              style={styles.datingProfileButton}
              onPress={() => router.push("/edit-dating-profile")}
            >
              <Heart size={18} color={colors.accent} />
              <Text style={styles.datingProfileButtonText}>Dating Profilini Duzenle</Text>
            </TouchableOpacity>
          </View>

          {/* Sekmeler */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "paylaşımlar" && styles.tabActive]}
              onPress={() => setActiveTab("paylaşımlar")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "paylaşımlar" && styles.tabTextActive,
                ]}
              >
                Paylasimlarim
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "referanslar" && styles.tabActive]}
              onPress={() => setActiveTab("referanslar")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "referanslar" && styles.tabTextActive,
                ]}
              >
                Referanslarim
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "degerlendirmeler" && styles.tabActive]}
              onPress={() => setActiveTab("degerlendirmeler")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "degerlendirmeler" && styles.tabTextActive,
                ]}
              >
                Degerlendirmeler
              </Text>
            </TouchableOpacity>
          </View>

          {/* Icerik */}
          <View style={styles.contentSection}>
            {activeTab === "paylaşımlar" ? (
              loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    <View style={styles.postCategoryRow}>
                      <Text style={[styles.postCategoryText, { color: CATEGORIES[post.category]?.color || colors.textMuted }]}>
                        {CATEGORIES[post.category]?.emoji} {CATEGORIES[post.category]?.label}
                      </Text>
                    </View>
                    <Text style={styles.postContent} numberOfLines={3}>
                      {post.content}
                    </Text>
                    <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Henuz paylasimin yok.</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Anonim paylasimlar burada gorunmez.
                  </Text>
                </View>
              )
            ) : activeTab === "referanslar" ? (
              <View style={styles.emptyState}>
                <Users size={48} color={colors.border} />
                <Text style={styles.emptyStateText}>
                  {"Davet ettigin kisiler\nburada gorunecek."}
                </Text>
                <TouchableOpacity style={styles.shareButton}>
                  <Text style={styles.shareButtonText}>Davetiye Paylas</Text>
                </TouchableOpacity>
              </View>
            ) : loading ? (
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
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  shareButton: {
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.borderHighlight,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  shareButtonText: {
    color: colors.primary,
    fontWeight: "600",
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
});
