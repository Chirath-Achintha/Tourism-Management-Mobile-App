import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AppButton from "@/components/AppButton";
import { COLORS } from "@/constants/colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 40,
    color: "gray",
  },
});

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌍 Tourism App</Text>

      <Text style={styles.description}>
        Discover destinations, book tours, and explore Sri Lanka easily.
      </Text>

      <AppButton
        title="Login"
        onPress={() => router.push("/login")}
      />

      <AppButton
        title="Sign Up"
        color={COLORS.secondary}
        onPress={() => router.push("/register")}
      />
    </View>
  );
}