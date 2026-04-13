import Constants from "expo-constants";
import { Platform } from "react-native";

const getHostFromExpo = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  return hostUri.split(":")[0];
};

const resolvedHost = getHostFromExpo();

export const API_BASE_URL = resolvedHost
  ? `http://${resolvedHost}:5000/api`
  : Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://localhost:5000/api";
