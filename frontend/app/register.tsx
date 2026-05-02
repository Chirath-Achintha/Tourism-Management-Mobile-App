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

export default function RegisterScreen() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("tourist");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9]{10}$/;

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    if (!text.trim()) {
      setFullNameError("Full name is required.");
    } else if (text.trim().length < 3) {
      setFullNameError("Name must be at least 3 characters.");
    } else {
      setFullNameError("");
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (!text.trim()) {
      setEmailError("Email address is required.");
    } else if (!emailPattern.test(text.trim().toLowerCase())) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    setPhoneNumber(text);
    if (!text.trim()) {
      setPhoneNumberError("Phone number is required.");
    } else if (!phonePattern.test(text.trim())) {
      setPhoneNumberError("Enter a valid 10-digit phone number.");
    } else {
      setPhoneNumberError("");
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
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
    } else if (confirmPassword && text === confirmPassword) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (!text) {
      setConfirmPasswordError("Please repeat your password.");
    } else if (text !== password) {
      setConfirmPasswordError("Passwords do not match.");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneNumber.trim();

    if (
      !fullName.trim() ||
      !normalizedEmail ||
      !normalizedPhone ||
      !password ||
      !confirmPassword ||
      fullNameError ||
      emailError ||
      phoneNumberError ||
      passwordError ||
      confirmPasswordError
    ) {
      Alert.alert("Validation", "Please correct the errors before registering.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: normalizedEmail,
          phoneNumber: normalizedPhone,
          password,
          confirmPassword,
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Registration Failed", data.message || "Unable to create account.");
        return;
      }

      await AsyncStorage.setItem(AUTH_STATUS_KEY, "true");
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      router.replace("/(tabs)/" as never);
    } catch (error) {
      console.error("Registration error:", error);
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
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join us and start your journey today</Text>
              </View>

              <View style={styles.roleToggleContainer}>
                <Pressable
                  style={[styles.roleButton, role === "tourist" && styles.roleButtonActive]}
                  onPress={() => setRole("tourist")}
                >
                  <Text style={[styles.roleButtonText, role === "tourist" && styles.roleButtonTextActive]}>
                    Tourist
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.roleButton, role === "hotel_manager" && styles.roleButtonActive]}
                  onPress={() => setRole("hotel_manager")}
                >
                  <Text style={[styles.roleButtonText, role === "hotel_manager" && styles.roleButtonTextActive]}>
                    Hotel Manager
                  </Text>
                </Pressable>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(26, 59, 47, 0.4)"
                    value={fullName}
                    onChangeText={handleFullNameChange}
                  />
                  {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="rgba(26, 59, 47, 0.4)"
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="077 123 4567"
                    placeholderTextColor="rgba(26, 59, 47, 0.4)"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                  />
                  {phoneNumberError ? <Text style={styles.errorText}>{phoneNumberError}</Text> : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Min. 6 characters"
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

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Repeat your password"
                      placeholderTextColor="rgba(26, 59, 47, 0.4)"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={22}
                        color="rgba(26, 59, 47, 0.6)"
                      />
                    </Pressable>
                  </View>
                  {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    isSubmitting && { opacity: 0.7 }
                  ]}
                  onPress={handleRegister}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Register</Text>
                  )}
                </Pressable>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>ALREADY HAVE AN ACCOUNT? </Text>
                  <Pressable onPress={() => router.push("/login" as any)}>
                    <Text style={styles.footerLink}>SIGN IN</Text>
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
    marginBottom: 24,
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
  roleToggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(26, 59, 47, 0.05)",
    borderRadius: 20,
    padding: 4,
    marginBottom: 30,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#FFD166",
  },
  roleButtonText: {
    color: "rgba(26, 59, 47, 0.6)",
    fontSize: 14,
    fontWeight: "700",
  },
  roleButtonTextActive: {
    color: "#1A3B2F",
  },
  form: {
    gap: 20,
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
