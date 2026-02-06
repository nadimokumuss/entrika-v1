import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bookmark, Trash2, Heart, ArrowLeft } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserBookmarks,
  toggleBookmark,
  subscribeToBookmarks,
  type BookmarkWithPost,
} from "@/lib/bookmarks";
import { useRouter } from "expo-router";
import Logo from "@/components/Logo";
import * as Haptics from "expo-haptics";
import {
  colors,
  borderRadius,
  spacing,
  fontSize,
  shadows,
} from "@/constants/theme";

export default function BookmarksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkWithPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getUserBookmarks(user.id);
      setBookmarks(data);
    } catch (error) {
      console.error("Bookmark'ları getirme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToBookmarks(user?.id, ({ action, bookmark }) => {
      if (action === "INSERT") {
        fetchBookmarks();
      } else if (action === "DELETE") {
        setBookmarks((prev) => prev.filter((b) => b.post_id !== bookmark.post_id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchBookmarks]);

  const handleRemoveBookmark = async (postId: string) => {
    if (!user?.id) return;

    Alert.alert("Bookmarkı Kaldır", "Bu postu kaydedilenlerden kaldırmak istediğine emin misin?", [
      {
        text: "İptal",
        style: "cancel",
      },
      {
        text: "Kaldır",
        style: "destructive",
        onPress: async () => {
          const { success } = await toggleBookmark(user.id, postId);
          if (success) {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarks();
    setRefreshing(false);
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post-detail?postId=${postId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "Dün";
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "itiraf":
        return colors.primary;
      case "ifsa":
        return colors.accent;
      case "red_flag":
        return colors.danger;
      case "yilanlik":
        return colors.warning;
      case "dolandiricilik":
        return colors.danger;
      case "tavsiye":
        return colors.success;
      default:
        return colors.textLight;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Logo size={24} />
          <Bookmark size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Kaydedilenler</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Logo size={24} />
        <Bookmark size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Kaydedilenler</Text>
        <Text style={styles.headerCount}>{bookmarks.length}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bookmark size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Henüz kaydedilen post yok</Text>
            <Text style={styles.emptySubtitle}>
              Beğendiğin postları kaydetmek için postun sağ üstündeki bookmark ikonuna tıkla
            </Text>
          </View>
        ) : (
          bookmarks.map((bookmark) => {
            const post = bookmark.posts;
            if (!post) return null;

            return (
              <TouchableOpacity
                key={bookmark.id}
                style={styles.bookmarkItem}
                onPress={() => handlePostPress(post.id)}
                activeOpacity={0.7}
              >
                <View style={styles.bookmarkHeader}>
                  <View style={styles.bookmarkMeta}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: `${getCategoryColor(post.category)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: getCategoryColor(post.category) },
                        ]}
                      >
                        {post.category}
                      </Text>
                    </View>
                    <Text style={styles.bookmarkDate}>
                      {formatDate(bookmark.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveBookmark(post.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.postContent} numberOfLines={3}>
                  {post.content}
                </Text>

                <View style={styles.bookmarkFooter}>
                  <View style={styles.authorInfo}>
                    <Heart size={14} color={colors.textMuted} />
                    <Text style={styles.authorText}>
                      @{post.profiles?.username || "anonim"}
                    </Text>
                  </View>
                  <Text style={styles.viewMore}>Detay →</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
  },
  headerCount: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  bookmarkItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  bookmarkHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  bookmarkMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  bookmarkDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  removeButton: {
    padding: spacing.xs,
  },
  postContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bookmarkFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  authorText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  viewMore: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
});
