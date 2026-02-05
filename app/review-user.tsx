import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, shadows } from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
import GradientBackground from "@/components/ui/GradientBackground";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, UserReview } from "@/lib/supabase";

const REVIEW_TAGS = {
  positive: ["Nazik", "Güvenilir", "Eğlenceli", "Samimi", "İlgili", "Saygılı", "Dürüst"],
  negative: ["Kaba", "Sahtekar", "Rahatsız Edici", "Yalancı", "Manipülatif", "Agresif", "Geç Cevap"],
};

export default function ReviewUserScreen() {
  const router = useRouter();
  const { userId, username } = useLocalSearchParams<{ userId: string; username: string }>();
  const { user } = useAuth();

  const [score, setScore] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingReview, setExistingReview] = useState<UserReview | null>(null);

  // Kendini değerlendirmeye izin verme
  useEffect(() => {
    if (user && userId && user.id === userId) {
      Alert.alert("Hata", "Kendinizi değerlendiremezsiniz.");
      router.back();
    }
  }, [user, userId]);

  // Mevcut review kontrol et
  useEffect(() => {
    const loadExistingReview = async () => {
      if (!user || !userId) return;

      const { data } = await supabase
        .from("user_reviews")
        .select("*")
        .eq("target_user_id", userId)
        .eq("reviewer_id", user.id)
        .single();

      if (data) {
        setExistingReview(data);
        setScore(data.score);
        setSelectedTags(data.tags || []);
        setContent(data.content || "");
        setIsAnonymous(data.is_anonymous);
      }
      setLoading(false);
    };

    loadExistingReview();
  }, [user, userId]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!user || !userId) return;

    if (score === null) {
      Alert.alert("Hata", "Lütfen bir puan seçin.");
      return;
    }

    setSaving(true);

    const reviewData = {
      target_user_id: userId,
      reviewer_id: user.id,
      score,
      content: content.trim() || null,
      tags: selectedTags,
      is_anonymous: isAnonymous,
    };

    const { error } = await supabase
      .from("user_reviews")
      .upsert(reviewData, { onConflict: "target_user_id,reviewer_id" });

    setSaving(false);

    if (error) {
      Alert.alert("Hata", "Değerlendirme kaydedilirken bir hata oluştu.");
      console.error("Review upsert error:", error);
      return;
    }

    router.back();
  };

  if (loading) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Değerlendir</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving || score === null}
            style={[styles.submitButton, (saving || score === null) && styles.submitButtonDisabled]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Gönder</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hedef kullanıcı */}
          <Text style={styles.targetUser}>@{username}</Text>

          {/* Puan Seçimi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Puan</Text>
            <View style={styles.scoreRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.scoreButton,
                    score === num && styles.scoreButtonActive,
                    score === num && num >= 7 && styles.scoreButtonGreen,
                    score === num && num >= 4 && num < 7 && styles.scoreButtonYellow,
                    score === num && num < 4 && styles.scoreButtonRed,
                  ]}
                  onPress={() => setScore(num)}
                >
                  <Text
                    style={[
                      styles.scoreButtonText,
                      score === num && styles.scoreButtonTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Etiketler - Pozitif */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Etiketler</Text>
            <Text style={styles.sectionSubtitle}>Pozitif</Text>
            <View style={styles.tagsRow}>
              {REVIEW_TAGS.positive.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    selectedTags.includes(tag) && styles.tagChipPositiveActive,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      selectedTags.includes(tag) && styles.tagChipTextPositiveActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Etiketler - Negatif */}
            <Text style={[styles.sectionSubtitle, { marginTop: spacing.md }]}>Negatif</Text>
            <View style={styles.tagsRow}>
              {REVIEW_TAGS.negative.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    selectedTags.includes(tag) && styles.tagChipNegativeActive,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      selectedTags.includes(tag) && styles.tagChipTextNegativeActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Yorum */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yorum (Opsiyonel)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Deneyiminizi paylaşın..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{content.length}/500</Text>
          </View>

          {/* Anonim Toggle */}
          <View style={styles.anonymousRow}>
            <View style={styles.anonymousTextContainer}>
              <Text style={styles.anonymousLabel}>Anonim Değerlendir</Text>
              <Text style={styles.anonymousDesc}>
                Kapatırsan kullanıcı adın görünür
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: colors.border, true: `${colors.primary}80` }}
              thumbColor={isAnonymous ? colors.primary : colors.textMuted}
            />
          </View>

          {existingReview && (
            <Text style={styles.updateNote}>
              Daha önce değerlendirmiştiniz. Gönder'e basarsanız güncellenecek.
            </Text>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: glassFallback.background,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    minWidth: 70,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: fontSize.sm,
  },
  scrollView: {
    flex: 1,
  },
  targetUser: {
    textAlign: "center",
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  scoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: glassFallback.border,
    backgroundColor: glassFallback.background,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  scoreButtonGreen: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  scoreButtonYellow: {
    borderColor: "#EAB308",
    backgroundColor: "#EAB308",
  },
  scoreButtonRed: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  scoreButtonText: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textLight,
  },
  scoreButtonTextActive: {
    color: colors.white,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: glassFallback.border,
    backgroundColor: glassFallback.background,
  },
  tagChipPositiveActive: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}20`,
  },
  tagChipNegativeActive: {
    borderColor: colors.danger,
    backgroundColor: `${colors.danger}20`,
  },
  tagChipText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  tagChipTextPositiveActive: {
    color: colors.success,
    fontWeight: "600",
  },
  tagChipTextNegativeActive: {
    color: colors.danger,
    fontWeight: "600",
  },
  commentInput: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.base,
    color: colors.text,
    minHeight: 100,
  },
  charCount: {
    textAlign: "right",
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  anonymousRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: glassFallback.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: glassFallback.border,
    padding: spacing.lg,
  },
  anonymousTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  anonymousLabel: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.text,
  },
  anonymousDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  updateNote: {
    textAlign: "center",
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
