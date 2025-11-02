-- Metrics materialized views for HELIX dashboards.
-- Each view is only created when its source tables already exist to support phased migrations.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'body_measurements'
  ) then
    execute $mv_body$
      create materialized view if not exists mv_body_overview as
      with measurements as (
        select
          bm.user_id,
          bm.recorded_at,
          bm.weight_kg,
          bm.body_fat_percentage,
          bm.waist_cm,
          lag(bm.weight_kg, 7) over (partition by bm.user_id order by bm.recorded_at) as weight_kg_7d,
          lag(bm.body_fat_percentage, 30) over (partition by bm.user_id order by bm.recorded_at) as bf_30d
        from body_measurements bm
      )
      select
        user_id,
        recorded_at as captured_at,
        weight_kg,
        body_fat_percentage,
        waist_cm,
        round(weight_kg - coalesce(weight_kg_7d, weight_kg), 2) as delta_weight_7d,
        round(body_fat_percentage - coalesce(bf_30d, body_fat_percentage), 2) as delta_body_fat_30d
      from measurements;
    $mv_body$;
    execute 'create index if not exists mv_body_overview_user_idx on mv_body_overview (user_id, captured_at desc)';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'meal_plans'
  ) and exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'weekly_plans'
  ) then
    execute $mv_nutrition$
      create materialized view if not exists mv_nutrition_compliance as
      with daily_intake as (
        select
          wp.user_id,
          mp.date as day,
          mp.target_calories,
          mp.protein_g as protein_target,
          coalesce(sum(ml.logged_calories), 0) as calories_consumed,
          coalesce(sum(ml.protein_g), 0) as protein_consumed
        from meal_plans mp
        join weekly_plans wp on mp.plan_id = wp.plan_id
        left join meals m on m.meal_plan_id = mp.meal_plan_id
        left join meal_logs ml on ml.meal_id = m.meal_id
        group by wp.user_id, mp.date, mp.target_calories, mp.protein_g
      )
      select
        user_id,
        day,
        target_calories,
        calories_consumed,
        protein_target,
        protein_consumed,
        greatest(
          0,
          100 - abs(coalesce(calories_consumed, 0) - coalesce(target_calories, 0)) / nullif(target_calories, 0) * 100
        ) as compliance_score
      from daily_intake;
    $mv_nutrition$;
    execute 'create index if not exists mv_nutrition_compliance_user_idx on mv_nutrition_compliance (user_id, day desc)';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'journal_entries'
  ) then
    execute $mv_mindset$
      create materialized view if not exists mv_mindset_confidence as
      with journal as (
        select
          user_id,
          date_trunc('day', created_at) as day,
          count(*) as journal_entries,
          avg(nullif(mood_rating, 0)) as avg_mood
        from journal_entries
        group by user_id, date_trunc('day', created_at)
      ),
      habit as (
        select
          hl.user_id,
          hl.completed_on as day,
          avg(case when hl.completed then 1 else 0 end) * 100 as habit_adherence
        from habit_logs hl
        group by hl.user_id, hl.completed_on
      ),
      checkins as (
        select
          user_id,
          date,
          avg(response_value) as checkin_score
        from daily_checkins
        group by user_id, date
      )
      select
        coalesce(journal.user_id, habit.user_id, checkins.user_id) as user_id,
        coalesce(journal.day, habit.day, checkins.date) as date,
        coalesce(habit.habit_adherence, 0) as habit_adherence,
        coalesce(journal.journal_entries, 0) as journal_entries,
        coalesce(journal.avg_mood, 0) as sentiment_score,
        round(
          (coalesce(habit.habit_adherence, 0) * 0.4 + coalesce(journal.avg_mood, 0) * 25 + coalesce(checkins.checkin_score, 0) * 10) / 10,
          1
        ) as confidence_index
      from journal
      full outer join habit on journal.user_id = habit.user_id and journal.day = habit.day
      full outer join checkins on coalesce(journal.user_id, habit.user_id) = checkins.user_id
        and coalesce(journal.day, habit.day) = checkins.date;
    $mv_mindset$;
    execute 'create index if not exists mv_mindset_confidence_user_idx on mv_mindset_confidence (user_id, date desc)';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wearable_daily_metrics'
  ) then
    execute $mv_sleep$
      create materialized view if not exists mv_sleep_recovery as
      with latest_baseline as (
        select distinct on (user_id)
          user_id,
          hrv_rmssd
        from biometric_baselines
        order by user_id, baseline_date desc
      )
      select
        wdm.user_id,
        wdm.date,
        wdm.sleep_hours,
        wdm.sleep_efficiency,
        wdm.hrv_rmssd,
        case
          when wdm.hrv_rmssd is null then 'unknown'
          when wdm.hrv_rmssd < coalesce(lb.hrv_rmssd, wdm.hrv_rmssd) * 0.9 then 'deload'
          when wdm.sleep_hours < 6 then 'watch'
        else 'normal'
        end as readiness_flag
      from wearable_daily_metrics wdm
      left join latest_baseline lb on lb.user_id = wdm.user_id;
    $mv_sleep$;
    execute 'create index if not exists mv_sleep_recovery_user_idx on mv_sleep_recovery (user_id, date desc)';
  end if;
end
$$;

-- Recommended refresh cadence:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_body_overview;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_nutrition_compliance;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_mindset_confidence;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sleep_recovery;
