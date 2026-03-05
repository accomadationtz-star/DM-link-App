import React, { useMemo, useState } from "react";
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
import { loginUser, googleSignIn } from "@/services/api/auth";
import { useAuthStore } from "@/store/auth";
import { useGoogleSignIn } from "@/utils/googleAuth";

type FormState = {
  username: string;
  password: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ username: "", password: "" });
  type FormErrors = Partial<Record<keyof FormState, string>>;
  type FormTouched = Partial<Record<keyof FormState, boolean>>;
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorScheme = useColorScheme();
  const setSession = useAuthStore((s) => s.setSession);
  const setPendingGoogleAuth = useAuthStore((s) => s.setPendingGoogleAuth);
  const { signIn } = useGoogleSignIn();

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      const { idToken } = await signIn();

      // Exchange Google idToken with backend
      const res = await googleSignIn({ idToken });

      if (!res.success) {
        Alert.alert("Error", "Google login failed");
        return;
      }

      // Check backend response status
      if (res.status === "completed") {
        // User already has phone number, full session issued
        try {
          await setSession({
            user: res.data.user,
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
          });
          // Don't navigate - the root layout will detect user is set
          // and automatically switch from (auth) to (tabs) routes
        } catch (storageError: any) {
          console.error("❌ Storage error:", storageError.message);
          Alert.alert(
            "Storage Error",
            "Failed to save session. Please try signing in again.\n\nError: " +
              storageError.message
          );
        }
      } else if (res.status === "requiresPhone") {
        // User needs to complete phone number
        setPendingGoogleAuth({
          googleUser: res.data.user,
          pendingToken: res.data.pendingToken,
        });
        router.push("/(auth)/complete-phone");
      } else {
        Alert.alert("Error", "Unexpected response from server");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Google login failed";
      console.error("❌ Google sign-in error:", error);
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = useMemo(() => {
    return (
      form.username.trim().length > 0 &&
      form.password.length >= 8 &&
      Object.values(errors).every((e) => !e)
    );
  }, [form, errors]);

  function handleChange<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (touched[key]) {
      validateField(key, value);
    } else {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validateUsername(username: string): boolean {
    return username.trim().length > 0;
  }

  function validatePassword(password: string): boolean {
    return password.length >= 8;
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!validateUsername(form.username))
      nextErrors.username = "Username is required";
    if (!validatePassword(form.password))
      nextErrors.password = "Minimum 8 characters";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateField<K extends keyof FormState>(key: K, rawValue?: string) {
    const value = (rawValue ?? form[key]) as string;
    let message: string | undefined;
    switch (key) {
      case "username": {
        const v = value.trim();
        if (!v) message = "Username is required";
        break;
      }
      case "password": {
        if (value.length < 8) message = "Minimum 8 characters";
        break;
      }
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [key]: message }));
  }

  async function onSubmit() {
    if (isSubmitting) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await loginUser({
        username: form.username.trim(),
        password: form.password,
      });
      if (res.success) {
        try {
          await setSession({
            user: res.data.user,
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
          });
          // Don't navigate - the root layout will detect user is set
          // and automatically switch from (auth) to (tabs) routes
        } catch (storageError: any) {
          console.error("❌ Storage error:", storageError.message);
          Alert.alert(
            "Storage Error",
            "Failed to save session. Please try again.\n\nError: " +
              storageError.message
          );
        }
      } else {
        // backend indicates failure
        Alert.alert("Login failed", res.message || "Please check your credentials");
      }
    } catch (e: any) {
      const backendMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Login failed. Please check your credentials.";
      console.error("❌ Login error:", e);
      Alert.alert("Error", backendMsg);
    } finally {
      setIsSubmitting(false);
    }
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
            Welcome back
          </ThemedText>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Username</ThemedText>
            <TextInput
              value={form.username}
              onChangeText={(t) => handleChange("username", t)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, username: true }));
                validateField("username");
              }}
              placeholder="e.g. johndoe"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, colorScheme === "dark" && styles.inputDark]}
              placeholderTextColor={
                colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
              }
              returnKeyType="next"
            />
            {errors.username ? (
              <ThemedText style={styles.error}>{errors.username}</ThemedText>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              value={form.password}
              onChangeText={(t) => handleChange("password", t)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, password: true }));
                validateField("password");
              }}
              placeholder="Minimum 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, colorScheme === "dark" && styles.inputDark]}
              placeholderTextColor={
                colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
              }
              returnKeyType="done"
            />
            {errors.password ? (
              <ThemedText style={styles.error}>{errors.password}</ThemedText>
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
              {isSubmitting ? "Signing in…" : "Sign in"}
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            disabled={isSubmitting}
            style={[
              styles.googleButton,
              colorScheme === "dark" && styles.googleButtonDark,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
          >
            {isSubmitting ? (
              <ActivityIndicator
                color={colorScheme === "dark" ? "#fff" : "#000"}
              />
            ) : (
              <ThemedText style={styles.googleButtonText}>
                Continue with Google
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.replace("/(auth)/register")}
          >
            <ThemedText>Don’t have an account? Create one</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, gap: 16 },
  title: { marginBottom: 8 },
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
  error: { color: "#d00" },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#99999933",
  },
  dividerText: {
    marginHorizontal: 12,
    opacity: 0.6,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#99999933",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  googleButtonDark: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
  },
  googleButtonText: {
    fontWeight: "600",
  },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
});
