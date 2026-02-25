import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Trash2,
  Reply,
  X,
  Bookmark,
  BookmarkCheck,
  Edit3,
  Repeat2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  borderRadius,
  spacing,
  fontSize,
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import {
  CATEGORIES,
  REACTIONS,
  type PostCategory,
  type ReactionType,
} from "@/constants/categories";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { blockUser } from "@/lib/blocking";
import { isPostBookmarked, toggleBookmark } from "@/lib/bookmarks";
import GradientBackground from "@/components/ui/GradientBackground";
import Logo from "@/components/Logo";
import GlassCard from "@/components/ui/GlassCard";
import { EditPostModal } from "@/components/ui/EditPostModal";
import { RepostModal } from "@/components/ui/RepostModal";
import EmojiPicker from "@/components/EmojiPicker";

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
  parent_id: string | null;
  profiles: { username: string; avatar_url: string } | null;
  reactions?: { type: ReactionType; count: number }[];
  userReaction?: ReactionType | null;
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
  const { colors, glass } = useTheme();

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
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [emojiPickerCommentId, setEmojiPickerCommentId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    try {
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
    } catch (err) {
      console.error("Error fetching post:", err);
    } finally {
      setLoading(false);
    }
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
      .select("*, profiles(username, avatar_url), parent_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    const commentList = (data || []).map((c) => ({
      ...c,
      profiles: c.profiles as any,
    }));

    // Fetch comment reactions for all comments
    const commentIds = commentList.map((c) => c.id);
    let commentReactionsData: any[] | null = null;
    let userReactionsData: any[] | null = null;

    try {
      const [reactionsResult, userReactionsResult] = await Promise.all([
        supabase
          .from("comment_reactions")
          .select("comment_id, reaction_type")
          .in("comment_id", commentIds),
        user ? supabase
          .from("comment_reactions")
          .select("comment_id, reaction_type")
          .eq("user_id", user.id)
          .in("comment_id", commentIds) : Promise.resolve({ data: null }),
      ]);
      commentReactionsData = reactionsResult.data;
      userReactionsData = userReactionsResult.data;
    } catch (e) {
      console.log("Comment reactions table not available yet");
    }

    // Build reactions map for each comment
    const reactionsMap: Record<string, Record<string, number>> = {};
    (commentReactionsData || []).forEach((cr: any) => {
      if (!reactionsMap[cr.comment_id]) reactionsMap[cr.comment_id] = {};
      reactionsMap[cr.comment_id][cr.reaction_type] = (reactionsMap[cr.comment_id][cr.reaction_type] || 0) + 1;
    });

    // Build user reaction map
    const userReactionMap: Record<string, ReactionType> = {};
    (userReactionsData || []).forEach((ur: any) => {
      userReactionMap[ur.comment_id] = ur.reaction_type;
    });

    setComments(
      commentList.map((c) => ({
        ...c,
        reactions: Object.entries(reactionsMap[c.id] || {})
          .map(([type, count]) => ({ type: type as ReactionType, count }))
          .sort((a, b) => b.count - a.count),
        userReaction: userReactionMap[c.id] || null,
      }))
    );
  }, [postId, user?.id]);

  // Check bookmark status
  useEffect(() => {
    if (user && postId) {
      isPostBookmarked(user.id, postId).then(setBookmarked);
    }
  }, [user, postId]);

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
            // Check if there's a temp comment that matches this new comment (same author and content)
            const tempIndex = prev.findIndex(c =>
              c.author_id === newComment.author_id &&
              c.content === newComment.content &&
              c.id.startsWith("temp-")
            );

            if (tempIndex >= 0) {
              // Replace temp comment with real one
              const updated = [...prev];
              updated[tempIndex] = { ...newComment, profiles };
              return updated;
            }

            // Check if comment already exists (prevent duplicates)
            if (prev.some((c) => c.id === newComment.id)) {
              return prev;
            }

            // Add new comment
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
    const parentId = replyingTo?.id || null;
    setInputText("");
    setReplyingTo(null);
    setSending(true);

    // OPTIMISTIC: Add comment immediately to UI
    const tempComment: CommentItem = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      author_id: user.id,
      content: text,
      is_anonymous: isAnonymous,
      created_at: new Date().toISOString(),
      parent_id: parentId,
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
        parent_id: parentId,
      });

      if (error) {
        console.error("Comment error:", error);
        // Remove temp comment on error
        setComments(prev => prev.filter(c => c.id !== tempComment.id));
        setInputText(text);
        Alert.alert("Hata", "Yorum gonderilemedi.");
      }
      // If successful, realtime will sync the real comment
    } catch (e) {
      console.error("Comment error:", e);
      // Remove temp comment on error
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
      setInputText(text);
    }
    setSending(false);
  };

  const handleReply = (comment: CommentItem) => {
    setReplyingTo(comment);
    const username = comment.is_anonymous ? "Anonim" : `@${comment.profiles?.username || "?"}`;
    setInputText("");
    inputRef.current?.focus();
  };

  const handleBookmarkToggle = async () => {
    if (!user || !postId) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const prev = bookmarked;
    setBookmarked(!prev);
    const result = await toggleBookmark(user.id, postId);
    if (!result.success) {
      setBookmarked(prev);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!user || !newContent.trim()) return;
    try {
      const { error } = await supabase
        .from("comments")
        .update({ content: newContent.trim() })
        .eq("id", commentId)
        .eq("author_id", user.id);

      if (error) throw error;

      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, content: newContent.trim() } : c
      ));
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (e) {
      console.error("Edit comment error:", e);
      Alert.alert("Hata", "Yorum guncellenemedi.");
    }
  };

  const handleCommentReaction = async (commentId: string, type: ReactionType) => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    try {
      // Check if user already reacted with this type
      const comment = comments.find(c => c.id === commentId);
      if (comment?.userReaction === type) {
        // Remove reaction
        await supabase
          .from("comment_reactions")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        setComments(prev => prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              reactions: (c.reactions || []).map(r => {
                if (r.type === type) {
                  return { ...r, count: Math.max(0, r.count - 1) };
                }
                return r;
              }).filter(r => r.count > 0),
              userReaction: null,
            };
          }
          return c;
        }));
      } else {
        // Add or update reaction
        await supabase.from("comment_reactions").upsert(
          { comment_id: commentId, user_id: user.id, reaction_type: type },
          { onConflict: "comment_id,user_id" }
        );

        setComments(prev => prev.map(c => {
          if (c.id === commentId) {
            const oldReaction = c.userReaction;
            const reactionsArr = [...(c.reactions || [])];

            // Remove count from old reaction if exists
            if (oldReaction) {
              const oldIdx = reactionsArr.findIndex(r => r.type === oldReaction);
              if (oldIdx >= 0) {
                if (reactionsArr[oldIdx].count <= 1) {
                  reactionsArr.splice(oldIdx, 1);
                } else {
                  reactionsArr[oldIdx].count--;
                }
              }
            }

            // Add or update new reaction count
            const newIdx = reactionsArr.findIndex(r => r.type === type);
            if (newIdx >= 0) {
              reactionsArr[newIdx].count++;
            } else {
              reactionsArr.push({ type, count: 1 });
            }

            // Sort by count
            reactionsArr.sort((a, b) => b.count - a.count);

            return {
              ...c,
              reactions: reactionsArr,
              userReaction: type,
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error("Comment reaction error:", e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    Alert.alert(
      "Yorumu Sil",
      "Bu yorumu silmek istedigine emin misin?",
      [
        { text: "Iptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId)
                .eq("author_id", user.id);

              if (error) throw error;

              // Remove from local state
              setComments(prev => prev.filter(c => c.id !== commentId));

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (e) {
              console.error("Delete comment error:", e);
              Alert.alert("Hata", "Yorum silinemedi.");
            }
          },
        },
      ]
    );
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
          ? "Anonim paylasim"
          : `@${post.profiles?.username}`,
      },
    });
  };

  const handleBlockUser = () => {
    setShowMenu(false);
    if (!user || !post || post.is_anonymous) return;
    Alert.alert(
      "Kullaniciyi Engelle",
      `@${post.profiles?.username} adli kullaniciyi engellemek istediginize emin misiniz?`,
      [
        { text: "Iptal", style: "cancel" },
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

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
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
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      alignItems: "center",
      justifyContent: "center",
    },
    commentBody: {
      flex: 1,
    },
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    commentHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    deleteCommentButton: {
      padding: spacing.xs,
      marginLeft: spacing.sm,
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
    commentReactionsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.sm,
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    commentReactionChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    commentReactionChipActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    commentReactionEmoji: {
      fontSize: fontSize.xs,
    },
    commentReactionCount: {
      color: colors.textMuted,
      fontSize: 10,
      marginLeft: spacing.xs,
    },
    commentReactionCountActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    commentAddReactionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      marginLeft: spacing.xs,
    },
    commentReplyButton: {
      padding: spacing.xs,
      marginLeft: spacing.sm,
    },
    commentActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    replyIndicator: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: `${colors.primary}10`,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.xs,
    },
    replyIndicatorText: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: "500",
      flex: 1,
    },
    replyIndicatorClose: {
      padding: spacing.xs,
    },
    replyBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.xs,
      gap: spacing.xs,
    },
    replyBadgeText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    commentItemReply: {
      marginLeft: 40,
    },
    commentEditInput: {
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    commentEditActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
    commentEditButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    commentEditButtonText: {
      fontSize: fontSize.xs,
      fontWeight: "600",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: "auto",
    },
    bookmarkButton: {
      padding: spacing.sm,
    },
    commentMenuButton: {
      padding: spacing.xs,
      marginLeft: spacing.xs,
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
      backgroundColor: glass.background,
      borderTopWidth: 1,
      borderTopColor: glass.border,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    textInput: {
      flex: 1,
      backgroundColor: glass.background,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      color: colors.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: glass.border,
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

  // Group comments: top-level + replies
  const topLevelComments = useMemo(() =>
    comments.filter(c => !c.parent_id),
    [comments]
  );

  const getReplies = useCallback((parentId: string) =>
    comments.filter(c => c.parent_id === parentId),
    [comments]
  );

  const renderSingleComment = (item: CommentItem, isReply: boolean = false) => {
    const authorTappable = !item.is_anonymous && item.profiles;
    const isEditing = editingCommentId === item.id;

    // Find parent comment for reply badge
    const parentComment = item.parent_id
      ? comments.find(c => c.id === item.parent_id)
      : null;

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
      <View key={item.id} style={[styles.commentItem, isReply && styles.commentItemReply]}>
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
          {/* Reply badge */}
          {isReply && parentComment && (
            <View style={styles.replyBadge}>
              <Reply size={12} color={colors.textMuted} />
              <Text style={styles.replyBadgeText}>
                {parentComment.is_anonymous
                  ? "Anonim"
                  : `@${parentComment.profiles?.username || "?"}`}'e yanit
              </Text>
            </View>
          )}
          <View style={styles.commentHeader}>
            <View style={styles.commentHeaderLeft}>
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
            {item.author_id === user?.id && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingCommentId(item.id);
                    setEditingCommentContent(item.content);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.commentMenuButton}
                >
                  <Edit3 size={14} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteComment(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.deleteCommentButton}
                >
                  <Trash2 size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isEditing ? (
            <>
              <TextInput
                style={styles.commentEditInput}
                value={editingCommentContent}
                onChangeText={setEditingCommentContent}
                multiline
                autoFocus
              />
              <View style={styles.commentEditActions}>
                <TouchableOpacity
                  style={styles.commentEditButton}
                  onPress={() => {
                    setEditingCommentId(null);
                    setEditingCommentContent("");
                  }}
                >
                  <Text style={[styles.commentEditButtonText, { color: colors.textMuted }]}>Iptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.commentEditButton, { backgroundColor: colors.primary, borderRadius: borderRadius.sm }]}
                  onPress={() => handleEditComment(item.id, editingCommentContent)}
                >
                  <Text style={[styles.commentEditButtonText, { color: colors.white }]}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.commentContent}>{item.content}</Text>
          )}

          {/* Comment Reactions + Reply */}
          <View style={styles.commentActionsRow}>
            {(item.reactions || []).slice(0, 3).map((reaction) => {
              const isUserReaction = item.userReaction === reaction.type;
              return (
                <TouchableOpacity
                  key={reaction.type}
                  style={[
                    styles.commentReactionChip,
                    isUserReaction && styles.commentReactionChipActive,
                  ]}
                  onPress={() => handleCommentReaction(item.id, reaction.type)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={styles.commentReactionEmoji}>
                    {REACTIONS[reaction.type]?.emoji ?? "?"}
                  </Text>
                  <Text style={[
                    styles.commentReactionCount,
                    isUserReaction && styles.commentReactionCountActive,
                  ]}>
                    {reaction.count}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Add reaction button with EmojiPicker */}
            <EmojiPicker
              visible={emojiPickerCommentId === item.id}
              onSelect={(type) => handleCommentReaction(item.id, type)}
              onClose={() => setEmojiPickerCommentId(null)}
              activeReaction={item.userReaction}
              triggerSize={14}
              onTriggerPress={() => setEmojiPickerCommentId(
                emojiPickerCommentId === item.id ? null : item.id
              )}
            />
            {/* Reply button */}
            <TouchableOpacity
              style={styles.commentReplyButton}
              onPress={() => handleReply(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Reply size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderComment = ({ item }: { item: CommentItem }) => {
    const replies = getReplies(item.id);
    return (
      <View>
        {renderSingleComment(item, false)}
        {replies.map(reply => renderSingleComment(reply, true))}
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
                        {"Hassas icerik\n"}
                        <Text style={styles.spoilerSubtext}>
                          Gormek icin dokun
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
                      {REACTIONS[reaction.type]?.emoji ?? "?"}
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
                        {REACTIONS[type]?.emoji ?? "?"}
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
      <Text style={styles.emptyCommentsTitle}>Henuz yorum yok</Text>
      <Text style={styles.emptyCommentsText}>Ilk yorumu sen yap!</Text>
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
            <Text style={styles.headerTitle}>Paylasim</Text>
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
          <Text style={styles.headerTitle}>Paylasim</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={() => setShowRepostModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Repeat2 size={22} color={colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={handleBookmarkToggle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {bookmarked ? (
                <BookmarkCheck size={22} color={colors.primary} />
              ) : (
                <Bookmark size={22} color={colors.textLight} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Comments List with Post Header */}
          <FlatList
            ref={flatListRef}
            data={topLevelComments}
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
            {replyingTo && (
              <View style={styles.replyIndicator}>
                <Reply size={14} color={colors.primary} />
                <Text style={styles.replyIndicatorText}>
                  {" "}{replyingTo.is_anonymous ? "Anonim" : `@${replyingTo.profiles?.username || "?"}`}'e yanit yaziyorsun
                </Text>
                <TouchableOpacity
                  style={styles.replyIndicatorClose}
                  onPress={() => setReplyingTo(null)}
                >
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder={replyingTo ? "Yanit yaz..." : "Yorum yaz..."}
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
              {/* Own post: Edit + Delete */}
              {post && post.author_id === user?.id && (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit3 size={20} color={colors.primary} />
                    <Text style={styles.menuItemText}>Duzenle</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      Alert.alert(
                        "Postu Sil",
                        "Bu postu silmek istediginize emin misiniz?",
                        [
                          { text: "Iptal", style: "cancel" },
                          {
                            text: "Sil",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                const { error } = await supabase
                                  .from("posts")
                                  .delete()
                                  .eq("id", post.id)
                                  .eq("author_id", user?.id);
                                if (error) throw error;
                                router.back();
                              } catch (e) {
                                Alert.alert("Hata", "Post silinemedi.");
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Trash2 size={20} color={colors.danger} />
                    <Text style={[styles.menuItemText, { color: colors.danger }]}>Sil</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              )}
              {/* Other's post: Report + Block */}
              {post && post.author_id !== user?.id && (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleReport}
                  >
                    <Flag size={20} color={colors.warning} />
                    <Text style={styles.menuItemText}>Raporla</Text>
                  </TouchableOpacity>
                  {!post.is_anonymous && (
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
                          Kullaniciyi Engelle
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <View style={styles.menuDivider} />
                </>
              )}
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

        {/* Edit Post Modal */}
        {post && (
          <EditPostModal
            visible={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              fetchPost();
            }}
            post={post}
          />
        )}

        {/* Repost Modal */}
        {post && (
          <RepostModal
            visible={showRepostModal}
            onClose={() => setShowRepostModal(false)}
            originalPost={{
              id: post.id,
              content: post.content,
              category: post.category,
              is_anonymous: post.is_anonymous,
              profiles: post.profiles,
            }}
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}
