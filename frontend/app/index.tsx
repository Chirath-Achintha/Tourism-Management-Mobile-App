import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexScreen() {
  const router = useRouter();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Responsive font sizes
  const titleFontSize = windowWidth < 380 ? 28 : 34;
  const subtitleFontSize = windowWidth < 380 ? 14 : 16;

  useEffect(() => {
    let isMounted = true;

    const redirectUser = async () => {
      try {
        const signedInValue = await AsyncStorage.getItem(AUTH_STATUS_KEY);

        if (!isMounted) return;

        if (signedInValue === "true") {
          router.push("/(tabs)" as never);
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
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <ImageBackground
        source={require("../assets/home/background.jpg")}
        style={[styles.background, { height: windowHeight }]}
        resizeMode="stretch"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleFontSize * 1.2 }]}>
              Discover Sri Lanka’s{"\n"}Magic
            </Text>
          </View>

          <View style={styles.bottomContainer}>
            <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>
              Explore hidden gems, plan unforgettable trips, and book your next adventure—all in one place.
            </Text>

            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }
                ]}
                onPress={() => router.push("/register")}
              >
                <Text style={styles.buttonText}>Start your journey</Text>
              </Pressable>

              <View style={styles.signInRow}>
                <Text style={styles.signInPrompt}>ALREADY HAVE AN ACCOUNT? </Text>
                <Pressable onPress={() => router.push("/login")} hitSlop={10}>
                  <Text style={styles.signInLink}>SIGN IN</Text>
                </Pressable>
              </View>
            </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.45)", // Balanced dark overlay
  },
  safeArea: {
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20, // Reduced padding to allow more text width
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === "ios" ? 40 : 60,
    alignItems: "center",
  },
  title: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 26,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 20,
  },
  button: {
    backgroundColor: "#FFD166", // Travel-friendly yellow
    height: 60,
    borderRadius: 30, // Fully rounded for modern look
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    marginTop: 10,
  },
  buttonText: {
    color: "#1A3B2F",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInPrompt: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  signInLink: {
    color: "#ffffff", // Use white for better visibility on the dark background
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textDecorationLine: "underline",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07111D",
  },
});
