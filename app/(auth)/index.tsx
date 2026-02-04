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
import { colors, borderRadius, spacing, fontSize, glass, gradients } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GradientBackground from "@/components/ui/GradientBackground";
import GradientButton from "@/components/ui/GradientButton";
import { LinearGradient } from "expo-linear-gradient";

export default function GatekeeperScreen() {
  const router = useRouter();
  const { validateInviteCode } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      setError("Davetiye kodu gerekli");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { valid, error: validateError } = await validateInviteCode(code);

      if (validateError) {
        setError("Hata: " + (validateError.message || "Bilinmeyen hata"));
      } else if (valid) {
        await AsyncStorage.setItem("pendingInviteCode", code);
        router.push("/(auth)/register");
      } else {
        setError("Gecersiz davetiye kodu");
      }
    } catch (err: any) {
      setError("Hata: " + (err?.message || "Bilinmeyen hata"));
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
          {/* Logo Alani */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={gradients.premiumShimmer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Sparkles size={40} color={colors.white} />
            </LinearGradient>
            <Text style={styles.title}>ENTRIKA</Text>
            <Text style={styles.subtitle}>Tanismadan Once Tani</Text>
          </View>

          {/* Davetiye Kodu Girisi */}
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

            <GradientButton
              onPress={handleSubmit}
              label="Kapiyi Ac"
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          {/* Alt Bilgi */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Sadece davetliler girebilir.{"\n"}
              Bir arkadasindan davetiye kodu al.
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Zaten hesabin var mi? <Text style={styles.loginLinkBold}>Giris Yap</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
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
