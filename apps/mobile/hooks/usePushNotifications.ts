import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  registerForPushNotificationsAsync,
  savePushToken,
  setupNotificationChannels,
} from "@/lib/notifications";

// Valid notification routes
type NotificationRoute =
  | `/chat/${string}`
  | "/conversations"
  | "/(tabs)"
  | "/(tabs)/profile"
  | "/(tabs)/index"
  | string; // Fallback for other routes

// Lazy-load expo-notifications
function getNotifications(): typeof import("expo-notifications") | null {
  if (Platform.OS === "web") return null;
  try {
    return require("expo-notifications");
  } catch {
    return null;
  }
}

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (Platform.OS === "web") return;

    const Notifications = getNotifications();
    if (!Notifications) return;

    // Android channel'lari olustur
    setupNotificationChannels();

    // Token kayit
    registerForPushNotificationsAsync().then((token) => {
      if (token && user) {
        savePushToken(user.id, token);
      }
    });

    try {
      // Foreground'da bildirim geldiginde
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification.request.content.title);
        });

      // Bildirime tiklandiginda navigation
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          handleNotificationNavigation(response.notification.request.content.data);
        });

      // Killed state'den acilista son bildirim kontrolu
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          handleNotificationNavigation(response.notification.request.content.data);
        }
      });
    } catch (e) {
      console.log("Push notification listeners not available");
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, user]);

  function handleNotificationNavigation(data: Record<string, unknown>) {
    const type = data?.type as string | undefined;

    switch (type) {
      case "message":
        if (data.matchId && typeof data.matchId === 'string') {
          router.push(`/chat/${data.matchId}` as NotificationRoute);
        }
        break;
      case "match":
        router.push("/conversations" as NotificationRoute);
        break;
      case "reaction":
      case "comment":
        // Feed'e yonlendir (ana sayfa)
        router.push("/(tabs)" as NotificationRoute);
        break;
      case "review":
        router.push("/(tabs)/profile" as NotificationRoute);
        break;
      default:
        break;
    }
  }
}
