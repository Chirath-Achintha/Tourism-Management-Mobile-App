import Constants from "expo-constants";
import { Platform } from "react-native";

type HostCandidate = string | null | undefined;

const getHostFromUri = (value: HostCandidate) => {
  if (!value || typeof value !== "string") return null;
  const host = value.split(":")[0]?.trim();
  return host || null;
};

const getHostFromExpo = () => {
  const constantsAny = Constants as unknown as {
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
    expoConfig?: { hostUri?: string };
  };

  return (
    getHostFromUri(constantsAny.expoConfig?.hostUri) ||
    getHostFromUri(constantsAny.manifest2?.extra?.expoClient?.hostUri) ||
    getHostFromUri(constantsAny.manifest?.debuggerHost)
  );
};

const resolvedHost = getHostFromExpo();
const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = explicitApiUrl
  ? explicitApiUrl
  : resolvedHost
    ? `http://${resolvedHost}:5000/api`
    : Platform.OS === "android"
      ? "http://10.0.2.2:5000/api"
      : "http://localhost:5000/api";
