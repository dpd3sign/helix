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
} from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Sex = "male" | "female" | "other";
type Goal = "fat_loss" | "muscle_gain" | "recomp" | "endurance" | "maintenance";
type TrainingAge = "new" | "1-2y" | "3y+";
type ActivityLevel = "sedentary" | "light" | "moderate" | "high" | "athlete";
type DietType =
  | "omnivore"
  | "pescatarian"
  | "vegetarian"
  | "vegan"
  | "paleo"
  | "keto"
  | "lowFODMAP";

export type EPEInput = {
  user_id: string;
  sex: Sex;
  dob: string;
  height_cm: number;
  weight_kg: number;
  body_fat_pct?: number;

  training_age: TrainingAge;
  activity_level: ActivityLevel;
  equipment: string[];

  primary_goal: Goal;
  target_weight_kg?: number;
  weekly_change_rate?: number;
  goal_duration_weeks: number;

  diet_type: DietType;
  allergies: string[];
  restricted_foods: string[];
  preferred_foods: string[];

  wake_time?: string;
  sleep_time?: string;
  stress_baseline?: 1 | 2 | 3 | 4 | 5;
  motivation_baseline?: 1 | 2 | 3 | 4 | 5;
  training_days_per_week: number;
  session_length_min: number;

  recent_metrics?: {
    hrv_rmssd?: number;
    rhr?: number;
    sleep_score?: number;
    steps?: number;
  };
};

type RecipeTags = {
  meal_type?: string;
  diet?: string[];
  macro_focus?: string;
  [key: string]: unknown;
};

type ExerciseTags = {
  equipment?: string[];
  pattern?: string[];
  focus?: string[];
  complexity?: string;
  [key: string]: unknown;
};

export type RecipeRow = {
  id: string;
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  diet_type: DietType;
  allergens: string[];
  ingredients: unknown;
  tags: RecipeTags;
};

export type ExerciseRow = {
  id: string;
  name: string;
  description?: string | null;
  tags: ExerciseTags;
};

type DerivedContext = {
  age: number;
  bmr: number;
  activityFactor: number;
  tdee: number;
  kcalTarget: number;
  macros: {
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    kcal_target: number;
  };
  explanations: string[];
};

type WorkoutBlock = {
  title: string;
  notes?: string;
  exercises: Array<{
    exercise_id: string;
    name: string;
    sets: number;
    reps: string;
    tempo?: string;
    rest_sec?: number;
  }>;
};

type DayPlan = {
  date: string;
  readiness: number;
  focus: "train" | "recover";
  adjustments: string[];
  workouts: Array<{
    name: string;
    focus?: string;
    intensity?: string;
    blocks: WorkoutBlock[];
  }>;
  meals: Array<{
    name: string;
    meal_type: string;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    recipe_id: string;
  }>;
};

type WeekPlan = {
  week: DayPlan[];
  explanations: string[];
  macros: DerivedContext["macros"];
  kcal_target: number;
};

const PAL: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

function calculateAge(dobIso: string): number {
  const birth = new Date(dobIso);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function mifflinStJeor(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  // Mifflin St. Jeor: (10 * weight) + (6.25 * height) - (5 * age) + s
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "female") return base - 161;
  if (sex === "male") return base + 5;
  return base - 78; // average offset between male/female
}

function applyGoalAdjustment(
  goal: Goal,
  tdee: number,
  weeklyRate?: number,
): { kcalTarget: number; explanation?: string } {
  const explanations: Record<Goal, string> = {
    fat_loss:
      "Applied a moderate caloric deficit (~15%) to support fat loss while preserving energy.",
    muscle_gain:
      "Added a gentle surplus (~12%) to drive muscle gain with controlled fat accrual.",
    recomp: "Kept calories near maintenance to prioritize body recomposition.",
    endurance:
      "Shifted calories toward endurance output while preserving recovery fuel.",
    maintenance: "Caloric target anchored at maintenance for stability.",
  };
  let target = tdee;
  switch (goal) {
    case "fat_loss":
      target = Math.round(tdee * 0.85);
      break;
    case "muscle_gain":
      target = Math.round(tdee * 1.12);
      break;
    case "endurance":
      target = Math.round(tdee * 1.05);
      break;
    case "recomp":
    case "maintenance":
      target = Math.round(tdee);
      break;
  }

  if (typeof weeklyRate === "number" && weeklyRate !== 0) {
    // weeklyRate is interpreted as kg change per week. Convert to kcal delta per day (7700 kcal per kg heuristic).
    const dailyDelta = (weeklyRate * 7700) / 7;
    target = Math.round(tdee + dailyDelta);
  }

  return {
    kcalTarget: Math.max(target, 1200),
    explanation: explanations[goal],
  };
}

function buildMacros(
  input: EPEInput,
  ctx: { kcalTarget: number; explanations: string[] },
): DerivedContext["macros"] {
  const { weight_kg, body_fat_pct, primary_goal, sex } = input;
  const leaner =
    (typeof body_fat_pct === "number" && sex === "male" && body_fat_pct < 15) ||
    (typeof body_fat_pct === "number" && sex === "female" && body_fat_pct < 24);

  let proteinPerKg = 1.8;
  if (primary_goal === "fat_loss" || leaner) {
    proteinPerKg = 2.2;
    ctx.explanations.push(
      "Protein set high (≈2.2 g/kg) to preserve lean mass while leaning out.",
    );
  } else if (primary_goal === "muscle_gain") {
    proteinPerKg = 2.0;
    ctx.explanations.push(
      "Protein emphasized (~2.0 g/kg) to support hypertrophy and recovery.",
    );
  }

  const protein_g = Math.round(proteinPerKg * weight_kg);
  const proteinCalories = protein_g * 4;

  const minFatByMass = weight_kg * 0.8;
  const minFatByPercent = (ctx.kcalTarget * 0.2) / 9;
  const fat_g = Math.max(Math.round(minFatByMass), Math.round(minFatByPercent));
  const fatCalories = fat_g * 9;
  if (fatCalories / ctx.kcalTarget < 0.2) {
    ctx.explanations.push(
      "Fats held at ≥20% of calories to maintain hormone health.",
    );
  }

  let remainingCalories = ctx.kcalTarget - (proteinCalories + fatCalories);
  if (primary_goal === "endurance") {
    remainingCalories = Math.round(
      ctx.kcalTarget * 0.55 - proteinCalories - fatCalories,
    );
    ctx.explanations.push(
      "Carbohydrates biased upward to fuel endurance blocks.",
    );
  }

  const carbs_g = Math.max(0, Math.round(remainingCalories / 4));
  return {
    protein_g,
    fat_g,
    carbs_g,
    kcal_target: ctx.kcalTarget,
  };
}

function determineReadiness(input: EPEInput): number {
  const base = 75;
  const deductions = [];
  if (input.recent_metrics?.hrv_rmssd && input.recent_metrics.hrv_rmssd < 50) {
    deductions.push(10);
  }
  if (
    input.recent_metrics?.sleep_score && input.recent_metrics.sleep_score < 70
  ) deductions.push(8);
  if (input.stress_baseline && input.stress_baseline >= 4) deductions.push(5);
  if (input.motivation_baseline && input.motivation_baseline <= 2) {
    deductions.push(5);
  }
  return Math.max(
    40,
    Math.min(95, base - deductions.reduce((a, b) => a + b, 0)),
  );
}

function getTagArray(
  tags: RecipeTags | ExerciseTags | undefined,
  key: string,
): string[] {
  if (!tags) return [];
  const value = tags[key];
  return Array.isArray(value) ? value as string[] : [];
}

function matchesDiet(recipe: RecipeRow, diet: DietType): boolean {
  if (diet === "omnivore") return true;
  if (diet === "vegetarian") {
    return recipe.diet_type === "vegetarian" || recipe.diet_type === "vegan";
  }
  if (diet === "vegan") return recipe.diet_type === "vegan";
  if (diet === "pescatarian") {
    return recipe.diet_type === "pescatarian" ||
      recipe.diet_type === "omnivore";
  }
  if (diet === "paleo") {
    const diets = getTagArray(recipe.tags, "diet");
    return diets.includes("paleo") || recipe.diet_type === "omnivore";
  }
  if (diet === "keto") {
    return recipe.tags?.macro_focus === "low_carb" ||
      recipe.tags?.macro_focus === "balanced";
  }
  if (diet === "lowFODMAP") return recipe.diet_type === "lowFODMAP";
  return true;
}

function filterRecipes(input: EPEInput, recipes: RecipeRow[]): RecipeRow[] {
  return recipes
    .filter((recipe) => matchesDiet(recipe, input.diet_type))
    .filter((recipe) =>
      recipe.allergens.every((a) => !input.allergies.includes(a))
    )
    .filter((recipe) =>
      input.restricted_foods.every((restricted) =>
        JSON.stringify(recipe.ingredients).toLowerCase().includes(
          restricted.toLowerCase(),
        ) === false
      )
    );
}

function filterExercises(
  input: EPEInput,
  exercises: ExerciseRow[],
): ExerciseRow[] {
  return exercises.filter((exercise) => {
    const equipmentNeeded = getTagArray(exercise.tags, "equipment");
    if (!equipmentNeeded || equipmentNeeded.length === 0) return true;
    return equipmentNeeded.some((item) => input.equipment.includes(item));
  });
}

function chooseFromPool<T>(pool: T[], count: number, startIndex = 0): T[] {
  if (pool.length === 0) return [];
  const chosen: T[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = (startIndex + i) % pool.length;
    chosen.push(pool[index]);
  }
  return chosen;
}

function buildWeekPlan(
  input: EPEInput,
  ctx: DerivedContext,
  recipes: RecipeRow[],
  exercises: ExerciseRow[],
): WeekPlan {
  const week: DayPlan[] = [];
  const readiness = determineReadiness(input);
  const trainDays = Math.max(1, Math.min(6, input.training_days_per_week));
  const recipePool = filterRecipes(input, recipes);
  const exercisePool = filterExercises(input, exercises);

  if (recipePool.length < 4) {
    ctx.explanations.push(
      "Limited recipe matches; rotating available meals while respecting dietary filters.",
    );
  }
  if (exercisePool.length < 5) {
    ctx.explanations.push(
      "Exercise pool constrained by equipment; reusing movements to maintain consistency.",
    );
  }

  const today = new Date();
  for (let i = 0; i < 7; i += 1) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() + i);
    const isoDate = dayDate.toISOString().slice(0, 10);

    const isTrainingDay = i < trainDays;
    const dayAdjustments: string[] = [];
    const dayMeals = chooseFromPool(recipePool, 4, i).map((recipe, idx) => ({
      name: recipe.name,
      meal_type: ["breakfast", "lunch", "snack", "dinner"][idx] ?? "planned",
      kcal: recipe.kcal,
      protein_g: recipe.protein_g,
      carbs_g: recipe.carbs_g,
      fat_g: recipe.fat_g,
      recipe_id: recipe.id,
    }));

    const dayWorkouts: DayPlan["workouts"] = [];
    if (isTrainingDay) {
      const exercisesChosen = chooseFromPool(exercisePool, 5, i);
      const blocks: WorkoutBlock[] = [
        {
          title: "Primary Strength",
          exercises: exercisesChosen.slice(0, 3).map((exercise) => ({
            exercise_id: exercise.id,
            name: exercise.name,
            sets: input.training_age === "new" ? 3 : 4,
            reps: input.primary_goal === "endurance" ? "12-15" : "6-10",
            tempo: input.training_age === "new" ? "3010" : "2010",
            rest_sec: input.session_length_min < 45 ? 60 : 90,
          })),
        },
        {
          title: "Accessory / Conditioning",
          exercises: exercisesChosen.slice(3).map((exercise) => ({
            exercise_id: exercise.id,
            name: exercise.name,
            sets: 3,
            reps: input.primary_goal === "endurance" ? "15-20" : "10-12",
            tempo: "2010",
            rest_sec: 45,
          })),
        },
      ].filter((block) => block.exercises.length > 0);

      if (input.session_length_min < 45) {
        dayAdjustments.push(
          "Session condensed with higher density to fit <45 minute window.",
        );
      }
      if (input.training_age === "new") {
        dayAdjustments.push(
          "Form-focused cues and moderate RPE (6-7) for new lifter progression.",
        );
      }

      dayWorkouts.push({
        name: `${input.primary_goal.replace("_", " ")} Session`,
        focus: input.primary_goal,
        intensity: readiness < 60 ? "moderate" : "progressive",
        blocks,
      });
    } else {
      dayAdjustments.push(
        "Active recovery emphasis: mobility, walking, and hydration.",
      );
    }

    week.push({
      date: isoDate,
      readiness: readiness,
      focus: isTrainingDay ? "train" : "recover",
      adjustments: dayAdjustments,
      workouts: dayWorkouts,
      meals: dayMeals,
    });
  }

  return {
    week,
    explanations: ctx.explanations,
    macros: ctx.macros,
    kcal_target: ctx.kcalTarget,
  };
}

function deriveContext(input: EPEInput): DerivedContext {
  const age = calculateAge(input.dob);
  const bmr = mifflinStJeor(input.sex, input.weight_kg, input.height_cm, age);
  const activityFactor = PAL[input.activity_level] ?? 1.2;
  const tdee = Math.round(bmr * activityFactor);
  const explanations: string[] = [];

  const goalAdjustment = applyGoalAdjustment(
    input.primary_goal,
    tdee,
    input.weekly_change_rate,
  );
  if (goalAdjustment.explanation) explanations.push(goalAdjustment.explanation);

  if (age >= 50) {
    explanations.push(
      "Training volume dialed back ~10% to match recovery trends after age 50.",
    );
  }
  if (input.recent_metrics?.steps && input.recent_metrics.steps < 6000) {
    explanations.push(
      "Daily step target increased (6-8k) to boost NEAT and recovery quality.",
    );
  }
  if (input.recent_metrics?.hrv_rmssd && input.recent_metrics.hrv_rmssd < 45) {
    explanations.push(
      "Low HRV detected; recovery days scheduled to avoid overreaching.",
    );
  }
  if (input.motivation_baseline && input.motivation_baseline <= 2) {
    explanations.push(
      "Kept choices simple to rebuild momentum and confidence.",
    );
  }
  if (input.training_age === "new") {
    explanations.push(
      "Progression starts with controlled tempos and foundational movements for new trainees.",
    );
  }
  if (input.equipment.length <= 2) {
    explanations.push(
      "Exercise menu tailored to match your available equipment.",
    );
  }
  if (input.diet_type !== "omnivore" || input.allergies.length > 0) {
    explanations.push(
      "Meal plan respects your diet type and filters out allergens automatically.",
    );
  }

  const ctx: DerivedContext = {
    age,
    bmr,
    activityFactor,
    tdee,
    kcalTarget: goalAdjustment.kcalTarget,
    macros: {
      protein_g: 0,
      fat_g: 0,
      carbs_g: 0,
      kcal_target: goalAdjustment.kcalTarget,
    },
    explanations,
  };

  ctx.macros = buildMacros(input, ctx);
  return ctx;
}

async function fetchRecipePool(
  client: SupabaseClient,
  input: EPEInput,
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

export async function generatePlanPreview(
  input: EPEInput,
  recipes: RecipeRow[],
  exercises: ExerciseRow[],
): Promise<WeekPlan> {
  const ctx = deriveContext(input);
  return buildWeekPlan(input, ctx, recipes, exercises);
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
    const planPreview = await generatePlanPreview(payload, recipes, exercises);
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
