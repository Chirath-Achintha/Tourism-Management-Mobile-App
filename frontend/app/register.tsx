import { useState, useRef } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  ImageBackground,
  SafeAreaView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/api";

const AUTH_STATUS_KEY = "auth:isSignedIn";
const ONBOARDING_SEEN_KEY = "onboarding:seen";
const AUTH_TOKEN_KEY = "auth:token";
const AUTH_USER_KEY = "auth:user";

export default function RegisterScreen() {
  const router = useRouter();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

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
      Alert.alert("Validation", "Enter a valid phone number.");
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
          role: "tourist",
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
      Alert.alert("Network Error", "Could not connect to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleFontSize = windowWidth < 380 ? 26 : 30;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/home/background.jpg")}
        style={[styles.background, { height: windowHeight }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.contentWrap}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.title, { fontSize: titleFontSize }]}>
              Create Account
            </Text>

            <Text style={styles.subtitle}>
              Start your journey across Sri Lanka today.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.6)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="rgba(255,255,255,0.6)"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleRegister}
                style={styles.button}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#1d140e" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </Pressable>
            </Animated.View>

            <Pressable onPress={() => router.back()}>
              <Text style={styles.backText}>Already have an account? Sign In</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111D",
  },
  background: {
    width: "100%",
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 17, 29, 0.55)",
  },
  safeArea: {
    flex: 1,
  },
  contentWrap: {
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    color: "#ffffff",
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(236, 242, 248, 0.85)",
    fontSize: 14,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#f2a978",
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#1d140e",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  backText: {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});