create table if not exists wearable_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  date date not null,
  timezone text default 'UTC',
  steps integer default 0,
  hrv_rmssd numeric,
  resting_hr numeric,
  sleep_score numeric,
  calories_burned integer default 0,
  synced_at timestamptz not null default timezone('utc', now()),
  raw_payload jsonb not null default '{}'::jsonb
);

create unique index if not exists wearable_daily_metrics_unique_idx
  on wearable_daily_metrics (user_id, provider, date);

create index if not exists wearable_daily_metrics_user_date_idx
  on wearable_daily_metrics (user_id, date desc);

alter table wearable_daily_metrics enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wearable_daily_metrics' and policyname = 'wearables_select_owner'
  ) then
    execute '
      create policy wearables_select_owner on wearable_daily_metrics
      for select using (user_id = auth.uid() or auth.role() = ''service_role'')
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wearable_daily_metrics' and policyname = 'wearables_insert_service'
  ) then
    execute '
      create policy wearables_insert_service on wearable_daily_metrics
      for insert with check (auth.role() = ''service_role'')
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wearable_daily_metrics' and policyname = 'wearables_update_service'
  ) then
    execute '
      create policy wearables_update_service on wearable_daily_metrics
      for update using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')
    ';
  end if;
end
$$;
