import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const AUTH_STATUS_KEY = "auth:isSignedIn";

export default function IndexScreen() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const redirectUser = async () => {
      try {
        const signedInValue = await AsyncStorage.getItem(AUTH_STATUS_KEY);

        if (!isMounted) return;

        if (signedInValue === "true") {
          router.replace("/(tabs)" as never);
          return;
        }

        setCheckingAuth(false);
      } catch {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    redirectUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#f2a978" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/home/background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentWrap}>
          <Text style={styles.title}>Discover Sri Lanka, One Journey at a Time</Text>

          <Text style={styles.subtitle}>
            From golden beaches to misty mountains, plan unforgettable trips with local insights,
            top destinations, and easy booking in one tourism app.
          </Text>

          <Pressable style={styles.button} onPress={() => router.push("/register")}>
            <Text style={styles.buttonText}>Start your journey</Text>
          </Pressable>

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>ALREADY HAVE AN ACCOUNT? </Text>
            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.signInLink}>SIGN IN</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 17, 29, 0.62)",
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  contentWrap: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(236, 242, 248, 0.92)",
    fontSize: 17,
    lineHeight: 26,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#f2a978",
    minHeight: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#1d140e",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  signInRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInPrompt: {
    color: "rgba(233, 238, 245, 0.78)",
    fontSize: 13,
    letterSpacing: 1,
  },
  signInLink: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f1c2d",
  },
});
