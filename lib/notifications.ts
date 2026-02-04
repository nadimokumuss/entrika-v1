import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Foreground bildirim davranisi: ses + banner goster
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// Android notification channel'lari olustur
export async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("messages", {
      name: "Mesajlar",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("matches", {
      name: "Eslesmeler",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("default", {
      name: "Genel",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }
}

// Push notification izni al ve Expo Push Token dondur
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Fiziksel cihaz kontrolu (simulator'da calismaz)
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Mevcut izin durumunu kontrol et
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Izin verilmemisse, iste
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission denied");
    return null;
  }

  // Expo Push Token al
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: require("expo-constants").default?.expoConfig?.extra?.eas?.projectId,
  });

  return tokenData.data;
}

// Token'i Supabase push_tokens tablosuna kaydet
export async function savePushToken(userId: string, token: string) {
  const platform = Platform.OS as "ios" | "android" | "web";

  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        is_active: true,
      },
      {
        onConflict: "user_id,token",
      }
    );

  if (error) {
    console.error("Error saving push token:", error);
  }
}

// Logout'ta kullanicinin tum tokenlarini deaktif et
export async function deactivatePushTokens(userId: string) {
  const { error } = await supabase
    .from("push_tokens")
    .update({ is_active: false })
    .eq("user_id", userId);

  if (error) {
    console.error("Error deactivating push tokens:", error);
  }
}

// ============================================================
// BİLDİRİM TERCİHLERİ
// ============================================================

// Bildirim tipleri
export type NotificationType =
  | "like"
  | "match"
  | "message"
  | "super_like"
  | "comment"
  | "profile_view"
  | "follow"
  | "mention"
  | "system";

// Bildirim tercihi tipleri
export interface NotificationPreferences {
  // Push notification preferences
  push_likes: boolean;
  push_matches: boolean;
  push_messages: boolean;
  push_super_likes: boolean;
  push_comments: boolean;
  push_profile_views: boolean;

  // In-app notification preferences
  inapp_likes: boolean;
  inapp_matches: boolean;
  inapp_messages: boolean;
  inapp_super_likes: boolean;
  inapp_comments: boolean;
  inapp_profile_views: boolean;

  // Email notification preferences
  email_likes: boolean;
  email_matches: boolean;
  email_messages: boolean;
  email_weekly_digest: boolean;

  // General settings
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_enabled: boolean;
}

// Varsayılan bildirim tercihleri
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  push_likes: true,
  push_matches: true,
  push_messages: true,
  push_super_likes: true,
  push_comments: true,
  push_profile_views: false,

  inapp_likes: true,
  inapp_matches: true,
  inapp_messages: true,
  inapp_super_likes: true,
  inapp_comments: true,
  inapp_profile_views: false,

  email_likes: false,
  email_matches: true,
  email_messages: false,
  email_weekly_digest: true,

  push_enabled: true,
  email_enabled: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
  quiet_hours_enabled: false,
};

// Bildirim kategorileri (UI için gruplandırma)
export const NOTIFICATION_CATEGORIES = {
  likes: {
    label: "Beğeniler",
    icon: "❤️",
    preferences: ["push_likes", "inapp_likes", "email_likes"] as const,
  },
  matches: {
    label: "Eşleşmeler",
    icon: "⚡",
    preferences: ["push_matches", "inapp_matches", "email_matches"] as const,
  },
  messages: {
    label: "Mesajlar",
    icon: "💬",
    preferences: ["push_messages", "inapp_messages", "email_messages"] as const,
  },
  super_likes: {
    label: "Super Beğeni",
    icon: "⭐",
    preferences: ["push_super_likes", "inapp_super_likes"] as const,
  },
  comments: {
    label: "Yorumlar",
    icon: "💭",
    preferences: ["push_comments", "inapp_comments"] as const,
  },
  profile_views: {
    label: "Profil Görüntülemeleri",
    icon: "👁️",
    preferences: ["push_profile_views", "inapp_profile_views"] as const,
  },
  weekly: {
    label: "Haftalık Özet",
    icon: "📊",
    preferences: ["email_weekly_digest"] as const,
  },
};

/**
 * Kullanıcının bildirim tercihlerini getir
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Veriyi düzelt (id, user_id, created_at, updated_at alanlarını çıkar)
    const {
      id,
      user_id: _,
      created_at: __,
      updated_at: ___,
      ...preferences
    } = data as any;

    return preferences as NotificationPreferences;
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return null;
  }
}

/**
 * Bildirim tercihlerini güncelle
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_notification_preferences")
      .update(preferences)
      .eq("user_id", userId);

    return !error;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return false;
  }
}

/**
 * Tüm bildirim tercihlerini sıfırla (varsayılana dön)
 */
export async function resetNotificationPreferences(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_notification_preferences")
      .update(DEFAULT_NOTIFICATION_PREFERENCES)
      .eq("user_id", userId);

    return !error;
  } catch (error) {
    console.error("Error resetting notification preferences:", error);
    return false;
  }
}

/**
 * Okunmamış bildirim sayısını getir (türe göre filtreleme ile)
 */
export async function getUnreadNotificationCount(
  userId: string,
  type?: NotificationType
): Promise<number> {
  try {
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (type) {
      query = query.eq("type", type);
    }

    const { count, error } = await query;

    return count || 0;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

/**
 * Bildirimi okundu olarak işaretle
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    return !error;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

/**
 * Tüm bildirimleri okundu olarak işaretle
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    return !error;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

/**
 * Bildirimi sil
 */
export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    return !error;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
}

/**
 * Okunmuş bildirimleri temizle (eski bildirimleri sil)
 */
export async function clearReadNotifications(
  userId: string,
  olderThanDays: number = 30
): Promise<boolean> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", userId)
      .eq("is_read", true)
      .lt("created_at", cutoffDate.toISOString());

    return !error;
  } catch (error) {
    console.error("Error clearing read notifications:", error);
    return false;
  }
}

/**
 * Bildirim sessiz saatlerinde mi kontrol et
 */
export function isInQuietHours(
  preferences: NotificationPreferences
): boolean {
  if (!preferences.quiet_hours_enabled) {
    return false;
  }

  if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
    return false;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const startTime = preferences.quiet_hours_start;
  const endTime = preferences.quiet_hours_end;

  // Basit karşılaştırma (daha karmaşık senaryolar için geliştirilebilir)
  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Gece yarısını geçen durum (örn: 22:00 - 09:00)
    return currentTime >= startTime || currentTime < endTime;
  }
}

/**
 * Bildirim gönderme kararı ver (tercihlere ve sessiz saatlere göre)
 */
export function shouldSendNotification(
  preferences: NotificationPreferences,
  type: NotificationType,
  channel: "push" | "inapp" | "email"
): boolean {
  // Genel kontrol
  if (channel === "push" && !preferences.push_enabled) return false;
  if (channel === "email" && !preferences.email_enabled) return false;

  // Sessiz saat kontrolü (sadece push için)
  if (channel === "push" && isInQuietHours(preferences)) {
    return false;
  }

  // Tip bazlı kontrol
  const typeKeyMap: Record<NotificationType, string> = {
    like: `${channel}_likes`,
    match: `${channel}_matches`,
    message: `${channel}_messages`,
    super_like: `${channel}_super_likes`,
    comment: `${channel}_comments`,
    profile_view: `${channel}_profile_views`,
    follow: `${channel}_likes`, // follow için likes kullan
    mention: `${channel}_comments`, // mention için comments kullan
    system: `${channel}_matches`, // system için matches kullan
  };

  const preferenceKey = typeKeyMap[type] as keyof NotificationPreferences;
  return preferences[preferenceKey] as boolean;
}
