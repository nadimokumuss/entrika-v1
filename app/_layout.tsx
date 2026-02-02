import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform, ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { colors } from "@/constants/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Push notification kayit ve listener'lari
  usePushNotifications();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Kullanıcı giriş yapmamış ve auth ekranında değil -> auth'a yönlendir
      router.replace("/(auth)");
    } else if (isAuthenticated && inAuthGroup) {
      // Kullanıcı giriş yapmış ve hala auth ekranında -> ana sayfaya yönlendir
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="new-post"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="edit-dating-profile"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="conversations"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="chat/[matchId]"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="review-user"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="report-content"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="blocked-users"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="post-detail"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="user-profile/[userId]"
          options={{
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Web'de hydration mismatch'i onlemek icin client mount'u bekle
  const [isClient, setIsClient] = useState(Platform.OS !== 'web');
  useEffect(() => {
    if (Platform.OS === 'web') setIsClient(true);
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Native: font yuklenene kadar bekle
  // Web: client mount olana kadar bekle (hydration icin bos div render et)
  if (!isClient) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!loaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
