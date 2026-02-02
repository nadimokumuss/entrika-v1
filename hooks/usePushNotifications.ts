import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { type EventSubscription } from "expo-modules-core";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  registerForPushNotificationsAsync,
  savePushToken,
  setupNotificationChannels,
} from "@/lib/notifications";

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Android channel'lari olustur
    setupNotificationChannels();

    // Token kayit
    registerForPushNotificationsAsync().then((token) => {
      if (token && user) {
        savePushToken(user.id, token);
      }
    });

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

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, user]);

  function handleNotificationNavigation(data: Record<string, unknown>) {
    const type = data?.type as string | undefined;

    switch (type) {
      case "message":
        if (data.matchId) {
          router.push(`/chat/${data.matchId}` as any);
        }
        break;
      case "match":
        router.push("/conversations" as any);
        break;
      case "reaction":
      case "comment":
        // Feed'e yonlendir (ana sayfa)
        router.push("/(tabs)" as any);
        break;
      case "review":
        router.push("/(tabs)/profile" as any);
        break;
      default:
        break;
    }
  }
}
