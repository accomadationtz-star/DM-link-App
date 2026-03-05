import { Stack } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

export default function AuthLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
      }}
    >
      {/* Login is the initial auth screen */}
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
        }}
      />

      {/* Register screen */}
      <Stack.Screen
        name="register"
        options={{
          title: "Register",
        }}
      />

      {/* Phone completion screen for Google users */}
      <Stack.Screen
        name="complete-phone"
        options={{
          title: "Complete Profile",
          headerShown: false,
          animationEnabled: false, // No animation when completing phone
        }}
      />
    </Stack>
  );
}
