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
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Image as ImageIcon, Send, XCircle } from "lucide-react-native";
import { CATEGORIES, type PostCategory } from "@/data/mockData";
import { colors, borderRadius, spacing, fontSize, glass } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { pickImage, uploadImage, showImageSourcePicker } from "@/lib/storage";
import GradientBackground from "@/components/ui/GradientBackground";

const glassFallback = glass || {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

export default function NewPostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const handleAddImage = () => {
    showImageSourcePicker(async (source) => {
      const uri = await pickImage({ source, aspect: [4, 3], quality: 0.8, allowsEditing: true });
      if (uri) {
        setSelectedImageUri(uri);
      }
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() || !selectedCategory || !user) return;
    setSubmitting(true);

    try {
      const isSpoiler =
        selectedCategory === "ifsa" ||
        selectedCategory === "red_flag" ||
        selectedCategory === "dolandiricilik";

      let imageUrl: string | null = null;
      if (selectedImageUri) {
        imageUrl = await uploadImage("post-images", user.id, selectedImageUri);
      }

      const { error } = await supabase.from("posts").insert({
        content: content.trim(),
        category: selectedCategory,
        is_anonymous: isAnonymous,
        is_spoiler: isSpoiler,
        author_id: user.id,
        image_url: imageUrl,
      });

      if (error) throw error;
      router.back();
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Paylaşım oluşturulamadı. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = content.trim().length > 0 && selectedCategory !== null;

  return (
    <GradientBackground variant="screen">
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
              disabled={!isValid || submitting}
              style={[styles.submitButton, isValid && !submitting && styles.submitButtonActive]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Send size={16} color={isValid ? colors.white : colors.textMuted} />
                  <Text style={[styles.submitButtonText, isValid && styles.submitButtonTextActive]}>
                    Paylaş
                  </Text>
                </>
              )}
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

            {/* Fotoğraf Önizleme */}
            {selectedImageUri && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={() => setSelectedImageUri(null)}
                >
                  <XCircle size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}
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
            <TouchableOpacity style={styles.mediaButton} onPress={handleAddImage}>
              <ImageIcon size={20} color={colors.primary} />
              <Text style={styles.mediaButtonText}>
                {selectedImageUri ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: glassFallback.background,
    borderBottomWidth: 1,
    borderBottomColor: glassFallback.border,
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
    borderColor: glassFallback.border,
    backgroundColor: glassFallback.background,
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
    backgroundColor: "transparent",
  },
  toolbar: {
    backgroundColor: glassFallback.background,
    borderTopWidth: 1,
    borderTopColor: glassFallback.border,
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
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  mediaButtonText: {
    color: colors.textLight,
    marginLeft: spacing.md,
  },
  imagePreviewContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.borderLight,
  },
  imageRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
