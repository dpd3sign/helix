# Generate Weekly Plan — EPE v1

This directory hosts the Explainable Personalization Engine (EPE) v1 edge
function. It transforms an `EPEInput` payload into a weekly plan, persists the
rows in Supabase, and returns the plan with human-readable WHY explanations.

## Files

- `index.ts` — Edge function entry (Deno). Handles validation, derives macros,
  generates the week, writes to `plans`, `plan_days`, `workouts`, and `meals`,
  and refreshes metric materialized views.
- `generate_weekly_plan.test.ts` — Logic tests for the planner using in-memory
  recipe/exercise pools.

## Prerequisites

- Supabase CLI installed.
- Environment variables in `.env` (shared with Expo):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Run Locally

```bash
# Ensure the latest migrations and seeds are applied
supabase migration up
supabase db execute -f supabase/seed/helix_exercises.sql
supabase db execute -f supabase/seed/helix_recipes.sql

# Serve the edge function locally
supabase functions serve generate_weekly_plan --env-file ../../.env
```

## Example Request

```bash
curl -X POST http://localhost:54321/functions/v1/generate_weekly_plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d @sample-payload.json
```

`sample-payload.json` should contain an object matching the `EPEInput` schema
(see `index.ts` for the exact type). The response includes the persisted
`plan_id`, macro targets, the generated week array, and the explanations array
surfaced in the mobile app’s “Coach rationale” glass card.

## Tests

```bash
deno test supabase/functions/generate_weekly_plan/generate_weekly_plan.test.ts
```

Tests validate:

- seven days returned,
- macros align with goal rules,
- explanation coverage (≥3 strings),
- workouts/meals respect equipment and diet filters.

## Deployment

```bash
supabase functions deploy generate_weekly_plan --project-ref <your-project-ref>
```

> After deployment, confirm that `SUPABASE_SERVICE_ROLE_KEY` and other secrets
> are configured in the Supabase dashboard function settings. Apply HELIX Design
> Rules when exposing the returned explanations in the UI (use Apple Glass cards
> with a single primary CTA).
