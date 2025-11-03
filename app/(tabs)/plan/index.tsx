import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";

interface WorkoutSession {
  session_id: string;
  date: string;
  status?: string;
  intensity_score?: number;
  prescription?: string;
  focus?: string;
}

interface Meal {
  meal_id: string;
  meal_type: string;
  planned_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface MealPlan {
  meal_plan_id: string;
  date: string;
  target_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  meals?: Meal[];
}

interface WeeklyPlan {
  plan_id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  readiness_score?: number;
  adjustments_made?: unknown;
  workout_sessions?: WorkoutSession[];
  meal_plans?: MealPlan[];
}

export default function PlanOverviewScreen() {
  const { session } = useAuth();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!session?.user) {
      setPlan(null);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("weekly_plans")
      .select(`
        plan_id,
        plan_type,
        start_date,
        end_date,
        readiness_score,
        adjustments_made,
        workout_sessions (session_id, date, status, intensity_score, prescription, focus),
        meal_plans (meal_plan_id, date, target_calories, protein_g, carbs_g, fat_g, meals (meal_id, meal_type, planned_calories, protein_g, carbs_g, fat_g))
      `)
      .eq("user_id", session.user.id)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[plan] fetch error", error.message);
      setPlan(null);
    } else {
      setPlan(data as WeeklyPlan | null);
    }
    setLoading(false);
  }, [session?.user]);

  useFocusEffect(
    useCallback(() => {
      fetchPlan();
    }, [fetchPlan]),
  );

  const regeneratePlan = useCallback(async () => {
    if (!session?.user) return;
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke(
        "generate-weekly-plan",
        {
          body: { user_id: session.user.id },
        },
      );
      if (error) throw error;
      Alert.alert(
        "Plan regeneration requested",
        "We will notify you when the adaptive plan is ready.",
      );
      fetchPlan();
    } catch (error) {
      Alert.alert(
        "Unable to regenerate",
        (error as Error).message ?? "Please try again.",
      );
      setLoading(false);
    }
  }, [session?.user, fetchPlan]);

  const nextSessions = useMemo(() => {
    const sessions = plan?.workout_sessions ?? [];
    return [...sessions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ).slice(0, 3);
  }, [plan?.workout_sessions]);

  const todayMeals = useMemo(() => {
    if (!plan?.meal_plans) return null;
    const today = new Date().toISOString().slice(0, 10);
    return plan.meal_plans.find((item) => item.date === today) ??
      plan.meal_plans[0] ?? null;
  }, [plan?.meal_plans]);

  const quickActions = useMemo(() => {
    const params = plan ? { planId: plan.plan_id } : undefined;
    return [
      {
        icon: "sparkles-outline" as const,
        label: "Regenerate Plan",
        onPress: regeneratePlan,
      },
      {
        icon: "swap-horizontal-outline" as const,
        label: "Swap Exercise",
        href: { pathname: "/(tabs)/plan/swap-exercise", params },
      },
      {
        icon: "restaurant-outline" as const,
        label: "Swap Recipe",
        href: { pathname: "/(tabs)/plan/swap-recipe", params },
      },
      {
        icon: "cart-outline" as const,
        label: "Grocery List",
        href: { pathname: "/(tabs)/plan/grocery-list", params },
      },
    ];
  }, [plan, regeneratePlan]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.selector, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Plan Overview</ThemedText>
          {!plan && !loading
            ? (
              <ThemedText style={styles.copy}>
                No adaptive plan found. Regenerate to seed your first cycle once
                biometrics are available.
              </ThemedText>
            )
            : (
              <>
                <ThemedText style={styles.copy}>
                  {plan?.plan_type ?? "—"} · {plan?.start_date ?? "—"} →{" "}
                  {plan?.end_date ?? "—"}
                </ThemedText>
                <View style={styles.metaRow}>
                  <View style={styles.metaCard}>
                    <ThemedText type="defaultSemiBold">Readiness</ThemedText>
                    <ThemedText style={styles.metaValue}>
                      {plan?.readiness_score ?? "Pending"}
                    </ThemedText>
                  </View>
                  <View style={styles.metaCard}>
                    <ThemedText type="defaultSemiBold">Adjustments</ThemedText>
                    <ThemedText style={styles.metaValue}>
                      {Array.isArray(plan?.adjustments_made)
                        ? plan?.adjustments_made.length
                        : plan?.adjustments_made
                        ? "Logged"
                        : "None"}
                    </ThemedText>
                  </View>
                </View>
              </>
            )}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Upcoming Workouts</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Sessions reflect HRV-guided intensity. Tap for full prescription.
          </ThemedText>
        </View>

        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          {nextSessions.length === 0
            ? (
              <ThemedText style={styles.placeholder}>
                No sessions generated yet.
              </ThemedText>
            )
            : (
              nextSessions.map((item) => (
                <View key={item.session_id} style={styles.cardRow}>
                  <ThemedText type="defaultSemiBold">
                    {new Date(item.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </ThemedText>
                  <ThemedText style={styles.cardDetail}>
                    {item.focus ?? item.prescription ?? "Prescription pending"}
                  </ThemedText>
                  <ThemedText style={styles.cardStatus}>
                    {item.status ?? "Scheduled"}
                  </ThemedText>
                </View>
              ))
            )}
          <Link
            href={{
              pathname: "/(tabs)/plan/workout",
              params: { planId: plan?.plan_id ?? "" },
            }}
            asChild
          >
            <Pressable style={styles.viewButton} disabled={!plan}>
              <ThemedText style={styles.viewText}>Open Workout View</ThemedText>
            </Pressable>
          </Link>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Meals</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Macro targets auto-adjust with compliance and wearable expenditure.
          </ThemedText>
        </View>

        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          {!todayMeals
            ? (
              <ThemedText style={styles.placeholder}>
                Meal plan pending.
              </ThemedText>
            )
            : (
              <>
                <ThemedText type="defaultSemiBold">
                  {new Date(todayMeals.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </ThemedText>
                <ThemedText style={styles.cardDetail}>
                  Target: {todayMeals.target_calories ?? "—"} kcal · P{" "}
                  {todayMeals.protein_g ?? "—"}g · C{" "}
                  {todayMeals.carbs_g ?? "—"}g · F {todayMeals.fat_g ?? "—"}g
                </ThemedText>
                {(todayMeals.meals ?? []).map((meal) => (
                  <View key={meal.meal_id} style={styles.mealRow}>
                    <ThemedText type="defaultSemiBold">
                      {meal.meal_type}
                    </ThemedText>
                    <ThemedText style={styles.mealDetail}>
                      {meal.planned_calories ?? "—"} kcal · P{" "}
                      {meal.protein_g ?? "—"}g
                    </ThemedText>
                  </View>
                ))}
              </>
            )}
          <Link
            href={{
              pathname: "/(tabs)/plan/meal",
              params: { planId: plan?.plan_id ?? "" },
            }}
            asChild
          >
            <Pressable style={styles.viewButton} disabled={!plan}>
              <ThemedText style={styles.viewText}>Open Meal View</ThemedText>
            </Pressable>
          </Link>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Quick Actions</ThemedText>
          <ThemedText style={styles.sectionCopy}>
            Trigger automations or jump into adjustment modals.
          </ThemedText>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.map((action) => {
            if ("href" in action && action.href) {
              return (
                <Link key={action.label} href={action.href} asChild>
                  <Pressable
                    style={[styles.actionCard, {
                      backgroundColor: palette.surface,
                      borderColor: palette.borderMuted,
                    }]}
                    disabled={!plan}
                  >
                    <Ionicons
                      name={action.icon}
                      size={22}
                      color={palette.tint}
                    />
                    <ThemedText style={styles.actionLabel}>
                      {action.label}
                    </ThemedText>
                  </Pressable>
                </Link>
              );
            }
            return (
              <Pressable
                key={action.label}
                style={[styles.actionCard, {
                  backgroundColor: palette.surface,
                  borderColor: palette.borderMuted,
                }]}
                onPress={action.onPress}
                disabled={loading}
              >
                <Ionicons name={action.icon} size={22} color={palette.tint} />
                <ThemedText style={styles.actionLabel}>
                  {action.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {loading && <ActivityIndicator color={palette.tint} />}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 24 },
  selector: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  copy: {
    lineHeight: 22,
    opacity: 0.75,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1F6FEB20",
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionHeader: {
    gap: 6,
  },
  sectionCopy: {
    opacity: 0.7,
    lineHeight: 22,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardRow: {
    gap: 4,
  },
  cardDetail: {
    opacity: 0.75,
    fontSize: 14,
  },
  cardStatus: {
    fontSize: 12,
    color: "#7D8793",
  },
  placeholder: {
    opacity: 0.6,
  },
  viewButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#1F6FEB",
  },
  viewText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actionCard: {
    flexBasis: "47%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    alignItems: "flex-start",
  },
  actionLabel: {
    fontWeight: "600",
  },
  mealRow: {
    borderWidth: 1,
    borderColor: "#E1E6EF",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  mealDetail: {
    fontSize: 13,
    opacity: 0.75,
  },
});
