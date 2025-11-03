# HELIX Utility Endpoints

This folder contains the explainable plan utilities requested in Phase 2
Step 2.1:

- `util-swap-exercise` — replace an exercise inside a plan day workout.
- `util-swap-recipe` — replace the recipe attached to a meal.
- `util-export-grocery` — aggregate ingredients across a plan’s meals for
  export.

All utilities:

1. Operate with the Supabase service-role key (RLS-safe).
2. Append a record to `audit_regenerations` with a structured `delta` JSON
   payload.
3. Return a narrative `why` string so the client can surface the exact
   reasoning.

## Deploy & Trigger

```bash
supabase functions deploy util-swap-exercise
supabase functions deploy util-swap-recipe
supabase functions deploy util-export-grocery
```

Invoke manually with a POST request:

```bash
curl -X POST https://<project>.functions.supabase.co/util-swap-exercise \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_day_id": "...",
    "from_exercise_id": "...",
    "to_exercise_id": "...",
    "user_id": "<optional-user-id>"
  }'
```

Responses follow the pattern:

```json
{
  "ok": true,
  "plan_id": "...",
  "plan_day_id": "...",
  "why": "Swapped Goblet Squat for Barbell Back Squat. Matches available equipment...",
  "blocks": [ ... ] // when applicable
}
```

## Testing

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
deno test -A supabase/functions/utilities/utilities.test.ts
```

The tests:

1. Create a temporary user + plan.
2. Exercise each utility.
3. Verify the affected row is updated and an `audit_regenerations` record
   exists.
4. Clean up temporary data.

## Querying audits

```sql
select occurred_at, reason, delta
from audit_regenerations
where plan_id = '<plan-id>'
order by occurred_at desc;
```

`delta` includes a `why` field mirroring the response so downstream analytics
can analyse behavior.
