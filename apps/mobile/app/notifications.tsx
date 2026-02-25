import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  MessageCircle,
  Heart,
  Sparkles,
  Star,
} from "lucide-react-native";
import { borderRadius, spacing, fontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import GradientBackground from "@/components/ui/GradientBackground";
import Logo from "@/components/Logo";
import { ErrorState } from "@/components/ui/ErrorState";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
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

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, glass } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ type: "network" | "server" | "general"; message?: string } | null>(null);

  const TYPE_CONFIG: Record<string, { icon: any; color: string }> = useMemo(() => ({
    message: { icon: MessageCircle, color: colors.accent },
    match: { icon: Heart, color: colors.accent },
    reaction: { icon: Sparkles, color: colors.primary },
    comment: { icon: MessageCircle, color: colors.primary },
    review: { icon: Star, color: colors.warning },
  }), [colors]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const { data, error: err } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (err) throw err;
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
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

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const { type, data } = notification;
    if (type === "message" && data.matchId) {
      router.push(`/chat/${data.matchId}`);
    } else if (type === "match") {
      router.push("/conversations");
    } else if ((type === "reaction" || type === "comment") && data.postId) {
      router.push({ pathname: "/post-detail", params: { postId: data.postId } });
    } else if (type === "review") {
      router.push("/(tabs)/profile");
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

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
      width: 80,
    },
    markAllButton: {
      padding: spacing.sm,
    },
    markAllText: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "600",
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
    listContent: {
      paddingBottom: spacing.xxl,
    },
    notificationCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
    },
    notificationCardUnread: {
      backgroundColor: "rgba(168, 85, 247, 0.06)",
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    notificationContent: {
      flex: 1,
      marginLeft: spacing.md,
      marginRight: spacing.sm,
    },
    notificationTitle: {
      color: colors.text,
      fontSize: fontSize.base,
      fontWeight: "600",
    },
    notificationBody: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      marginTop: 2,
      lineHeight: 18,
    },
    notificationTime: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.xs,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  }), [colors, glass]);

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.message;
    const Icon = config.icon;

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.is_read && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
          <Icon size={20} color={config.color} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

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
            <Text style={styles.headerTitle}>Bildirimler</Text>
            <View style={styles.headerRight} />
          </View>
          <ErrorState type={error.type} message={error.message} onRetry={() => fetchNotifications()} />
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
            <Text style={styles.headerTitle}>Bildirimler</Text>
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
          <Text style={styles.headerTitle}>Bildirimler</Text>
          {hasUnread ? (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllText}>Tümü okundu</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerRight} />
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
            <Text style={styles.emptySubtitle}>
              Yeni bildirimleriniz burada görünecek.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}
