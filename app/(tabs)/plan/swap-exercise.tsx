import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

const alternatives = [
  {
    name: "Romanian Deadlift",
    reason: "Available with current equipment; similar posterior-chain load.",
  },
  {
    name: "Kettlebell Swing",
    reason: "Power emphasis when barbell not accessible.",
  },
  {
    name: "Single-Leg Hip Thrust",
    reason: "Low equipment, maintains unilateral strength.",
  },
];

export default function SwapExerciseModal() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();

  const handleSwap = async (exercise: string) => {
    if (!params.planId) {
      Alert.alert(
        "Plan missing",
        "Return to the plan overview to select a plan.",
      );
      return;
    }
    try {
      const { error } = await supabase.functions.invoke("swap-exercise", {
        body: { plan_id: params.planId, replacement: exercise },
      });
      if (error) throw error;
      Alert.alert(
        "Swap requested",
        `${exercise} will replace the current exercise.`,
      );
      router.back();
    } catch (error) {
      Alert.alert(
        "Swap failed",
        (error as Error).message ?? "Unable to update session.",
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Swap Exercise" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.copy}>
          In production this modal surfaces filtered exercises by movement
          pattern, equipment availability, and fatigue score.
        </ThemedText>

        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          {alternatives.map((option) => (
            <Pressable
              key={option.name}
              style={styles.option}
              onPress={() => handleSwap(option.name)}
            >
              <ThemedText type="defaultSemiBold">{option.name}</ThemedText>
              <ThemedText style={styles.reason}>{option.reason}</ThemedText>
              <ThemedText style={styles.swapHint}>
                Tap to request swap
              </ThemedText>
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
  option: {
    gap: 6,
    paddingVertical: 8,
  },
  reason: {
    fontSize: 13,
    opacity: 0.75,
  },
  swapHint: {
    fontSize: 12,
    color: "#1F6FEB",
  },
  closeButton: {
    marginTop: 24,
    alignSelf: "flex-end",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#1F6FEB",
  },
  closeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
