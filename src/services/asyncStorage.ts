import AsyncStorageNative from "@react-native-async-storage/async-storage";

export const AsyncStorage = {
  getItem: AsyncStorageNative.getItem,
  setItem: AsyncStorageNative.setItem,
  removeItem: AsyncStorageNative.removeItem,
  getJson: async <T>(key: string): Promise<T | null> => {
    try {
      const raw = await AsyncStorageNative.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJson: async (key: string, value: unknown): Promise<void> => {
    await AsyncStorageNative.setItem(key, JSON.stringify(value));
  },
};
