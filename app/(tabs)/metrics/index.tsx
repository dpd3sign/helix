import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const sections = [
  {
    title: "Body",
    description: "Weight, body fat %, and measurements trend.",
    href: "/(tabs)/metrics/body",
  },
  {
    title: "Nutrition",
    description: "Macro compliance and caloric adjustments.",
    href: "/(tabs)/metrics/nutrition",
  },
  {
    title: "Mindset",
    description: "Confidence index and sentiment analysis.",
    href: "/(tabs)/metrics/mindset",
  },
  {
    title: "Sleep & Recovery",
    description: "HRV, sleep stages, and readiness.",
    href: "/(tabs)/metrics/sleep",
  },
  {
    title: "Physique Visualizer",
    description: "Phase 2: 3D body model evolution.",
    href: "/(tabs)/metrics/physique",
  },
];

export default function MetricsOverviewScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Liquid-glass group: see Colors.*.glass tokens */}
        <ThemedView variant="glass" style={styles.hero}>
          <ThemedText type="subtitle">Metrics Dashboard</ThemedText>
          <ThemedText style={styles.heroCopy}>
            Visualize how your readiness, nutrition, training, and mindset sync
            together. Each section below will pull from Supabase materialized
            views.
          </ThemedText>
        </ThemedView>

        <View style={styles.sectionList}>
          {sections.map((section) => (
            <Link key={section.title} href={section.href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.cardPressable,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <ThemedView variant="glass" style={styles.card}>
                  <ThemedText type="defaultSemiBold">{section.title}</ThemedText>
                  <ThemedText style={styles.cardDescription}>
                    {section.description}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 24 },
  hero: {
    padding: 20,
    gap: 10,
  },
  heroCopy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  sectionList: {
    gap: 16,
  },
  cardPressable: {
    borderRadius: 24,
  },
  card: {
    padding: 18,
    gap: 6,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
});
