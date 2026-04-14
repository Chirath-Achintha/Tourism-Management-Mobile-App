import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

const AUTH_STATUS_KEY = "auth:isSignedIn";

export default function IndexScreen() {
  const router = useRouter();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Responsive font sizes
  const titleFontSize = windowWidth < 380 ? 32 : 38;
  const subtitleFontSize = windowWidth < 380 ? 15 : 17;

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
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <ImageBackground
        source={require("../assets/home/background.jpg")}
        style={[styles.background, { height: windowHeight }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.contentWrap}>
            <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleFontSize * 1.15 }]}>
              Discover Sri Lanka, One Journey at a Time
            </Text>

            <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>
              From golden beaches to misty mountains, plan unforgettable trips with local insights,
              top destinations, and easy booking in one tourism app.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
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
    backgroundColor: "rgba(7, 17, 29, 0.55)", // Slightly lightened to show peacock more clearly
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  contentWrap: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 20 : 40,
    gap: 16,
  },
  title: {
    color: "#ffffff",
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(236, 242, 248, 0.85)",
    lineHeight: 24,
    fontWeight: "400",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#f2a978",
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: "#1d140e",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  signInRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  signInPrompt: {
    color: "rgba(233, 238, 245, 0.65)",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  signInLink: {
    color: "#ffffff",
    fontSize: 12,
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
