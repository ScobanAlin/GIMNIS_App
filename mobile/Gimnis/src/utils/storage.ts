// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const ROLE_KEY = "tablet_role";

export async function saveRole(role: string) {
  await AsyncStorage.setItem(ROLE_KEY, role);
}

export async function loadRole(): Promise<string | null> {
  return await AsyncStorage.getItem(ROLE_KEY);
}

export async function clearRole() {
  await AsyncStorage.removeItem(ROLE_KEY);
}
