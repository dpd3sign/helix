import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const rituals = [
  {
    title: "Morning Identity Prompt",
    detail:
      "“What evidence will you create today that supports your chosen identity?”",
  },
  {
    title: "Midday Affirmation",
    detail: "Timed with workouts or key meals to reinforce precision.",
  },
  {
    title: "Evening Reappraisal",
    detail: "Reframe any friction logged during the day.",
  },
];

const backlog = [
  "Design journaling data model & offline cache.",
  "Set up Supabase triggers for reappraisal nudges after negative mood logs.",
  "Draft affirmation library for each identity archetype.",
  "Prototype confidence index calculation blending habits + mood.",
];

const shortcuts = [
  { label: "Open Journal", href: "/(tabs)/mindset/journal" },
  { label: "Affirmation Deck", href: "/(tabs)/mindset/affirmations" },
  { label: "Identity Check-In", href: "/(tabs)/mindset/identity-check-in" },
  { label: "Build Micro-Habit", href: "/(tabs)/mindset/micro-habit" },
];

export default function MindsetScreen() {
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
          <ThemedText type="subtitle">Identity Reinforcement Loop</ThemedText>
          <ThemedText style={styles.panelCopy}>
            The mindset system structures guided journaling, affirmations, and
            micro-habit feedback to keep identity front and center.
          </ThemedText>
        </View>

        <ThemedText type="subtitle">Shortcuts</ThemedText>
        <View style={styles.shortcuts}>
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.label} href={shortcut.href} asChild>
              <Pressable
                style={[styles.shortcutCard, {
                  backgroundColor: palette.surface,
                  borderColor: palette.borderMuted,
                }]}
              >
                <ThemedText type="defaultSemiBold">{shortcut.label}</ThemedText>
                <ThemedText style={styles.shortcutHint}>
                  Tap to open prototype flow.
                </ThemedText>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Daily Rituals</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Scaffold of touch points that will evolve as the AI coach
            personalizes routines.
          </ThemedText>
        </View>

        <View style={styles.ritualStack}>
          {rituals.map((item) => (
            <View
              key={item.title}
              style={[
                styles.ritualCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.borderMuted,
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText style={styles.ritualDetail}>{item.detail}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Build Queue</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Work-in-progress tasks for journaling and mindset automation.
          </ThemedText>
        </View>

        <View style={styles.backlog}>
          {backlog.map((task) => (
            <View
              key={task}
              style={[
                styles.backlogItem,
                {
                  backgroundColor: `${palette.tint}0D`,
                  borderColor: `${palette.tint}33`,
                },
              ]}
            >
              <ThemedText style={styles.backlogText}>{task}</ThemedText>
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
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  panelCopy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  shortcuts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  shortcutCard: {
    flexBasis: "47%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  shortcutHint: {
    fontSize: 13,
    opacity: 0.65,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionCopy: {
    opacity: 0.7,
    lineHeight: 22,
  },
  ritualStack: {
    gap: 12,
  },
  ritualCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  ritualDetail: {
    lineHeight: 20,
    opacity: 0.75,
  },
  backlog: {
    gap: 10,
  },
  backlogItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  backlogText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
