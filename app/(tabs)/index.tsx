import { useState, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Sparkles, MessageCircle } from "lucide-react-native";
import {
  CATEGORIES,
  REACTIONS,
  type PostCategory,
  type ReactionType,
} from "@/data/mockData";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

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
  if (diffMins < 1) return "Az once";
  if (diffMins < 60) return `${diffMins} dk once`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat once`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gun once`;
  return date.toLocaleDateString("tr-TR");
}

function PostCard({ post }: { post: FeedPost }) {
  const [revealed, setRevealed] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const { user } = useAuth();
  const category = CATEGORIES[post.category];

  const handleLongPress = () => {
    setShowReactions(true);
  };

  const handleReaction = async (type: ReactionType) => {
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

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={300}
      style={styles.postCard}
    >
      {/* Kategori Badge */}
      <View style={styles.postHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: `${category.color}15` }]}>
          <Text style={[styles.categoryText, { color: category.color }]}>
            {category.emoji} {category.label}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatTimeAgo(post.created_at)}</Text>
      </View>

      {/* Icerik */}
      <View style={styles.postContent}>
        <View style={styles.postTextContainer}>
          {post.is_spoiler && !revealed ? (
            <TouchableOpacity onPress={() => setRevealed(true)} activeOpacity={0.8}>
              <View style={styles.spoilerBox}>
                <Text style={styles.spoilerText}>
                  {"🔒 Hassas icerik\n"}
                  <Text style={styles.spoilerSubtext}>Gormek icin dokun</Text>
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
        <View style={styles.authorRow}>
          <Image source={{ uri: post.profiles.avatar_url }} style={styles.authorAvatar} />
          <Text style={styles.authorName}>@{post.profiles.username}</Text>
        </View>
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
        <View style={styles.commentsContainer}>
          <MessageCircle size={16} color={colors.textMuted} />
          <Text style={styles.commentCount}>{post.commentCount}</Text>
        </View>
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
    </Pressable>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      // Fetch posts with author profile
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*, profiles(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50);

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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Sparkles size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>ENTRIKA</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Sparkles size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>ENTRIKA</Text>
        </View>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Henuz paylasim yok</Text>
            <Text style={styles.emptyStateText}>
              Ilk paylasimi sen yap!
            </Text>
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginLeft: spacing.sm,
    letterSpacing: 1,
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
  postCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: colors.borderLight,
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
    borderTopColor: colors.borderLight,
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
    borderTopColor: colors.borderLight,
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
    backgroundColor: colors.borderLight,
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
});
