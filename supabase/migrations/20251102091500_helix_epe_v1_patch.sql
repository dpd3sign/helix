-- Additive schema updates ensuring option B compatibility.

alter table plan_days
  add column if not exists status text default 'planned';

alter table workouts
  add column if not exists focus text,
  add column if not exists intensity text;

alter table meals
  add column if not exists meal_type text default 'unspecified',
  add column if not exists ingredients jsonb not null default '[]'::jsonb;

alter table recipes
  add column if not exists tags jsonb not null default '{}'::jsonb;

alter table plan_days
  add column if not exists adjustments_made jsonb not null default '[]'::jsonb;
