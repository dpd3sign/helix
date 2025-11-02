# HELIX Background Jobs

This folder tracks the automation functions for HELIX Phase 2 — Step 2.1. Two Deno edge functions run on a nightly schedule and expose manual triggers for operators:

- `job-sync-wearables` — records wearable sync runs (cron and manual). The function calls the `sync_wearables` RPC when available and logs a placeholder run until integrations are wired.
- `job-refresh-metrics` — refreshes analytics materialized views through the `refresh_metric_views` RPC.

Every execution inserts a row in `job_runs` with the status, reason, row count, timestamps, optional user_id (manual), and any error details.

## Deployment & Scheduling

1. Deploy the functions:
   ```bash
   supabase functions deploy job-sync-wearables
   supabase functions deploy job-refresh-metrics
   ```
2. Create nightly schedules (example: 2 AM UTC wearable sync, 3 AM UTC metrics refresh):
   ```bash
   supabase functions schedule create job-sync-wearables --cron "0 2 * * *"
   supabase functions schedule create job-refresh-metrics --cron "0 3 * * *"
   ```
3. Pause or resume schedules as needed:
   ```bash
   supabase functions schedule pause job-sync-wearables
   supabase functions schedule resume job-sync-wearables
   ```

Manual runs can be triggered with `curl` (send a JSON body with `user_id` to capture who initiated the job):

```bash
curl -X POST https://<project>.functions.supabase.co/job-sync-wearables \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"00000000-0000-0000-0000-000000000000"}'
```

Responses follow the HELIX job contract:

```json
{
  "ok": true,
  "ran": "sync_wearables",
  "started_at": "...",
  "finished_at": "...",
  "rows_affected": 0,
  "notes": [
    "sync_wearables RPC not configured yet; recorded placeholder run."
  ]
}
```

## Auditing job_runs

- Query the latest runs:
  ```sql
  select job_key, status, reason, started_at, finished_at, rows_affected
  from job_runs
  order by started_at desc
  limit 20;
  ```
- Investigate manual invocations:
  ```sql
  select *
  from job_runs
  where run_type = 'manual'
  order by started_at desc;
  ```

`job_runs` uses RLS: authenticated users (and service role) can read; only service role can insert/delete. Use Supabase Studio, SQL editors, or `supabase db query` to inspect history.
