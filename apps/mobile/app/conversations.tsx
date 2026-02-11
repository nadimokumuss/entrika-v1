import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, MessageCircle } from "lucide-react-native";
import { borderRadius, spacing, fontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchConversations,
  subscribeToAllMessages,
  ConversationItem,
} from "@/lib/messaging";
import { getBlockedUserIds } from "@/lib/blocking";
import GradientBackground from "@/components/ui/GradientBackground";
import Logo from "@/components/Logo";
import { ErrorState } from "@/components/ui/ErrorState";

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Dun";
  if (diffDays < 7) {
    const days = ["Paz", "Pzt", "Sal", "Car", "Per", "Cum", "Cmt"];
    return days[date.getDay()];
  }
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

export default function ConversationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, glass } = useTheme();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ type: "network" | "server" | "general"; message?: string } | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await fetchConversations(user.id);
      // Filter out conversations with blocked users
      const blockedIds = await getBlockedUserIds(user.id);
      const filtered = data.filter(
        (conv) => !blockedIds.includes(conv.otherUserId)
      );
      setConversations(filtered);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
        setError({ type: "network" });
      } else if (error?.code?.startsWith("5")) {
        setError({ type: "server" });
      } else {
        setError({ type: "general", message: error?.message });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Realtime: refresh list when new messages arrive
  useEffect(() => {
    const channel = subscribeToAllMessages(() => {
      loadConversations();
    });
    return () => {
      channel.unsubscribe();
    };
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
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
      flex: 1,
      color: colors.text,
      fontSize: fontSize.lg,
      fontWeight: "bold",
      textAlign: "center",
    },
    headerRight: {
      width: 40,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xxl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: fontSize.xl,
      fontWeight: "bold",
      marginTop: spacing.lg,
    },
    emptySubtitle: {
      color: colors.textMuted,
      fontSize: fontSize.md,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    list: {
      flex: 1,
    },
    conversationCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: glass.background,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.borderLight,
    },
    conversationInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    username: {
      color: colors.text,
      fontSize: fontSize.base,
      fontWeight: "500",
      flex: 1,
      marginRight: spacing.sm,
    },
    usernameBold: {
      fontWeight: "700",
    },
    time: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    preview: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      flex: 1,
      marginRight: spacing.sm,
    },
    previewUnread: {
      color: colors.text,
      fontWeight: "600",
    },
    unreadBadge: {
      backgroundColor: colors.accent,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    unreadText: {
      color: colors.white,
      fontSize: fontSize.xs,
      fontWeight: "bold",
    },
  }), [colors, glass]);

  if (error) {
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
            <Text style={styles.headerTitle}>Mesajlar</Text>
            <View style={styles.headerRight} />
          </View>
          <ErrorState type={error.type} message={error.message} onRetry={() => loadConversations()} />
        </SafeAreaView>
      </GradientBackground>
    );
  }

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
            <Text style={styles.headerTitle}>Mesajlar</Text>
            <View style={styles.headerRight} />
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
          <Text style={styles.headerTitle}>Mesajlar</Text>
          <View style={styles.headerRight} />
        </View>

        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Henuz eslesmeniz yok</Text>
            <Text style={styles.emptySubtitle}>
              Eslesme yaptiktan sonra mesajlasmaya baslayabilirsiniz.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {conversations.map((conv) => (
              <TouchableOpacity
                key={conv.matchId}
                style={styles.conversationCard}
                onPress={() => router.push(`/chat/${conv.matchId}`)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: conv.otherAvatarUrl }}
                  style={styles.avatar}
                />
                <View style={styles.conversationInfo}>
                  <View style={styles.topRow}>
                    <Text
                      style={[
                        styles.username,
                        conv.unreadCount > 0 && styles.usernameBold,
                      ]}
                      numberOfLines={1}
                    >
                      {conv.otherUsername}
                    </Text>
                    <Text style={styles.time}>
                      {formatTime(conv.lastMessageAt)}
                    </Text>
                  </View>
                  <View style={styles.bottomRow}>
                    <Text
                      style={[
                        styles.preview,
                        conv.unreadCount > 0 && styles.previewUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {conv.lastMessage || "Henuz mesaj yok"}
                    </Text>
                    {conv.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}
