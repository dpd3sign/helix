import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="devices" options={{ title: 'Manage Devices' }} />
      <Stack.Screen name="preferences" options={{ title: 'Notifications & Preferences' }} />
      <Stack.Screen name="billing" options={{ title: 'Subscription & Billing' }} />
    </Stack>
  );
}
