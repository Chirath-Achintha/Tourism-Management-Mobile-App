import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

export default function AppButton({ title, onPress, color }: { title: string; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color || COLORS.primary }]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "80%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
  },
});