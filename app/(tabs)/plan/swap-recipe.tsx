import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

const recipes = [
  { title: 'High-Carb Smoothie', macros: 'Cal 520 · P 32g · C 82g · F 12g', match: 'Same macros; faster prep.' },
  { title: 'Turkey Wrap', macros: 'Cal 480 · P 45g · C 50g · F 18g', match: 'Maintains protein target with simple ingredients.' },
  { title: 'Chickpea Power Bowl', macros: 'Cal 540 · P 28g · C 65g · F 16g', match: 'Plant-based variant.' },
];

export default function SwapRecipeModal() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();

  const handleSwap = async (recipe: string) => {
    if (!params.planId) {
      Alert.alert('Plan missing', 'Navigate from the plan overview to swap recipes.');
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('swap-recipe', {
        body: { plan_id: params.planId, recipe_title: recipe },
      });
      if (error) throw error;
      Alert.alert('Recipe swapped', `${recipe} queued for the selected meal.`);
      router.back();
    } catch (error) {
      Alert.alert('Unable to swap', (error as Error).message ?? 'Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Swap Recipe' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.copy}>
          The full implementation will query the recipe catalog by macro similarity and dietary preferences.
        </ThemedText>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
          {recipes.map(recipe => (
            <Pressable key={recipe.title} style={styles.recipeRow} onPress={() => handleSwap(recipe.title)}>
              <ThemedText type="defaultSemiBold">{recipe.title}</ThemedText>
              <ThemedText style={styles.recipeMacros}>{recipe.macros}</ThemedText>
              <ThemedText style={styles.recipeMatch}>{recipe.match}</ThemedText>
              <ThemedText style={styles.swapHint}>Tap to request replacement</ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <ThemedText style={styles.closeText}>Close</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  content: { gap: 18 },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  recipeRow: {
    gap: 6,
    paddingVertical: 8,
  },
  recipeMacros: {
    fontSize: 13,
    opacity: 0.75,
  },
  recipeMatch: {
    fontSize: 13,
    opacity: 0.75,
  },
  swapHint: {
    fontSize: 12,
    color: '#1F6FEB',
  },
  closeButton: {
    marginTop: 24,
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1F6FEB',
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
