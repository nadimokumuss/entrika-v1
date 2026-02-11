import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ShieldOff, UserX } from "lucide-react-native";
import { borderRadius, spacing, fontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

import GradientBackground from "@/components/ui/GradientBackground";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBlockedUsersWithProfiles,
  unblockUser,
  BlockedUserWithProfile,
} from "@/lib/blocking";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlockedUsersScreen() {
  const { colors, glass } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlockedUsers = useCallback(async () => {
    if (!user) return;
    const data = await getBlockedUsersWithProfiles(user.id);
    setBlockedUsers(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = (blockedUser: BlockedUserWithProfile) => {
    Alert.alert(
      "Engeli Kaldır",
      `@${blockedUser.username} adlı kullanıcının engelini kaldırmak istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Engeli Kaldır",
          onPress: async () => {
            if (!user) return;
            const success = await unblockUser(user.id, blockedUser.blocked_id);
            if (success) {
              setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedUser.id));
            } else {
              Alert.alert("Hata", "Engel kaldırılamadı. Lütfen tekrar deneyin.");
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
      backgroundColor: glass.background,
    },
    backButton: {
      padding: spacing.sm,
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSpacer: {
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
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: glass.background,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.borderLight,
    },
    userInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    username: {
      color: colors.text,
      fontSize: fontSize.base,
      fontWeight: "600",
    },
    dateText: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      marginTop: spacing.xs,
    },
    unblockButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${colors.danger}15`,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      gap: spacing.xs,
    },
    unblockText: {
      color: colors.danger,
      fontSize: fontSize.sm,
      fontWeight: "600",
    },
    bottomSpacer: {
      height: 60,
    },
  }), [colors, glass]);

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Engellenen Kullanıcılar</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : blockedUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <ShieldOff size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Engellenen kullanıcı yok</Text>
            <Text style={styles.emptySubtitle}>
              Engellediğiniz kullanıcılar burada görünecek.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {blockedUsers.map((blockedUser) => (
              <View key={blockedUser.id} style={styles.userCard}>
                <Image
                  source={{ uri: blockedUser.avatar_url }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.username}>@{blockedUser.username}</Text>
                  <Text style={styles.dateText}>
                    {formatDate(blockedUser.created_at)} tarihinde engellendi
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.unblockButton}
                  onPress={() => handleUnblock(blockedUser)}
                >
                  <UserX size={18} color={colors.danger} />
                  <Text style={styles.unblockText}>Kaldır</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}
