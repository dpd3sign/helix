import { Stack } from 'expo-router';

export default function MindsetLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mindset', headerShown: false }} />
      <Stack.Screen name="journal" options={{ title: 'Reflection Journal' }} />
      <Stack.Screen name="affirmations" options={{ title: 'Affirmations' }} />
      <Stack.Screen name="identity-check-in" options={{ title: 'Identity Check-In' }} />
      <Stack.Screen name="micro-habit" options={{ title: 'Micro-Habit Builder', presentation: 'modal' }} />
    </Stack>
  );
}
