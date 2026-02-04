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
