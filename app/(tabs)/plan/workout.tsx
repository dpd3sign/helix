import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

interface WorkoutLog {
  log_id: string;
  session_id: string;
  notes?: string;
  created_at?: string;
}

interface WorkoutSession {
  session_id: string;
  date: string;
  week_number?: number;
  status?: string;
  intensity_score?: number;
  prescription?: string;
  focus?: string;
  notes?: string;
  exercise_logs?: WorkoutLog[];
}

export default function WorkoutViewScreen() {
  const palette = Colors[useColorScheme() ?? "light"];
  const params = useLocalSearchParams<{ planId?: string }>();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!params.planId) {
      setSessions([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("workout_sessions")
      .select(
        "session_id,date,week_number,status,intensity_score,prescription,focus,notes",
      )
      .eq("plan_id", params.planId)
      .order("date", { ascending: true });

    if (error) {
      console.warn("[workouts] fetch error", error.message);
      setSessions([]);
    } else if (data) {
      setSessions(data as WorkoutSession[]);
    }
    setLoading(false);
  }, [params.planId]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions]),
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle">Workout Sessions</ThemedText>
        <ThemedText style={styles.copy}>
          Prescriptions adapt nightly based on readiness. Complete logs sync
          back to Supabase for progression.
        </ThemedText>

        {sessions.length === 0 && !loading
          ? (
            <View
              style={[styles.card, {
                backgroundColor: palette.surface,
                borderColor: palette.borderMuted,
              }]}
            >
              <ThemedText style={styles.placeholder}>
                No sessions found for this plan.
              </ThemedText>
            </View>
          )
          : null}

        {sessions.map((session) => (
          <View
            key={session.session_id}
            style={[styles.card, {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
            }]}
          >
            <ThemedText type="defaultSemiBold">
              {new Date(session.date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </ThemedText>
            <ThemedText style={styles.readiness}>
              Status: {session.status ?? "Scheduled"} · Intensity:{" "}
              {session.intensity_score ?? "—"}
            </ThemedText>
            <ThemedText style={styles.prescription}>
              {session.focus ?? session.prescription ?? "Prescription pending."}
            </ThemedText>
            {session.notes && (
              <ThemedText style={styles.noteCopy}>{session.notes}</ThemedText>
            )}
          </View>
        ))}

        {loading && <ActivityIndicator color={palette.tint} />}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  readiness: {
    fontSize: 13,
    opacity: 0.75,
  },
  prescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteCopy: {
    lineHeight: 20,
    opacity: 0.7,
  },
  placeholder: {
    opacity: 0.7,
  },
});
