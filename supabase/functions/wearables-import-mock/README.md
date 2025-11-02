# Wearables Mock Import

This manual utility seeds `wearable_daily_metrics` with 7 days of mock data so the planning engine and dashboards can be exercised without a live wearable integration.

## Files
- `index.ts` — Edge function that upserts mock data, refreshes metric views, and logs to `job_runs` (`job_key = "mock_import"`).
- `wearables-import-mock.test.ts` — Validates upsert idempotency and job logging.
- `../__mocks__/wearables/weekly.json` — Source payload (date, steps, HRV, resting HR, sleep score).

## Deploy

```bash
supabase functions deploy wearables-import-mock
```

## Manual Invocation

```bash
curl -X POST https://<project>.functions.supabase.co/wearables-import-mock \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>"}'
```

Response shape:

```json
{
  "ok": true,
  "reason": "mock_import",
  "rows_affected": 7,
  "notes": [
    "Upserted 7 mock wearable records for ...",
    "refresh_metric_views executed to sync analytics.",
    "Imported mock wearable metrics to simulate readiness feedback..."
  ],
  "why": "Imported mock wearable metrics to simulate readiness feedback... ",
  "job_run_id": "..."
}
```

Each call inserts a new `job_runs` row so operations can trace usage. Running the import again replaces existing rows (no duplicates) and still produces an audit entry.

## Disabling in Non-Dev Environments
- **Staging/Production:** Remove or revoke the schedule (none by default). Ensure the function is only callable with service-role credentials. Optionally set an environment flag (not handled in code yet) to short-circuit in production.
- To disable entirely: `supabase functions delete wearables-import-mock`.

## Tests

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
deno test -A supabase/functions/wearables-import-mock/wearables-import-mock.test.ts
```

The test seeds a temporary user, runs the import twice, checks that the row count stays constant, and confirms a `job_runs` entry exists.
