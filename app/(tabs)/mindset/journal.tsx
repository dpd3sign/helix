import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const prompts = [
  {
    title: "Morning Alignment",
    prompt: "What identity-driven win will you create today?",
    note:
      "Store entry in `journal_entries` with prompt reference and mood rating.",
  },
  {
    title: "Midday Reflection",
    prompt: "Where did you notice resistance? How can you reframe it?",
    note: "Triggers cognitive reappraisal helper if mood dips.",
  },
  {
    title: "Evening Debrief",
    prompt: "Which actions proved you are becoming your chosen identity?",
    note: "Feeds confidence index calculation.",
  },
];

export default function JournalScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
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
          <ThemedText type="subtitle">Reflection Journal</ThemedText>
          <ThemedText style={styles.copy}>
            Users can log text or voice notes synced offline. Entries will
            trigger reappraisal flows when mood is negative.
          </ThemedText>
        </View>

        <View style={styles.stack}>
          {prompts.map((item) => (
            <View
              key={item.title}
              style={[styles.card, {
                backgroundColor: palette.surface,
                borderColor: palette.borderMuted,
              }]}
            >
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText style={styles.prompt}>{item.prompt}</ThemedText>
              <ThemedText style={styles.note}>{item.note}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },
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
  stack: {
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  prompt: {
    fontSize: 15,
    lineHeight: 22,
  },
  note: {
    fontSize: 13,
    opacity: 0.7,
  },
});
