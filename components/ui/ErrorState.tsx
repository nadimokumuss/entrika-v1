import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AlertOctagon, RefreshCw, WifiOff, ServerCrash } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, gradients, shadows } from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
};

interface ErrorStateProps {
  type: "network" | "server" | "auth" | "not-found" | "general";
  message?: string;
  onRetry?: () => void;
  style?: any;
}

const ERROR_STATES = {
  network: {
    icon: WifiOff,
    title: "Bağlantı Hatası",
    description: "İnternet bağlantını kontrol et ve tekrar dene",
    actionText: "Tekrar Dene",
  },
  server: {
    icon: ServerCrash,
    title: "Sunucu Hatası",
    description: "Bir şeyler ters gitti. Tekrar deneyelim mi?",
    actionText: "Tekrar Dene",
  },
  auth: {
    icon: AlertOctagon,
    title: "Oturum Süresi Doldu",
    description: "Güvenliğini sağlamak için tekrar giriş yapmalısın",
    actionText: "Giriş Yap",
    actionRoute: "/(auth)/login",
  },
  "not-found": {
    icon: AlertOctagon,
    title: "Sayfa Bulunamadı",
    description: "Aradığın sayfa mevcut değil",
    actionText: "Ana Sayfaya Git",
    actionRoute: "/",
  },
  general: {
    icon: AlertOctagon,
    title: "Bir Hata Oluştu",
    description: "Beklenmeden bir sorunla karşılaştık",
    actionText: "Tekrar Dene",
  },
};

export function ErrorState({ type, message, onRetry, style }: ErrorStateProps) {
  const router = useRouter();
  const config = ERROR_STATES[type];
  const Icon = config.icon;

  const handleAction = () => {
    if (onRetry) {
      onRetry();
    } else if (config.actionRoute) {
      router.push(config.actionRoute);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Error Glow Effect */}
      <View style={styles.errorGlowContainer}>
        <View style={styles.errorGlow} />
      </View>

      {/* Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconRing}>
          <Icon size={48} color={colors.danger} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{config.title}</Text>

      {/* Description */}
      <Text style={styles.description}>
        {message || config.description}
      </Text>

      {/* Retry Button */}
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleAction}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.danger, "#DC2626"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.retryGradient}
        >
          <RefreshCw size={18} color={colors.white} style={styles.retryIcon} />
          <Text style={styles.retryText}>{config.actionText}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Error Code (Optional) */}
      <View style={styles.errorCodeContainer}>
        <Text style={styles.errorCode}>ERROR_{type.toUpperCase().replace("-", "_")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    minHeight: 400,
  },
  errorGlowContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  errorGlow: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${colors.danger}10`,
    borderWidth: 1,
    borderColor: `${colors.danger}20`,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: glassFallback.background,
    borderWidth: 1,
    borderColor: glassFallback.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  retryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  retryIcon: {
    marginRight: spacing.xs,
  },
  retryText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  errorCodeContainer: {
    position: "absolute",
    bottom: spacing.xl,
  },
  errorCode: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: "monospace",
  },
});
