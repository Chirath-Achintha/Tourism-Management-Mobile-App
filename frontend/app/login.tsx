import { useRef, useState } from "react";
import { Alert,
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
  Animated, } from "react-native";
import { useRouter } from "expo-router";
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
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async () => {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier || !password) {
      Alert.alert("Validation", "Email/username and password are required.");
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

      router.push("/(tabs)" as never);
    } catch {
      Alert.alert("Network Error", "Could not connect to backend. Check your server and IP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

const titleFontSize = windowWidth < 380 ? 28 : 32;

return (
  <View style={styles.container}>
    <ImageBackground
      source={require("../assets/home/background.jpg")}
      style={[styles.background, { height: windowHeight }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentWrap}>
          <Text style={[styles.title, { fontSize: titleFontSize }]}>
            Welcome Back
          </Text>

          <Text style={styles.subtitle}>
            Login to continue your journey across Sri Lanka.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.6)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleLogin}
                style={styles.button}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#1d140e" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </Pressable>
          </Animated.View>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>Go Back</Text>
          </Pressable>
        </View>
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
    justifyContent: "flex-end",
  },
  contentWrap: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 20 : 40,
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
});
