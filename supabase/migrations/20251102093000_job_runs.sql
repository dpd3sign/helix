-- Job runs audit table for scheduled and manual jobs.
create table if not exists job_runs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null,
  run_type text not null check (run_type in ('manual','cron')),
  status text not null check (status in ('success','failure')),
  reason text,
  rows_affected integer default 0,
  notes jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  user_id uuid,
  error_detail jsonb
);

create index if not exists job_runs_job_type_idx on job_runs (job_key, started_at desc);
create index if not exists job_runs_user_idx on job_runs (user_id, started_at desc);

alter table job_runs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'job_runs' and policyname = 'job_runs_select_any'
  ) then
    execute 'create policy job_runs_select_any on job_runs for select using (auth.role() = ''service_role'' or auth.role() = ''authenticated'')';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'job_runs' and policyname = 'job_runs_insert_service'
  ) then
    execute $policy$
      create policy job_runs_insert_service on job_runs
        for insert with check (auth.role() = 'service_role')
    $policy$;
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'job_runs' and policyname = 'job_runs_delete_service'
  ) then
    execute $policy$
      create policy job_runs_delete_service on job_runs
        for delete using (auth.role() = 'service_role')
    $policy$;
  end if;
end $$;
