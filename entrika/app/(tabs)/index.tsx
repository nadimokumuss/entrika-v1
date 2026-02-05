import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Sparkles, MessageCircle, MoreHorizontal, Flag, ShieldBan, Bell } from "lucide-react-native";
import {
  CATEGORIES,
  REACTIONS,
  type PostCategory,
  type ReactionType,
} from "@/data/mockData";
import * as Haptics from "expo-haptics";
import { colors, borderRadius, spacing, fontSize, glass, shadows } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getBlockedUserIds } from "@/lib/blocking";
import { blockUser } from "@/lib/blocking";
import GradientBackground from "@/components/ui/GradientBackground";
import AnimatedHeader from "@/components/ui/AnimatedHeader";
import GlassCard from "@/components/ui/GlassCard";

const glassFallback = glass || {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

interface FeedPost {
  id: string;
  content: string;
  category: PostCategory;
  is_anonymous: boolean;
  is_spoiler: boolean;
  image_url: string | null;
  author_id: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  reactions: { type: ReactionType; count: number }[];
  commentCount: number;
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

function PostCard({
  post,
  onRefresh,
}: {
  post: FeedPost;
  onRefresh: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const category = CATEGORIES[post.category];

  const handleLongPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReactions(true);
  };

  const handleReaction = async (type: ReactionType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setShowReactions(false);
    if (!user) return;
    try {
      await supabase.from("post_reactions").upsert(
        { post_id: post.id, user_id: user.id, reaction_type: type },
        { onConflict: "post_id,user_id" }
      );
    } catch (e) {
      console.error("Reaction error:", e);
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    router.push({
      pathname: "/report-content",
      params: {
        type: "post",
        targetId: post.id,
        targetName: post.is_anonymous ? "Anonim paylaşım" : `@${post.profiles?.username}`,
      },
    });
  };

  const handleBlockUser = () => {
    setShowMenu(false);
    if (!user || post.is_anonymous) return;
    Alert.alert(
      "Kullanıcıyı Engelle",
      `@${post.profiles?.username} adlı kullanıcıyı engellemek istediğinize emin misiniz? Bu kullanıcının paylaşımlarını ve profilini göremezsiniz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Engelle",
          style: "destructive",
          onPress: async () => {
            const success = await blockUser(user.id, post.author_id);
            if (success) {
              Alert.alert("Engellendi", `@${post.profiles?.username} engellendi.`);
              onRefresh();
            } else {
              Alert.alert("Hata", "Kullanıcı engellenemedi.");
            }
          },
        },
      ]
    );
  };

  const handlePress = () => {
    router.push({
      pathname: "/post-detail",
      params: { postId: post.id },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
    >
      <GlassCard style={styles.postCardOuter}>
        <View style={styles.postCardInner}>
          {/* Kategori Badge + Menu */}
          <View style={styles.postHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: `${category.color}15` }]}>
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.emoji} {category.label}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatTimeAgo(post.created_at)}</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MoreHorizontal size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Icerik */}
          <View style={styles.postContent}>
            <View style={styles.postTextContainer}>
              {post.is_spoiler && !revealed ? (
                <TouchableOpacity onPress={() => setRevealed(true)} activeOpacity={0.8}>
                  <View style={styles.spoilerBox}>
                    <Text style={styles.spoilerText}>
                      {"Hassas içerik\n"}
                      <Text style={styles.spoilerSubtext}>Görmek için dokun</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text style={styles.postText}>{post.content}</Text>
              )}
            </View>

            {post.image_url && (
              <View style={styles.thumbnailContainer}>
                <Image source={{ uri: post.image_url }} style={styles.thumbnail} />
              </View>
            )}
          </View>

          {/* Author */}
          {!post.is_anonymous && post.profiles && (
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => router.push({
                pathname: "/user-profile/[userId]",
                params: { userId: post.author_id },
              })}
              activeOpacity={0.7}
            >
              <Image source={{ uri: post.profiles.avatar_url }} style={styles.authorAvatar} />
              <Text style={styles.authorName}>@{post.profiles.username}</Text>
            </TouchableOpacity>
          )}

          {/* Reaksiyonlar */}
          <View style={styles.reactionsRow}>
            <View style={styles.reactionsList}>
              {post.reactions.slice(0, 3).map((reaction, index) => (
                <View key={index} style={styles.reactionChip}>
                  <Text style={styles.reactionEmoji}>{REACTIONS[reaction.type].emoji}</Text>
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.commentsContainer}
              onPress={handlePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MessageCircle size={16} color={colors.textMuted} />
              <Text style={styles.commentCount}>{post.commentCount}</Text>
            </TouchableOpacity>
          </View>

          {/* Reaksiyon Secici */}
          {showReactions && (
            <View style={styles.reactionPickerOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setShowReactions(false)}
              />
              <View style={styles.reactionPicker}>
                {(Object.keys(REACTIONS) as ReactionType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => handleReaction(type)}
                    style={styles.reactionOption}
                  >
                    <Text style={styles.reactionOptionEmoji}>{REACTIONS[type].emoji}</Text>
                    <Text style={styles.reactionOptionLabel}>{REACTIONS[type].label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </GlassCard>

      {/* Post Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Flag size={20} color={colors.warning} />
              <Text style={styles.menuItemText}>Raporla</Text>
            </TouchableOpacity>
            {!post.is_anonymous && post.author_id !== user?.id && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleBlockUser}>
                  <ShieldBan size={20} color={colors.danger} />
                  <Text style={[styles.menuItemText, { color: colors.danger }]}>
                    Kullanıcıyı Engelle
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <Text style={[styles.menuItemText, { color: colors.textMuted, textAlign: "center" }]}>
                İptal
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

export default function FeedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user]);

  const fetchPosts = useCallback(async () => {
    try {
      // Get blocked user IDs
      const blockedIds = user ? await getBlockedUserIds(user.id) : [];

      // Fetch posts with author profile
      let query = supabase
        .from("posts")
        .select("*, profiles(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50);

      // Filter out blocked users' posts
      if (blockedIds.length > 0) {
        query = query.not("author_id", "in", `(${blockedIds.join(",")})`);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;
      if (!postsData) {
        setPosts([]);
        return;
      }

      // Fetch reaction counts for all posts
      const postIds = postsData.map((p) => p.id);

      const { data: reactionsData } = await supabase
        .from("post_reactions")
        .select("post_id, reaction_type")
        .in("post_id", postIds);

      // Fetch comment counts
      const { data: commentsData } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);

      // Aggregate reactions per post
      const reactionsMap: Record<string, Record<string, number>> = {};
      (reactionsData || []).forEach((r) => {
        if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = {};
        reactionsMap[r.post_id][r.reaction_type] =
          (reactionsMap[r.post_id][r.reaction_type] || 0) + 1;
      });

      // Count comments per post
      const commentsMap: Record<string, number> = {};
      (commentsData || []).forEach((c) => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
      });

      const feedPosts: FeedPost[] = postsData.map((p) => {
        const postReactions = reactionsMap[p.id] || {};
        const reactions = Object.entries(postReactions)
          .map(([type, count]) => ({ type: type as ReactionType, count }))
          .sort((a, b) => b.count - a.count);

        return {
          id: p.id,
          content: p.content,
          category: p.category as PostCategory,
          is_anonymous: p.is_anonymous,
          is_spoiler: p.is_spoiler,
          image_url: p.image_url,
          author_id: p.author_id,
          created_at: p.created_at,
          profiles: p.profiles as any,
          reactions,
          commentCount: commentsMap[p.id] || 0,
        };
      });

      setPosts(feedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      fetchUnreadCount();
    }, [fetchPosts, fetchUnreadCount])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <AnimatedHeader>
            <View style={styles.headerContent}>
              <Sparkles size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>ENTRIKA</Text>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={styles.bellButton}
              >
                <Bell size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </AnimatedHeader>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <AnimatedHeader>
          <View style={styles.headerContent}>
            <Sparkles size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>ENTRIKA</Text>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={styles.bellButton}
            >
              <Bell size={24} color={colors.textLight} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </AnimatedHeader>

        {/* Kategori Filtre */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === null && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === null && styles.filterChipTextActive,
              ]}
            >
              Tümü
            </Text>
          </TouchableOpacity>
          {(Object.keys(CATEGORIES) as PostCategory[]).map((key) => {
            const cat = CATEGORIES[key];
            const isActive = selectedCategory === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  isActive && { backgroundColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Feed */}
        <ScrollView
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {(() => {
            const filtered = selectedCategory
              ? posts.filter((p) => p.category === selectedCategory)
              : posts;
            return filtered.length > 0 ? (
              filtered.map((post) => (
                <PostCard key={post.id} post={post} onRefresh={fetchPosts} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>
                  {selectedCategory
                    ? "Bu kategoride paylaşım yok"
                    : "Henüz paylaşım yok"}
                </Text>
                <Text style={styles.emptyStateText}>
                  {selectedCategory
                    ? "Başka bir kategori dene veya ilk paylaşımı sen yap!"
                    : "İlk paylaşımı sen yap!"}
                </Text>
              </View>
            );
          })()}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginLeft: spacing.sm,
    letterSpacing: 1,
    flex: 1,
  },
  bellButton: {
    padding: spacing.sm,
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: colors.accent,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "bold",
  },
  filterBar: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterBarContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  feed: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  feedContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  bottomSpacer: {
    height: 80,
  },
  postCardOuter: {
    marginBottom: spacing.lg,
  },
  postCardInner: {
    padding: spacing.lg,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  timeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: "auto",
  },
  menuButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  postContent: {
    flexDirection: "row",
  },
  postTextContainer: {
    flex: 1,
  },
  postText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  spoilerBox: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  spoilerText: {
    color: colors.textLight,
    textAlign: "center",
    fontSize: fontSize.sm,
  },
  spoilerSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  thumbnailContainer: {
    marginLeft: spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.borderLight,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: glassFallback.border,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
  },
  authorName: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  reactionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: glassFallback.border,
  },
  reactionsList: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  reactionEmoji: {
    fontSize: fontSize.sm,
  },
  reactionCount: {
    color: colors.textLight,
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  commentsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  reactionPickerOverlay: {
    position: "absolute",
    top: "50%",
    left: spacing.lg,
    right: spacing.lg,
    transform: [{ translateY: -50 }],
  },
  reactionPicker: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  reactionOption: {
    alignItems: "center",
    padding: spacing.sm,
  },
  reactionOptionEmoji: {
    fontSize: 24,
  },
  reactionOptionLabel: {
    color: colors.textLight,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  // Menu modal styles
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
});
