import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

import { corsHeaders } from "../_shared/job-utils.ts";
import { buildWhySentence, getServiceSupabaseClient, logPlanAudit } from "../_shared/plan-utils.ts";

type ExportRequest = {
  plan_id: string;
};

type PlanRow = {
  id: string;
  start_date: string | null;
};

type PlanDayRow = {
  id: string;
  date: string | null;
};

type RecipeEmbed = {
  id?: string;
  name?: string;
  ingredients?: unknown;
} | null;

type MealWithRecipe = {
  id: string;
  plan_day_id: string;
  meal_type: string;
  name: string;
  recipe: RecipeEmbed | RecipeEmbed[] | null;
};

type GroceryItem = {
  item: string;
  quantities: string[];
};

type ExportResponse = {
  ok: boolean;
  plan_id?: string;
  items?: GroceryItem[];
  why?: string;
  error?: string;
};

async function fetchPlan(client: SupabaseClient, planId: string): Promise<PlanRow | null> {
  const { data, error } = await client
    .from("plans")
    .select("id, start_date")
    .eq("id", planId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchPlanDays(client: SupabaseClient, planId: string): Promise<PlanDayRow[]> {
  const { data, error } = await client
    .from("plan_days")
    .select("id, date")
    .eq("plan_id", planId);
  if (error) throw error;
  return data ?? [];
}

async function fetchMeals(client: SupabaseClient, planDayIds: string[]): Promise<MealWithRecipe[]> {
  if (planDayIds.length === 0) return [];
  const { data, error } = await client
    .from("meals")
    .select("id, plan_day_id, meal_type, name, recipe:recipes(id, name, ingredients)")
    .in("plan_day_id", planDayIds);
  if (error) throw error;
  return data ?? [];
}

function normalizeIngredients(meals: MealWithRecipe[]): GroceryItem[] {
  const map = new Map<string, string[]>();

  for (const meal of meals) {
    const recipe = Array.isArray(meal.recipe) ? meal.recipe[0] ?? null : meal.recipe;
    const ingredients = Array.isArray(recipe?.ingredients)
      ? recipe?.ingredients as unknown[]
      : [];
    if (ingredients.length === 0) continue;
    for (const ingredient of ingredients) {
      if (!ingredient || typeof ingredient !== "object") continue;
      const ing = ingredient as Record<string, unknown>;
      const itemField = ing.item ?? ing.name;
      const itemName = typeof itemField === "string"
        ? itemField
        : "Unspecified item";
      const amountField = ing.amount ?? ing.quantity;
      const amount = typeof amountField === "string"
        ? amountField
        : "1 unit";
      const key = itemName.trim().toLowerCase();
      const existing = map.get(key) ?? [];
      existing.push(amount);
      map.set(key, existing);
    }
  }

  return Array.from(map.entries())
    .map(([itemKey, quantities]) => ({
      item: itemKey,
      quantities,
    }))
    .sort((a, b) => a.item.localeCompare(b.item));
}

function buildExportWhy(plan: PlanRow, planDays: PlanDayRow[], meals: MealWithRecipe[], items: GroceryItem[]): string {
  const parts = [
    `Exported grocery list for plan starting ${plan.start_date ?? "unscheduled"}.`,
    `Covers ${planDays.length} plan days and ${meals.length} meals.`,
    `Aggregated ${items.length} unique ingredients to streamline shopping.`,
  ];
  return buildWhySentence(parts);
}

async function exportGroceryList(data: ExportRequest): Promise<ExportResponse> {
  if (!data.plan_id) {
    return { ok: false, error: "plan_id is required." };
  }

  const client = getServiceSupabaseClient();
  const plan = await fetchPlan(client, data.plan_id);
  if (!plan) {
    return { ok: false, error: "Plan not found." };
  }

  const planDays = await fetchPlanDays(client, plan.id);
  const planDayIds = planDays.map((day) => day.id);
  const meals = await fetchMeals(client, planDayIds);
  const items = normalizeIngredients(meals);
  const why = buildExportWhy(plan, planDays, meals, items);

  await logPlanAudit(client, plan.id, "Export grocery list", {
    type: "export_grocery_list",
    plan_id: plan.id,
    plan_day_count: planDays.length,
    meal_count: meals.length,
    unique_items: items.length,
    why,
  });

  return {
    ok: true,
    plan_id: plan.id,
    items,
    why,
  };
}

export async function handleExportGrocery(body: ExportRequest): Promise<ExportResponse> {
  try {
    return await exportGroceryList(body);
  } catch (error) {
    console.error("[export_grocery_list] unexpected error", error);
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
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({})) as ExportRequest;
    const result = await handleExportGrocery(body);
    const status = result.ok ? 200 : 400;
    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  });
}
