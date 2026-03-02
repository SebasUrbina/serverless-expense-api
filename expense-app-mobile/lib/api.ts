import axios from "axios";
import { useAuth } from "./AuthProvider";
import { Platform } from "react-native";

// To connect to localhost from Android emulator, use 10.0.2.2 instead of 127.0.0.1
// You may need to replace this if using physical iOS device or connecting remotely
let API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8787/api";

// Auto-correct the 10.0.2.2 Android alias to 127.0.0.1 if running on Web or iOS simulator
if (Platform.OS !== "android" && API_URL.includes("10.0.2.2")) {
  API_URL = API_URL.replace("10.0.2.2", "127.0.0.1");
  console.log("API_URL", API_URL);
}

export function useApi() {
  const { session } = useAuth();

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Inject the JWT token into every request automatically
  api.interceptors.request.use((config) => {
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  });

  return api;
}
