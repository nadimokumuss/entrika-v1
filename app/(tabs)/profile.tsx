import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings, Share2, Users } from "lucide-react-native";
import { CURRENT_USER, MOCK_POSTS } from "@/data/mockData";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";

type TabType = "paylaşımlar" | "referanslar";

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("paylaşımlar");
  const user = CURRENT_USER;

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return "#EAB308";
    if (score >= 4) return colors.warning;
    return colors.danger;
  };

  const scoreColor = getScoreColor(user.reputationScore);
  const userPosts = MOCK_POSTS.filter((p) => !p.isAnonymous).slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Share2 size={22} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.iconButtonMargin]}>
            <Settings size={22} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Profil Bilgileri */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
              <Text style={styles.scoreBadgeText}>
                {user.reputationScore.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Kullanıcı Adı */}
          <Text style={styles.username}>@{user.username}</Text>

          {/* İtibar Açıklaması */}
          <View style={styles.reputationRow}>
            <View style={[styles.reputationDot, { backgroundColor: scoreColor }]} />
            <Text style={[styles.reputationText, { color: scoreColor }]}>
              {user.reputationScore >= 8
                ? "Güvenilir Üye"
                : user.reputationScore >= 6
                ? "İyi İtibar"
                : user.reputationScore >= 4
                ? "Orta İtibar"
                : "Düşük İtibar"}
            </Text>
          </View>

          {/* İstatistikler */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.inviteQuota}</Text>
              <Text style={styles.statLabel}>Davetiye</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Paylaşım</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Referans</Text>
            </View>
          </View>
        </View>

        {/* Sekmeler */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "paylaşımlar" && styles.tabActive]}
            onPress={() => setActiveTab("paylaşımlar")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "paylaşımlar" && styles.tabTextActive,
              ]}
            >
              Paylaşımlarım
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "referanslar" && styles.tabActive]}
            onPress={() => setActiveTab("referanslar")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "referanslar" && styles.tabTextActive,
              ]}
            >
              Referanslarım
            </Text>
          </TouchableOpacity>
        </View>

        {/* İçerik */}
        <View style={styles.contentSection}>
          {activeTab === "paylaşımlar" ? (
            userPosts.length > 0 ? (
              userPosts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  <Text style={styles.postContent} numberOfLines={3}>
                    {post.content}
                  </Text>
                  <Text style={styles.postTime}>{post.createdAt}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Henüz paylaşımın yok.</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyState}>
              <Users size={48} color={colors.border} />
              <Text style={styles.emptyStateText}>
                Davet ettiğin kişiler{"\n"}burada görünecek.
              </Text>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>Davetiye Paylaş</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
  scrollView: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  iconButton: {
    padding: spacing.sm,
  },
  iconButtonMargin: {
    marginLeft: spacing.sm,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.borderLight,
  },
  scoreBadge: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.background,
  },
  scoreBadgeText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: fontSize.sm,
  },
  username: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginTop: spacing.lg,
  },
  reputationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  reputationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  reputationText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: "bold",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontWeight: "500",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  contentSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  postCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  postContent: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  postTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    color: colors.textMuted,
    marginTop: spacing.lg,
    textAlign: "center",
    lineHeight: 22,
  },
  shareButton: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  shareButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 80,
  },
});
