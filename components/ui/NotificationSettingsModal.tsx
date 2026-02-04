import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  X,
  Heart,
  Zap,
  MessageCircle,
  Star,
  MessageSquare,
  Eye,
  BarChart3,
  RotateCcw,
  Moon,
} from "lucide-react-native";
import {
  colors,
  borderRadius,
  spacing,
  fontSize,
  glass,
  shadows,
} from "@/constants/theme";
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CATEGORIES,
  updateNotificationPreferences,
  resetNotificationPreferences,
} from "@/lib/notifications";

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentPreferences?: NotificationPreferences | null;
  onSave?: (preferences: NotificationPreferences) => void;
}

// Toggle Switch component
function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: glass.border, true: colors.primary }}
      thumbColor={value ? colors.white : colors.textMuted}
      ios_backgroundColor={glass.border}
    />
  );
}

export function NotificationSettingsModal({
  visible,
  onClose,
  userId,
  currentPreferences,
  onSave,
}: NotificationSettingsModalProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    currentPreferences || DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
  }, [currentPreferences]);

  const handleToggle = (
    category: keyof NotificationPreferences,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateNotificationPreferences(userId, preferences);
      if (success) {
        if (onSave) {
          onSave(preferences);
        }
        onClose();
        Alert.alert("Başarılı", "Bildirim tercihleri kaydedildi.");
      } else {
        Alert.alert("Hata", "Bildirim tercihleri kaydedilemedi.");
      }
    } catch (error) {
      Alert.alert("Hata", "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Sıfırla",
      "Tüm bildirim tercihlerini varsayılan ayarlara döndürmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              const success = await resetNotificationPreferences(userId);
              if (success) {
                setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
                Alert.alert("Başarılı", "Bildirim tercihleri sıfırlandı.");
              }
            } catch (error) {
              Alert.alert("Hata", "Bir hata oluştu.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const categoryIcons: Record<string, React.ElementType> = {
    likes: Heart,
    matches: Zap,
    messages: MessageCircle,
    super_likes: Star,
    comments: MessageSquare,
    profile_views: Eye,
    weekly: BarChart3,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bell size={24} color={colors.primary} />
              <Text style={styles.title}>Bildirim Ayarları</Text>
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
            {/* General Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genel Ayarlar</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Bell size={20} color={colors.primary} />
                  <Text style={styles.settingLabel}>Push Bildirimler</Text>
                </View>
                <ToggleSwitch
                  value={preferences.push_enabled}
                  onValueChange={(value) => handleToggle("push_enabled", value)}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <MessageCircle size={20} color={colors.primary} />
                  <Text style={styles.settingLabel}>E-posta Bildirimleri</Text>
                </View>
                <ToggleSwitch
                  value={preferences.email_enabled}
                  onValueChange={(value) => handleToggle("email_enabled", value)}
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Moon size={20} color={colors.primary} />
                  <View>
                    <Text style={styles.settingLabel}>Sessiz Saatler</Text>
                    <Text style={styles.settingDescription}>
                      Belirli saatlerde bildirim alma
                    </Text>
                  </View>
                </View>
                <ToggleSwitch
                  value={preferences.quiet_hours_enabled}
                  onValueChange={(value) => handleToggle("quiet_hours_enabled", value)}
                />
              </View>

              {preferences.quiet_hours_enabled && (
                <View style={styles.quietHoursContainer}>
                  <Text style={styles.quietHoursLabel}>
                    {preferences.quiet_hours_start || "22:00"} -{" "}
                    {preferences.quiet_hours_end || "09:00"}
                  </Text>
                  <Text style={styles.quietHoursDescription}>
                    Bu saatler arasında push bildirim almazsınız
                  </Text>
                </View>
              )}
            </View>

            {/* Category Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bildirim Türleri</Text>

              {Object.entries(NOTIFICATION_CATEGORIES).map(
                ([key, category]) => {
                  const Icon = categoryIcons[key];
                  return (
                    <View key={key} style={styles.categoryContainer}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryIcon}>{category.icon}</Text>
                          <Text style={styles.categoryLabel}>{category.label}</Text>
                        </View>
                      </View>

                      {category.preferences.map((prefKey) => {
                        const [channel, type] = prefKey.split("_");
                        const channelLabel =
                          channel === "push"
                            ? "Push"
                            : channel === "inapp"
                            ? "Uygulama"
                            : "E-posta";

                        return (
                          <View key={prefKey} style={styles.settingRow}>
                            <Text style={styles.settingLabel}>{channelLabel}</Text>
                            <ToggleSwitch
                              value={preferences[prefKey] as boolean}
                              onValueChange={(value) => handleToggle(prefKey, value)}
                              disabled={
                                (channel === "push" && !preferences.push_enabled) ||
                                (channel === "email" && !preferences.email_enabled)
                              }
                            />
                          </View>
                        );
                      })}
                    </View>
                  );
                }
              )}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              disabled={saving}
            >
              <RotateCcw size={18} color={colors.warning} />
              <Text style={styles.resetButtonText}>Varsayılanlara Dön</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={["#A855F7", "#F472B6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: glass.border,
    maxHeight: "85%",
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentScroll: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  settingRowBorder: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  categoryContainer: {
    backgroundColor: glass.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
  },
  categoryHeader: {
    marginBottom: spacing.sm,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryIcon: {
    fontSize: fontSize.xl,
  },
  categoryLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  quietHoursContainer: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  quietHoursLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.primary,
  },
  quietHoursDescription: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: `${colors.warning}50`,
  },
  resetButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.warning,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  saveGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.white,
  },
});
