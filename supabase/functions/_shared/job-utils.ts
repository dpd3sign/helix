import {
  createClient,
  type PostgrestSingleResponse,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.43.4";

export type RunType = "manual" | "cron";

export interface JobLogicResult {
  status: "success" | "failure";
  reason: string;
  rowsAffected?: number;
  notes?: string[];
  errorDetail?: Record<string, unknown> | null;
}

export interface RunJobOptions {
  userId?: string | null;
  notes?: string[];
}

export interface RunJobResponse {
  ok: boolean;
  ran: string;
  started_at: string;
  finished_at: string;
  rows_affected: number;
  notes: string[];
  status: "success" | "failure";
  reason: string;
  job_run_id: string | null;
  error?: Record<string, unknown> | null;
}

export interface JobContext {
  runType: RunType;
}

export type JobLogic = (
  client: SupabaseClient,
  context: JobContext,
) => Promise<JobLogicResult>;

function ensureEnv(): { url: string; serviceRoleKey: string } {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for job execution.",
    );
  }
  return { url, serviceRoleKey: key };
}

function serialiseError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { value: error };
}

async function insertJobRun(
  client: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<PostgrestSingleResponse<{ id: string }>> {
  return await client
    .from("job_runs")
    .insert(payload)
    .select("id")
    .single();
}

export async function runJob(
  jobKey: string,
  runType: RunType,
  logic: JobLogic,
  options: RunJobOptions = {},
): Promise<RunJobResponse> {
  const { url, serviceRoleKey } = ensureEnv();
  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const startedAt = new Date();

  let logicResult: JobLogicResult = {
    status: "success",
    reason: "Job executed with default reason.",
    rowsAffected: 0,
    notes: [],
  };

  try {
    logicResult = await logic(client, { runType });
  } catch (error) {
    console.error(`[${jobKey}] unhandled error`, error);
    logicResult = {
      status: "failure",
      reason: "Unhandled error during job execution.",
      rowsAffected: 0,
      notes: ["Check job logs for stack trace."],
      errorDetail: serialiseError(error),
    };
  }

  const finishedAt = new Date();
  const notes = logicResult.notes ?? [];
  const rowsAffected = logicResult.rowsAffected ?? 0;
  const insertPayload: Record<string, unknown> = {
    job_key: jobKey,
    run_type: runType,
    status: logicResult.status,
    reason: logicResult.reason,
    rows_affected: rowsAffected,
    notes,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    error_detail: logicResult.errorDetail ?? null,
  };

  if (options.userId) {
    insertPayload.user_id = options.userId;
  }

  let jobRunId: string | null = null;
  const insertResponse = await insertJobRun(client, insertPayload);

  if (insertResponse.error) {
    console.error(
      `[${jobKey}] failed to write job_runs entry`,
      insertResponse.error,
    );
    notes.push("Unable to persist job_runs entry; check logs.");
  } else if (insertResponse.data?.id) {
    jobRunId = insertResponse.data.id;
  }

  return {
    ok: logicResult.status === "success",
    ran: jobKey,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    rows_affected: rowsAffected,
    notes,
    status: logicResult.status,
    reason: logicResult.reason,
    job_run_id: jobRunId,
    error: logicResult.errorDetail ?? null,
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
