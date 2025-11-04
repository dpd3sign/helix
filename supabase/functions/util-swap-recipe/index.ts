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
  plan_day_id?: string; // UUID string (or alias via pickPlanDayId)
  meal_id?: string; // UUID string
  from_recipe_id?: string | null; // UUID | null | "null"
  to_recipe_id?: string | null; // UUID | null | "null"
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
function isSupabaseClient(x: unknown): x is SupabaseClient {
  return !!x && typeof x === "object" && typeof (x as any).from === "function";
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
/** UUID-ish check (let Postgres enforce real UUID when non-null) */
function looksLikeUuid(u: string | null): u is string {
  if (!u) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(u);
}
/** Accept common aliases for plan_day_id */
function pickPlanDayId(raw: Record<string, unknown>): string | "" {
  const cands = [
    raw.plan_day_id,
    (raw as any).planDayId,
    (raw as any).plan_day,
    (raw as any).planId,
  ];
  for (const v of cands) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

async function fetchMealById(client: SupabaseClient, mealId: string) {
  return await client
    .from("meals")
    .select(
      "id, plan_day_id, name, meal_type, kcal, protein_g, carbs_g, fat_g, recipe_id",
    )
    .eq("id", mealId)
    .maybeSingle();
}
async function fetchMealByKeys(
  client: SupabaseClient,
  planDayId: string | "",
  fromRecipeId: string | null,
  mealType?: string,
) {
  let q = client
    .from("meals")
    .select(
      "id, plan_day_id, name, meal_type, kcal, protein_g, carbs_g, fat_g, recipe_id",
    );
  if (planDayId) q = q.eq("plan_day_id", planDayId);
  q = fromRecipeId === null
    ? q.is("recipe_id", null)
    : q.eq("recipe_id", fromRecipeId);
  if (mealType && mealType.trim()) q = q.eq("meal_type", mealType.trim());
  if (!planDayId) q = q.order("created_at", { ascending: false });
  return await q.maybeSingle();
}

/* ---------------- core handler ---------------- */

/**
 * Flexible signature:
 * - handleSwapRecipe(client, body)
 * - handleSwapRecipe(body)
 * - handleSwapRecipe(body, client)
 */
export async function handleSwapRecipe(
  a: unknown,
  b?: unknown,
): Promise<SwapRecipeResponse> {
  let client: SupabaseClient;
  let body: unknown;

  if (isSupabaseClient(a)) {
    client = a;
    body = b;
  } else if (isSupabaseClient(b)) {
    client = b;
    body = a;
  } else {
    client = getServiceSupabaseClient({ persistSession: false });
    body = a;
  }

  const raw = isRecord(body) ? body : {};
  const meal_id = typeof raw.meal_id === "string" ? raw.meal_id.trim() : "";
  const plan_day_id = pickPlanDayId(raw);
  const meal_type = typeof raw.meal_type === "string"
    ? raw.meal_type
    : undefined;

  const from_recipe_id = normalizeUuid(raw.from_recipe_id);
  const to_recipe_id = normalizeUuid(raw.to_recipe_id);

  // 1) Locate source meal
  let meal:
    | {
      id: string;
      plan_day_id: string;
      name: string | null;
      meal_type: string | null;
      kcal: number | null;
      protein_g: number | null;
      carbs_g: number | null;
      fat_g: number | null;
      recipe_id: string | null;
    }
    | null = null;

  if (meal_id) {
    const { data, error } = await fetchMealById(client, meal_id);
    if (error) {
      return {
        ok: false,
        error: `Failed to locate meal by id: ${error.message}`,
      };
    }
    meal = data;
  } else {
    const { data, error } = await fetchMealByKeys(
      client,
      plan_day_id,
      from_recipe_id,
      meal_type,
    );
    if (error) {
      return { ok: false, error: `Failed to locate meal: ${error.message}` };
    }
    meal = data;
  }
  if (!meal) {
    return {
      ok: false,
      error:
        "No matching meal found (provide meal_id, or plan_day_id(+alias) with from_recipe_id and optional meal_type).",
    };
  }

  // 2) Explanation (for audit/UX)
  const why = `Swapped recipe on meal "${meal.name ?? "Meal"}" ${
    from_recipe_id === null ? "(from NULL)" : `from ${meal.recipe_id}`
  } → ${to_recipe_id === null ? "(left unchanged)" : to_recipe_id}.`;

  // 3) Update only when we have a real UUID target; skip prefetch and trust FK
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
    const { error: updErr } = await client.from("meals").update(updatePayload)
      .eq("id", meal.id);
    if (updErr) return { ok: false, error: `Update failed: ${updErr.message}` };
  }

  // 4) Audit (tolerant)
  try {
    await logPlanAudit(
      client,
      meal.plan_day_id,
      `Swap recipe: ${meal.name ?? "Meal"} → ${to_recipe_id ?? "(unchanged)"}`,
      {
        type: "swap_recipe",
        plan_day_id: meal.plan_day_id,
        meal_id: meal.id,
        from: { id: from_recipe_id },
        to: { id: to_recipe_id },
        why,
      },
    );
  } catch {
    // don't block success on audit failure
  }

  return { ok: true, meal_id: meal.id, from_recipe_id, to_recipe_id, why };
}

/* ---------------- Edge entrypoint ---------------- */

serve(async (req: Request) => {
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
    const result = await handleSwapRecipe(raw);
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
