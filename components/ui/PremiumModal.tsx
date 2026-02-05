import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Crown,
  Infinity,
  RotateCcw,
  Zap,
  Eye,
  Star,
  Heart,
  Shield,
  X,
} from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, shadows, gradients } from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: (plan: "premium" | "gold") => void;
  currentPlan?: "free" | "premium" | "gold";
}

const SCREEN_WIDTH = Dimensions.get("window").width;

const PREMIUM_FEATURES = [
  { icon: Infinity, title: "Sınırsız Beğeni", description: "Günde 20 beğeni limiti yok" },
  { icon: RotateCcw, title: "Geri Alma", description: "Yanlış swipe'ı geri al" },
  { icon: Zap, title: "Boost", description: "30 dakika öne çıkma" },
  { icon: Eye, title: "Kim Beğendi", description: "Günde 3 profil görüntüleme" },
];

const GOLD_FEATURES = [
  ...PREMIUM_FEATURES,
  { icon: Star, title: "Super Match", description: "Günde 3 mesajlı eşleşme" },
  { icon: Heart, title: "Profil Görüntüleme", description: "Kim profiline baktı" },
  { icon: Shield, title: "Priority Matching", description: "Öncelikli eşleşme" },
];

export function PremiumModal({ visible, onClose, onUpgrade, currentPlan = "free" }: PremiumModalProps) {
  const handleUpgrade = (plan: "premium" | "gold") => {
    if (onUpgrade) {
      onUpgrade(plan);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Crown size={32} color={colors.primary} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>ENTRIKA PREMIUM</Text>
              <Text style={styles.subtitle}>Eşleşme şansını artır</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentScroll}
          >
            {/* Premium Plan */}
            <TouchableOpacity
              style={styles.planCard}
              onPress={() => handleUpgrade("premium")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[`${colors.primary}20`, `${colors.primary}10`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.planGradient}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>PREMIUM</Text>
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>₺99/ay</Text>
                  </View>
                </View>

                <View style={styles.featuresList}>
                  {PREMIUM_FEATURES.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View style={styles.featureIconContainer}>
                        <feature.icon size={18} color={colors.primary} />
                      </View>
                      <View style={styles.featureTextContainer}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => handleUpgrade("premium")}
                >
                  <LinearGradient
                    colors={gradients.premiumShimmer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeGradient}
                  >
                    <Text style={styles.upgradeButtonText}>Yükselt</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>

            {/* Gold Plan */}
            <TouchableOpacity
              style={styles.planCard}
              onPress={() => handleUpgrade("gold")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[`${colors.accent}20`, `${colors.accent}10`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.planGradient}
              >
                <View style={styles.planHeader}>
                  <View style={styles.goldHeaderContainer}>
                    <Text style={[styles.planName, styles.goldText]}>GOLD</Text>
                    <Crown size={16} color={colors.warning} style={styles.goldIcon} />
                  </View>
                  <View style={[styles.planBadge, styles.goldBadge]}>
                    <Text style={[styles.planBadgeText, styles.goldText]}>₺199/ay</Text>
                  </View>
                </View>

                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
                </View>

                <View style={styles.featuresList}>
                  {GOLD_FEATURES.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View
                        style={[
                          styles.featureIconContainer,
                          index >= PREMIUM_FEATURES.length && styles.featureIconContainerGold,
                        ]}
                      >
                        <feature.icon
                          size={18}
                          color={index >= PREMIUM_FEATURES.length ? colors.accent : colors.primary}
                        />
                      </View>
                      <View style={styles.featureTextContainer}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                      </View>
                      {index >= PREMIUM_FEATURES.length && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>YENİ</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => handleUpgrade("gold")}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeGradient}
                  >
                    <Text style={styles.upgradeButtonText}>Yükselt</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Abonelik istediğin zaman iptal edilebilir. Premium özellikler abonelik süresi boyunca geçerlidir.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  container: {
    width: "100%",
    maxHeight: SCREEN_WIDTH * 1.6,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: glassFallback.border,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: glassFallback.border,
    gap: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentScroll: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  planCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  planGradient: {
    padding: spacing.lg,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  goldHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  planName: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.primary,
  },
  goldText: {
    color: colors.warning,
  },
  goldIcon: {},
  planBadge: {
    backgroundColor: `${colors.primary}30`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  goldBadge: {
    backgroundColor: `${colors.warning}30`,
  },
  planBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
    color: colors.primary,
  },
  popularBadge: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  popularBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "bold",
    color: colors.white,
  },
  featuresList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconContainerGold: {
    backgroundColor: `${colors.accent}20`,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  featureDescription: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  newBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "bold",
    color: colors.white,
  },
  upgradeButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  upgradeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  upgradeButtonText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.white,
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
    textAlign: "center",
  },
});
