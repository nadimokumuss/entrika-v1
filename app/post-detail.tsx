import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  MoreHorizontal,
  Flag,
  ShieldBan,
  User,
  Flame,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  colors,
  borderRadius,
  spacing,
  fontSize,
  shadows,
} from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
import {
  CATEGORIES,
  REACTIONS,
  type PostCategory,
  type ReactionType,
} from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { blockUser } from "@/lib/blocking";
import GradientBackground from "@/components/ui/GradientBackground";
import Logo from "@/components/Logo";
import GlassCard from "@/components/ui/GlassCard";

interface PostDetail {
  id: string;
  content: string;
  category: PostCategory;
  is_anonymous: boolean;
  is_spoiler: boolean;
  image_url: string | null;
  author_id: string;
  created_at: string;
  profiles: { username: string; avatar_url: string } | null;
}

interface CommentItem {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: { username: string; avatar_url: string } | null;
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

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user, profile } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [reactions, setReactions] = useState<
    { type: ReactionType; count: number }[]
  >([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url)")
      .eq("id", postId)
      .single();

    if (error) {
      console.error("Error fetching post:", error);
      return;
    }
    setPost({
      ...data,
      category: data.category as PostCategory,
      profiles: data.profiles as any,
    });
  }, [postId]);

  const fetchReactions = useCallback(async () => {
    if (!postId) return;

    const { data } = await supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", postId);

    if (!data) return;

    const map: Record<string, number> = {};
    data.forEach((r) => {
      map[r.reaction_type] = (map[r.reaction_type] || 0) + 1;
    });

    const sorted = Object.entries(map)
      .map(([type, count]) => ({ type: type as ReactionType, count }))
      .sort((a, b) => b.count - a.count);

    setReactions(sorted);
  }, [postId]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    setComments(
      (data || []).map((c) => ({
        ...c,
        profiles: c.profiles as any,
      }))
    );
  }, [postId]);

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchPost(), fetchReactions(), fetchComments()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchPost, fetchReactions, fetchComments]);

  // Realtime subscription for new comments
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const newComment = payload.new as any;

          // Fetch profile for the new comment
          let profiles = null;
          if (!newComment.is_anonymous) {
            const { data } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", newComment.author_id)
              .single();
            profiles = data;
          }

          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [...prev, { ...newComment, profiles }];
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [postId]);

  const handleSendComment = async () => {
    if (!inputText.trim() || !user || !postId || sending) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = inputText.trim();
    setInputText("");
    setSending(true);

    // OPTIMISTIC: Add comment immediately to UI
    const tempComment: CommentItem = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      author_id: user.id,
      content: text,
      is_anonymous: isAnonymous,
      created_at: new Date().toISOString(),
      profiles: isAnonymous ? null : {
        username: profile?.username || user.email?.split('@')[0] || "Sen",
        avatar_url: profile?.avatar_url || "",
      },
    };

    setComments(prev => [...prev, tempComment]);

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: user.id,
        content: text,
        is_anonymous: isAnonymous,
      });

      if (error) {
        console.error("Comment error:", error);
        // Remove temp comment on error
        setComments(prev => prev.filter(c => c.id !== tempComment.id));
        setInputText(text);
        Alert.alert("Hata", "Yorum gönderilemedi.");
      }
      // If successful, realtime will sync the real comment
      // We could replace the temp comment with the real one if needed
    } catch (e) {
      console.error("Comment error:", e);
      // Remove temp comment on error
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
      setInputText(text);
    }
    setSending(false);
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReactions(true);
  };

  const handleReactionButtonPress = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setShowReactions(true);
  };

  const handleReaction = async (type: ReactionType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setShowReactions(false);
    if (!user || !postId) return;
    try {
      await supabase.from("post_reactions").upsert(
        { post_id: postId, user_id: user.id, reaction_type: type },
        { onConflict: "post_id,user_id" }
      );
      fetchReactions();
    } catch (e) {
      console.error("Reaction error:", e);
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    if (!post) return;
    router.push({
      pathname: "/report-content",
      params: {
        type: "post",
        targetId: post.id,
        targetName: post.is_anonymous
          ? "Anonim paylaşım"
          : `@${post.profiles?.username}`,
      },
    });
  };

  const handleBlockUser = () => {
    setShowMenu(false);
    if (!user || !post || post.is_anonymous) return;
    Alert.alert(
      "Kullanıcıyı Engelle",
      `@${post.profiles?.username} adlı kullanıcıyı engellemek istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Engelle",
          style: "destructive",
          onPress: async () => {
            const success = await blockUser(user.id, post.author_id);
            if (success) {
              Alert.alert("Engellendi", `@${post.profiles?.username} engellendi.`);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleAuthorPress = (authorId: string) => {
    router.push({
      pathname: "/user-profile/[userId]",
      params: { userId: authorId },
    });
  };

  const renderComment = ({ item }: { item: CommentItem }) => {
    const authorTappable = !item.is_anonymous && item.profiles;

    const avatarContent = !item.is_anonymous && item.profiles?.avatar_url ? (
      <Image
        source={{ uri: item.profiles.avatar_url }}
        style={styles.commentAvatarImage}
      />
    ) : (
      <View style={styles.commentAvatarPlaceholder}>
        <User size={16} color={colors.textMuted} />
      </View>
    );

    const authorNameContent = (
      <Text style={styles.commentAuthor}>
        {item.is_anonymous
          ? "Anonim"
          : `@${item.profiles?.username || "?"}`}
      </Text>
    );

    return (
      <View style={styles.commentItem}>
        {authorTappable ? (
          <TouchableOpacity
            style={styles.commentAvatar}
            onPress={() => handleAuthorPress(item.author_id)}
            activeOpacity={0.7}
          >
            {avatarContent}
          </TouchableOpacity>
        ) : (
          <View style={styles.commentAvatar}>{avatarContent}</View>
        )}
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            {authorTappable ? (
              <TouchableOpacity
                onPress={() => handleAuthorPress(item.author_id)}
                activeOpacity={0.7}
              >
                {authorNameContent}
              </TouchableOpacity>
            ) : (
              authorNameContent
            )}
            <Text style={styles.commentTime}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>
          <Text style={styles.commentContent}>{item.content}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!post) return null;
    const category = CATEGORIES[post.category];

    return (
      <Pressable onLongPress={handleLongPress} delayLongPress={300}>
        <GlassCard style={styles.postCard}>
          <View style={styles.postCardInner}>
            {/* Header */}
            <View style={styles.postHeader}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: `${category.color}15` },
                ]}
              >
                <Text style={[styles.categoryText, { color: category.color }]}>
                  {category.emoji} {category.label}
                </Text>
              </View>
              <Text style={styles.timeText}>
                {formatTimeAgo(post.created_at)}
              </Text>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenu(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MoreHorizontal size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.postContent}>
              <View style={styles.postTextContainer}>
                {/* Spoiler warning only for non-anonymous posts with is_spoiler=true */}
                {post.is_spoiler && !post.is_anonymous && !revealed ? (
                  <TouchableOpacity
                    onPress={() => setRevealed(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.spoilerBox}>
                      <Text style={styles.spoilerText}>
                        {"Hassas içerik\n"}
                        <Text style={styles.spoilerSubtext}>
                          Görmek için dokun
                        </Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.postText}>{post.content}</Text>
                )}
              </View>
              {post.image_url && (
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: post.image_url }}
                    style={styles.thumbnail}
                  />
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
                <Image
                  source={{ uri: post.profiles.avatar_url }}
                  style={styles.authorAvatar}
                />
                <Text style={styles.authorName}>
                  @{post.profiles.username}
                </Text>
              </TouchableOpacity>
            )}

            {/* Reactions */}
            <View style={styles.reactionsRow}>
              <View style={styles.reactionsList}>
                {reactions.slice(0, 3).map((reaction, index) => (
                  <View key={index} style={styles.reactionChip}>
                    <Text style={styles.reactionEmoji}>
                      {REACTIONS[reaction.type].emoji}
                    </Text>
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
              </View>
              <View style={styles.commentsInfo}>
                <MessageCircle size={16} color={colors.textMuted} />
                <Text style={styles.commentsInfoText}>
                  {comments.length}
                </Text>
              </View>
            </View>

            {/* Reaction Picker */}
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
                      <Text style={styles.reactionOptionEmoji}>
                        {REACTIONS[type].emoji}
                      </Text>
                      <Text style={styles.reactionOptionLabel}>
                        {REACTIONS[type].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </GlassCard>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyComments}>
      <MessageCircle size={32} color={colors.textMuted} />
      <Text style={styles.emptyCommentsTitle}>Henüz yorum yok</Text>
      <Text style={styles.emptyCommentsText}>İlk yorumu sen yap!</Text>
    </View>
  );

  if (loading) {
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
            <Logo size={24} />
            <Text style={styles.headerTitle}>Paylaşım</Text>
          </View>
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Logo size={24} />
          <Text style={styles.headerTitle}>Paylaşım</Text>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Comments List with Post Header */}
          <FlatList
            ref={flatListRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (comments.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Yorum yaz..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={(text) => {
                  if (text.length <= 500) setInputText(text);
                }}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  inputText.trim().length > 0 && styles.sendButtonActive,
                ]}
                onPress={handleSendComment}
                disabled={!inputText.trim() || sending}
              >
                <Send
                  size={20}
                  color={
                    inputText.trim().length > 0
                      ? colors.white
                      : colors.textMuted
                  }
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputFooter}>
              <TouchableOpacity
                style={styles.anonToggle}
                onPress={() => setIsAnonymous(!isAnonymous)}
                activeOpacity={0.7}
              >
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
                  style={styles.switch}
                />
                <Text style={styles.anonLabel}>Anonim</Text>
              </TouchableOpacity>
              <Text style={styles.charCount}>
                {inputText.length}/500
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Post Menu Modal */}
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
              {post &&
                !post.is_anonymous &&
                post.author_id !== user?.id && (
                  <>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleBlockUser}
                    >
                      <ShieldBan size={20} color={colors.danger} />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: colors.danger },
                        ]}
                      >
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
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Post Card
  postCard: {
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
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  commentsInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentsInfoText: {
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

  // Comments
  commentItem: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  commentAvatar: {
    marginRight: spacing.md,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    alignItems: "center",
    justifyContent: "center",
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  commentAuthor: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  commentTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: spacing.sm,
  },
  commentContent: {
    color: colors.text,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  emptyComments: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  emptyCommentsTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  emptyCommentsText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },

  // Input Bar
  inputBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: glassFallback.background,
    borderTopWidth: 1,
    borderTopColor: glassFallback.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    backgroundColor: glassFallback.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: glassFallback.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  inputFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  anonToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  switch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  anonLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
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
});
