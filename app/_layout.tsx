import { Stack } from "expo-router";
import { palette } from "@/src/theme/palette";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="drama/[bookId]"
        options={{
          title: "Detail Drama",
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.textPrimary,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
