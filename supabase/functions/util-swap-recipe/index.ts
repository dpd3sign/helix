import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno&deno-std=0.224.0";
import {
  getServiceSupabaseClient,
  logPlanAudit,
} from "../_shared/plan-utils.ts";

/** Basic CORS headers for Edge Functions */
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

/** Request body shape the function accepts */
type SwapRecipeRequest = {
  plan_day_id: string; // UUID (string)
  from_recipe_id: string | null; // UUID string or "null" or null
  to_recipe_id: string | null; // UUID string or "null" or null
  meal_type?: string; // optional filter (breakfast/lunch/dinner/snack)
};

/** Function response */
type SwapRecipeResponse = {
  ok: boolean;
  meal_id?: string;
  from_recipe_id?: string | null;
  to_recipe_id?: string | null;
  why?: string;
  error?: string;
};

/** Coerce "null" (string) → null, trim whitespace, pass through UUID-like strings */
function normalizeUuid(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim().toLowerCase() === "null") {
    return null;
  }
  const s = String(value).trim();
  return s.length ? s : null;
}

/** Light UUID-ish check (let Postgres enforce real UUID when non-null) */
function looksLikeUuid(u: string | null): u is string {
  if (!u) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(
      u,
    );
}

/** Fetch the target meal row using plan_day_id + (from_recipe_id or IS NULL) + optional meal_type */
async function fetchMeal(
  client: SupabaseClient,
  planDayId: string,
  fromRecipeId: string | null,
  mealType?: string,
) {
  let q = client
    .from("meals")
    .select(
      "id, plan_day_id, name, meal_type, kcal, protein_g, carbs_g, fat_g, recipe_id",
    )
    .eq("plan_day_id", planDayId);

  q = fromRecipeId === null
    ? q.is("recipe_id", null)
    : q.eq("recipe_id", fromRecipeId);
  if (mealType && mealType.trim()) q = q.eq("meal_type", mealType.trim());

  return await q.maybeSingle();
}

/** Fetch a recipe by id (tolerant) */
async function fetchRecipe(client: SupabaseClient, id: string | null) {
  if (!id || !looksLikeUuid(id)) return { data: null, error: null };
  return await client
    .from("recipes")
    .select("id, name, kcal, protein_g, carbs_g, fat_g, ingredients, diet_type")
    .eq("id", id)
    .maybeSingle();
}

/** Core handler: swap a meal's recipe_id safely */
export async function handleSwapRecipe(
  client: SupabaseClient,
  body: SwapRecipeRequest,
): Promise<SwapRecipeResponse> {
  const plan_day_id = body.plan_day_id;
  const meal_type = body.meal_type;

  // Sanitize inputs from request
  const from_recipe_id = normalizeUuid(body.from_recipe_id);
  const to_recipe_id = normalizeUuid(body.to_recipe_id);

  if (!plan_day_id || typeof plan_day_id !== "string") {
    return { ok: false, error: "plan_day_id is required" };
  }

  // 1) Locate the source meal
  const { data: meal, error: mealErr } = await fetchMeal(
    client,
    plan_day_id,
    from_recipe_id,
    meal_type,
  );

  if (mealErr) {
    return { ok: false, error: `Failed to locate meal: ${mealErr.message}` };
  }
  if (!meal) {
    return {
      ok: false,
      error:
        "No matching meal found (check plan_day_id, from_recipe_id, and meal_type).",
    };
  }

  // 2) Resolve target recipe (if provided) — allow NULL (meaning: do not set)
  let toRecipeName = "unchanged";
  if (to_recipe_id !== null) {
    const { data: r2, error: r2Err } = await fetchRecipe(client, to_recipe_id);
    if (r2Err) {
      return {
        ok: false,
        error: `Failed to fetch new recipe: ${r2Err.message}`,
      };
    }
    if (!r2) {
      return {
        ok: false,
        error: "to_recipe_id not found (or not a valid UUID).",
      };
    }
    toRecipeName = r2.name ?? "new recipe";
  }

  // (Optional) explain WHY (macro deltas, etc.) — keep lightweight here
  const why = `Swapped recipe on meal "${meal.name ?? "Meal"}" ${
    from_recipe_id === null ? "(from NULL)" : `from ${meal.recipe_id}`
  } → ${to_recipe_id === null ? "(left unchanged)" : to_recipe_id}.`;

  // 3) Build update payload — only set recipe_id if we actually have a UUID
  const updatePayload: Record<string, unknown> = {};
  if (to_recipe_id !== null) {
    // only assign if a real UUID-like string (let Postgres enforce true UUID)
    if (!looksLikeUuid(to_recipe_id)) {
      return {
        ok: false,
        error: `Invalid to_recipe_id format (received "${to_recipe_id}")`,
      };
    }
    updatePayload.recipe_id = to_recipe_id;
  }
  // (Optionally recompute kcal/macros if your app expects that here.)

  // If there's literally nothing to update (to_recipe_id === null), we still "succeed" for UX consistency.
  if (Object.keys(updatePayload).length > 0) {
    const { error: updErr } = await client
      .from("meals")
      .update(updatePayload)
      .eq("id", meal.id);

    if (updErr) {
      return {
        ok: false,
        error: `Update failed: ${updErr.message}`,
      };
    }
  }

  // 4) Audit trail (tolerant)
  try {
    await logPlanAudit(
      client,
      plan_day_id, /* using plan_day as context */
      `Swap recipe: ${meal.name ?? "Meal"} → ${toRecipeName}`,
      {
        type: "swap_recipe",
        plan_day_id,
        meal_id: meal.id,
        from: { id: from_recipe_id },
        to: { id: to_recipe_id },
        why,
      },
    );
  } catch (_e) {
    // ignore audit failures; do not block success
  }

  return {
    ok: true,
    meal_id: meal.id,
    from_recipe_id,
    to_recipe_id,
    why,
  };
}

/** Edge handler */
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = (await req.json()) as SwapRecipeRequest;

    const client = getServiceSupabaseClient({
      persistSession: false,
    });

    const result = await handleSwapRecipe(client, body);

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: corsHeaders,
    });
  } catch (e) {
    const err = e as Error;
    console.error("[swap_recipe] unexpected error", { message: err.message });
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unexpected error",
        why: err.message,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
