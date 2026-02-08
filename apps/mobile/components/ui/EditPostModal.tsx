import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trash2, Save, X, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { borderRadius, spacing, fontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, type PostCategory } from "@/constants/categories";

const CONTENT_MIN_LENGTH = 10;
const CONTENT_MAX_LENGTH = 500;

interface EditPostModalProps {
  visible: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    category: PostCategory;
    is_anonymous: boolean;
    is_spoiler: boolean;
    image_url: string | null;
  } | null;
}

export function EditPostModal({ visible, onClose, post }: EditPostModalProps) {
  const { colors, gradients, glass } = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState(post?.content || "");
  const [category, setCategory] = useState<PostCategory | null>(post?.category || null);
  const [isAnonymous, setIsAnonymous] = useState(post?.is_anonymous ?? false);
  const [isSpoiler, setIsSpoiler] = useState(post?.is_spoiler ?? false);
  const [saving, setSaving] = useState(false);

  const contentCount = content.length;
  const isDirty =
    post &&
    (content !== post.content ||
      category !== post.category ||
      isAnonymous !== post.is_anonymous ||
      isSpoiler !== post.is_spoiler);

  const handleDelete = () => {
    Alert.alert(
      "Postu Sil",
      "Bu postu silmek istediğine emin misin? Bu işlem geri alınamaz.",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("posts")
                .delete()
                .eq("id", post?.id);

              if (error) throw error;

              onClose();
              Alert.alert("Başarılı", "Post silindi.");
            } catch (error: any) {
              Alert.alert("Hata", error.message || "Post silinemedi.");
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (content.trim().length < CONTENT_MIN_LENGTH) {
      Alert.alert("Hata", `En az ${CONTENT_MIN_LENGTH} karakter olmalı.`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          content: content.trim(),
          category: category || "general",
          is_anonymous: isAnonymous,
          is_spoiler: isSpoiler,
        })
        .eq("id", post?.id);

      if (error) throw error;

      onClose();
      Alert.alert("Başarılı", "Post güncellendi.");
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Post güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    keyboardView: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
    container: {
      flex: 1,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: glass.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
    },
    backButton: {
      padding: spacing.sm,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: "bold",
      color: colors.text,
    },
    deleteButton: {
      padding: spacing.sm,
    },
    content: {
      flex: 1,
      padding: spacing.xl,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    section: {
      marginBottom: spacing.xl,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: "600",
      color: colors.textLight,
      marginBottom: spacing.sm,
    },
    textInput: {
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: colors.text,
      fontSize: fontSize.md,
      minHeight: 120,
      textAlignVertical: "top",
    },
    counter: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: "right",
      marginTop: spacing.xs,
    },
    counterWarning: {
      color: colors.danger,
    },
    categoriesScroll: {
      marginHorizontal: -spacing.lg,
    },
    categoriesContent: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    categoryChip: {
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    categoryChipActive: {
      backgroundColor: `${colors.primary}20`,
      borderColor: colors.primary,
    },
    categoryChipText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },
    categoryChipTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: glass.background,
      borderWidth: 1,
      borderColor: glass.border,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    optionRowActive: {
      backgroundColor: `${colors.primary}10`,
      borderColor: colors.primary,
    },
    optionCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: glass.border,
      marginRight: spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    optionCheckboxActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: fontSize.md,
      color: colors.textLight,
    },
    optionTextActive: {
      color: colors.primary,
      fontWeight: "500",
    },
    infoBox: {
      backgroundColor: `${colors.primary}10`,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    infoText: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      lineHeight: 18,
    },
    footer: {
      padding: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: glass.border,
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
      gap: spacing.sm,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: colors.white,
      fontSize: fontSize.md,
      fontWeight: "bold",
    },
  }), [colors, glass]);

  if (!post) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <SafeAreaView style={styles.container} edges={["top"]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Postu Düzenle</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Trash2 size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Content Input */}
            <View style={styles.section}>
              <Text style={styles.label}>İçerik</Text>
              <TextInput
                style={styles.textInput}
                value={content}
                onChangeText={setContent}
                placeholder="Nelerden bahsetmek istersin?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={6}
                maxLength={CONTENT_MAX_LENGTH}
                autoFocus
                textAlignVertical="top"
                editable={!saving}
              />
              <Text style={[styles.counter, contentCount > CONTENT_MAX_LENGTH * 0.9 && styles.counterWarning]}>
                {contentCount}/{CONTENT_MAX_LENGTH}
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Kategori</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContent}
              >
                {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryChip,
                      category === key && styles.categoryChipActive,
                    ]}
                    onPress={() => {
                      setCategory(key as PostCategory);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === key && styles.categoryChipTextActive,
                      ]}
                    >
                      {emoji} {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Options */}
            <View style={styles.section}>
              <Text style={styles.label}>Seçenekler</Text>

              <TouchableOpacity
                style={[styles.optionRow, isAnonymous && styles.optionRowActive]}
                onPress={() => setIsAnonymous(!isAnonymous)}
              >
                <View style={[styles.optionCheckbox, isAnonymous && styles.optionCheckboxActive]}>
                  {isAnonymous && <Check size={16} color={colors.primary} />}
                </View>
                <Text style={[styles.optionText, isAnonymous && styles.optionTextActive]}>
                  Anonim paylaş
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionRow, isSpoiler && styles.optionRowActive]}
                onPress={() => setIsSpoiler(!isSpoiler)}
              >
                <View style={[styles.optionCheckbox, isSpoiler && styles.optionCheckboxActive]}>
                  {isSpoiler && <Check size={16} color={colors.primary} />}
                </View>
                <Text style={[styles.optionText, isSpoiler && styles.optionTextActive]}>
                  Spoiler içeri
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Anonim paylaş yaparak kullanıcı adını gizleyebilirsin.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !isDirty}
            >
              <LinearGradient
                colors={gradients.premiumShimmer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Save size={18} color={colors.white} />
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
