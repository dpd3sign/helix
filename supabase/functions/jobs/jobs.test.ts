import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { runSyncWearablesJob } from "../job-sync-wearables/index.ts";
import { runRefreshMetricsJob } from "../job-refresh-metrics/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";

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

async function fetchJobRun(id: string) {
  const client = await getClient();
  const { data } = await client.from("job_runs").select("*").eq("id", id)
    .single();
  return data;
}

async function cleanupJobRun(id: string) {
  const client = await getClient();
  await client.from("job_runs").delete().eq("id", id);
}

Deno.test({
  name: "manual sync_wearables job logs audit row",
  ignore: !hasSecrets(),
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const userId = crypto.randomUUID();
    const result = await runSyncWearablesJob("manual", userId);

    assert(result.ok, "Expected job to succeed");
    assert(result.job_run_id, "job_run_id should be present");
    assertEquals(result.ran, "sync_wearables");
    assert(Array.isArray(result.notes), "notes should be an array");

    const row = await fetchJobRun(result.job_run_id);
    assert(row, "job_runs entry should exist");
    assertEquals(row?.job_key, "sync_wearables");
    assertEquals(row?.run_type, "manual");
    assertEquals(row?.user_id, userId);

    await cleanupJobRun(result.job_run_id);
  },
});

Deno.test({
  name: "manual refresh_metric_views job logs audit row",
  ignore: !hasSecrets(),
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const userId = crypto.randomUUID();
    const result = await runRefreshMetricsJob("manual", userId);

    assert(result.ok, "Expected job to succeed");
    assert(result.job_run_id, "job_run_id should be present");
    assertEquals(result.ran, "refresh_metric_views");
    assert(Array.isArray(result.notes), "notes should be an array");

    const row = await fetchJobRun(result.job_run_id);
    assert(row, "job_runs entry should exist");
    assertEquals(row?.job_key, "refresh_metric_views");
    assertEquals(row?.run_type, "manual");
    assertEquals(row?.user_id, userId);

    await cleanupJobRun(result.job_run_id);
  },
});
