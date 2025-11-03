/**
 * HELIX Explainable Personalization Engine (EPE) v1
 *
 * Responsibility:
 *   - Accept an `EPEInput` payload from the mobile client or onboarding flow.
 *   - Derive metabolic metrics (age, BMR, TDEE, macros) and rule-based adjustments.
 *   - Generate a transparent 7-day plan (workouts + meals) with WHY explanations.
 *   - Persist rows into Supabase tables (plans, plan_days, workouts, meals) and refresh materialized views.
 *   - Respond with `{ plan_id, kcal_target, macros, week, explanations }`.
 *
 * Local development:
 *   1. `cd supabase/functions/generate_weekly_plan`
 *   2. `supabase functions serve generate_weekly_plan --env-file ../../.env`
 *   3. POST JSON payload to `http://localhost:54321/functions/v1/generate_weekly_plan`
 *
 * Tests (logic only):
 *   `deno test supabase/functions/generate_weekly_plan/generate_weekly_plan.test.ts`
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno&deno-std=0.224.0";
import {
  type DayPlan,
  type EPEInput,
  type ExerciseRow,
  generatePlanPreview as buildPlanPreview,
  type RecipeRow,
  type WeekPlan,
} from "./planner.ts";

export { generatePlanPreview } from "./planner.ts";
export type {
  DayPlan,
  EPEInput,
  ExerciseRow,
  RecipeRow,
  WeekPlan,
} from "./planner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function fetchRecipePool(
  client: SupabaseClient,
  _input: EPEInput,
): Promise<RecipeRow[]> {
  const { data, error } = await client
    .from("recipes")
    .select(
      "id, name, kcal, protein_g, carbs_g, fat_g, diet_type, allergens, ingredients, tags",
    );
  if (error) throw error;
  return data as RecipeRow[];
}

async function fetchExercisePool(
  client: SupabaseClient,
): Promise<ExerciseRow[]> {
  const { data, error } = await client.from("exercises").select(
    "id, name, description, tags",
  );
  if (error) throw error;
  return data as ExerciseRow[];
}

async function persistPlan(
  client: SupabaseClient,
  input: EPEInput,
  plan: WeekPlan,
): Promise<{ plan_id: string; week: DayPlan[] }> {
  const { data: insertedPlan, error: planError } = await client.from("plans")
    .insert({
      user_id: input.user_id,
      start_date: plan.week[0]?.date ?? new Date().toISOString().slice(0, 10),
      goal: input.primary_goal,
      kcal_target: plan.kcal_target,
      macros: plan.macros,
      explanations: plan.explanations,
    }).select("id").single();

  if (planError) throw planError;
  const planId: string = insertedPlan.id;

  const dayRows = plan.week.map((day, index) => ({
    plan_id: planId,
    date: day.date,
    day_index: index,
    readiness: day.readiness,
    adjustments_made: day.adjustments,
    status: day.focus === "train" ? "training" : "recovery",
  }));

  const { data: insertedDays, error: dayError } = await client.from("plan_days")
    .insert(dayRows)
    .select("id, day_index");
  if (dayError) throw dayError;

  const dayIdMap = new Map<number, string>();
  insertedDays?.forEach((day) => {
    dayIdMap.set(day.day_index as number, day.id as string);
  });

  const mealRows = plan.week.flatMap((day, index) => {
    const planDayId = dayIdMap.get(index);
    if (!planDayId) return [];
    return day.meals.map((meal) => ({
      plan_day_id: planDayId,
      name: meal.name,
      meal_type: meal.meal_type,
      kcal: meal.kcal,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      recipe_id: meal.recipe_id,
      ingredients: [],
    }));
  });

  if (mealRows.length > 0) {
    const { error: mealError } = await client.from("meals").insert(mealRows);
    if (mealError) throw mealError;
  }

  const workoutRows = plan.week.flatMap((day, index) => {
    const planDayId = dayIdMap.get(index);
    if (!planDayId) return [];
    return day.workouts.map((workout) => ({
      plan_day_id: planDayId,
      name: workout.name,
      focus: workout.focus,
      intensity: workout.intensity,
      blocks: workout.blocks,
    }));
  });

  if (workoutRows.length > 0) {
    const { error: workoutError } = await client.from("workouts").insert(
      workoutRows,
    );
    if (workoutError) throw workoutError;
  }

  const { error: refreshError } = await client.rpc("refresh_metric_views");
  if (refreshError) {
    console.warn("refresh_metric_views failed", refreshError);
  }

  return { plan_id: planId, week: plan.week };
}

function validateInput(input: EPEInput): string[] {
  const errors: string[] = [];
  if (!input.user_id) errors.push("user_id is required");
  if (!input.dob) errors.push("dob is required");
  if (!input.height_cm || input.height_cm < 120) {
    errors.push("height_cm unrealistic");
  }
  if (!input.weight_kg || input.weight_kg < 40) {
    errors.push("weight_kg unrealistic");
  }
  if (!input.goal_duration_weeks) {
    errors.push("goal_duration_weeks is required");
  }
  if (!input.training_days_per_week) {
    errors.push("training_days_per_week is required");
  }
  if (!input.session_length_min) errors.push("session_length_min is required");
  return errors;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as EPEInput;
    const validationErrors = validateInput(payload);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: "invalid_input", details: validationErrors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase service role credentials");
    }

    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const recipes = await fetchRecipePool(client, payload);
    const exercises = await fetchExercisePool(client);
    const planPreview = await buildPlanPreview(payload, recipes, exercises);
    const persisted = await persistPlan(client, payload, planPreview);

    return new Response(
      JSON.stringify({
        plan_id: persisted.plan_id,
        kcal_target: planPreview.kcal_target,
        macros: planPreview.macros,
        week: persisted.week,
        explanations: planPreview.explanations,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("generate_weekly_plan error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "internal_error", message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
