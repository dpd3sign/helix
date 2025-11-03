import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno&deno-std=0.224.0";

export function getServiceSupabaseClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export async function logPlanAudit(
  client: SupabaseClient,
  planId: string,
  reason: string,
  delta: Record<string, unknown>,
) {
  const { error } = await client.from("audit_regenerations").insert({
    plan_id: planId,
    reason,
    delta,
  });
  if (error) {
    console.error("[audit] failed to insert audit_regenerations row", error);
  }
}

export function appendAdjustment(
  adjustments: unknown,
  entry: Record<string, unknown>,
): Record<string, unknown>[] {
  const existing = Array.isArray(adjustments)
    ? adjustments as Record<string, unknown>[]
    : [];
  return [...existing, entry];
}

export function buildWhySentence(parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");
}
