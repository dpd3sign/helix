import { Stack } from 'expo-router';

export default function MetricsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Metrics Overview', headerShown: false }} />
      <Stack.Screen name="body" options={{ title: 'Body Metrics' }} />
      <Stack.Screen name="nutrition" options={{ title: 'Nutrition Metrics' }} />
      <Stack.Screen name="mindset" options={{ title: 'Mindset Metrics' }} />
      <Stack.Screen name="sleep" options={{ title: 'Sleep & Recovery' }} />
      <Stack.Screen name="physique" options={{ title: 'Physique Visualizer' }} />
    </Stack>
  );
}
