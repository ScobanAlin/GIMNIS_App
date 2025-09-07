import { Platform } from "react-native";

// Android emulator reaches your PC's localhost via 10.0.2.2
export const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

// If testing on a real phone with Expo Go, use your PC's LAN IP instead of localhost:
// export const BASE_URL = "http://192.168.1.23:3000";
