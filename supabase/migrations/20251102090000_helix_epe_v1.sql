-- HELIX EPE v1 schema
-- Creates plan, workout, meal, and supporting tables with RLS and helper function.

create extension if not exists "pgcrypto";

-- Plans
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  goal text not null check (goal in ('fat_loss','muscle_gain','recomp','endurance','maintenance')),
  kcal_target integer not null check (kcal_target > 0),
  macros jsonb not null default '{}'::jsonb,
  explanations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_user_start_idx on plans(user_id, start_date);

-- Plan days
create table if not exists plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  date date not null,
  day_index smallint not null,
  readiness integer,
  adjustments_made jsonb not null default '[]'::jsonb,
  status text default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_days_day_index_chk check (day_index between 0 and 6),
  constraint plan_days_adjustments_array_chk check (jsonb_typeof(adjustments_made) = 'array')
);

create unique index if not exists plan_days_unique on plan_days(plan_id, date);
create index if not exists plan_days_plan_idx on plan_days(plan_id);

-- Recipes (reference data) must exist before meals.
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kcal integer not null check (kcal > 0),
  protein_g integer not null check (protein_g >= 0),
  carbs_g integer not null check (carbs_g >= 0),
  fat_g integer not null check (fat_g >= 0),
  diet_type text not null,
  allergens text[] not null default '{}',
  prep_time integer not null check (prep_time >= 0),
  ingredients jsonb not null default '[]'::jsonb,
  tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists recipes_diet_idx on recipes(diet_type);
create index if not exists recipes_prep_time_idx on recipes(prep_time);
create index if not exists recipes_tags_idx on recipes using gin (tags);
create index if not exists recipes_allergens_gin on recipes using gin (allergens);

-- Meals linked to plan days
create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references plan_days(id) on delete cascade,
  name text not null,
  meal_type text default 'unspecified',
  kcal integer not null check (kcal >= 0),
  protein_g integer not null check (protein_g >= 0),
  carbs_g integer not null check (carbs_g >= 0),
  fat_g integer not null check (fat_g >= 0),
  recipe_id uuid references recipes(id),
  ingredients jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint meals_ingredients_array_chk check (jsonb_typeof(ingredients) = 'array')
);

create index if not exists meals_plan_day_idx on meals(plan_day_id);
create index if not exists meals_recipe_idx on meals(recipe_id);

-- Exercises reference table
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists exercises_name_idx on exercises using gin (to_tsvector('english', name));
create index if not exists exercises_tags_idx on exercises using gin (tags);

-- Workouts
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references plan_days(id) on delete cascade,
  name text not null,
  focus text,
  intensity text,
  blocks jsonb not null,
  created_at timestamptz not null default now(),
  constraint workouts_blocks_array_chk check (jsonb_typeof(blocks) = 'array' and jsonb_array_length(blocks) > 0)
);

create index if not exists workouts_plan_day_idx on workouts(plan_day_id);

-- Audit log for regenerations
create table if not exists audit_regenerations (
  id bigserial primary key,
  plan_id uuid not null references plans(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  reason text not null,
  delta jsonb not null default '{}'::jsonb
);

create index if not exists audit_regenerations_plan_idx on audit_regenerations(plan_id, occurred_at desc);

-- Helper function to refresh materialized views after plan operations.
create or replace function refresh_metric_views()
returns void
language plpgsql
as $$
begin
  if to_regclass('public.mv_body_overview') is not null then
    execute 'refresh materialized view concurrently mv_body_overview';
  end if;
  if to_regclass('public.mv_nutrition_compliance') is not null then
    execute 'refresh materialized view concurrently mv_nutrition_compliance';
  end if;
  if to_regclass('public.mv_mindset_confidence') is not null then
    execute 'refresh materialized view concurrently mv_mindset_confidence';
  end if;
  if to_regclass('public.mv_sleep_recovery') is not null then
    execute 'refresh materialized view concurrently mv_sleep_recovery';
  end if;
end;
$$;

comment on function refresh_metric_views is 'Refreshes HELIX metric materialized views after plan updates.';

-- Row Level Security and policies

-- Plans
alter table plans enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plans' and policyname = 'plans_select_owner') then
    execute 'create policy plans_select_owner on plans for select using (user_id = auth.uid())';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plans' and policyname = 'plans_modify_owner') then
    execute 'create policy plans_modify_owner on plans for all using (user_id = auth.uid()) with check (user_id = auth.uid())';
  end if;
end $$;

-- Plan days
alter table plan_days enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plan_days' and policyname = 'plan_days_select_owner') then
    execute $policy$
      create policy plan_days_select_owner on plan_days
        for select using (
          exists (
            select 1 from plans
            where plans.id = plan_days.plan_id
              and plans.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plan_days' and policyname = 'plan_days_modify_owner') then
    execute $policy$
      create policy plan_days_modify_owner on plan_days
        for all using (
          exists (
            select 1 from plans
            where plans.id = plan_days.plan_id
              and plans.user_id = auth.uid()
          )
        )
        with check (
          exists (
            select 1 from plans
            where plans.id = plan_days.plan_id
              and plans.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
end $$;

-- Meals
alter table meals enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meals' and policyname = 'meals_select_owner') then
    execute $policy$
      create policy meals_select_owner on meals
        for select using (
          exists (
            select 1
            from plan_days
            join plans on plans.id = plan_days.plan_id
            where plan_days.id = meals.plan_day_id
              and plans.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meals' and policyname = 'meals_modify_owner') then
    execute $policy$
      create policy meals_modify_owner on meals
        for all using (
          exists (
            select 1
            from plan_days
            join plans on plans.id = plan_days.plan_id
            where plan_days.id = meals.plan_day_id
              and plans.user_id = auth.uid()
          )
        )
        with check (
          exists (
            select 1
            from plan_days
            join plans on plans.id = plan_days.plan_id
            where plan_days.id = meals.plan_day_id
              and plans.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
end $$;

-- Workouts
alter table workouts enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workouts' and policyname = 'workouts_select_owner') then
    execute $policy$
      create policy workouts_select_owner on workouts
        for select using (
          exists (
            select 1
            from plan_days
            join plans on plans.id = plan_days.plan_id
            where plan_days.id = workouts.plan_day_id
              and plans.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workouts' and policyname = 'workouts_modify_owner') then
    execute $policy$
      create policy workouts_modify_owner on workouts
        for all using (
          exists (
            select 1
            from plan_days
            join plans on plans.id = plan_days.plan_id
            where plan_days.id = workouts.plan_day_id
              and plans.user_id = auth.uid()
          )
        )
        with check (
          exists (
            select 1
            from plan_days
            join plans on plans.id = plan_days.plan_id
            where plan_days.id = workouts.plan_day_id
              and plans.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
end $$;

-- Audit regenerations
alter table audit_regenerations enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_regenerations' and policyname = 'audit_regenerations_select_owner') then
    execute $policy$
      create policy audit_regenerations_select_owner on audit_regenerations
        for select using (
          exists (
            select 1
            from plans
            where plans.id = audit_regenerations.plan_id
              and plans.user_id = auth.uid()
          )
        )
    $policy$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_regenerations' and policyname = 'audit_regenerations_insert_service') then
    execute 'create policy audit_regenerations_insert_service on audit_regenerations for insert with check (auth.role() = ''service_role'')';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_regenerations' and policyname = 'audit_regenerations_delete_service') then
    execute 'create policy audit_regenerations_delete_service on audit_regenerations for delete using (auth.role() = ''service_role'')';
  end if;
end $$;

-- Recipes (reference data) - read for all authenticated users, modifications restricted to service role.
alter table recipes enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'recipes' and policyname = 'recipes_select_all') then
    execute 'create policy recipes_select_all on recipes for select using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'recipes' and policyname = 'recipes_modify_service') then
    execute 'create policy recipes_modify_service on recipes for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;
end $$;

-- Exercises (reference data)
alter table exercises enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_select_all') then
    execute 'create policy exercises_select_all on exercises for select using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_modify_service') then
    execute 'create policy exercises_modify_service on exercises for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;
end $$;
