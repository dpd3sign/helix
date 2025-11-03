import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const anchors = [
  "After brushing teeth",
  "Post-lunch",
  "Pre-workout",
  "Before sleep",
];
const examples = [
  "Perform 1 minute of diaphragmatic breathing.",
  "Log 3 gratitude wins.",
  "Walk 50 deliberate steps.",
  "Review tomorrow’s plan for 2 minutes.",
];

export default function MicroHabitModal() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Micro-Habit Builder" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.panel, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Design Your Habit</ThemedText>
          <ThemedText style={styles.copy}>
            Micro-habits pair an anchor, identity statement, and simple action.
            This modal will eventually write to the `habits` table.
          </ThemedText>
        </View>

        <View style={{ gap: 14 }}>
          <View
            style={[styles.card, {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
            }]}
          >
            <ThemedText type="defaultSemiBold">Choose Anchor</ThemedText>
            {anchors.map((anchor) => (
              <ThemedText key={anchor} style={styles.item}>
                • {anchor}
              </ThemedText>
            ))}
          </View>
          <View
            style={[styles.card, {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
            }]}
          >
            <ThemedText type="defaultSemiBold">Identity Statement</ThemedText>
            <ThemedText style={styles.item}>
              “Because I am a disciplined athlete, I will…”
            </ThemedText>
          </View>
          <View
            style={[styles.card, {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
            }]}
          >
            <ThemedText type="defaultSemiBold">Action Ideas</ThemedText>
            {examples.map((example) => (
              <ThemedText key={example} style={styles.item}>
                • {example}
              </ThemedText>
            ))}
          </View>
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
  content: { gap: 20 },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  item: {
    fontSize: 14,
    lineHeight: 20,
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
