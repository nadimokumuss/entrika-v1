import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  Trash2,
  Bell,
  MessageSquare,
  Heart,
  MessageCircle,
  Star,
  Info,
  Headphones,
  Shield,
  FileText,
  LogOut,
  ShieldBan,
  Edit3,
} from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, shadows } from "@/constants/theme";

const glassFallback = {
  background: "rgba(22, 22, 31, 0.6)",
  border: "rgba(255, 255, 255, 0.08)",
  borderHighlight: "rgba(168, 85, 247, 0.2)",
};
import GradientBackground from "@/components/ui/GradientBackground";
import GlassCard from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const APP_VERSION = "1.0.0";

interface NotificationPreferences {
  push_enabled: boolean;
  messages: boolean;
  matches: boolean;
  comments: boolean;
  reviews: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  push_enabled: true,
  messages: true,
  matches: true,
  comments: true,
  reviews: true,
};

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single();

      if (data?.notification_preferences) {
        setNotifPrefs({ ...DEFAULT_PREFS, ...data.notification_preferences });
      }
    } catch {
      // Use defaults
    }
  };

  const saveNotificationPreferences = async (prefs: NotificationPreferences) => {
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ notification_preferences: prefs })
        .eq("id", user.id);
    } catch (error) {
      console.error("Bildirim tercihleri kaydedilemedi:", error);
    }
  };

  const toggleNotifPref = (key: keyof NotificationPreferences) => {
    setNotifPrefs((prev) => {
      let updated: NotificationPreferences;
      if (key === "push_enabled") {
        const newVal = !prev.push_enabled;
        updated = {
          push_enabled: newVal,
          messages: newVal ? prev.messages : false,
          matches: newVal ? prev.matches : false,
          comments: newVal ? prev.comments : false,
          reviews: newVal ? prev.reviews : false,
        };
      } else {
        updated = { ...prev, [key]: !prev[key] };
      }
      saveNotificationPreferences(updated);
      return updated;
    });
  };

  // --- Hesap ---

  const handleChangeEmail = () => {
    Alert.prompt(
      "E-posta Değiştir",
      "Yeni e-posta adresinizi girin:",
      async (newEmail) => {
        if (!newEmail || !newEmail.trim()) return;
        const trimmed = newEmail.trim();
        try {
          const { error } = await supabase.auth.updateUser({ email: trimmed });
          if (error) throw error;
          Alert.alert("Başarılı", "E-posta adresiniz güncellendi. Doğrulama maili gönderilmiş olabilir.");
        } catch (error: any) {
          Alert.alert("Hata", error.message || "E-posta güncellenemedi.");
        }
      },
      "plain-text",
      user?.email || ""
    );
  };

  const handleChangePassword = () => {
    Alert.prompt(
      "Şifre Değiştir",
      "Yeni şifrenizi girin (en az 6 karakter):",
      async (newPassword) => {
        if (!newPassword || !newPassword.trim()) return;
        if (newPassword.length < 6) {
          Alert.alert("Hata", "Şifre en az 6 karakter olmalı.");
          return;
        }
        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          Alert.alert("Başarılı", "Şifreniz güncellendi.");
        } catch (error: any) {
          Alert.alert("Hata", error.message || "Şifre güncellenemedi.");
        }
      },
      "secure-text"
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı Sil",
      "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Hesabı Sil",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Son Onay",
              "Tüm verileriniz kalıcı olarak silinecek. Devam etmek istiyor musunuz?",
              [
                { text: "Vazgeç", style: "cancel" },
                {
                  text: "Evet, Sil",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const { error } = await supabase.rpc("delete_user_account");
                      if (error) throw error;
                      await signOut();
                    } catch (error: any) {
                      Alert.alert("Hata", error.message || "Hesap silinemedi.");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // --- Cikis ---

  const handleSignOut = () => {
    Alert.alert(
      "Çıkış Yap",
      "Çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const maskedEmail = () => {
    const email = user?.email || "";
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  };

  return (
    <GradientBackground variant="screen">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ayarlar</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hesap */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hesap</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity style={styles.row} onPress={() => router.push("/edit-profile")}>
                <View style={styles.rowLeft}>
                  <Edit3 size={20} color={colors.primary} />
                  <Text style={styles.rowLabel}>Profili Düzenle</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue}>@{profile?.username}</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity style={styles.row} onPress={handleChangeEmail}>
                <View style={styles.rowLeft}>
                  <Mail size={20} color={colors.primary} />
                  <Text style={styles.rowLabel}>E-posta</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue}>{maskedEmail()}</Text>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity style={styles.row} onPress={handleChangePassword}>
                <View style={styles.rowLeft}>
                  <Lock size={20} color={colors.primary} />
                  <Text style={styles.rowLabel}>Şifre Değiştir</Text>
                </View>
                <View style={styles.rowRight}>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
                <View style={styles.rowLeft}>
                  <Trash2 size={20} color={colors.danger} />
                  <Text style={[styles.rowLabel, { color: colors.danger }]}>Hesabı Sil</Text>
                </View>
                <View style={styles.rowRight}>
                  <ChevronRight size={18} color={colors.danger} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bildirimler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bildirimler</Text>
            <View style={styles.sectionCard}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Bell size={20} color={colors.primary} />
                  <Text style={styles.rowLabel}>Push Bildirimleri</Text>
                </View>
                <Switch
                  value={notifPrefs.push_enabled}
                  onValueChange={() => toggleNotifPref("push_enabled")}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={notifPrefs.push_enabled ? colors.primary : colors.textMuted}
                />
              </View>

              <View style={styles.rowDivider} />

              <View style={[styles.row, !notifPrefs.push_enabled && styles.rowDisabled]}>
                <View style={styles.rowLeft}>
                  <MessageSquare size={20} color={notifPrefs.push_enabled ? colors.textLight : colors.textMuted} />
                  <Text style={[styles.rowLabel, !notifPrefs.push_enabled && styles.rowLabelDisabled]}>
                    Mesajlar
                  </Text>
                </View>
                <Switch
                  value={notifPrefs.messages}
                  onValueChange={() => toggleNotifPref("messages")}
                  disabled={!notifPrefs.push_enabled}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={notifPrefs.messages && notifPrefs.push_enabled ? colors.primary : colors.textMuted}
                />
              </View>

              <View style={styles.rowDivider} />

              <View style={[styles.row, !notifPrefs.push_enabled && styles.rowDisabled]}>
                <View style={styles.rowLeft}>
                  <Heart size={20} color={notifPrefs.push_enabled ? colors.textLight : colors.textMuted} />
                  <Text style={[styles.rowLabel, !notifPrefs.push_enabled && styles.rowLabelDisabled]}>
                    Eşleşmeler
                  </Text>
                </View>
                <Switch
                  value={notifPrefs.matches}
                  onValueChange={() => toggleNotifPref("matches")}
                  disabled={!notifPrefs.push_enabled}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={notifPrefs.matches && notifPrefs.push_enabled ? colors.primary : colors.textMuted}
                />
              </View>

              <View style={styles.rowDivider} />

              <View style={[styles.row, !notifPrefs.push_enabled && styles.rowDisabled]}>
                <View style={styles.rowLeft}>
                  <MessageCircle size={20} color={notifPrefs.push_enabled ? colors.textLight : colors.textMuted} />
                  <Text style={[styles.rowLabel, !notifPrefs.push_enabled && styles.rowLabelDisabled]}>
                    Yorumlar & Tepkiler
                  </Text>
                </View>
                <Switch
                  value={notifPrefs.comments}
                  onValueChange={() => toggleNotifPref("comments")}
                  disabled={!notifPrefs.push_enabled}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={notifPrefs.comments && notifPrefs.push_enabled ? colors.primary : colors.textMuted}
                />
              </View>

              <View style={styles.rowDivider} />

              <View style={[styles.row, !notifPrefs.push_enabled && styles.rowDisabled]}>
                <View style={styles.rowLeft}>
                  <Star size={20} color={notifPrefs.push_enabled ? colors.textLight : colors.textMuted} />
                  <Text style={[styles.rowLabel, !notifPrefs.push_enabled && styles.rowLabelDisabled]}>
                    Değerlendirmeler
                  </Text>
                </View>
                <Switch
                  value={notifPrefs.reviews}
                  onValueChange={() => toggleNotifPref("reviews")}
                  disabled={!notifPrefs.push_enabled}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={notifPrefs.reviews && notifPrefs.push_enabled ? colors.primary : colors.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Gizlilik ve Guvenlik */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gizlilik ve Güvenlik</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push("/blocked-users")}
              >
                <View style={styles.rowLeft}>
                  <ShieldBan size={20} color={colors.danger} />
                  <Text style={styles.rowLabel}>Engellenen Kullanıcılar</Text>
                </View>
                <View style={styles.rowRight}>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hakkinda */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <View style={styles.sectionCard}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Info size={20} color={colors.textLight} />
                  <Text style={styles.rowLabel}>Uygulama Versiyonu</Text>
                </View>
                <Text style={styles.rowValue}>{APP_VERSION}</Text>
              </View>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => Linking.openURL("mailto:destek@entrika.app")}
              >
                <View style={styles.rowLeft}>
                  <Headphones size={20} color={colors.textLight} />
                  <Text style={styles.rowLabel}>Destek</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => Alert.alert("Gizlilik Politikası", "Gizlilik politikası yaklaşımda...")}
              >
                <View style={styles.rowLeft}>
                  <Shield size={20} color={colors.textLight} />
                  <Text style={styles.rowLabel}>Gizlilik Politikası</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => Alert.alert("Kullanım Şartları", "Kullanım şartları yaklaşımda...")}
              >
                <View style={styles.rowLeft}>
                  <FileText size={20} color={colors.textLight} />
                  <Text style={styles.rowLabel}>Kullanım Şartları</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cikis Yap */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={colors.white} />
            <Text style={styles.signOutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
    backgroundColor: glassFallback.background,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: glassFallback.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: glassFallback.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: fontSize.base,
    color: colors.text,
    marginLeft: spacing.md,
  },
  rowLabelDisabled: {
    color: colors.textMuted,
  },
  rowValue: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  rowDivider: {
    height: 1,
    backgroundColor: glass.border,
    marginLeft: spacing.lg + 20 + spacing.md,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  signOutButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: fontSize.md,
  },
  bottomSpacer: {
    height: 60,
  },
});
