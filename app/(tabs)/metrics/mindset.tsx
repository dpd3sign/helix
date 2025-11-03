import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSupabaseView } from "@/hooks/use-supabase-view";

interface MindsetRow {
  date: string;
  confidence_index: number | null;
  sentiment_score: number | null;
  journal_entries: number | null;
  habit_adherence: number | null;
}

export default function MindsetMetricsScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const { data } = useSupabaseView<MindsetRow>("mv_mindset_confidence", {
    order: { column: "date", ascending: false },
    limit: 14,
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Mindset Metrics</ThemedText>
          <ThemedText style={styles.copy}>
            Coach tone adapts to confidence trends, sentiment, and habit
            adherence. Maintain streaks to keep reinforcement in the Goldilocks
            zone.
          </ThemedText>
        </View>

        {data.map((entry) => (
          <View
            key={entry.date}
            style={[styles.metricCard, {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
            }]}
          >
            <ThemedText type="defaultSemiBold">
              {new Date(entry.date).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </ThemedText>
            <ThemedText style={styles.detail}>
              Confidence {entry.confidence_index?.toFixed(0) ?? "—"} · Sentiment
              {" "}
              {entry.sentiment_score?.toFixed(1) ?? "—"} · Journal{" "}
              {entry.journal_entries ?? "—"}
            </ThemedText>
            <ThemedText style={styles.detail}>
              Habit adherence {entry.habit_adherence?.toFixed(0) ?? "—"}%
            </ThemedText>
          </View>
        ))}

        {data.length === 0 && (
          <View
            style={[styles.card, {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
            }]}
          >
            <ThemedText style={styles.placeholder}>
              Complete check-ins and journal entries to populate this dashboard.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },
  card: {
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
  metricCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  detail: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 20,
  },
  placeholder: {
    opacity: 0.7,
  },
});
