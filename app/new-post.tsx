import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Image as ImageIcon, Send } from "lucide-react-native";
import { CATEGORIES, type PostCategory } from "@/data/mockData";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";

export default function NewPostScreen() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const handleSubmit = () => {
    if (!content.trim() || !selectedCategory) return;

    console.log({
      content,
      category: selectedCategory,
      isAnonymous,
    });

    router.back();
  };

  const isValid = content.trim().length > 0 && selectedCategory !== null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Yeni Paylaşım</Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid}
            style={[styles.submitButton, isValid && styles.submitButtonActive]}
          >
            <Send size={16} color={isValid ? colors.white : colors.textMuted} />
            <Text style={[styles.submitButtonText, isValid && styles.submitButtonTextActive]}>
              Paylaş
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Kategori Seçimi */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionLabel}>Kategori Seç *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {(Object.entries(CATEGORIES) as [PostCategory, typeof CATEGORIES[PostCategory]][]).map(
                ([key, category]) => {
                  const isSelected = selectedCategory === key;

                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSelectedCategory(key)}
                      style={[
                        styles.categoryChip,
                        isSelected && {
                          borderColor: category.color,
                          borderWidth: 2,
                          backgroundColor: `${category.color}15`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && { color: category.color, fontWeight: "600" },
                        ]}
                      >
                        {category.emoji} {category.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          </View>

          {/* Uyarı */}
          {(selectedCategory === "ifsa" ||
            selectedCategory === "red_flag" ||
            selectedCategory === "dolandiricilik") && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Bu kategori hassas içerik olarak işaretlenecek ve spoiler filtresiyle
                kapatılacaktır.
              </Text>
            </View>
          )}

          {/* İçerik */}
          <View style={styles.contentSection}>
            <TextInput
              style={styles.contentInput}
              placeholder="Deneyimini paylaş..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Alt Toolbar */}
        <View style={styles.toolbar}>
          {/* Anonim Mod */}
          <View style={styles.anonRow}>
            <View>
              <Text style={styles.anonLabel}>Anonim Paylaş</Text>
              <Text style={styles.anonDescription}>Kullanıcı adın gizlenecek</Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          {/* Medya Ekleme */}
          <TouchableOpacity style={styles.mediaButton}>
            <ImageIcon size={20} color={colors.primary} />
            <Text style={styles.mediaButtonText}>Fotoğraf Ekle</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: "600",
    fontSize: fontSize.lg,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
  },
  submitButtonActive: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    marginLeft: spacing.sm,
    fontWeight: "500",
    color: colors.textMuted,
  },
  submitButtonTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  categorySection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionLabel: {
    color: colors.textLight,
    marginBottom: spacing.md,
    fontWeight: "500",
  },
  categoryScroll: {
    marginHorizontal: -spacing.lg,
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    marginRight: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  warningBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: `${colors.warning}15`,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
    borderRadius: borderRadius.lg,
  },
  warningText: {
    color: colors.warning,
    fontSize: fontSize.sm,
  },
  contentSection: {
    paddingHorizontal: spacing.lg,
  },
  contentInput: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
    minHeight: 200,
  },
  toolbar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  anonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  anonLabel: {
    color: colors.text,
    fontWeight: "500",
  },
  anonDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  mediaButtonText: {
    color: colors.textLight,
    marginLeft: spacing.md,
  },
});
