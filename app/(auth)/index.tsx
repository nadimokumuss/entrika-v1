import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { colors, spacing, fontSize, gradients } from "@/constants/theme";
import GradientBackground from "@/components/ui/GradientBackground";
import GradientButton from "@/components/ui/GradientButton";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableOpacity } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <GradientBackground variant="auth">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Logo */}
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
            <Text style={styles.subtitle}>Tanışmadan Önce Tanı</Text>
          </View>

          {/* Butonlar */}
          <View style={styles.buttonContainer}>
            <GradientButton
              onPress={() => router.push("/(auth)/register")}
              label="Hesap Oluştur"
            />

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                Zaten hesabın var mı? <Text style={styles.loginButtonBold}>Giriş Yap</Text>
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
  buttonContainer: {
    width: "100%",
  },
  loginButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  loginButtonText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
  },
  loginButtonBold: {
    color: colors.primary,
    fontWeight: "600",
  },
});
