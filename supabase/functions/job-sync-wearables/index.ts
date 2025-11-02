import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

import {
  corsHeaders,
  runJob,
  type JobLogicResult,
  type RunJobResponse,
  type RunType,
} from "../_shared/job-utils.ts";

const JOB_KEY = "sync_wearables";

async function performSync(client: SupabaseClient): Promise<JobLogicResult> {
  const notes: string[] = [];
  try {
    const { data, error } = await client.rpc("sync_wearables");
    if (error) {
      const message = (error.message ?? "").toLowerCase();
      const details = (error.details ?? "").toLowerCase();
      const missingFunction = message.includes("could not find the function") ||
        details.includes("no matches were found") ||
        message.includes("does not exist");

      // treat missing RPC as a soft success so we can enable the schedule before integrations land.
      if (missingFunction) {
        notes.push("sync_wearables RPC not configured yet; recorded placeholder run.");
        return {
          status: "success",
          reason: "Wearable sync placeholder run (RPC not configured).",
          rowsAffected: 0,
          notes,
        };
      }
      throw error;
    }

    const rowsAffected = typeof data === "number"
      ? data
      : Array.isArray(data)
      ? data.length
      : 0;

    notes.push(`sync_wearables RPC executed (${rowsAffected} records processed).`);
    return {
      status: "success",
      reason: "Wearable integrations refreshed via sync_wearables RPC.",
      rowsAffected,
      notes,
    };
  } catch (error) {
    console.error("[sync_wearables] RPC error", error);
    notes.push("sync_wearables RPC threw an error; see error_detail for context.");
    return {
      status: "failure",
      reason: "sync_wearables RPC failed.",
      rowsAffected: 0,
      notes,
      errorDetail: {
        ...(error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { value: error }),
      },
    };
  }
}

async function execute(runType: RunType, userId?: string | null): Promise<RunJobResponse> {
  return await runJob(
    JOB_KEY,
    runType,
    async (client) => await performSync(client),
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

export async function runSyncWearablesJob(runType: RunType, userId?: string | null) {
  return await execute(runType, userId);
}

if (import.meta.main) {
  serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
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
