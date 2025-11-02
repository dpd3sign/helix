import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

import {
  corsHeaders,
  runJob,
  type JobLogicResult,
  type RunJobResponse,
} from "../_shared/job-utils.ts";
import { buildWhySentence } from "../_shared/plan-utils.ts";

type MockRecord = {
  date: string;
  steps: number;
  hrv_rmssd: number;
  rhr: number;
  sleep_score: number;
};

type ImportResponse = {
  ok: boolean;
  reason?: string;
  rows_affected?: number;
  notes?: string[];
  why?: string;
  job_run_id?: string | null;
  error?: string;
};

const JOB_KEY = "mock_import";
const MOCK_PATH = new URL("../__mocks__/wearables/weekly.json", import.meta.url).pathname;

function ensureEnv(): { url: string; serviceRoleKey: string } {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return { url, serviceRoleKey: key };
}

async function loadMockData(): Promise<MockRecord[]> {
  const json = await Deno.readTextFile(MOCK_PATH);
  const parsed = JSON.parse(json);
  return Array.isArray(parsed) ? parsed as MockRecord[] : [];
}

async function upsertWearables(
  client: SupabaseClient,
  userId: string,
  records: MockRecord[],
): Promise<number> {
  if (records.length === 0) return 0;
  const rows = records.map((record) => ({
    user_id: userId,
    provider: "mock",
    date: record.date,
    steps: record.steps,
    hrv_rmssd: record.hrv_rmssd,
    resting_hr: record.rhr,
    sleep_score: record.sleep_score,
    calories_burned: 0,
    timezone: "UTC",
    synced_at: new Date().toISOString(),
  }));

  const { data, error } = await client
    .from("wearable_daily_metrics")
    .upsert(rows, { onConflict: "user_id,date,provider" })
    .select("id");

  if (error) throw error;
  return Array.isArray(data) ? data.length : 0;
}

async function importMockData(userId: string): Promise<JobLogicResult> {
  const { url, serviceRoleKey } = ensureEnv();
  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const notes: string[] = [];
  const records = await loadMockData();
  if (records.length === 0) {
    return {
      status: "failure",
      reason: "No mock records found.",
      rowsAffected: 0,
      notes,
    };
  }

  const rowsAffected = await upsertWearables(client, userId, records);
  notes.push(`Upserted ${rowsAffected} mock wearable records for ${userId}.`);

  const { error: refreshError } = await client.rpc("refresh_metric_views");
  if (refreshError) {
    notes.push("refresh_metric_views failed; metrics may be outdated.");
  } else {
    notes.push("refresh_metric_views executed to sync analytics.");
  }

  const why = buildWhySentence([
    "Imported mock wearable metrics to simulate readiness feedback.",
    "Useful for server-side validation before live wearable integrations.",
  ]);

  return {
    status: "success",
    reason: "mock_import",
    rowsAffected,
    notes: [...notes, why],
  };
}

async function execute(userId: string): Promise<ImportResponse> {
  const result = await runJob(
    JOB_KEY,
    "manual",
    async () => await importMockData(userId),
    { userId },
  );

  return {
    ok: result.ok,
    reason: result.reason,
    rows_affected: result.rows_affected,
    notes: result.notes,
    why: result.notes[result.notes.length - 1],
    job_run_id: result.job_run_id,
  };
}

if (import.meta.main) {
  serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.user_id === "string" ? body.user_id : null;
    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await execute(userId);
    const status = result.ok ? 200 : 500;
    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  });
}

export { execute as runMockImport };
