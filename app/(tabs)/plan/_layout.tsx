import { Stack } from 'expo-router';

export default function PlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Plan Overview', headerShown: false }}
      />
      <Stack.Screen
        name="workout"
        options={{ title: 'Workout View' }}
      />
      <Stack.Screen
        name="meal"
        options={{ title: 'Meal View' }}
      />
      <Stack.Screen
        name="generator"
        options={{ title: 'Regenerate Plan', presentation: 'modal' }}
      />
      <Stack.Screen
        name="swap-exercise"
        options={{ title: 'Swap Exercise', presentation: 'modal' }}
      />
      <Stack.Screen
        name="swap-recipe"
        options={{ title: 'Swap Recipe', presentation: 'modal' }}
      />
      <Stack.Screen
        name="grocery-list"
        options={{ title: 'Grocery List', presentation: 'modal' }}
      />
    </Stack>
  );
}
