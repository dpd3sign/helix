import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{ title: "Welcome to HELIX" }}
      />
      <Stack.Screen
        name="login"
        options={{ title: "Log In" }}
      />
      <Stack.Screen
        name="account"
        options={{ title: "Create Account" }}
      />
      <Stack.Screen
        name="initial-questions"
        options={{ title: "Your Baseline" }}
      />
      <Stack.Screen
        name="goals-equipment"
        options={{ title: "Goals & Equipment" }}
      />
      <Stack.Screen
        name="wearable-sync"
        options={{ title: "Connect Wearables" }}
      />
      <Stack.Screen
        name="identity-framing"
        options={{ title: "Identity Alignment" }}
      />
      <Stack.Screen
        name="wearable-permissions"
        options={{
          title: "Enable Permissions",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
