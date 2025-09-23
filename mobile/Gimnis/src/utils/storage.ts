// src/utils/storage.ts
let storage: any;

try {
  // Try to load MMKV (fails in Expo Go)
  const { MMKV } = require("react-native-mmkv");
  storage = new MMKV();
} catch (e) {
  console.warn("MMKV not available, using memory storage fallback");

  const memoryStore: Record<string, string | number> = {};

  storage = {
    set: (key: string, value: string | number) => {
      memoryStore[key] = value;
    },
    getString: (key: string) => {
      const v = memoryStore[key];
      return typeof v === "string" ? v : null;
    },
    getNumber: (key: string) => {
      const v = memoryStore[key];
      return typeof v === "number" ? v : null;
    },
    delete: (key: string) => {
      delete memoryStore[key];
    },
    clearAll: () => {
      Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    },
  };
}

// ✅ Export the storage object itself
export { storage };

// ✅ Export helpers with the same API as your MMKV version
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
