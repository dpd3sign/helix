import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSupabaseView } from '@/hooks/use-supabase-view';

interface SleepRow {
  date: string;
  sleep_hours: number | null;
  sleep_efficiency: number | null;
  hrv_rmssd: number | null;
  readiness_flag: string | null;
}

export default function SleepMetricsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { data } = useSupabaseView<SleepRow>('mv_sleep_recovery', {
    order: { column: 'date', ascending: false },
    limit: 14,
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
          <ThemedText type="subtitle">Sleep & Recovery</ThemedText>
          <ThemedText style={styles.copy}>
            HRV and sleep duration drive readiness recalculations each morning. Watch for consecutive red flags to anticipate deloads.
          </ThemedText>
        </View>

        {data.map((entry) => (
          <View
            key={entry.date}
            style={[styles.metricCard, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}
          >
            <ThemedText type="defaultSemiBold">
              {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </ThemedText>
            <ThemedText style={styles.detail}>
              Sleep {entry.sleep_hours?.toFixed(1) ?? '—'} h · Efficiency {entry.sleep_efficiency?.toFixed(0) ?? '—'}%
            </ThemedText>
            <ThemedText style={styles.detail}>HRV {entry.hrv_rmssd?.toFixed(0) ?? '—'} ms · Flag {entry.readiness_flag ?? 'normal'}</ThemedText>
          </View>
        ))}

        {data.length === 0 && (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderMuted }]}>
            <ThemedText style={styles.placeholder}>Connect a wearable to unlock recovery analytics.</ThemedText>
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
  },
  placeholder: {
    opacity: 0.7,
  },
});
