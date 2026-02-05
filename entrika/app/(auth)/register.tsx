import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, AtSign, ChevronLeft, Mail } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import GradientBackground from "@/components/ui/GradientBackground";
import GradientButton from "@/components/ui/GradientButton";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

type Gender = "female" | "male";

const FEMALE_AVATARS = [
  "https://api.dicebear.com/7.x/lorelei/png?seed=luna",
  "https://api.dicebear.com/7.x/lorelei/png?seed=stella",
  "https://api.dicebear.com/7.x/lorelei/png?seed=violet",
  "https://api.dicebear.com/7.x/lorelei/png?seed=rose",
  "https://api.dicebear.com/7.x/lorelei/png?seed=jade",
  "https://api.dicebear.com/7.x/lorelei/png?seed=sophie",
];

const MALE_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/png?seed=jack",
  "https://api.dicebear.com/7.x/avataaars/png?seed=alex",
  "https://api.dicebear.com/7.x/avataaars/png?seed=max",
  "https://api.dicebear.com/7.x/avataaars/png?seed=leo",
  "https://api.dicebear.com/7.x/avataaars/png?seed=sam",
  "https://api.dicebear.com/7.x/avataaars/png?seed=ben",
];

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [gender, setGender] = useState<Gender | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const avatarOptions = gender === "female" ? FEMALE_AVATARS : gender === "male" ? MALE_AVATARS : [];

  const handleGenderSelect = (selectedGender: Gender) => {
    setGender(selectedGender);
    setSelectedAvatar(selectedGender === "female" ? FEMALE_AVATARS[0] : MALE_AVATARS[0]);
  };

  const handleRegister = async () => {
    if (!gender) {
      setError("Cinsiyet seçimi gerekli");
      return;
    }
    if (!selectedAvatar) {
      setError("Avatar seçimi gerekli");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Geçerli bir e-posta adresi gerekli");
      return;
    }
    if (!username.trim()) {
      setError("Kullanıcı adı gerekli");
      return;
    }
    if (username.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalı");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("[REGISTER] signUp cagriliyor:", { email, username, gender });
      const { error: signUpError } = await signUp(
        email,
        password,
        username,
        gender,
        selectedAvatar
      );

      console.log("[REGISTER] signUp sonucu:", signUpError ? signUpError.message : "basarili");

      if (signUpError) {
        setError(signUpError.message);
      }
    } catch (err: any) {
      console.error("[REGISTER] CATCH hatasi:", err);
      setError(err.message || "Bir hata olustu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground variant="auth">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Baslik */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Aramıza Hoş Geldin</Text>
              <Text style={styles.subtitle}>Kimliğini oluştur ve topluluğa katıl.</Text>
            </View>

            {/* Cinsiyet Secimi */}
            <View style={styles.genderSection}>
              <Text style={styles.sectionLabel}>Cinsiyetini Seç</Text>
              <View style={styles.genderOptions}>
                <TouchableOpacity
                  onPress={() => handleGenderSelect("female")}
                  style={[
                    styles.genderOption,
                    gender === "female" && styles.genderOptionSelected,
                  ]}
                >
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text
                    style={[
                      styles.genderText,
                      gender === "female" && styles.genderTextSelected,
                    ]}
                  >
                    Kadın
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleGenderSelect("male")}
                  style={[
                    styles.genderOption,
                    gender === "male" && styles.genderOptionSelected,
                  ]}
                >
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text
                    style={[
                      styles.genderText,
                      gender === "male" && styles.genderTextSelected,
                    ]}
                  >
                    Erkek
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Avatar Secimi */}
            {gender && (
              <View style={styles.avatarSection}>
                <Text style={styles.sectionLabel}>Avatar Seç</Text>
                <View style={styles.avatarGrid}>
                  {avatarOptions.map((avatar, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedAvatar(avatar)}
                      style={[
                        styles.avatarOption,
                        selectedAvatar === avatar && styles.avatarSelected,
                      ]}
                    >
                      <Image source={{ uri: avatar }} style={styles.avatarImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Form */}
            <View>
              <View style={styles.inputContainer}>
                <Mail size={20} color={colors.primary} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta Adresi"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text.toLowerCase().trim());
                    setError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <AtSign size={20} color={colors.primary} />
                <TextInput
                  style={styles.input}
                  placeholder="Kullanıcı Adı"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                    setError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={colors.primary} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre (en az 6 karakter)"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError("");
                  }}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <GradientButton
                onPress={handleRegister}
                label="Topluluğa Katıl"
                loading={isLoading}
                disabled={isLoading}
                style={{ marginTop: spacing.lg }}
              />
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 64,
    paddingBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxxl,
  },
  titleContainer: {
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  genderSection: {
    marginBottom: spacing.xxl,
  },
  genderOptions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  genderOption: {
    flex: 1,
    backgroundColor: glassFallback.background,
    borderWidth: 2,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  genderEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  genderText: {
    color: colors.textLight,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  genderTextSelected: {
    color: colors.primary,
  },
  avatarSection: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    color: colors.textLight,
    marginBottom: spacing.lg,
    fontWeight: "500",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  avatarSelected: {
    borderColor: colors.primary,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.borderLight,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    color: colors.text,
    marginLeft: spacing.md,
    fontSize: fontSize.md,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
});
