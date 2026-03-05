import React, { useState, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { completePhoneNumber } from "@/services/api/auth";
import { useAuthStore } from "@/store/auth";
import { validatePhoneNumber } from "@/utils/validators";

type FormState = {
  phoneNumber: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;
type FormTouched = Partial<Record<keyof FormState, boolean>>;

export default function CompletePhoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [form, setForm] = useState<FormState>({ phoneNumber: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use separate hooks to avoid infinite loop from object reference changes
  const pendingGoogleAuth = useAuthStore((state) => state.pendingGoogleAuth);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  // Redirect if no pending auth (phone already completed or session expired)
  React.useEffect(() => {
    if (!pendingGoogleAuth) {
      // Check if user already has full session (phone was already completed)
      const authStore = useAuthStore.getState();
      if (authStore.user?.phoneNumber) {
        // User already completed phone, go to home
        router.replace("/(tabs)");
      } else {
        // No pending auth and no complete session, go back to login
        router.replace("/(auth)/login");
      }
    }
  }, [pendingGoogleAuth, router]);

  const canSubmit = useMemo(() => {
    return (
      validatePhoneNumber(form.phoneNumber) &&
      Object.values(errors).every((e) => !e)
    );
  }, [form, errors]);

  function handleChange(value: string) {
    setForm({ phoneNumber: value });
    if (touched.phoneNumber) {
      validateField(value);
    } else {
      setErrors({ phoneNumber: undefined });
    }
  }

  function validateField(value: string) {
    let message: string | undefined;
    if (!validatePhoneNumber(value)) {
      message = "Enter a valid Tanzanian number (07xxxxxxxx or 06xxxxxxxx)";
    }
    setErrors({ phoneNumber: message });
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!validatePhoneNumber(form.phoneNumber)) {
      nextErrors.phoneNumber =
        "Enter a valid Tanzanian number (07xxxxxxxx or 06xxxxxxxx)";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit() {
    if (isSubmitting) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await completePhoneNumber({
        phoneNumber: form.phoneNumber.trim(),
      });

      if (res.success) {
        // Full session is now available
        try {
          await setSession({
            user: res.data.user,
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
          });
          // Don't navigate - the root layout will detect user is set
          // and automatically switch from (auth) to (tabs) routes
          // Just set a brief success message
          Alert.alert("Success!", "Your profile is complete. Welcome!");
        } catch (storageError: any) {
          console.error("❌ Storage error:", storageError.message);
          Alert.alert(
            "Storage Error",
            "Failed to save session. Please try again.\n\nError: " +
              storageError.message,
          );
        }
      } else {
        Alert.alert("Error", res.message || "Failed to complete phone");
      }
    } catch (error: any) {
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to submit phone number";

      // Check for specific error cases
      if (error?.response?.status === 409) {
        Alert.alert(
          "Phone already exists",
          "This phone number is already registered. Please use a different number.",
        );
      } else if (error?.response?.status === 401) {
        Alert.alert(
          "Session expired",
          "Your session has expired. Please sign in again.",
        );
        await clearSession();
        router.replace("/(auth)/login");
      } else {
        console.error("❌ Phone completion error:", error);
        Alert.alert("Error", backendMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!pendingGoogleAuth) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.title}>
            Complete your profile
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            We've received your Google profile. Please provide your phone number
            to complete sign up.
          </ThemedText>

          <View style={styles.userInfo}>
            <ThemedText style={styles.infoLabel}>Signed in as:</ThemedText>
            <ThemedText style={styles.email}>
              {pendingGoogleAuth.googleUser.email}
            </ThemedText>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              value={form.phoneNumber}
              onChangeText={handleChange}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, phoneNumber: true }));
                validateField(form.phoneNumber);
              }}
              placeholder="0756789012"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, colorScheme === "dark" && styles.inputDark]}
              placeholderTextColor={
                colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
              }
            />
            {errors.phoneNumber ? (
              <ThemedText style={styles.error}>{errors.phoneNumber}</ThemedText>
            ) : null}
          </View>

          <TouchableOpacity
            disabled={!canSubmit || isSubmitting}
            style={[
              styles.button,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
              (!canSubmit || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={onSubmit}
          >
            <ThemedText style={styles.buttonText}>
              {isSubmitting ? "Completing…" : "Complete sign up"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isSubmitting}
            style={styles.linkBtn}
            onPress={() => {
              clearSession();
              router.replace("/(auth)/login");
            }}
          >
            <ThemedText style={styles.linkText}>Start over</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, gap: 20 },
  title: { marginBottom: 4 },
  subtitle: { opacity: 0.7, marginBottom: 12, fontSize: 14 },
  userInfo: {
    backgroundColor: "#ef4444" + "22",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoLabel: { opacity: 0.7, fontSize: 12 },
  email: { fontWeight: "600", marginTop: 4 },
  fieldGroup: { gap: 6 },
  label: { opacity: 0.8 },
  input: {
    borderWidth: 1,
    borderColor: "#99999933",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  inputDark: {
    color: "#ffffff",
  },
  error: { color: "#d00", fontSize: 12 },
  button: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  linkBtn: { alignItems: "center", paddingVertical: 12 },
  linkText: { opacity: 0.7, fontSize: 14 },
});
