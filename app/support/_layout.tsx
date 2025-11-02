import { Stack } from 'expo-router';

export default function SupportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Help Center' }} />
      <Stack.Screen name="contact" options={{ title: 'Contact Support' }} />
      <Stack.Screen name="feature" options={{ title: 'Submit Feature Idea' }} />
    </Stack>
  );
}
