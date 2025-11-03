import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

interface Meal {
  meal_id: string;
  meal_type: string;
  recipe_id?: string;
  planned_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  ingredients_list?: unknown;
}

interface MealPlan {
  meal_plan_id: string;
  date: string;
  target_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  meals?: Meal[];
  notes?: string;
}

export default function MealViewScreen() {
  const params = useLocalSearchParams<{ planId?: string }>();
  const palette = Colors[useColorScheme() ?? "light"];
  const [day, setDay] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMeals = useCallback(async () => {
    if (!params.planId) {
      setDay(null);
      return;
    }
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("meal_plans")
      .select(
        "meal_plan_id,date,target_calories,protein_g,carbs_g,fat_g,fiber_g,notes, meals (meal_id,meal_type,planned_calories,protein_g,carbs_g,fat_g,fiber_g)",
      )
      .eq("plan_id", params.planId)
      .order("date", { ascending: true });

    if (error) {
      console.warn("[meal_plan] fetch error", error.message);
      setDay(null);
    } else if (data) {
      const plans = data as MealPlan[];
      setDay(plans.find((item) => item.date === today) ?? plans[0] ?? null);
    }
    setLoading(false);
  }, [params.planId]);

  useFocusEffect(
    useCallback(() => {
      fetchMeals();
    }, [fetchMeals]),
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle">Meal Plan</ThemedText>
        <ThemedText style={styles.copy}>
          Calorie and macro targets align with your readiness, expenditure, and
          compliance history.
        </ThemedText>

        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          {day
            ? (
              <>
                <ThemedText type="defaultSemiBold">
                  {new Date(day.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </ThemedText>
                <ThemedText style={styles.summary}>
                  {day.target_calories ?? "—"} kcal · P{" "}
                  {day.protein_g ?? "—"}g · C {day.carbs_g ?? "—"}g · F{" "}
                  {day.fat_g ?? "—"}g · Fiber {day.fiber_g ?? "—"}g
                </ThemedText>
                {day.notes && (
                  <ThemedText style={styles.note}>{day.notes}</ThemedText>
                )}
              </>
            )
            : (
              <ThemedText style={styles.placeholder}>
                Meal plan not generated yet.
              </ThemedText>
            )}
        </View>

        {day?.meals?.map((meal) => (
          <View
            key={meal.meal_id}
            style={[styles.mealCard, {
              backgroundColor: palette.surface,
              borderColor: palette.borderMuted,
            }]}
          >
            <ThemedText type="defaultSemiBold">{meal.meal_type}</ThemedText>
            <ThemedText style={styles.mealDetail}>
              {meal.planned_calories ?? "—"} kcal · P{" "}
              {meal.protein_g ?? "—"}g · C {meal.carbs_g ?? "—"}g · F{" "}
              {meal.fat_g ?? "—"}g
            </ThemedText>
          </View>
        ))}

        <View
          style={[styles.card, {
            backgroundColor: palette.surface,
            borderColor: palette.borderMuted,
          }]}
        >
          <ThemedText type="subtitle">Compliance & Adjustments</ThemedText>
          <ThemedText style={styles.note}>
            Meal logs compare against these targets. Deviations beyond
            thresholds call adaptive macros and trigger the grocery automation
            pipeline.
          </ThemedText>
        </View>

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
    padding: 18,
    gap: 8,
  },
  summary: {
    fontSize: 14,
    opacity: 0.8,
  },
  note: {
    lineHeight: 20,
    opacity: 0.7,
  },
  placeholder: {
    opacity: 0.7,
  },
  mealCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  mealDetail: {
    fontSize: 13,
    opacity: 0.75,
  },
});
