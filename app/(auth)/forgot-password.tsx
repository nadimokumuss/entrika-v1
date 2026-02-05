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
import { Mail, ChevronLeft, KeyRound } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, glass, gradients } from "@/constants/theme";

const glassFallback = glass || {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
import { supabase } from "@/lib/supabase";
import GradientBackground from "@/components/ui/GradientBackground";
import GradientButton from "@/components/ui/GradientButton";
import { LinearGradient } from "expo-linear-gradient";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Geçerli bir e-posta adresi gerekli");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email
      );

      if (resetError) {
        setError(resetError.message);
      } else {
        setIsSent(true);
      }
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
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
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={gradients.premiumShimmer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <KeyRound size={32} color={colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Şifremi Unuttum</Text>
            <Text style={styles.subtitle}>
              Sıfırlama bağlantısı e-postana gönderilecek
            </Text>
          </View>

          {isSent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Sıfırlama bağlantısı e-posta adresine gönderildi. Lütfen e-postanı
                kontrol et.
              </Text>
              <GradientButton
                onPress={() => router.back()}
                label="Girişe Dön"
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
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

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <GradientButton
                onPress={handleReset}
                label="Sıfırla"
                loading={isLoading}
                disabled={isLoading}
                style={{ marginTop: spacing.lg }}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxxl,
  },
  header: {
    paddingTop: 64,
    paddingBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
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
  successContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  successText: {
    color: colors.success,
    textAlign: "center",
    fontSize: fontSize.md,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
});
