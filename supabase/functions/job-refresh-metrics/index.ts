import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

import {
  corsHeaders,
  type JobLogicResult,
  runJob,
  type RunJobResponse,
  type RunType,
} from "../_shared/job-utils.ts";

const JOB_KEY = "refresh_metric_views";

async function refreshMetrics(client: SupabaseClient): Promise<JobLogicResult> {
  const notes: string[] = [];
  const { error } = await client.rpc("refresh_metric_views");

  if (error) {
    console.error("[refresh_metric_views] RPC error", error);
    notes.push("refresh_metric_views RPC threw an error; check error_detail.");
    return {
      status: "failure",
      reason: "refresh_metric_views RPC failed.",
      rowsAffected: 0,
      notes,
      errorDetail: {
        ...(error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { value: error }),
      },
    };
  }

  notes.push("Materialized views refreshed to keep dashboards current.");
  return {
    status: "success",
    reason: "Metric materialized views refreshed for analytics.",
    rowsAffected: 0,
    notes,
  };
}

async function execute(
  runType: RunType,
  userId?: string | null,
): Promise<RunJobResponse> {
  return await runJob(
    JOB_KEY,
    runType,
    async (client) => await refreshMetrics(client),
    { userId: userId ?? undefined },
  );
}

function extractManualUserId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  if ("user_id" in body && typeof body.user_id === "string") {
    return body.user_id;
  }
  return null;
}

function buildResponsePayload(result: RunJobResponse) {
  return {
    ok: result.ok,
    ran: result.ran,
    started_at: result.started_at,
    finished_at: result.finished_at,
    rows_affected: result.rows_affected,
    notes: result.notes,
  };
}

export async function runRefreshMetricsJob(
  runType: RunType,
  userId?: string | null,
) {
  return await execute(runType, userId);
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

    const isCron = req.headers.get("x-supabase-cron") === "true";
    const runType: RunType = isCron ? "cron" : "manual";
    let userId: string | null = null;

    if (runType === "manual") {
      const body = await req.json().catch(() => ({}));
      userId = extractManualUserId(body);
    }

    const result = await execute(runType, userId);
    const status = result.ok ? 200 : 500;

    return new Response(JSON.stringify(buildResponsePayload(result)), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  });
}
