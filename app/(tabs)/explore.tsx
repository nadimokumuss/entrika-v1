import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, MapPin, AlertTriangle } from "lucide-react-native";
import { MOCK_SHADOW_PROFILES, type ShadowProfile } from "@/data/mockData";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";

function ShadowProfileCard({ profile }: { profile: ShadowProfile }) {
  const getScoreColor = (score: number) => {
    if (score <= 2) return colors.danger;
    if (score <= 4) return colors.warning;
    if (score <= 6) return "#EAB308";
    return colors.success;
  };

  const scoreColor = getScoreColor(profile.avgScore);

  return (
    <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
      <View style={styles.profileContent}>
        {/* Sol - Bilgiler */}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{profile.targetName}</Text>
            {profile.avgScore <= 2 && (
              <AlertTriangle size={16} color={colors.danger} style={styles.warningIcon} />
            )}
          </View>

          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.textMuted} />
            <Text style={styles.locationText}>{profile.city}</Text>
          </View>

          {/* Etiketler */}
          <View style={styles.tagsContainer}>
            {profile.tags.map((tag, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.reviewCount}>{profile.totalReviews} değerlendirme</Text>
        </View>

        {/* Sağ - Puan */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { backgroundColor: `${scoreColor}15` }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {profile.avgScore.toFixed(1)}
            </Text>
          </View>
          <Text style={styles.scoreLabel}>puan</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProfiles = MOCK_SHADOW_PROFILES.filter(
    (profile) =>
      profile.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Keşfet</Text>

        {/* Arama */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="İsim, şehir veya etiket ara..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Sonuçlar */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Uyarı Banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>
            Profiller kullanıcı yorumlarına dayanır.{"\n"}
            Bilgiler doğrulanmamış olabilir.
          </Text>
        </View>

        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => (
            <ShadowProfileCard key={profile.id} profile={profile} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "Aradığınız kriterlere uygun profil bulunamadı."
                : "Henüz profil oluşturulmamış."}
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: "bold",
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    marginLeft: spacing.md,
    fontSize: fontSize.md,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  warningBanner: {
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  warningBannerText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  profileCard: {
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
  profileContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  warningIcon: {
    marginLeft: spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tagChip: {
    backgroundColor: `${colors.danger}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  reviewCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.md,
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    color: colors.textMuted,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 80,
  },
});
