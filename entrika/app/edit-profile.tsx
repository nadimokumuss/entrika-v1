import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Save, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, borderRadius, spacing, fontSize, glass, gradients, shadows } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import GradientBackground from "@/components/ui/GradientBackground";

const glassFallback = glass || {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const BIO_MAX_LENGTH = 150;

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const bioCount = bio.length;

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) return "Kullanıcı adı boş olamaz";
    if (value.length < USERNAME_MIN_LENGTH) return `En az ${USERNAME_MIN_LENGTH} karakter`;
    if (value.length > USERNAME_MAX_LENGTH) return `En fazla ${USERNAME_MAX_LENGTH} karakter`;
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Sadece harf, rakam ve _";
    if (value.startsWith("_") || value.endsWith("_")) return "_ başta veya sonda olamaz";
    return null;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError(null);
  };

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    const error = validateUsername(trimmedUsername);
    if (error) {
      setUsernameError(error);
      return;
    }

    setSaving(true);
    try {
      // Username değişiyorsa unique kontrolü
      if (trimmedUsername !== profile?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", trimmedUsername)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw checkError;
        }

        if (existingUser) {
          setUsernameError("Bu kullanıcı adı zaten alınmış");
          setSaving(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: trimmedUsername,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      await refreshProfile();
      router.back();
    } catch (error: any) {
      console.error("Profile update error:", error);
      Alert.alert("Hata", error.message || "Profil güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <GradientBackground variant="screen">
        <SafeAreaView style={styles.container} edges={["top"]}>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profili Düzenle</Text>
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Save size={18} color={colors.primary} />
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Önizleme */}
            <View style={styles.avatarPreview}>
              <LinearGradient
                colors={gradients.premiumShimmer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarEmoji}>
                      {profile.gender === "female" ? "👩" : "👨"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
              <Text style={styles.avatarNote}>
                Avatarı değiştirmek için profil sayfasına git
              </Text>
            </View>

            {/* Username Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
              <View
                style={[
                  styles.inputContainer,
                  usernameError && styles.inputContainerError,
                ]}
              >
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="kullanici_adi"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={USERNAME_MAX_LENGTH}
                  editable={!saving}
                />
              </View>
              {usernameError ? (
                <Text style={styles.errorText}>{usernameError}</Text>
              ) : (
                <Text style={styles.hintText}>
                  {username.length}/{USERNAME_MAX_LENGTH}
                </Text>
              )}
            </View>

            {/* Bio Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Hakkında</Text>
              <View style={styles.bioContainer}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Kendinden bahset..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  maxLength={BIO_MAX_LENGTH}
                  editable={!saving}
                  textAlignVertical="top"
                />
                <Text style={styles.bioCount}>{bioCount}/{BIO_MAX_LENGTH}</Text>
              </View>
              <Text style={styles.hintText}>
                İlgilerini, hobilerini veya ne aradığını yazabilirsin.
              </Text>
            </View>

            {/* Bilgi Kartı */}
            <View style={styles.infoCard}>
              <View style={styles.infoDot} />
              <Text style={styles.infoText}>
                Kullanıcı adın herkes tarafından görülebilir. Bio alanı
                profilinde ve değerlendirmelerinde gösterilir.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: glassFallback.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: spacing.md,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}20`,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.xs,
    fontSize: fontSize.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  avatarPreview: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: glassFallback.background,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarNote: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.md,
    textAlign: "center",
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  inputContainerError: {
    borderColor: colors.danger,
  },
  atSymbol: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  bioContainer: {
    position: "relative",
  },
  bioInput: {
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 100,
    lineHeight: 22,
  },
  bioCount: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.md,
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    color: colors.textLight,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
});
