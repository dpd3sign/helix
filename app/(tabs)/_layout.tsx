import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

import { FloatingMenu } from "@/components/floating-menu";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";

export default function TabLayout() {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? Colors.dark : Colors.light;
  const glass = palette.glass;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerTitleStyle: { fontWeight: "600" },
        sceneContainerStyle: { backgroundColor: palette.background },
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 12,
          height: 68,
          borderRadius: glass.radius + 4,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          shadowColor: glass.shadowColor,
          shadowOffset: glass.shadowOffset,
          shadowOpacity: glass.shadowOpacity,
          shadowRadius: glass.shadowRadius,
          elevation: glass.elevation,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView
            intensity={glass.blurIntensity}
            tint={scheme === "dark" ? "dark" : "light"}
            style={{
              flex: 1,
              borderRadius: glass.radius + 4,
              overflow: "hidden",
            }}
          />
        ),
        headerRight: () => <FloatingMenu />,
      }}
    >
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mindset"
        options={{
          title: "Mindset",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="planet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="metrics"
        options={{
          title: "Metrics",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
