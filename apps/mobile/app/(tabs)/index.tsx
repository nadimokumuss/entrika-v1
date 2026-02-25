import { useState, useCallback, useRef, useEffect, memo, useMemo } from "react";
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
import { Sparkles, MessageCircle, MoreHorizontal, Flag, ShieldBan, Bell, Bookmark, Flame, Trash2, Repeat2, PenSquare } from "lucide-react-native";
import {
  CATEGORIES,
  REACTIONS,
  type PostCategory,
  type ReactionType,
} from "@/constants/categories";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { borderRadius, spacing, fontSize, shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";

import { useAuth } from "@/contexts/AuthContext";
import { getBlockedUserIds } from "@/lib/blocking";
import { blockUser } from "@/lib/blocking";
import GradientBackground from "@/components/ui/GradientBackground";
import AnimatedHeader from "@/components/ui/AnimatedHeader";
import GlassCard from "@/components/ui/GlassCard";
import { PostCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EditPostModal } from "@/components/ui/EditPostModal";
import { RepostModal } from "@/components/ui/RepostModal";
import { isPostBookmarked, toggleBookmark } from "@/lib/bookmarks";
import Logo from "@/components/Logo";
import { useFollow } from "@/contexts/FollowContext";
import { Users, Globe } from "lucide-react-native";

interface RepostData {
  id: string;
  content: string;
  category: PostCategory;
  is_anonymous: boolean;
  author_id: string;
  profiles: { username: string; avatar_url: string } | null;
}

interface FeedPost {
  id: string;
  content: string;
  category: PostCategory;
  is_anonymous: boolean;
  is_spoiler: boolean;
  image_url: string | null;
  author_id: string;
  created_at: string;
  repost_of_id: string | null;
  repost_of: RepostData | null;
  profiles: {
    username: string;
    avatar_url: string;
  };
  reactions: { type: ReactionType; count: number }[];
  commentCount: number;
  topComment?: {
    content: string;
    author: string;
    likes: number;
  } | null;
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

const PostCard = memo(function PostCard({
  post,
  onRefresh,
  onEdit,
  onDelete,
  onRepost,
}: {
  post: FeedPost;
  onRefresh: () => void;
  onEdit: (post: FeedPost) => void;
  onDelete?: (postId: string) => void;
  onRepost?: (post: FeedPost) => void;
}) {
  const { colors, glass } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const category = CATEGORIES[post.category];

  // Check if post is bookmarked on mount
  useEffect(() => {
    if (user?.id) {
      isPostBookmarked(user.id, post.id).then(setIsBookmarked);
    }
  }, [user?.id, post.id]);

  const handleBookmarkToggle = useCallback(async () => {
    if (!user?.id) return;
    const { success, isBookmarked: newBookmarkState } = await toggleBookmark(user.id, post.id);
    if (success) {
      setIsBookmarked(newBookmarkState);
      if (Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
    }
  }, [user?.id, post.id]);

  const handleLongPress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReactions(true);
  }, []);

  const handleReactionButtonPress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setShowReactions(true);
  }, []);

  const handleReaction = useCallback(async (type: ReactionType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setShowReactions(false);
    if (!user) return;
    try {
      const { error } = await supabase.from("post_reactions").upsert(
        { post_id: post.id, user_id: user.id, reaction_type: type },
        { onConflict: "post_id,user_id" }
      );
      if (error) throw error;
    } catch (e) {
      console.error("Reaction error:", e);
      Alert.alert("Hata", "Reaksiyon eklenemedi. Lütfen tekrar deneyin.");
    }
  }, [post.id, user?.id]);

  const handleReport = useCallback(() => {
    setShowMenu(false);
    router.push({
      pathname: "/report-content",
      params: {
        type: "post",
        targetId: post.id,
        targetName: post.is_anonymous ? "Anonim paylaşım" : `@${post.profiles?.username}`,
      },
    });
  }, [post.id, post.is_anonymous, post.profiles?.username, router]);

  const handleBlockUser = useCallback(() => {
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
  }, [user?.id, post.author_id, post.is_anonymous, post.profiles?.username, onRefresh]);

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/post-detail",
      params: { postId: post.id },
    });
  }, [post.id, router]);

  const styles = useMemo(() => StyleSheet.create({
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
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginLeft: spacing.sm,
    },
    bookmarkButton: {
      padding: spacing.xs,
    },
    menuButton: {
      padding: spacing.xs,
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
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
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
      borderTopColor: glass.border,
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
      borderTopColor: glass.border,
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
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
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
    reactionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    repostButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    quoteContainer: {
      marginTop: spacing.md,
      backgroundColor: `${colors.primary}08`,
      borderWidth: 1,
      borderColor: `${colors.primary}20`,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    quoteAuthor: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: "600",
      marginBottom: spacing.xs,
    },
    quoteText: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      lineHeight: 18,
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
    topCommentPreview: {
      flexDirection: "row",
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: glass.border,
      alignItems: "flex-start",
      backgroundColor: `${colors.primary}08`,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    topCommentHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flex: 1,
    },
    topCommentIcon: {
      fontSize: fontSize.sm,
    },
    topCommentAuthor: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    topCommentLikesBadge: {
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      marginLeft: "auto",
    },
    topCommentLikesText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: "bold",
    },
    topCommentText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      lineHeight: 16,
    },
    reactionPickerOverlay: {
      position: "absolute",
      top: "50%",
      left: spacing.lg,
      right: spacing.lg,
      transform: [{ translateY: -50 }],
    },
    reactionPicker: {
      backgroundColor: "rgba(30, 30, 42, 0.95)",
      borderWidth: 1,
      borderColor: glass.border,
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
  }), [colors, glass]);

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
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={handleBookmarkToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Bookmark
                  size={18}
                  color={isBookmarked ? colors.primary : colors.textMuted}
                  fill={isBookmarked ? colors.primary : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenu(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MoreHorizontal size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Icerik */}
          <View style={styles.postContent}>
            <View style={styles.postTextContainer}>
              {/* Spoiler warning only for non-anonymous posts with is_spoiler=true */}
              {post.is_spoiler && !post.is_anonymous && !revealed ? (
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

          {/* Quoted/Repost Content */}
          {post.repost_of && (
            <TouchableOpacity
              style={styles.quoteContainer}
              onPress={() => router.push({
                pathname: "/post-detail",
                params: { postId: post.repost_of!.id },
              })}
              activeOpacity={0.7}
            >
              <Text style={styles.quoteAuthor}>
                {post.repost_of.is_anonymous
                  ? "Anonim"
                  : `@${post.repost_of.profiles?.username || "?"}`}
              </Text>
              <Text style={styles.quoteText} numberOfLines={3}>
                {post.repost_of.content}
              </Text>
            </TouchableOpacity>
          )}

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
              {/* Reaction Button */}
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={handleReactionButtonPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Flame size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {/* Repost Button */}
              <TouchableOpacity
                style={styles.repostButton}
                onPress={() => onRepost?.(post)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Repeat2 size={16} color={colors.textMuted} />
              </TouchableOpacity>
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

          {/* Top Comment Preview */}
          {post.topComment && (
            <TouchableOpacity style={styles.topCommentPreview} onPress={handlePress}>
              <View style={styles.topCommentHeader}>
                <Text style={styles.topCommentIcon}>💭</Text>
                <Text style={styles.topCommentAuthor}>{post.topComment.author}</Text>
                {post.topComment.likes > 0 && (
                  <View style={styles.topCommentLikesBadge}>
                    <Text style={styles.topCommentLikesText}>{post.topComment.likes}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.topCommentText} numberOfLines={2}>
                {post.topComment.content}
              </Text>
            </TouchableOpacity>
          )}

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
            {post.author_id === user?.id ? (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onEdit(post);
                  }}
                >
                  <Sparkles size={20} color={colors.primary} />
                  <Text style={styles.menuItemText}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    if (onDelete) {
                      Alert.alert(
                        "Gönderiyi Sil",
                        "Bu gönderiyi silmek istediğine emin misin?",
                        [
                          { text: "İptal", style: "cancel" },
                          {
                            text: "Sil",
                            style: "destructive",
                            onPress: () => onDelete(post.id),
                          },
                        ]
                      );
                    }
                  }}
                >
                  <Trash2 size={20} color={colors.danger} />
                  <Text style={[styles.menuItemText, { color: colors.danger }]}>
                    Sil
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
                  <Flag size={20} color={colors.warning} />
                  <Text style={styles.menuItemText}>Raporla</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
                <Flag size={20} color={colors.warning} />
                <Text style={styles.menuItemText}>Raporla</Text>
              </TouchableOpacity>
            )}
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
});

export default function FeedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { followingIds } = useFollow();
  const { colors, glass, gradients } = useTheme();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<{ type: "network" | "server" | "general"; message?: string } | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [repostModalVisible, setRepostModalVisible] = useState(false);
  const [repostTarget, setRepostTarget] = useState<FeedPost | null>(null);
  const [feedFilter, setFeedFilter] = useState<'all' | 'following' | 'discover'>('all');

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

      // Fetch posts with author profile (last 30 days for algorithmic feed)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from("posts")
        .select("*, profiles(username, avatar_url), repost_of:repost_of_id(id, content, category, is_anonymous, author_id, profiles(username, avatar_url))")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100); // Get more posts to apply algorithmic sorting

      // Filter out blocked users' posts
      if (blockedIds.length > 0) {
        query = query.not("author_id", "in", `(${blockedIds.join(",")})`);
      }

      // Apply feed filter
      if (feedFilter === 'following') {
        const ids = Array.from(followingIds);
        if (ids.length > 0) {
          query = query.in('author_id', ids);
        } else {
          // No follows yet, return empty
          setPosts([]);
          setError(null);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } else if (feedFilter === 'discover') {
        const ids = Array.from(followingIds);
        if (user && ids.length > 0) {
          // Exclude self and followed users
          const excludeIds = [user.id, ...ids];
          query = query.not("author_id", "in", `(${excludeIds.join(",")})`);
        } else if (user) {
          // Just exclude self
          query = query.not("author_id", "in", `(${user.id})`);
        }
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

      // Fetch comment counts and top comments
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, post_id, content, is_anonymous, profiles(username)")
        .in("post_id", postIds)
        .order("created_at", { ascending: false });

      // Fetch comment reactions (if table exists)
      let commentReactionsData: any[] | null = null;
      try {
        const { data: crData } = await supabase
          .from("comment_reactions")
          .select("comment_id, reaction_type")
          .in("comment_id", (commentsData || []).map((c: any) => c.id));
        commentReactionsData = crData;
      } catch (e) {
        // Table might not exist yet
        console.log("Comment reactions table not available yet");
      }

      // Aggregate reactions per post
      const reactionsMap: Record<string, Record<string, number>> = {};
      (reactionsData || []).forEach((r) => {
        if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = {};
        reactionsMap[r.post_id][r.reaction_type] =
          (reactionsMap[r.post_id][r.reaction_type] || 0) + 1;
      });

      // Count comments per post and find top comment (most reacted)
      const commentsMap: Record<string, number> = {};
      const commentReactionMap: Record<string, number> = {};

      // Build comment reaction count map
      (commentReactionsData || []).forEach((cr: any) => {
        commentReactionMap[cr.comment_id] = (commentReactionMap[cr.comment_id] || 0) + 1;
      });

      // Group comments by post and find the most reacted one
      const commentsByPost: Record<string, any[]> = {};
      (commentsData || []).forEach((c: any) => {
        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
        if (!commentsByPost[c.post_id]) {
          commentsByPost[c.post_id] = [];
        }
        commentsByPost[c.post_id].push(c);
      });

      const topCommentMap: Record<string, { content: string; author: string; likes: number } | null> = {};
      Object.keys(commentsByPost).forEach(postId => {
        const postComments = commentsByPost[postId];
        // Sort by reaction count, then by recency
        const sorted = [...postComments].sort((a, b) => {
          const aReactions = commentReactionMap[a.id] || 0;
          const bReactions = commentReactionMap[b.id] || 0;
          if (bReactions !== aReactions) return bReactions - aReactions;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        if (sorted.length > 0) {
          const top = sorted[0];
          topCommentMap[postId] = {
            content: top.content,
            author: top.is_anonymous ? "Anonim" : top.profiles?.username || "Kullanıcı",
            likes: commentReactionMap[top.id] || 0,
          };
        }
      });

      // Calculate feed scores and sort
      const feedPostsWithScore: (FeedPost & { feedScore: number })[] = postsData.map((p) => {
        const postReactions = reactionsMap[p.id] || {};
        const reactions = Object.entries(postReactions)
          .map(([type, count]) => ({ type: type as ReactionType, count }))
          .sort((a, b) => b.count - a.count);

        const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

        // Calculate time decay (hours since post)
        const hoursSincePost = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60);

        // Time decay: 1 for new posts, 0 after 72 hours (3 days)
        const timeDecay = Math.max(0, 1 - hoursSincePost / 72);

        // Reaction score: logarithmic to prevent spam domination
        const reactionScore = totalReactions > 0 ? Math.log10(totalReactions + 1) / 5 : 0;

        // Final score: 40% time, 60% reactions
        const feedScore = timeDecay * 0.4 + reactionScore * 0.6;

        return {
          id: p.id,
          content: p.content,
          category: p.category as PostCategory,
          is_anonymous: p.is_anonymous,
          is_spoiler: p.is_spoiler,
          image_url: p.image_url,
          author_id: p.author_id,
          created_at: p.created_at,
          repost_of_id: (p as any).repost_of_id || null,
          repost_of: (p as any).repost_of || null,
          profiles: p.profiles as any,
          reactions,
          commentCount: commentsMap[p.id] || 0,
          topComment: topCommentMap[p.id] || null,
          feedScore,
        };
      });

      // Sort by feed score (highest first)
      const sortedPosts = feedPostsWithScore
        .sort((a, b) => b.feedScore - a.feedScore)
        .slice(0, 50); // Limit to top 50

      setPosts(sortedPosts);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      const errorType = error?.message?.includes("network") || error?.message?.includes("fetch")
        ? "network"
        : "server";
      setError({ type: errorType, message: error?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      fetchUnreadCount();
    }, [fetchPosts, fetchUnreadCount, feedFilter])
  );

  // Realtime subscriptions for posts, reactions, and comments
  useEffect(() => {
    if (!user) return;

    // Posts channel subscription
    const postsChannel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload as any;

          if (eventType === "INSERT") {
            // Yeni post eklendi - feed'e ekle
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", newRecord.author_id)
              .single();

            const newPost: FeedPost = {
              id: newRecord.id,
              content: newRecord.content,
              category: newRecord.category as PostCategory,
              is_anonymous: newRecord.is_anonymous,
              is_spoiler: newRecord.is_spoiler,
              image_url: newRecord.image_url,
              author_id: newRecord.author_id,
              created_at: newRecord.created_at,
              repost_of_id: newRecord.repost_of_id || null,
              repost_of: null,
              profiles: profileData as any,
              reactions: [],
              commentCount: 0,
            };
            setPosts((prev) => [newPost, ...prev]);
          } else if (eventType === "UPDATE") {
            // Post güncellendi - feed'deki post'u güncelle
            setPosts((prev) =>
              prev.map((post) =>
                post.id === newRecord.id
                  ? { ...post, ...newRecord, category: newRecord.category as PostCategory }
                  : post
              )
            );
          } else if (eventType === "DELETE") {
            // Post silindi - feed'den çıkar
            setPosts((prev) => prev.filter((post) => post.id !== oldRecord.id));
          }
        }
      )
      .subscribe();

    // Reactions channel subscription
    const reactionsChannel = supabase
      .channel("reactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_reactions",
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload as any;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            // Reaksiyon eklendi veya güncellendi - post'un reaksiyonlarını yeniden hesapla
            const { data } = await supabase
              .from("post_reactions")
              .select("reaction_type")
              .eq("post_id", newRecord.post_id);

            const reactionsMap: Record<string, number> = {};
            (data || []).forEach((r) => {
              reactionsMap[r.reaction_type] = (reactionsMap[r.reaction_type] || 0) + 1;
            });

            const reactions = Object.entries(reactionsMap)
              .map(([type, count]) => ({ type: type as ReactionType, count }))
              .sort((a, b) => b.count - a.count);

            setPosts((prev) =>
              prev.map((post) =>
                post.id === newRecord.post_id ? { ...post, reactions } : post
              )
            );
          } else if (eventType === "DELETE") {
            // Reaksiyon silindi - post'un reaksiyonlarını yeniden hesapla
            const { data } = await supabase
              .from("post_reactions")
              .select("reaction_type")
              .eq("post_id", oldRecord.post_id);

            const reactionsMap: Record<string, number> = {};
            (data || []).forEach((r) => {
              reactionsMap[r.reaction_type] = (reactionsMap[r.reaction_type] || 0) + 1;
            });

            const reactions = Object.entries(reactionsMap)
              .map(([type, count]) => ({ type: type as ReactionType, count }))
              .sort((a, b) => b.count - a.count);

            setPosts((prev) =>
              prev.map((post) =>
                post.id === oldRecord.post_id ? { ...post, reactions } : post
              )
            );
          }
        }
      )
      .subscribe();

    // Comments channel subscription
    const commentsChannel = supabase
      .channel("comments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
        },
        async (payload) => {
          const { new: newRecord, old: oldRecord } = payload as any;
          const postId = newRecord?.post_id || oldRecord?.post_id;

          if (postId) {
            // Yorum sayısını yeniden hesapla
            const { count } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", postId);

            setPosts((prev) =>
              prev.map((post) =>
                post.id === postId ? { ...post, commentCount: count || 0 } : post
              )
            );
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      postsChannel.unsubscribe();
      reactionsChannel.unsubscribe();
      commentsChannel.unsubscribe();
    };
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  const handleEditPost = useCallback((post: FeedPost) => {
    setSelectedPost(post);
    setEditModalVisible(true);
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("author_id", user?.id);

      if (error) throw error;

      // Remove from local state
      setPosts(prev => prev.filter(p => p.id !== postId));

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error("Delete post error:", e);
      Alert.alert("Hata", "Gönderi silinemedi.");
    }
  }, [user?.id]);

  const handleCloseEditModal = useCallback(() => {
    setEditModalVisible(false);
    setSelectedPost(null);
    fetchPosts();
  }, [fetchPosts]);

  // Memoize filtered posts to avoid recalculation on every render
  const filteredPosts = useMemo(() => {
    return selectedCategory
      ? posts.filter((p) => p.category === selectedCategory)
      : posts;
  }, [posts, selectedCategory]);

  const styles = useMemo(() => StyleSheet.create({
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
    feedTabsContainer: {
      flexDirection: "row",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      backgroundColor: glass.background,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
    },
    feedTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      backgroundColor: glass.backgroundLight,
      borderRadius: borderRadius.md,
    },
    feedTabActive: {
      backgroundColor: `${colors.primary}20`,
    },
    feedTabText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    feedTabTextActive: {
      color: colors.primary,
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
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
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
    fab: {
      position: "absolute",
      bottom: 90,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      elevation: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
  }), [colors, glass]);

  if (loading) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <AnimatedHeader>
            <View style={styles.headerContent}>
              <Logo size={28} />
              <Text style={styles.headerTitle}>ENTRIKA</Text>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={styles.bellButton}
              >
                <Bell size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </AnimatedHeader>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
            showsVerticalScrollIndicator={false}
          >
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <AnimatedHeader>
            <View style={styles.headerContent}>
              <Logo size={28} />
              <Text style={styles.headerTitle}>ENTRIKA</Text>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={styles.bellButton}
              >
                <Bell size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </AnimatedHeader>
          <ErrorState
            type={error.type}
            message={error.message}
            onRetry={() => {
              setError(null);
              fetchPosts();
            }}
          />
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
            <Logo size={28} />
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

        {/* Feed Filter Tabs */}
        <View style={styles.feedTabsContainer}>
          <TouchableOpacity
            style={[styles.feedTab, feedFilter === 'all' && styles.feedTabActive]}
            onPress={() => setFeedFilter('all')}
          >
            <Globe size={16} color={feedFilter === 'all' ? colors.primary : colors.textMuted} />
            <Text style={[styles.feedTabText, feedFilter === 'all' && styles.feedTabTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedTab, feedFilter === 'following' && styles.feedTabActive]}
            onPress={() => setFeedFilter('following')}
          >
            <Users size={16} color={feedFilter === 'following' ? colors.primary : colors.textMuted} />
            <Text style={[styles.feedTabText, feedFilter === 'following' && styles.feedTabTextActive]}>
              Tanıdıklar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedTab, feedFilter === 'discover' && styles.feedTabActive]}
            onPress={() => setFeedFilter('discover')}
          >
            <Sparkles size={16} color={feedFilter === 'discover' ? colors.primary : colors.textMuted} />
            <Text style={[styles.feedTabText, feedFilter === 'discover' && styles.feedTabTextActive]}>
              Tanımadıklar
            </Text>
          </TouchableOpacity>
        </View>

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
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} onRefresh={fetchPosts} onEdit={handleEditPost} onDelete={handleDeletePost} onRepost={(p) => { setRepostTarget(p); setRepostModalVisible(true); }} />
            ))
          ) : (
            <EmptyState type={feedFilter === 'following' ? 'following' : 'feed'} />
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Edit Post Modal */}
        <EditPostModal
          visible={editModalVisible}
          onClose={handleCloseEditModal}
          post={selectedPost ? {
            id: selectedPost.id,
            content: selectedPost.content,
            category: selectedPost.category,
            is_anonymous: selectedPost.is_anonymous,
            is_spoiler: selectedPost.is_spoiler,
            image_url: selectedPost.image_url,
          } : null}
        />

        {repostTarget && (
          <RepostModal
            visible={repostModalVisible}
            onClose={() => {
              setRepostModalVisible(false);
              setRepostTarget(null);
              fetchPosts();
            }}
            originalPost={{
              id: repostTarget.id,
              content: repostTarget.content,
              category: repostTarget.category,
              is_anonymous: repostTarget.is_anonymous,
              profiles: repostTarget.profiles,
            }}
          />
        )}

        {/* FAB - Yeni Paylasim */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/new-post")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <PenSquare size={24} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </GradientBackground>
  );
}
