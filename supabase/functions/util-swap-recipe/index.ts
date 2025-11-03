import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno&deno-std=0.224.0";

import { corsHeaders } from "../_shared/job-utils.ts";
import {
  appendAdjustment,
  buildWhySentence,
  getServiceSupabaseClient,
  logPlanAudit,
} from "../_shared/plan-utils.ts";

type SwapRecipeRequest = {
  plan_day_id: string;
  from_recipe_id: string;
  to_recipe_id: string;
  meal_type?: string;
};

type PlanDayRow = {
  id: string;
  plan_id: string;
  adjustments_made: unknown;
};

type MealRow = {
  id: string;
  plan_day_id: string;
  name: string;
  meal_type: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  recipe_id: string | null;
};

type RecipeRow = {
  id: string;
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  diet_type: string;
  tags: Record<string, unknown>;
};

type SwapRecipeResponse = {
  ok: boolean;
  plan_id?: string;
  plan_day_id?: string;
  meal_id?: string;
  why?: string;
  meal?: MealRow;
  error?: string;
};

async function fetchPlanDay(
  client: SupabaseClient,
  planDayId: string,
): Promise<PlanDayRow | null> {
  const { data, error } = await client
    .from("plan_days")
    .select("id, plan_id, adjustments_made")
    .eq("id", planDayId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchMeal(
  client: SupabaseClient,
  planDayId: string,
  recipeId: string,
  mealType?: string,
): Promise<MealRow | null> {
  let query = client
    .from("meals")
    .select(
      "id, plan_day_id, name, meal_type, kcal, protein_g, carbs_g, fat_g, recipe_id",
    )
    .eq("plan_day_id", planDayId)
    .eq("recipe_id", recipeId)
    .limit(1);

  if (mealType) {
    query = query.eq("meal_type", mealType);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchRecipe(
  client: SupabaseClient,
  id: string,
): Promise<RecipeRow | null> {
  const { data, error } = await client
    .from("recipes")
    .select("id, name, kcal, protein_g, carbs_g, fat_g, diet_type, tags")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function buildRecipeWhy(oldRecipe: RecipeRow, newRecipe: RecipeRow): string {
  const deltaCalories = newRecipe.kcal - oldRecipe.kcal;
  const deltaProtein = newRecipe.protein_g - oldRecipe.protein_g;

  const parts: string[] = [
    `Swapped ${oldRecipe.name} for ${newRecipe.name}.`,
  ];

  if (deltaProtein !== 0) {
    const direction = deltaProtein > 0 ? "adds" : "reduces";
    parts.push(
      `${direction} ${
        Math.abs(deltaProtein)
      }g protein to support the day's macro target.`,
    );
  }

  if (deltaCalories !== 0) {
    const direction = deltaCalories > 0 ? "adds" : "removes";
    parts.push(
      `${direction} ${
        Math.abs(deltaCalories)
      } kcal to keep energy aligned with the plan.`,
    );
  }

  if (newRecipe.diet_type !== oldRecipe.diet_type) {
    parts.push(
      `Aligns with the ${newRecipe.diet_type} preference for this phase.`,
    );
  }

  return buildWhySentence(parts);
}

async function swapRecipe(
  data: SwapRecipeRequest,
): Promise<SwapRecipeResponse> {
  if (!data.plan_day_id || !data.from_recipe_id || !data.to_recipe_id) {
    return { ok: false, error: "Missing required fields." };
  }

  const client = getServiceSupabaseClient();
  const planDay = await fetchPlanDay(client, data.plan_day_id);
  if (!planDay) {
    return { ok: false, error: "Plan day not found." };
  }

  const meal = await fetchMeal(
    client,
    data.plan_day_id,
    data.from_recipe_id,
    data.meal_type,
  );
  if (!meal) {
    return { ok: false, error: "Meal with the specified recipe not found." };
  }

  const fromRecipe = await fetchRecipe(client, data.from_recipe_id);
  const toRecipe = await fetchRecipe(client, data.to_recipe_id);
  if (!fromRecipe || !toRecipe) {
    return { ok: false, error: "One of the recipes could not be found." };
  }

  const why = buildRecipeWhy(fromRecipe, toRecipe);

  const updatedMeal: Partial<MealRow> = {
    name: toRecipe.name,
    meal_type: meal.meal_type,
    kcal: toRecipe.kcal,
    protein_g: toRecipe.protein_g,
    carbs_g: toRecipe.carbs_g,
    fat_g: toRecipe.fat_g,
    recipe_id: toRecipe.id,
  };

  const { error: updateError } = await client
    .from("meals")
    .update(updatedMeal)
    .eq("id", meal.id);
  if (updateError) throw updateError;

  const adjustmentEntry = {
    type: "swap_recipe",
    at: new Date().toISOString(),
    meal_id: meal.id,
    from_recipe_id: fromRecipe.id,
    to_recipe_id: toRecipe.id,
    why,
  };

  await client
    .from("plan_days")
    .update({
      adjustments_made: appendAdjustment(
        planDay.adjustments_made,
        adjustmentEntry,
      ),
    })
    .eq("id", planDay.id);

  await logPlanAudit(
    client,
    planDay.plan_id,
    `Swap recipe: ${fromRecipe.name} → ${toRecipe.name}`,
    {
      type: "swap_recipe",
      plan_day_id: planDay.id,
      meal_id: meal.id,
      from: { id: fromRecipe.id, name: fromRecipe.name },
      to: { id: toRecipe.id, name: toRecipe.name },
      why,
    },
  );

  return {
    ok: true,
    plan_id: planDay.plan_id,
    plan_day_id: planDay.id,
    meal_id: meal.id,
    why,
    meal: {
      ...meal,
      ...updatedMeal,
    } as MealRow,
  };
}

export async function handleSwapRecipe(
  body: SwapRecipeRequest,
): Promise<SwapRecipeResponse> {
  try {
    return await swapRecipe(body);
  } catch (error) {
    console.error("[swap_recipe] unexpected error", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error.",
    };
  }
}

if (import.meta.main) {
  serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const body = await req.json().catch(() => ({})) as SwapRecipeRequest;
    const result = await handleSwapRecipe(body);
    const status = result.ok ? 200 : 400;
    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  });
}
