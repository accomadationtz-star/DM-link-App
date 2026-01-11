import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { registerUser } from "@/services/api/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

type FormState = {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;
type FormTouched = Partial<Record<keyof FormState, boolean>>;

const initialState: FormState = {
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);

  const canSubmit = useMemo(() => {
    return (
      form.username.trim().length > 0 &&
      validateEmail(form.email) &&
      validatePhone(form.phoneNumber) &&
      form.password.length >= 8 &&
      form.confirmPassword.length >= 8 &&
      form.password === form.confirmPassword
    );
  }, [form]);

  function handleChange<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (touched[key]) {
      validateField(key, value);
    } else {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15;
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!form.username.trim()) nextErrors.username = "Username is required";
    else if (form.username.trim().length < 3)
      nextErrors.username = "Minimum 3 characters";
    if (!validateEmail(form.email)) nextErrors.email = "Enter a valid email";
    if (!validatePhone(form.phoneNumber))
      nextErrors.phoneNumber = "Enter a valid phone number";
    if (form.password.length < 8) nextErrors.password = "Minimum 8 characters";
    if (form.confirmPassword.length < 8)
      nextErrors.confirmPassword = "Minimum 8 characters";
    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    )
      nextErrors.confirmPassword = "Passwords do not match";
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
        else if (v.length < 3) message = "Minimum 3 characters";
        break;
      }
      case "email": {
        if (!validateEmail(value)) message = "Enter a valid email";
        break;
      }
      case "phoneNumber": {
        if (!validatePhone(value)) message = "Enter a valid phone number";
        break;
      }
      case "password": {
        if (value.length < 8) message = "Minimum 8 characters";
        // also keep confirm password in sync if it was filled
        if (form.confirmPassword) {
          if (value !== form.confirmPassword) {
            setErrors((prev) => ({
              ...prev,
              confirmPassword: "Passwords do not match",
            }));
          } else {
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }
        }
        break;
      }
      case "confirmPassword": {
        if (value.length < 8) message = "Minimum 8 characters";
        else if (form.password !== value) message = "Passwords do not match";
        break;
      }
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [key]: message }));
  }

  async function onSubmit() {
    if (!validate()) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await registerUser({
        username: form.username.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      });
      router.replace("/(auth)/login");
    } catch (error: unknown) {
      setErrors((prev) => ({
        ...prev,
        email: "Registration failed. Please try again.",
      }));
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
            Create your account
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
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              value={form.email}
              onChangeText={(t) => handleChange("email", t)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, email: true }));
                validateField("email");
              }}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, colorScheme === "dark" && styles.inputDark]}
              placeholderTextColor={
                colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
              }
              returnKeyType="next"
            />
            {errors.email ? (
              <ThemedText style={styles.error}>{errors.email}</ThemedText>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Phone number</ThemedText>
            <TextInput
              value={form.phoneNumber}
              onChangeText={(t) => handleChange("phoneNumber", t)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, phoneNumber: true }));
                validateField("phoneNumber");
              }}
              placeholder="e.g. +255700000000"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, colorScheme === "dark" && styles.inputDark]}
              placeholderTextColor={
                colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
              }
              returnKeyType="next"
            />
            {errors.phoneNumber ? (
              <ThemedText style={styles.error}>{errors.phoneNumber}</ThemedText>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={styles.passwordRow}>
              <TextInput
                value={form.password}
                onChangeText={(t) => handleChange("password", t)}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, password: true }));
                  validateField("password");
                }}
                placeholder="Minimum 8 characters"
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  styles.passwordInput,
                  colorScheme === "dark" && styles.inputDark,
                ]}
                placeholderTextColor={
                  colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
                }
                returnKeyType="done"
              />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setIsPasswordVisible((p) => !p)}
                style={styles.toggleBtn}
              >
                <ThemedText>{isPasswordVisible ? "Hide" : "Show"}</ThemedText>
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <ThemedText style={styles.error}>{errors.password}</ThemedText>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <View style={styles.passwordRow}>
              <TextInput
                value={form.confirmPassword}
                onChangeText={(t) => handleChange("confirmPassword", t)}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, confirmPassword: true }));
                  validateField("confirmPassword");
                }}
                placeholder="Re-enter your password"
                secureTextEntry={!isConfirmVisible}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  styles.passwordInput,
                  colorScheme === "dark" && styles.inputDark,
                ]}
                placeholderTextColor={
                  colorScheme === "dark" ? "#9CA3AF" : "#6B7280"
                }
                returnKeyType="done"
              />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setIsConfirmVisible((p) => !p)}
                style={styles.toggleBtn}
              >
                <ThemedText>{isConfirmVisible ? "Hide" : "Show"}</ThemedText>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <ThemedText style={styles.error}>
                {errors.confirmPassword}
              </ThemedText>
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
            {isSubmitting ? (
              <ActivityIndicator />
            ) : (
              <ThemedText style={styles.buttonText}>Create account</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.replace("/(auth)/login")}
          >
            <ThemedText>Already have an account? Sign in</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 32,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    opacity: 0.8,
  },
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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    color: "#d00",
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
