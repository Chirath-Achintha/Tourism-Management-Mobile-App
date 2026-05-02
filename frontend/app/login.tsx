import { useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "@/constants/api";

const AUTH_STATUS_KEY = "auth:isSignedIn";
const ONBOARDING_SEEN_KEY = "onboarding:seen";
const AUTH_TOKEN_KEY = "auth:token";
const AUTH_USER_KEY = "auth:user";

export default function LoginScreen() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIdentifierChange = (text: string) => {
    setIdentifier(text);
    if (!text.trim()) {
      setIdentifierError("Email or username is required.");
    } else if (text.trim().length < 3) {
      setIdentifierError("Must be at least 3 characters.");
    } else {
      setIdentifierError("");
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (!text) {
      setPasswordError("Password is required.");
    } else if (text.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
    } else {
      setPasswordError("");
    }
  };

  const handleLogin = async () => {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier || !password || identifierError || passwordError) {
      Alert.alert("Validation", "Please correct the errors before logging in.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedIdentifier,
          username: normalizedIdentifier,
          password,
        }),
      });

      const rawText = await response.text();
      let data: { message?: string; token?: string; user?: any } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Unable to login.");
        return;
      }

      await AsyncStorage.setItem(AUTH_STATUS_KEY, "true");
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token || "");
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user || {}));

      router.replace("/(tabs)" as never);
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Network Error", "Could not connect to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent />
      <View style={styles.backgroundContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
              <Pressable
                style={styles.topBackButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={28} color="#1A3B2F" />
              </Pressable>

              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue your adventure</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email or Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(26, 59, 47, 0.4)"
                    value={identifier}
                    onChangeText={handleIdentifierChange}
                    autoCapitalize="none"
                  />
                  {identifierError ? <Text style={styles.errorText}>{identifierError}</Text> : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(26, 59, 47, 0.4)"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={handlePasswordChange}
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color="rgba(26, 59, 47, 0.6)"
                      />
                    </Pressable>
                  </View>
                  {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    isSubmitting && { opacity: 0.7 }
                  ]}
                  onPress={handleLogin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </Pressable>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>DON'T HAVE AN ACCOUNT? </Text>
                  <Pressable onPress={() => router.push("/register")}>
                    <Text style={styles.footerLink}>REGISTER</Text>
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FAF5", // Light mint green / off-white
  },
  backgroundContent: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 40 : 60,
    paddingBottom: 40,
  },
  topBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(26, 59, 47, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginLeft: -8,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    color: "#1A3B2F",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(26, 59, 47, 0.6)",
    fontSize: 15,
    fontWeight: "500",
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: "#1A3B2F",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  roleButtonActive: {
    backgroundColor: "#FFD166",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(26, 59, 47, 0.1)",
    borderRadius: 16,
    padding: 16,
    color: "#1A3B2F",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordWrapper: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(26, 59, 47, 0.1)",
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: "#1A3B2F",
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: "#FFD166", // Travel-friendly yellow
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    marginTop: 10,
  },
  buttonText: {
    color: "#1d140e",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    color: "rgba(26, 59, 47, 0.6)",
    fontSize: 13,
  },
  footerLink: {
    color: "#1A3B2F",
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    marginTop: 2,
  },
});
