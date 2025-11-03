import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4?target=deno&deno-std=0.224.0";

import { corsHeaders } from "../_shared/job-utils.ts";
import {
  appendAdjustment,
  buildWhySentence,
  getServiceSupabaseClient,
  logPlanAudit,
} from "../_shared/plan-utils.ts";

type SwapExerciseRequest = {
  plan_day_id: string;
  from_exercise_id: string;
  to_exercise_id: string;
  user_id?: string;
};

type WorkoutRow = {
  id: string;
  plan_day_id: string;
  blocks: unknown;
};

type PlanDayRow = {
  id: string;
  plan_id: string;
  adjustments_made: unknown;
};

type ExerciseRow = {
  id: string;
  name: string;
  tags: Record<string, unknown>;
};

type WorkoutBlock = {
  title?: string;
  exercises?: ExerciseEntry[];
  [key: string]: unknown;
};

type ExerciseEntry = {
  exercise_id?: string;
  name?: string;
  [key: string]: unknown;
};

type SwapResponse = {
  ok: boolean;
  plan_id?: string;
  plan_day_id?: string;
  workout_id?: string;
  why?: string;
  blocks?: unknown;
  audit_id?: number | null;
  error?: string;
};

function getTagArray(tags: Record<string, unknown>, key: string): string[] {
  const value = tags?.[key];
  return Array.isArray(value) ? value as string[] : [];
}

async function fetchPlanDay(
  client: SupabaseClient,
  planDayId: string,
): Promise<PlanDayRow | null> {
  const { data, error } = await client
    .from("plan_days")
    .select("id, plan_id, adjustments_made")
    .eq("id", planDayId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchWorkouts(
  client: SupabaseClient,
  planDayId: string,
): Promise<WorkoutRow[]> {
  const { data, error } = await client
    .from("workouts")
    .select("id, plan_day_id, blocks")
    .eq("plan_day_id", planDayId);
  if (error) throw error;
  return data ?? [];
}

async function fetchExercise(
  client: SupabaseClient,
  id: string,
): Promise<ExerciseRow | null> {
  const { data, error } = await client
    .from("exercises")
    .select("id, name, tags")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function enrichBlocks(
  blocks: unknown,
  fromExercise: ExerciseRow,
  toExercise: ExerciseRow,
  fromId: string,
  toId: string,
) {
  if (!Array.isArray(blocks)) return { blocks, updated: false };
  let updated = false;
  const updatedBlocks = (blocks as WorkoutBlock[]).map((block) => {
    if (!block || typeof block !== "object") return block;
    const exercises = Array.isArray(block.exercises) ? block.exercises : [];
    const nextExercises = exercises.map((exerciseEntry: ExerciseEntry) => {
      if (
        exerciseEntry &&
        typeof exerciseEntry === "object" &&
        "exercise_id" in exerciseEntry &&
        exerciseEntry.exercise_id === fromId
      ) {
        updated = true;
        return {
          ...exerciseEntry,
          exercise_id: toId,
          name: toExercise.name,
          swapped_at: new Date().toISOString(),
        };
      }
      return exerciseEntry;
    });
    return { ...block, exercises: nextExercises };
  });
  return { blocks: updatedBlocks, updated };
}

function buildExerciseWhy(
  fromExercise: ExerciseRow,
  toExercise: ExerciseRow,
): string {
  const fromPatterns = getTagArray(fromExercise.tags ?? {}, "pattern");
  const toPatterns = getTagArray(toExercise.tags ?? {}, "pattern");
  const toEquipment = getTagArray(toExercise.tags ?? {}, "equipment");
  const focus = getTagArray(toExercise.tags ?? {}, "focus");

  const parts: string[] = [
    `Swapped ${fromExercise.name} for ${toExercise.name}.`,
  ];

  if (toPatterns.length > 0) {
    if (fromPatterns.some((p) => toPatterns.includes(p))) {
      parts.push(
        `Maintains the ${
          toPatterns.join("/")
        } pattern while offering a fresh stimulus.`,
      );
    } else {
      parts.push(
        `Shifts focus toward the ${
          toPatterns.join("/")
        } pattern for balanced development.`,
      );
    }
  }

  if (toEquipment.length > 0) {
    parts.push(`Matches available equipment (${toEquipment.join(", ")}).`);
  }

  if (focus.length > 0) {
    parts.push(
      `Targets ${focus.join(", ")} to align with current training priorities.`,
    );
  }

  return buildWhySentence(parts);
}

async function updatePlanDayAdjustments(
  client: SupabaseClient,
  planDay: PlanDayRow,
  entry: Record<string, unknown>,
) {
  const updatedAdjustments = appendAdjustment(planDay.adjustments_made, entry);
  const { error } = await client
    .from("plan_days")
    .update({ adjustments_made: updatedAdjustments })
    .eq("id", planDay.id);
  if (error) {
    console.error(
      "[swap_exercise] failed to update plan_day adjustments",
      error,
    );
  }
}

async function swapExercise(data: SwapExerciseRequest): Promise<SwapResponse> {
  if (!data.plan_day_id || !data.from_exercise_id || !data.to_exercise_id) {
    return { ok: false, error: "Missing required fields." };
  }

  const client = getServiceSupabaseClient();
  const planDay = await fetchPlanDay(client, data.plan_day_id);
  if (!planDay) {
    return { ok: false, error: "Plan day not found." };
  }

  const workouts = await fetchWorkouts(client, data.plan_day_id);
  if (workouts.length === 0) {
    return { ok: false, error: "No workouts scheduled for this day." };
  }

  const fromExercise = await fetchExercise(client, data.from_exercise_id);
  if (!fromExercise) {
    return { ok: false, error: "Original exercise not found." };
  }

  const toExercise = await fetchExercise(client, data.to_exercise_id);
  if (!toExercise) {
    return { ok: false, error: "Replacement exercise not found." };
  }

  let targetWorkout: WorkoutRow | null = null;
  let updatedBlocks: unknown = null;

  for (const workout of workouts) {
    const { blocks, updated } = enrichBlocks(
      workout.blocks,
      fromExercise,
      toExercise,
      data.from_exercise_id,
      data.to_exercise_id,
    );
    if (updated) {
      targetWorkout = workout;
      updatedBlocks = blocks;
      break;
    }
  }

  if (!targetWorkout || !updatedBlocks) {
    return { ok: false, error: "Exercise not found in workout blocks." };
  }

  const { error: updateError } = await client
    .from("workouts")
    .update({ blocks: updatedBlocks })
    .eq("id", targetWorkout.id);
  if (updateError) throw updateError;

  const why = buildExerciseWhy(fromExercise, toExercise);

  const adjustmentEntry = {
    type: "swap_exercise",
    at: new Date().toISOString(),
    workout_id: targetWorkout.id,
    from_exercise_id: fromExercise.id,
    to_exercise_id: toExercise.id,
    why,
  };
  await updatePlanDayAdjustments(client, planDay, adjustmentEntry);

  await logPlanAudit(
    client,
    planDay.plan_id,
    `Swap exercise: ${fromExercise.name} → ${toExercise.name}`,
    {
      type: "swap_exercise",
      plan_day_id: planDay.id,
      workout_id: targetWorkout.id,
      from: { id: fromExercise.id, name: fromExercise.name },
      to: { id: toExercise.id, name: toExercise.name },
      why,
    },
  );

  return {
    ok: true,
    plan_id: planDay.plan_id,
    plan_day_id: planDay.id,
    workout_id: targetWorkout.id,
    why,
    blocks: updatedBlocks,
  };
}

export async function handleSwapExercise(
  body: SwapExerciseRequest,
): Promise<SwapResponse> {
  try {
    return await swapExercise(body);
  } catch (error) {
    console.error("[swap_exercise] unexpected error", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error.",
    };
  }
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

    const body = await req.json().catch(() => ({})) as SwapExerciseRequest;
    const result = await handleSwapExercise(body);
    const status = result.ok ? 200 : 400;
    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  });
}
