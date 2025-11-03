import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { handleSwapExercise } from "../util-swap-exercise/index.ts";
import { handleSwapRecipe } from "../util-swap-recipe/index.ts";
import { handleExportGrocery } from "../util-export-grocery/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function hasSecrets() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

let clientPromise: Promise<any> | null = null;
async function getClient() {
  if (!hasSecrets()) {
    throw new Error("Supabase credentials are not configured");
  }
  if (!clientPromise) {
    clientPromise = import(
      "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno&deno-std=0.224.0"
    ).then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    );
  }
  return clientPromise;
}

async function createTestUser() {
  if (!hasSecrets()) return null;
  const client = await getClient();
  const email = `test-${crypto.randomUUID()}@helix.local`;
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: "Pass1234!",
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function deleteTestUser(userId: string) {
  if (!hasSecrets()) return;
  const client = await getClient();
  await client.auth.admin.deleteUser(userId);
}

async function insertPlan(userId: string) {
  const client = await getClient();
  const startDate = new Date().toISOString().slice(0, 10);
  const { data, error } = await client
    .from("plans")
    .insert({
      user_id: userId,
      start_date: startDate,
      goal: "fat_loss",
      kcal_target: 2200,
      macros: { protein_g: 180, fat_g: 70, carbs_g: 230, kcal_target: 2200 },
      explanations: [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function deletePlan(planId: string) {
  if (!hasSecrets()) return;
  const client = await getClient();
  await client.from("plans").delete().eq("id", planId);
}

async function insertPlanDay(planId: string, dayIndex = 0) {
  const client = await getClient();
  const date = new Date();
  date.setDate(date.getDate() + dayIndex);
  const { data, error } = await client
    .from("plan_days")
    .insert({
      plan_id: planId,
      date: date.toISOString().slice(0, 10),
      day_index: dayIndex,
      readiness: 75,
      adjustments_made: [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function getTwoExercises() {
  const client = await getClient();
  const { data, error } = await client
    .from("exercises")
    .select("id, name, tags")
    .limit(2);
  if (error) throw error;
  if (!data || data.length < 2) {
    throw new Error("Not enough exercises seeded for tests.");
  }
  return data;
}

async function getTwoRecipes() {
  const client = await getClient();
  const { data, error } = await client
    .from("recipes")
    .select("id, name, kcal, protein_g, carbs_g, fat_g, diet_type, tags")
    .limit(2);
  if (error) throw error;
  if (!data || data.length < 2) {
    throw new Error("Not enough recipes seeded for tests.");
  }
  return data;
}

async function insertWorkout(planDayId: string, exerciseId: string, exerciseName: string) {
  const client = await getClient();
  const block = [
    {
      title: "Strength Block",
      exercises: [{
        exercise_id: exerciseId,
        name: exerciseName,
        sets: 3,
        reps: "8-10",
        rest_sec: 90,
      }],
    },
  ];
  const { data, error } = await client
    .from("workouts")
    .insert({
      plan_day_id: planDayId,
      name: "Test Session",
      focus: "strength",
      intensity: "moderate",
      blocks: block,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function insertMeal(
  planDayId: string,
  recipe: {
    id: string;
    name: string;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  },
) {
  const client = await getClient();
  const { data, error } = await client
    .from("meals")
    .insert({
      plan_day_id: planDayId,
      name: recipe.name,
      meal_type: "lunch",
      kcal: recipe.kcal,
      protein_g: recipe.protein_g,
      carbs_g: recipe.carbs_g,
      fat_g: recipe.fat_g,
      recipe_id: recipe.id,
      ingredients: [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function fetchLatestAudit(planId: string) {
  if (!hasSecrets()) return null;
  const client = await getClient();
  const { data } = await client
    .from("audit_regenerations")
    .select("*")
    .eq("plan_id", planId)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}

Deno.test({
  name: "swap_exercise updates workout and logs audit",
  ignore: !hasSecrets(),
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const user = await createTestUser();
    assert(user, "user creation failed");

    const planId = await insertPlan(user.id);
    const planDayId = await insertPlanDay(planId);
    const [fromExercise, toExercise] = await getTwoExercises();
    await insertWorkout(planDayId, fromExercise.id, fromExercise.name);

    try {
      const result = await handleSwapExercise({
        plan_day_id: planDayId,
        from_exercise_id: fromExercise.id,
        to_exercise_id: toExercise.id,
        user_id: user.id,
      });

      assert(result.ok, `swap_exercise failed: ${result.error}`);
      assert(result.blocks, "blocks missing in response");
      assertStringIncludes(result.why ?? "", toExercise.name);

      const client = await getClient();
      const workout = await client.from("workouts").select("blocks").eq(
        "id",
        result.workout_id!,
      ).single();
      assert(workout.data, "Workout not found after swap");
      const blocks = workout.data.blocks as unknown[];
      const hasReplacement = JSON.stringify(blocks).includes(toExercise.id);
      assert(hasReplacement, "Replacement exercise not in blocks");

      const audit = await fetchLatestAudit(planId);
      assert(audit, "Audit row not written");
      assertEquals(audit?.delta?.type, "swap_exercise");
    } finally {
      await deletePlan(planId);
      await deleteTestUser(user.id);
    }
  },
});

Deno.test({
  name: "swap_recipe updates meal macros and logs audit",
  ignore: !hasSecrets(),
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const user = await createTestUser();
    assert(user, "user creation failed");

    const planId = await insertPlan(user.id);
    const planDayId = await insertPlanDay(planId);
    const [fromRecipe, toRecipe] = await getTwoRecipes();
    await insertMeal(planDayId, fromRecipe);

    try {
      const result = await handleSwapRecipe({
        plan_day_id: planDayId,
        from_recipe_id: fromRecipe.id,
        to_recipe_id: toRecipe.id,
      });

      assert(result.ok, `swap_recipe failed: ${result.error}`);
      assert(result.meal, "Updated meal missing");
      assertEquals(result.meal?.recipe_id, toRecipe.id);
      assertStringIncludes(result.why ?? "", toRecipe.name);

      const audit = await fetchLatestAudit(planId);
      assert(audit, "Audit row not written");
      assertEquals(audit?.delta?.type, "swap_recipe");
    } finally {
      await deletePlan(planId);
      await deleteTestUser(user.id);
    }
  },
});

Deno.test({
  name: "export_grocery_list aggregates ingredients and logs audit",
  ignore: !hasSecrets(),
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const user = await createTestUser();
    assert(user, "user creation failed");

    const planId = await insertPlan(user.id);
    const planDayId = await insertPlanDay(planId);
    const recipes = await getTwoRecipes();
    await insertMeal(planDayId, recipes[0]);
    await insertMeal(planDayId, recipes[1]);

    try {
      const result = await handleExportGrocery({ plan_id: planId });
      assert(result.ok, `export_grocery_list failed: ${result.error}`);
      assert(result.items && result.items.length > 0, "No grocery items returned");
      assertStringIncludes(result.why ?? "", "Exported grocery list");

      const audit = await fetchLatestAudit(planId);
      assert(audit, "Audit row not written");
      assertEquals(audit?.delta?.type, "export_grocery_list");
    } finally {
      await deletePlan(planId);
      await deleteTestUser(user.id);
    }
  },
});
