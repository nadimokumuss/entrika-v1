import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, MapPin, AlertTriangle } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, glass, gradients, shadows } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import GradientBackground from "@/components/ui/GradientBackground";
import AnimatedHeader from "@/components/ui/AnimatedHeader";
import GlassCard from "@/components/ui/GlassCard";

const glassFallback = glass || {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

interface ShadowProfileView {
  id: string;
  target_name: string;
  city: string | null;
  avg_score: number;
  total_reviews: number;
  tags: string[];
}

function ShadowProfileCard({ profile }: { profile: ShadowProfileView }) {
  const getScoreColor = (score: number) => {
    if (score <= 2) return colors.danger;
    if (score <= 4) return colors.warning;
    if (score <= 6) return "#EAB308";
    return colors.success;
  };

  const scoreColor = getScoreColor(profile.avg_score);

  return (
    <GlassCard style={styles.profileCard}>
      <View style={styles.profileContent}>
        {/* Sol - Bilgiler */}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{profile.target_name}</Text>
            {profile.avg_score <= 2 && (
              <AlertTriangle size={16} color={colors.danger} style={styles.warningIcon} />
            )}
          </View>

          {profile.city && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={styles.locationText}>{profile.city}</Text>
            </View>
          )}

          {/* Etiketler */}
          {profile.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {profile.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.reviewCount}>{profile.total_reviews} değerlendirme</Text>
        </View>

        {/* Sag - Puan */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { backgroundColor: `${scoreColor}15` }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {profile.avg_score.toFixed(1)}
            </Text>
          </View>
          <Text style={styles.scoreLabel}>puan</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<ShadowProfileView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async (query?: string) => {
    try {
      // Fetch shadow profiles with their reviews aggregated
      let shadowQuery = supabase
        .from("shadow_profiles")
        .select("id, target_name, city, identifier_hash");

      if (query && query.trim()) {
        // Search by name or city using ilike
        shadowQuery = shadowQuery.or(
          `target_name.ilike.%${query.trim()}%,city.ilike.%${query.trim()}%`
        );
      }

      const { data: shadowData, error: shadowError } = await shadowQuery
        .order("created_at", { ascending: false })
        .limit(50);

      if (shadowError) throw shadowError;
      if (!shadowData || shadowData.length === 0) {
        setProfiles([]);
        return;
      }

      const profileIds = shadowData.map((sp) => sp.id);

      // Fetch reviews for all shadow profiles
      const { data: reviewsData } = await supabase
        .from("shadow_reviews")
        .select("shadow_profile_id, score, tags")
        .in("shadow_profile_id", profileIds);

      // Aggregate reviews per profile
      const reviewsMap: Record<string, { scores: number[]; tags: string[] }> = {};
      (reviewsData || []).forEach((r) => {
        if (!reviewsMap[r.shadow_profile_id]) {
          reviewsMap[r.shadow_profile_id] = { scores: [], tags: [] };
        }
        reviewsMap[r.shadow_profile_id].scores.push(r.score);
        if (r.tags) {
          r.tags.forEach((tag: string) => {
            if (!reviewsMap[r.shadow_profile_id].tags.includes(tag)) {
              reviewsMap[r.shadow_profile_id].tags.push(tag);
            }
          });
        }
      });

      const result: ShadowProfileView[] = shadowData.map((sp) => {
        const reviews = reviewsMap[sp.id] || { scores: [], tags: [] };
        const avgScore =
          reviews.scores.length > 0
            ? reviews.scores.reduce((a, b) => a + b, 0) / reviews.scores.length
            : 5.0;

        return {
          id: sp.id,
          target_name: sp.target_name,
          city: sp.city,
          avg_score: avgScore,
          total_reviews: reviews.scores.length,
          tags: reviews.tags,
        };
      });

      // If searching by tag, filter client-side
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        const filtered = result.filter(
          (p) =>
            p.target_name.toLowerCase().includes(q) ||
            (p.city && p.city.toLowerCase().includes(q)) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        );
        setProfiles(filtered);
      } else {
        setProfiles(result);
      }
    } catch (error) {
      console.error("Error fetching shadow profiles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchProfiles(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchProfiles]);

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <AnimatedHeader>
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
        </AnimatedHeader>

        {/* Sonuclar */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Uyari Banner */}
          <View style={styles.warningBanner}>
            <Text style={styles.warningBannerText}>
              {"Profiller kullanıcı yorumlarına dayanır.\nBilgiler doğrulanmamış olabilir."}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : profiles.length > 0 ? (
            profiles.map((profile) => (
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
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
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
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  profileCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
