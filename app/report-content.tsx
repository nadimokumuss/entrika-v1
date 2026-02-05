import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, AlertTriangle, CheckCircle } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, glass } from "@/constants/theme";

const glassFallback = glass || {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
import GradientBackground from "@/components/ui/GradientBackground";
import { supabase, ReportType } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const REPORT_REASONS = [
  { id: "inappropriate", label: "Uygunsuz İçerik" },
  { id: "harassment", label: "Taciz / Zorbalık" },
  { id: "fake_profile", label: "Sahte Profil" },
  { id: "spam", label: "Spam / Reklam" },
  { id: "scam", label: "Dolandırıcılık" },
  { id: "hate_speech", label: "Nefret Söylemi" },
  { id: "violence", label: "Şiddet / Tehdit" },
  { id: "other", label: "Diğer" },
];

export default function ReportContentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { type, targetId, targetName } = useLocalSearchParams<{
    type: string;
    targetId: string;
    targetName: string;
  }>();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getTitle = () => {
    switch (type) {
      case "post":
        return "Paylaşımı Raporla";
      case "user":
        return "Kullanıcıyı Raporla";
      case "shadow_profile":
        return "Profili Raporla";
      default:
        return "Raporla";
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason || !user || !targetId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        report_type: type as ReportType,
        target_id: targetId,
        reason: selectedReason,
        details: details.trim() || null,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Rapor gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getTitle()}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.successContainer}>
            <CheckCircle size={64} color={colors.success} />
            <Text style={styles.successTitle}>Rapor Gönderildi</Text>
            <Text style={styles.successText}>
              Raporunuz inceleme ekibimize iletildi. Geri bildiriminiz için teşekkürler.
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Target info */}
          {targetName && (
            <View style={styles.targetInfo}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.targetText}>
                {type === "post" ? "Paylaşım" : type === "user" ? "Kullanıcı" : "Profil"}:{" "}
                <Text style={styles.targetName}>{targetName}</Text>
              </Text>
            </View>
          )}

          {/* Reason selection */}
          <Text style={styles.sectionTitle}>Neden raporluyorsunuz?</Text>
          <View style={styles.reasonsContainer}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.id && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selectedReason === reason.id && styles.radioOuterSelected,
                  ]}
                >
                  {selectedReason === reason.id && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason.id && styles.reasonTextSelected,
                  ]}
                >
                  {reason.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Details */}
          <Text style={styles.sectionTitle}>Ek detay (opsiyonel)</Text>
          <TextInput
            style={styles.detailsInput}
            placeholder="Raporunuzla ilgili ek bilgi ekleyin..."
            placeholderTextColor={colors.textMuted}
            value={details}
            onChangeText={setDetails}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{details.length}/500</Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Rapor Gönder</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: glassFallback.background,
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
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  targetInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.warning}15`,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  targetText: {
    color: colors.textLight,
    fontSize: fontSize.base,
    flex: 1,
  },
  targetName: {
    fontWeight: "bold",
    color: colors.text,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  reasonsContainer: {
    backgroundColor: glassFallback.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: glassFallback.border,
    overflow: "hidden",
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  reasonOptionSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: fontSize.base,
    color: colors.text,
    marginLeft: spacing.md,
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  detailsInput: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    fontSize: fontSize.base,
    color: colors.text,
    minHeight: 100,
  },
  charCount: {
    textAlign: "right",
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.lg,
  },
  successText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 22,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.xl,
    marginTop: spacing.xxl,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "bold",
  },
  bottomSpacer: {
    height: 60,
  },
});
