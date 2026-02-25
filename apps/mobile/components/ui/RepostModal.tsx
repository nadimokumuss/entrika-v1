import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Send } from "lucide-react-native";
import { borderRadius, spacing, fontSize } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, type PostCategory } from "@/constants/categories";
import GlassCard from "./GlassCard";

interface RepostModalProps {
  visible: boolean;
  onClose: () => void;
  originalPost: {
    id: string;
    content: string;
    category: PostCategory;
    is_anonymous: boolean;
    profiles?: { username: string; avatar_url: string } | null;
  };
}

export function RepostModal({ visible, onClose, originalPost }: RepostModalProps) {
  const { colors, glass, gradients } = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>(originalPost.category);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  const handleRepost = async () => {
    if (!user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        content: content.trim() || `"${originalPost.content.substring(0, 100)}${originalPost.content.length > 100 ? "..." : ""}"`,
        category,
        is_anonymous: isAnonymous,
        repost_of_id: originalPost.id,
      });

      if (error) throw error;

      Alert.alert("Basarili", "Alintilama yapildi.");
      setContent("");
      onClose();
    } catch (e: any) {
      console.error("Repost error:", e);
      Alert.alert("Hata", e.message || "Alintilama yapilamadi.");
    } finally {
      setSending(false);
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
      marginTop: 60,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: glass.border,
    },
    backButton: {
      padding: spacing.sm,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: "bold",
      color: colors.text,
    },
    sendButton: {
      padding: spacing.sm,
    },
    scrollContent: {
      padding: spacing.xl,
    },
    quoteCard: {
      marginBottom: spacing.lg,
    },
    quoteCardInner: {
      padding: spacing.md,
    },
    quoteLabel: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    quoteAuthor: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: "600",
      marginBottom: spacing.xs,
    },
    quoteContent: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    label: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      fontWeight: "600",
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
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
      minHeight: 80,
      textAlignVertical: "top",
    },
    counter: {
      color: colors.textMuted,
      fontSize: fontSize.xs,
      textAlign: "right",
      marginTop: spacing.xs,
    },
    categoriesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
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
      fontSize: fontSize.xs,
      color: colors.textLight,
    },
    categoryChipTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    anonRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.lg,
    },
    anonLabel: {
      color: colors.textLight,
      fontSize: fontSize.sm,
      marginLeft: spacing.sm,
    },
    switch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
  }), [colors, glass]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Alintila</Text>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleRepost}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Send size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Original Post Quote */}
            <GlassCard style={styles.quoteCard}>
              <View style={styles.quoteCardInner}>
                <Text style={styles.quoteLabel}>Alintilanan post</Text>
                <Text style={styles.quoteAuthor}>
                  {originalPost.is_anonymous
                    ? "Anonim"
                    : `@${originalPost.profiles?.username || "?"}`}
                </Text>
                <Text style={styles.quoteContent} numberOfLines={4}>
                  {originalPost.content}
                </Text>
              </View>
            </GlassCard>

            {/* Comment TextInput */}
            <Text style={styles.label}>Yorumun (opsiyonel)</Text>
            <TextInput
              style={styles.textInput}
              value={content}
              onChangeText={setContent}
              placeholder="Bu post hakkinda ne dusunuyorsun?"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
            <Text style={styles.counter}>{content.length}/500</Text>

            {/* Category Selection */}
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.categoriesRow}>
              {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryChip,
                    category === key && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(key as PostCategory)}
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
            </View>

            {/* Anonymous Toggle */}
            <View style={styles.anonRow}>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                style={styles.switch}
              />
              <Text style={styles.anonLabel}>Anonim paylas</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
