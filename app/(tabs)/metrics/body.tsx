import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSupabaseView } from "@/hooks/use-supabase-view";

interface BodyOverviewRow {
  captured_at: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  waist_cm: number | null;
  delta_weight_7d: number | null;
  delta_body_fat_30d: number | null;
}

export default function BodyMetricsScreen() {
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];
  const { data, loading } = useSupabaseView<BodyOverviewRow>(
    "mv_body_overview",
    {
      order: { column: "captured_at", ascending: false },
      limit: 5,
    },
  );

  const latest = data[0];

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
          <ThemedText type="subtitle">Body Metrics</ThemedText>
          <ThemedText style={styles.copy}>
            Measurements feed adaptive calorie and training decisions. Values
            refresh whenever new logs arrive.
          </ThemedText>
          {loading && (
            <ThemedText style={styles.placeholder}>
              Loading latest check-ins…
            </ThemedText>
          )}
          {!loading && !latest && (
            <ThemedText style={styles.placeholder}>
              Awaiting first measurement.
            </ThemedText>
          )}
        </View>

        {latest && (
          <View style={styles.stack}>
            <View
              style={[styles.statCard, {
                backgroundColor: palette.surface,
                borderColor: palette.borderMuted,
              }]}
            >
              <ThemedText type="defaultSemiBold">Current Weight</ThemedText>
              <ThemedText style={styles.value}>
                {latest.weight_kg ?? "—"} kg
              </ThemedText>
              <ThemedText style={styles.note}>
                Δ7d: {latest.delta_weight_7d
                  ? `${latest.delta_weight_7d.toFixed(1)} kg`
                  : "—"} · Captured{" "}
                {new Date(latest.captured_at).toLocaleDateString()}
              </ThemedText>
            </View>
            <View
              style={[styles.statCard, {
                backgroundColor: palette.surface,
                borderColor: palette.borderMuted,
              }]}
            >
              <ThemedText type="defaultSemiBold">Body Fat %</ThemedText>
              <ThemedText style={styles.value}>
                {latest.body_fat_percentage ?? "—"} %
              </ThemedText>
              <ThemedText style={styles.note}>
                Δ30d: {latest.delta_body_fat_30d
                  ? `${latest.delta_body_fat_30d.toFixed(1)} %`
                  : "—"}
              </ThemedText>
            </View>
            <View
              style={[styles.statCard, {
                backgroundColor: palette.surface,
                borderColor: palette.borderMuted,
              }]}
            >
              <ThemedText type="defaultSemiBold">Waist</ThemedText>
              <ThemedText style={styles.value}>
                {latest.waist_cm ?? "—"} cm
              </ThemedText>
              <ThemedText style={styles.note}>
                Track tapered progress alongside strength PRs.
              </ThemedText>
            </View>
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
  statCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    fontSize: 13,
    opacity: 0.7,
  },
  placeholder: {
    opacity: 0.65,
  },
});
