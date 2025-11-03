import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const responseExamples = [
  {
    heading: "Fatigue Check-in",
    message:
      "“Your HRV is tracking 8% below baseline and sleep slipped to 6h12m. Let’s trade the heavy press session for mobility and keep carbs higher tonight.”",
  },
  {
    heading: "Identity Reinforcement",
    message:
      "“You executed every micro-habit yesterday. That’s exactly how a disciplined athlete thinks—keep stacking the evidence.”",
  },
  {
    heading: "Cognitive Reappraisal",
    message:
      "“What else might yesterday’s missed workout mean? Perhaps proof that you can reset quickly. Let’s map a minimal session you can complete in 15 minutes.”",
  },
];

const buildSteps = [
  "Set up embeddings table (`coach_memory`) and pgvector extension.",
  "Wire Supabase Edge Function to Anthropic/OpenAI with tone guardrails.",
  "Create scripted dialogues for regression tests.",
  "Integrate coach transcript viewer with offline persistence.",
];

export default function CoachScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.headerCard, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">AI Coach Blueprint</ThemedText>
          <ThemedText style={styles.headerCopy}>
            Quietly confident, identity-anchored guidance that fuses biometrics,
            habits, and mindset cues.
          </ThemedText>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Tone Samples</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            These utterances define the voice and direction the coach will take.
          </ThemedText>
        </View>

        <View style={styles.examples}>
          {responseExamples.map((example) => (
            <View
              key={example.heading}
              style={[
                styles.exampleCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.borderMuted,
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">{example.heading}</ThemedText>
              <ThemedText style={styles.exampleMessage}>
                {example.message}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Build Checklist</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Concrete steps to bring the conversation engine online.
          </ThemedText>
        </View>

        <View style={styles.checklist}>
          {buildSteps.map((step) => (
            <View
              key={step}
              style={[
                styles.checklistItem,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.borderMuted,
                },
              ]}
            >
              <Ionicons name="bulb-outline" size={18} color={palette.tint} />
              <ThemedText style={styles.checklistText}>{step}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    gap: 24,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  headerCopy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionCopy: {
    opacity: 0.7,
    lineHeight: 22,
  },
  examples: {
    gap: 12,
  },
  exampleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  exampleMessage: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.75,
  },
  checklist: {
    gap: 12,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checklistText: {
    flex: 1,
    lineHeight: 20,
  },
});
