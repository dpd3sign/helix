import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

import { runSyncWearablesJob } from "../job-sync-wearables/index.ts";
import { runRefreshMetricsJob } from "../job-refresh-metrics/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";

const shouldSkip = SUPABASE_SERVICE_ROLE_KEY.length === 0;
const client = shouldSkip
  ? null
  : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

async function fetchJobRun(id: string) {
  if (!client) return null;
  const { data } = await client.from("job_runs").select("*").eq("id", id)
    .single();
  return data;
}

async function cleanupJobRun(id: string) {
  if (!client) return;
  await client.from("job_runs").delete().eq("id", id);
}

Deno.test({
  name: "manual sync_wearables job logs audit row",
  ignore: shouldSkip,
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
  ignore: shouldSkip,
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
