import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, Sparkles } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function GatekeeperScreen() {
  const router = useRouter();
  const { validateInviteCode } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock modda çalışmak için (Supabase bağlı değilken)
  const MOCK_MODE = true;
  const mockValidCodes = ["ENTRIKA2024", "HOSGELDIN", "DAVET123"];

  const handleSubmit = async () => {
    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      setError("Davetiye kodu gerekli");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (MOCK_MODE) {
        // Mock mode - Supabase olmadan test için
        if (mockValidCodes.includes(code)) {
          await AsyncStorage.setItem("pendingInviteCode", code);
          router.push("/(auth)/register");
        } else {
          setError("Geçersiz davetiye kodu");
        }
      } else {
        // Production mode - Supabase ile
        const { valid, error: validateError } = await validateInviteCode(code);

        if (validateError) {
          setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } else if (valid) {
          await AsyncStorage.setItem("pendingInviteCode", code);
          router.push("/(auth)/register");
        } else {
          setError("Geçersiz veya kullanılmış davetiye kodu");
        }
      }
    } catch (err) {
      setError("Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo Alanı */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Sparkles size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>ENTRİKA</Text>
          <Text style={styles.subtitle}>Tanışmadan Önce Tanı</Text>
        </View>

        {/* Davetiye Kodu Girişi */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="Davetiye Kodun"
              placeholderTextColor={colors.textMuted}
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text);
                setError("");
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Kapıyı Aç</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Alt Bilgi */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sadece davetliler girebilir.{"\n"}
            Bir arkadaşından davetiye kodu al.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              Zaten hesabın var mı? <Text style={styles.loginLinkBold}>Giriş Yap</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxxl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  footer: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
  },
  footerText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
  },
  loginLink: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  loginLinkText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: "600",
  },
});
