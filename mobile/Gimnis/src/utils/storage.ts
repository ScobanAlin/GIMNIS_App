// src/utils/storage.ts
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV();

// helper functions
export function setItem(key: string, value: string) {
  storage.set(key, value);
}

export function getItem(key: string): string | null {
  return storage.getString(key) ?? null;
}

export function removeItem(key: string) {
  storage.delete(key);
}

export function clearAll() {
  storage.clearAll();
}

export const getString = (key: string) => storage.getString(key) ?? null;
export const getNumber = (key: string) => storage.getNumber(key) ?? null;
export const setString = (key: string, value: string) => storage.set(key, value);
export const setNumber = (key: string, value: number) => storage.set(key, value);
