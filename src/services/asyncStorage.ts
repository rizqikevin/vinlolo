import AsyncStorageNative from "@react-native-async-storage/async-storage";

export const AsyncStorage = {
  getItem: AsyncStorageNative.getItem,
  setItem: AsyncStorageNative.setItem,
};
