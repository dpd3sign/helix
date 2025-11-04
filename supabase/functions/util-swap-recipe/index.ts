import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno&deno-std=0.224.0";
import {
  getServiceSupabaseClient,
  logPlanAudit,
} from "../_shared/plan-utils.ts";

/** CORS */
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

type SwapRecipeRequest = {
  plan_day_id: string; // UUID string
  from_recipe_id: string | null; // UUID or null or "null"
  to_recipe_id: string | null; // UUID or null or "null"
  meal_type?: string;
};

type SwapRecipeResponse = {
  ok: boolean;
  meal_id?: string;
  from_recipe_id?: string | null;
  to_recipe_id?: string | null;
  why?: string;
  error?: string;
};

/* ---------------- helpers ---------------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

/** Coerce "null" string -> null; normalize unknown to string|null */
function normalizeUuid(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim().toLowerCase() === "null") {
    return null;
  }
  const s = String(value).trim();
  return s.length ? s : null;
}

function looksLikeUuid(u: string | null): u is string {
  if (!u) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(u);
}

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

async function fetchRecipe(client: SupabaseClient, id: string | null) {
  if (!id || !looksLikeUuid(id)) return { data: null, error: null };
  return await client
    .from("recipes")
    .select("id, name, kcal, protein_g, carbs_g, fat_g, ingredients, diet_type")
    .eq("id", id)
    .maybeSingle();
}

/* ---------------- core handler (used by tests) ---------------- */

export async function handleSwapRecipe(
  client: SupabaseClient,
  body: unknown, // make tolerant: tests may pass undefined in some paths
): Promise<SwapRecipeResponse> {
  // Defensive parse of body
  const raw = isRecord(body) ? body : {};
  const plan_day_id = typeof raw.plan_day_id === "string"
    ? raw.plan_day_id
    : "";
  const meal_type = typeof raw.meal_type === "string"
    ? raw.meal_type
    : undefined;

  const from_recipe_id = normalizeUuid(raw.from_recipe_id);
  const to_recipe_id = normalizeUuid(raw.to_recipe_id);

  if (!plan_day_id) {
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

  // 2) Resolve the target recipe (if provided)
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

  const why = `Swapped recipe on meal "${meal.name ?? "Meal"}" ${
    from_recipe_id === null ? "(from NULL)" : `from ${meal.recipe_id}`
  } → ${to_recipe_id === null ? "(left unchanged)" : to_recipe_id}.`;

  // 3) Build update payload; only set recipe_id if we have a valid UUID string
  const updatePayload: Record<string, unknown> = {};
  if (to_recipe_id !== null) {
    if (!looksLikeUuid(to_recipe_id)) {
      return {
        ok: false,
        error: `Invalid to_recipe_id format (received "${to_recipe_id}")`,
      };
    }
    updatePayload.recipe_id = to_recipe_id;
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: updErr } = await client
      .from("meals")
      .update(updatePayload)
      .eq("id", meal.id);

    if (updErr) return { ok: false, error: `Update failed: ${updErr.message}` };
  }

  // 4) Audit (tolerant — don't fail success if audit write fails)
  try {
    await logPlanAudit(
      client,
      plan_day_id,
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
  } catch {
    // ignore audit failure
  }

  return {
    ok: true,
    meal_id: meal.id,
    from_recipe_id,
    to_recipe_id,
    why,
  };
}

/* ---------------- Edge entrypoint ---------------- */

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method Not Allowed" }),
      {
        status: 405,
        headers: corsHeaders,
      },
    );
  }

  try {
    const raw = await req.json().catch(() => ({}));
    const client = getServiceSupabaseClient({ persistSession: false });
    const result = await handleSwapRecipe(client, raw);
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
