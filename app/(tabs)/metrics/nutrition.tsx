import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSupabaseView } from "@/hooks/use-supabase-view";

interface NutritionRow {
  day: string;
  calories_target: number | null;
  calories_consumed: number | null;
  protein_target: number | null;
  protein_consumed: number | null;
  compliance_score: number | null;
}

export default function NutritionMetricsScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const { data } = useSupabaseView<NutritionRow>("mv_nutrition_compliance", {
    order: { column: "day", ascending: false },
    limit: 7,
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
          <ThemedText type="subtitle">Nutrition Metrics</ThemedText>
          <ThemedText style={styles.copy}>
            Review compliance across the last week. Use deviations to trigger
            macro adjustments and grocery automation.
          </ThemedText>
        </View>

        {data.map((entry) => (
          <View
            key={entry.day}
            style={[styles.row, {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
            }]}
          >
            <ThemedText type="defaultSemiBold">
              {new Date(entry.day).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </ThemedText>
            <ThemedText style={styles.detail}>
              {entry.calories_consumed ?? "—"} / {entry.calories_target ?? "—"}
              {" "}
              kcal · Protein {entry.protein_consumed ?? "—"} /{" "}
              {entry.protein_target ?? "—"} g
            </ThemedText>
            <ThemedText style={styles.score}>
              Compliance: {entry.compliance_score?.toFixed(0) ?? "—"}%
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
              Log meals to populate compliance trends.
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
    gap: 8,
  },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  row: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  detail: {
    fontSize: 14,
    opacity: 0.75,
  },
  score: {
    fontSize: 13,
    opacity: 0.65,
  },
  placeholder: {
    opacity: 0.7,
  },
});
