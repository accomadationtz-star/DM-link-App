import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useState } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeGoogleSignIn } from "@/utils/googleAuth";
import { useAuthStore } from "@/store/auth";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Use separate hooks to avoid infinite loop from object reference changes
  const hydrate = useAuthStore((state) => state.hydrate);
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  // Hydrate auth state on app launch
  useEffect(() => {
    hydrate().then(() => setIsHydrated(true));
  }, [hydrate]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isHydrated || !isAuthHydrated) {
      return; // Don't navigate until hydrated
    }

    const inAuthGroup = segments[0] === "(auth)";
    const isAuthenticated = !!user;

    // Only redirect if user is logged in and stuck in auth screens
    // Allow browsing home without login (actions will be protected individually)
    if (isAuthenticated && inAuthGroup) {
      // User is logged in but still in auth screens -> redirect to home
      router.replace("/(tabs)");
    }
  }, [user, segments, isHydrated, isAuthHydrated]);

  // Don't render until auth state is loaded
  if (!isHydrated || !isAuthHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="property" options={{ headerShown: false }} />
        <Stack.Screen name="agent" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
