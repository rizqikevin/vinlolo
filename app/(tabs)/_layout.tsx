import { palette } from "@/src/theme/palette";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F8FAFC",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#FFFFFF000",
          borderTopColor: "#1E293B",
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        sceneStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shorts",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="play-box-multiple"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
