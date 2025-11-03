# HELIX Modular Architecture (React Native + Supabase)

## 1. Purpose & Scope

- Translate the previously defined HELIX platform vision into a buildable
  architecture for an Expo (React Native + TypeScript) front end backed by
  Supabase (Postgres, Auth, Edge Functions, Storage, RLS).
- Preserve the modular structure across mind, body, and identity systems while
  aligning with the operational stack (EAS builds, Sentry, Reanimated 3,
  NativeWind, dark mode).
- Provide implementation notes for no-code-to-code migration, covering UI
  structure, data models, backend logic, automation, and validation/testing.

## 2. Platform Overview

- **Frontend:** Expo (managed workflow) with React Navigation 7, NativeWind for
  styling, Reanimated 3 for motion, Expo Haptics, and SF Symbols via
  `expo-symbols`. Screens organized under tab navigation with feature-specific
  stacks/modals.
- **Backend:** Supabase for database, authentication, storage, row-level
  security, realtime, edge functions (Deno), cron jobs, and log forwarding to
  Sentry.
- **Integrations:** Wearable providers (Apple Health, Fitbit, Garmin, WHOOP,
  Oura, Google Fit) via OAuth → Supabase edge functions; grocery APIs; push
  notifications through Expo services; optional 3-D body tooling (phase 2).
- **Observability:** Sentry SDK on client, Supabase logs + edge function tracing
  piped to Sentry Dataplane.
- **DevOps:** EAS for builds and updates; GitHub Actions workflow (future) to
  run lint/tests, trigger Supabase migrations, and deploy edge functions.

## 3. Module Architecture

Each module includes: (1) mobile UI surfaces, (2) Supabase schema, (3) backend
services/automation, (4) testing & instrumentation.

### 3.1 User Data Module

- **UI:** Onboarding wizard (`OnboardingStack`) capturing profile, equipment,
  goals; profile edit screen; baseline metrics review.
- **State:** Recoil/Jotai or TanStack Query + Supabase hooks to sync user
  profile and derived values; use Context for auth session.
- **Supabase Tables:**
  - `profiles`: `user_id (uuid, pk/fk users)`, `name`, `date_of_birth`, `sex`,
    `height_cm`, `weight_kg`, `goal_type`, `equipment_available (jsonb)`,
    `unit_system`, `activity_level`, `preferred_style`, `timezone`, timestamps.
  - `biometric_baselines`: `baseline_id (uuid pk)`, `user_id`, `baseline_date`,
    `resting_heart_rate`, `hrv_rmssd`, `sleep_hours`, `body_fat_percentage`,
    `bmr_kcal`, `tdee_kcal`, `macro_targets (jsonb)`.
- **Derived Logic:** Supabase edge function `calculate_baseline` triggered via
  RPC after onboarding to compute BMR (Mifflin St. Jeor), TDEE, and default
  macros (hand off to Meal System).
- **Validation:** Postgres CHECK constraints (e.g., height range 100–250 cm),
  Supabase `pgtyped` or Zod schemas on client; onboarding flow uses NativeWind
  forms with conditional sections.
- **Testing:** Jest + React Testing Library for form validation; edge function
  unit tests covering BMR calculation; integration tests using Supabase Test
  Runner seeds for varied demographics.
- **Client Implementation (Expo):** The Expo onboarding stack signs users up via
  `supabase.auth.signUp`, persists interim profile data in context, and
  finalizes onboarding by upserting `profiles` and `biometric_baselines` with
  calculated BMR/TDEE/macros before invoking the `generate-weekly-plan` edge
  function. Login is supported through `supabase.auth.signInWithPassword` with
  session persistence in `@react-native-async-storage/async-storage`.

### 3.2 Wearables API Module

- **UI:** Settings > Connected Devices; status indicators and sync timestamps;
  data permission management.
- **Supabase Tables:**
  - `wearable_connections`: `connection_id`, `user_id`, `provider`,
    `access_token (encrypted)`, `refresh_token (encrypted)`, `expires_at`,
    `scopes`, `status`.
  - `wearable_daily_metrics`: `metric_id`, `user_id`, `provider`, `date`,
    `timezone`, `sleep_hours`, `sleep_efficiency`, `rem_minutes`,
    `deep_minutes`, `hrv_rmssd`, `hrv_sdnn`, `resting_hr`, `max_hr`, `steps`,
    `calories_burned`, `recovery_index`, `stress_level`, `synced_at`,
    `raw_payload (jsonb)`.
- **Backend:** Edge function per provider for OAuth callback + token exchange;
  scheduled cron (Supabase cron schema) hitting `sync_wearables` function every
  6 hours; normalization library exposes consistent units/timezones (Luxon).
- **Client Integration:** Wearable settings screen reads `wearable_connections`
  and invokes `wearable-authorize` / `sync-wearables` edge functions from the
  Expo client, surfacing connection status and on-demand sync triggers per
  provider.
- **Data Validation:** Unique index on (`user_id`,`date`,`provider`); edge
  function handles deduping and linear interpolation for gaps; stores original
  payload for audits.
- **Testing:** Mock providers via Supabase function unit tests; end-to-end
  sandbox tokens; timezone regression suite (e.g., America/Phoenix no DST).

### 3.3 Planning Engine (Adaptive Weekly Plans)

- **UI:** Weekly plan dashboard (tab home), readiness banner, daily adjustment
  sheet, notification center (Expo push).
- **Supabase Tables:**
  - `weekly_plans`: `plan_id`, `user_id`, `start_date`, `end_date`, `plan_type`,
    `readiness_score`, `adjustments_made (jsonb)`.
  - `daily_readiness`: `readiness_id`, `plan_id`, `date`, `hrv_score`,
    `sleep_score`, `resting_hr_score`, `composite_score`,
    `status (normal/deload/rest)`, `notes`.
- **Logic:** Edge function `generate_weekly_plan` runs on onboarding and
  Sundays; uses `wearable_daily_metrics` + `biometric_baselines`. Function
  stores target caloric load, training focus, and seeds Meal/Workout sessions.
  Daily cron `recompute_readiness` calculates SWC thresholds, updates plan
  intensity, and queue notifications.
- **Notification Flow:** Supabase `pg_net` to send push to Expo Notification
  Service; fallback email via Resend/Sendgrid integration.
- **Testing:** Simulation script (Node) pushing HRV trends to verify intensity
  toggles; snapshot tests for adjustments log; ensure calories respond to steps
  deltas.
- **Client Integration:** Plan overview screen fetches `weekly_plans` with
  nested sessions/meals, triggers `generate-weekly-plan` via Supabase Functions,
  and passes `plan_id` through router params for downstream workout/meal detail
  screens.

### 3.4 Meal System (Nutritional Intelligence)

- **UI:** Meal tab with day selector, macro ring (NativeWind + Reanimated), meal
  cards, grocery list modal.
- **Supabase Tables:**
  - `meal_plans`: `meal_plan_id`, `plan_id`, `day_index`, `target_calories`,
    `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `notes`.
  - `meals`: `meal_id`, `meal_plan_id`, `date`, `meal_type`, `recipe_id`,
    `planned_calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`,
    `ingredients_list (jsonb)`.
  - `grocery_lists`: `grocery_list_id`, `meal_plan_id`, `duration_days`,
    `items (jsonb)`, `purchased`.
  - `meal_logs`: `log_id`, `user_id`, `meal_id`, `logged_calories`, `protein_g`,
    `carbs_g`, `fat_g`, `source (manual/photo/api)`, `logged_at`.
- **Backend:** Edge function `generate_meal_plan` respects AMDR (45–65% carbs,
  20–35% fats, 1.4–2.0 g/kg protein). Uses recipe catalog (Supabase Storage
  JSON) with macro tags; optional call to grocery API (Instacart) via serverless
  function. `sync_energy_expenditure` adjusts next-day goals from wearables.
- **Testing:** Unit tests for macro balancing; contract tests for grocery list
  JSON; QA scenarios for 7 vs 30-day plan generation; ensure saturated fat
  constraints via validation rule.

### 3.5 Workout System (Physical Evolution)

- **UI:** Workout tab with session timeline, exercise detail sheet (video via
  Expo AV), progress graphs (Victory Native + Reanimated), haptics for set
  completion.
- **Supabase Tables:**
  - `exercises`: `exercise_id`, `name`, `movement_pattern`,
    `equipment_required`, `video_url`, `muscle_groups`, `primary_movement`,
    `is_bodyweight`.
  - `workout_sessions`: `session_id`, `plan_id`, `date`, `week_number`,
    `status`, `intensity_score`, `prescription (jsonb)` for
    sets/reps/tempo/rest.
  - `exercise_logs`: `log_id`, `session_id`, `exercise_id`, `set_index`,
    `weight_used`, `reps`, `rpe`, `notes`, `performed_at`.
- **Logic:** `generate_workout_sessions` edge function chooses progression model
  (linear/undulating) based on goal/equipment; `adjust_workout_load` triggered
  post-readiness calculation reduces volume by ~20% when HRV below SWC.
  Intensity scoring computed server-side for benchmarking.
- **Testing:** Data-driven tests for overload progression; HRV fatigue
  simulation ensures deload weeks triggered; UI instrumentation with Detox for
  logging flow.

### 3.6 Mindset System (Mindset Rewiring)

- **UI:** Mindset tab with journal feed, prompt carousel, affirmation scheduler,
  mood quick-log sheet.
- **Supabase Tables:**
  - `journal_prompts`: `prompt_id`, `prompt_text`, `framework`.
  - `journal_entries`: `entry_id`, `user_id`, `prompt_id`, `text`,
    `mood_rating`, `tags`, `created_at`.
  - `affirmations`: `affirmation_id`, `text`, `delivery_time`,
    `context_trigger`, `archetype`.
  - `habits`: `habit_id`, `user_id`, `description`, `anchor`, `frequency`,
    `goal_identity`.
- **Logic:** Background job `schedule_affirmations` dispatches notifications;
  `mindset_rules` edge function listens to mood logs (Supabase realtime) to
  trigger cognitive reappraisal sequences; journaling uses offline-first storage
  (SQLite via Expo) with background sync.
- **Testing:** Content seeding tests; reappraisal trigger integration; snapshot
  tests verifying journaling prompts align with frameworks
  (identity/discrepancy/reappraisal).

### 3.7 Visualization & Metrics Module

- **UI:** Analytics tab using Reanimated charts (Skia) for readiness, strength,
  sleep vs mood; identity quote banner with gradient backgrounds; toggle for
  dark/light (NativeWind theme).
- **Data Sources:** Materialized views (`mv_training_volume`,
  `mv_confidence_index`) precomputed nightly; Supabase `analytics_snapshots`
  storing aggregated metrics for quick fetch.
- **Phase 2:** 3-D body model stored in Storage (GLB files) or integrated via
  external service; metadata table `body_models` referencing measurement
  snapshots.
- **Testing:** Chart snapshot tests; performance budget (fetch under 300 ms);
  ensure dark-mode contrast ratios via unit tests on theme tokens.

### 3.8 Identity Sync Engine

- **UI:** Daily check-in modal, nudge history feed, badge locker with
  animations.
- **Supabase Tables:**
  - `identity_archetypes`: `archetype_id`, `name`, `description`,
    `affirmation_pack (jsonb)`, `default_habits (jsonb)`.
  - `daily_checkins`: `checkin_id`, `user_id`, `date`, `question_id`,
    `response_value`, `notes`.
  - `reinforcement_nudges`: `nudge_id`, `user_id`, `trigger`, `payload`,
    `delivered_at`, `acknowledged`.
  - `rewards`: `reward_id`, `user_id`, `milestone`, `reward_type`, `redeemed`.
- **Logic:** Edge function `identity_sync` pulls adherence metrics (habits,
  workouts, meals) and readiness to choose nudges/rewards; uses compliance
  thresholds to adjust difficulty. Integrates with Expo push and wearable
  haptics (where API allows).
- **Testing:** Scenario simulations for high/low compliance; ensure difficulty
  adjustments respect bounds; QA on badge unlocking states.

### 3.9 AI Coach Module

- **UI:** Chat screen leveraging React Native Gifted Chat or custom composer;
  quick actions for workouts/meals; transcripts stored locally for offline
  access.
- **Supabase Tables/Storage:** `coach_sessions` (metadata), `coach_messages`
  (role, content, references), embeddings table `coach_memory` for semantic
  search (pgvector).
- **Backend:** Edge function `coach_reply` orchestrates:
  1. Intent classification (Supabase function with OpenAI/Anthropic via
     server-side call).
  2. Context retrieval (recent biometrics, habit logs, mood).
  3. Response generation (LLM call) adhering to personality rules.
  4. Logging to Sentry breadcrumbs + Supabase for audits.
- **Safety:** Moderation function filters user input before LLM call; red-team
  prompts stored for regression tests.
- **Testing:** Scripted dialogue harness to validate tone (engineered calm,
  identity anchored); regression suite ensuring correct references to HRV/sleep
  data.

### 3.10 Supabase Analytics Views (Materialized)

- **Body Overview (`mv_body_overview`):** Aggregates `body_measurements` with
  7-day weight deltas and 30-day body-fat change. Source:
  `supabase/migrations/20250101000000_metrics_views.sql`.
- **Nutrition Compliance (`mv_nutrition_compliance`):** Summarizes meal plan
  targets vs. logged intake with daily compliance scores.
- **Mindset Confidence (`mv_mindset_confidence`):** Blends journal sentiment,
  habit adherence, and check-in scores into a confidence index powering the
  Mindset dashboards.
- **Sleep & Recovery (`mv_sleep_recovery`):** Joins wearable streams with
  baseline HRV to flag readiness states per day.
- **Refresh Strategy:** Nightly `REFRESH MATERIALIZED VIEW CONCURRENTLY` jobs
  (or Supabase cron) keep dashboards near-real time while isolating reads for
  the Expo client.

## 4. Cross-Cutting Concerns

- **Authentication & RLS:** Supabase Auth with email/password + social sign-in;
  device biometrics via Expo Local Authentication. RLS policies: each data table
  restricted to `auth.uid() = user_id`; service key used only within edge
  functions. Two-factor optional using Supabase OTP.
- **Secrets & Config:** Expo Config Plugin loads Supabase keys, wearable client
  IDs via `expo-secure-store`. Edge function secrets managed via Supabase
  dashboard; no secrets shipped in client bundle.
- **Offline Strategy:** Critical data (next workout, meal plan, affirmations)
  cached using React Query persist + MMKV; sync queue pattern for meal
  logs/journals when offline.
- **Theming:** Global NativeWind theme with semantic tokens
  (background.obsidian, accent.teal, cta.orange). Components respect dark mode
  via Tailwind `dark:` variants and Expo Appearance API.
- **Internationalization:** Date/time formatting via Day.js; units toggled per
  `unit_system` field; translation pipeline (phase 2) using `i18next`.

## 5. Workflows & Automations

1. **Onboarding Flow:**
   - User signs up → completes multi-step profile (React Navigation stack).
   - Client calls `rpc_calculate_baseline`; Supabase transaction writes
     `profiles`, `biometric_baselines`, seeds first `weekly_plan`.
   - Success screen prompts wearable connection & identity archetype selection.
2. **Daily Sync Cycle:**
   - Supabase cron triggers `sync_wearables`.
   - Data persisted to `wearable_daily_metrics`.
   - `recompute_readiness` recalculates readiness, updates `weekly_plans`,
     `workout_sessions`, `meal_plans`.
   - Notifications dispatched; AI Coach receives context update.
3. **Meal Compliance Adjustment:**
   - Meal logs streamed via Supabase realtime.
   - Edge function compares logged intake vs targets; if deviation > threshold,
     adjust next-day macro percentages and notify coach.
4. **Identity Reinforcement:**
   - Nightly job evaluates `habits`, `daily_checkins`, `journal_entries`.
   - `identity_sync` issues badges/nudges, updates `confidence_index`
     materialized view.
5. **Error Handling:** Edge functions wrap wearable API calls with retries +
   exponential backoff; failures logged to Sentry with user context hashed.

## 6. Testing & Quality Strategy

- **Unit Tests:** Jest for calculations (BMR, macros, readiness); Deno test
  harness for edge functions; SQL tests via pgTAP for constraints.
- **Integration Tests:** Supabase Testrunner executing flows (onboarding → plan
  generation); Detox for mobile UI flows; contract tests for wearable + grocery
  API responses using mock servers.
- **Performance:** Edge functions benchmarked under expected concurrent loads
  (CRON bursts); Expo app measured with React Native Performance monitors to
  keep frame drops < 5%.
- **Security:** Automated linting for secrets, Supabase RLS policy unit tests,
  periodic penetration testing (phase 2).

## 7. Delivery Roadmap

1. **MVP Sprint (Weeks 1–4):** Auth + onboarding, baseline calculations, weekly
   plan generation, basic meal/workout rendering, manual logging, Sentry
   integration.
2. **Adaptive Layer (Weeks 5–8):** Wearable connections (start with Apple
   Health/Google Fit), readiness recalculations, adaptive workouts/meals,
   identity archetype selection, push notifications.
3. **AI & Mindset (Weeks 9–12):** Journaling, affirmations, AI Coach edge
   functions, cognitive reappraisal triggers, confidence index dashboard.
4. **Scale & Polish (Weeks 13+):** Grocery automation, advanced analytics,
   reward marketplace, community features, 3-D physique pipeline.

## 8. Next Actions

- Configure Expo env vars (`EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`) and install new dependencies
  (`@supabase/supabase-js`, `@react-native-async-storage/async-storage`).
- Apply the metrics migration
  `supabase/migrations/20250101000000_metrics_views.sql` and ensure base tables
  (`body_measurements`, `meal_logs`, `habit_logs`, etc.) exist or are migrated.
- Implement the referenced edge functions (`wearable-authorize`,
  `sync-wearables`, `generate-weekly-plan`, `swap-exercise`, `swap-recipe`,
  `export-grocery-list`) plus schedule concurrency-friendly refreshes for the
  materialized views.
- Build automated tests covering onboarding RPCs, plan regeneration, and view
  refresh logic (pgTAP/unit tests + Detox for client flows).

> References retained from original specification: HRV research [1], AMDR
> guidelines [2], protein guidance [3][4], identity-based habits [5][6],
> self-discrepancy theory [7], cognitive reappraisal [8][9][10][11].
