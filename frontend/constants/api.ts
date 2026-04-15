import Constants from "expo-constants";
import { Platform } from "react-native";

type HostCandidate = string | null | undefined;

const INVALID_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "exp"]);

const getHostFromUri = (value: HostCandidate) => {
  if (!value || typeof value !== "string") return null;

  const raw = value.trim();
  if (!raw) return null;

  let host = "";

  try {
    // Handles values like "exp://192.168.1.10:8081".
    host = new URL(raw).hostname;
  } catch {
    // Handles values like "192.168.1.10:8081".
    const withoutPath = raw.split("/")[0]?.trim() ?? "";
    host = withoutPath.split(":")[0]?.trim() ?? "";
  }

  if (!host || INVALID_HOSTS.has(host) || host.endsWith(".expo.dev") || host.includes("exp.host")) {
    return null;
  }

  return host;
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
