import React from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/auth";
import { logoutUser } from "@/services/api/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Profile
        </ThemedText>

        {user ? (
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>
              Welcome, {user.username}
            </ThemedText>
            <ThemedText style={styles.cardSubtitle}>{user.email}</ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              Role: {user.role}
            </ThemedText>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: Colors[colorScheme ?? "light"].tint },
              ]}
              onPress={async () => {
                try {
                  const rToken =
                    useAuthStore.getState().refreshToken ?? undefined;
                  await logoutUser(rToken);
                } catch {
                  // ignore logout API errors; proceed to clear session
                }
                await clearSession();
                router.replace("/(auth)/login");
              }}
              accessibilityRole="button"
            >
              <ThemedText style={styles.buttonText}>Log out</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>
                Welcome to Accomtz
              </ThemedText>
              <ThemedText style={styles.cardSubtitle}>
                Sign in to manage bookings, save favorites, and message agents.
              </ThemedText>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: Colors[colorScheme ?? "light"].tint },
                ]}
                onPress={() => router.push("/(auth)/login")}
                accessibilityRole="button"
              >
                <ThemedText style={styles.buttonText}>Log in</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.outline,
                  { borderColor: Colors[colorScheme ?? "light"].tint },
                ]}
                onPress={() => router.push("/(auth)/register")}
                accessibilityRole="button"
              >
                <ThemedText
                  style={[
                    styles.outlineText,
                    { color: Colors[colorScheme ?? "light"].tint },
                  ]}
                >
                  Create an account
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.helper}>
              <ThemedText>
                New here? Create an account to start browsing and booking
                properties.
              </ThemedText>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: "#99999933",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 18,
  },
  cardSubtitle: {
    opacity: 0.85,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#111827",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  outline: {
    borderWidth: 1,
    borderColor: "#111827",
  },
  outlineText: {
    fontWeight: "600",
  },
  helper: {
    alignItems: "center",
  },
});
