import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const expansions = [
  {
    title: "3D Physique Visualizer",
    detail:
      "Integrate scanning hardware or manual measurements to interpolate body model updates.",
  },
  {
    title: "Social Accountability",
    detail:
      "Partner connection, shared progress snapshots, and encouragement nudges.",
  },
  {
    title: "DAPPER Sync Module",
    detail:
      "Supplements and skincare ritual integration for holistic identity upkeep.",
  },
];

export default function PhaseTwoScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.hero, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Phase 2 Expansion</ThemedText>
          <ThemedText style={styles.copy}>
            Future roadmap modules extend HELIX into social accountability and
            advanced physique visualization.
          </ThemedText>
        </View>
        <View style={styles.stack}>
          {expansions.map((item) => (
            <View
              key={item.title}
              style={[styles.card, {
                backgroundColor: palette.surface,
                borderColor: palette.borderMuted,
              }]}
            >
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText style={styles.copy}>{item.detail}</ThemedText>
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
  hero: {
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
});
