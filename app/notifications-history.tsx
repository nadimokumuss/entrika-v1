import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Bell,
  X,
  Heart,
  Zap,
  MessageCircle,
  Star,
  MessageSquare,
  Eye,
  Trash2,
  Check,
  Filter,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { colors, borderRadius, spacing, fontSize, shadows } from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import GradientBackground from "@/components/ui/GradientBackground";
import AnimatedHeader from "@/components/ui/AnimatedHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  NotificationType,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from "@/lib/notifications";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  actor_id?: string;
  actor?: {
    username: string;
    avatar_url: string;
  };
  metadata?: any;
}

type FilterType = "all" | "like" | "match" | "message" | "super_like" | "comment";

const FILTER_OPTIONS: { type: FilterType; label: string; icon: typeof Heart }[] = [
  { type: "all", label: "Tümü", icon: Bell },
  { type: "like", label: "Beğeniler", icon: Heart },
  { type: "match", label: "Eşleşmeler", icon: Zap },
  { type: "message", label: "Mesajlar", icon: MessageCircle },
  { type: "super_like", label: "Super", icon: Star },
  { type: "comment", label: "Yorumlar", icon: MessageSquare },
];

function formatNotificationTime(dateStr: string): string {
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

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

function getNotificationIcon(type: NotificationType): typeof Heart {
  const iconMap: Record<NotificationType, typeof Heart> = {
    like: Heart,
    match: Zap,
    message: MessageCircle,
    super_like: Star,
    comment: MessageSquare,
    profile_view: Eye,
    follow: Heart,
    mention: MessageSquare,
    system: Bell,
  };
  return iconMap[type] || Bell;
}

export default function NotificationsHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("notifications")
        .select(`
          *,
          actor:actor_id (username, avatar_url)
        `)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (selectedFilter !== "all") {
        query = query.eq("type", selectedFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setNotifications((data as NotificationItem[]) || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Hata", "Bildirimler yüklenemedi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    }
  };

  const handleDelete = (notificationId: string) => {
    Alert.alert(
      "Bildirimi Sil",
      "Bu bildirimi silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const success = await deleteNotification(notificationId);
            if (success) {
              setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      Alert.alert("Başarılı", "Tüm bildirimler okundu olarak işaretlendi.");
    }
  };

  const handlePress = (notification: NotificationItem) => {
    // Okundu olarak işaretle
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Bildirim tipine göre yönlendir
    if (notification.type === "match") {
      router.push("/conversations");
    } else if (notification.type === "message") {
      // Chat ID metadata'dan gelebilir
      router.push("/conversations");
    } else if (notification.type === "like" || notification.type === "super_like") {
      // Profiline git
      if (notification.actor_id) {
        router.push(`/user-profile/${notification.actor_id}`);
      }
    } else if (notification.type === "comment") {
      // Post'a git
      const postId = notification.metadata?.post_id;
      if (postId) {
        router.push(`/post-detail?postId=${postId}`);
      }
    }
  };

  if (loading) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <Text style={styles.title}>Bildirimler</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bildirimler</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Check size={16} color={colors.primary} />
              <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {FILTER_OPTIONS.map((filter) => {
            const Icon = filter.icon;
            const isActive = selectedFilter === filter.type;
            return (
              <TouchableOpacity
                key={filter.type}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                  setSelectedFilter(filter.type);
                }}
              >
                <Icon size={16} color={isActive ? colors.white : colors.textLight} />
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notifications List */}
        <ScrollView
          style={styles.notificationsList}
          contentContainerStyle={styles.notificationsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.is_read && styles.notificationItemUnread,
                  ]}
                  onPress={() => handlePress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationIconContainer}>
                    <Icon
                      size={20}
                      color={
                        !notification.is_read
                          ? colors.primary
                          : colors.textMuted
                      }
                    />
                  </View>

                  <View style={styles.notificationContent}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        !notification.is_read && styles.notificationTitleUnread,
                      ]}
                    >
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationBody}>
                      {notification.body}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatNotificationTime(notification.created_at)}
                    </Text>
                  </View>

                  <View style={styles.notificationActions}>
                    {!notification.is_read && (
                      <View style={styles.unreadDot} />
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(notification.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <EmptyState type="notifications" />
          )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.full,
  },
  markAllText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    maxHeight: 50,
  },
  filterBarContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: glassFallback.background,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: glassFallback.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: glassFallback.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: glassFallback.border,
  },
  notificationItemUnread: {
    backgroundColor: `${colors.primary}10`,
    borderColor: `${colors.primary}30`,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  notificationTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  notificationTitleUnread: {
    color: colors.primary,
  },
  notificationBody: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  notificationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  deleteButton: {
    padding: spacing.xs,
  },
});
