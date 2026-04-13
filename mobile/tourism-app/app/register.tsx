import { useState } from "react";
import { Alert, View, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppButton from "@/components/AppButton";
import { COLORS } from "@/constants/colors";
import { API_BASE_URL } from "@/constants/api";

const AUTH_STATUS_KEY = "auth:isSignedIn";
const ONBOARDING_SEEN_KEY = "onboarding:seen";
const AUTH_TOKEN_KEY = "auth:token";
const AUTH_USER_KEY = "auth:user";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?[0-9]{7,15}$/;

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneNumber.trim();

    if (!fullName.trim() || !normalizedEmail || !normalizedPhone || !password || !confirmPassword) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      Alert.alert("Validation", "Please enter a valid email address.");
      return;
    }

    if (!phonePattern.test(normalizedPhone)) {
      Alert.alert("Validation", "Enter a valid phone number with 7-15 digits.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
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

      router.replace("/(tabs)" as never);
    } catch {
      Alert.alert("Network Error", "Could not connect to backend. Check your server and IP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#ccc"
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#ccc"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor="#ccc"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#ccc"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#ccc"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <AppButton
        title={isSubmitting ? "Creating account..." : "Sign Up"}
        onPress={handleRegister}
      />

      <AppButton
        title="Back"
        color={COLORS.gray}
        onPress={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
});
