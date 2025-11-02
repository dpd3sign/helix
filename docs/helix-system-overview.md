# HELIX System Overview

## 1. Vision
- **HELIX** is a next-generation self-development ecosystem synchronizing mind, body, and identity, grounded in behavioral science and biometric feedback.
- The experience combines psychological frameworks (Atomic Habits, self-discrepancy theory, cognitive reappraisal) with wearable-derived data and adaptive coaching.
- Target delivery platform: Expo (React Native + TypeScript) backed by Supabase (Postgres, Auth, Edge Functions, Storage, RLS).

## 2. Core Pillars
1. **Mind** – Journaling, cognitive reframing, identity prompts, coach conversations.
2. **Body** – Adaptive training, recovery monitoring, nutrition planning.
3. **Identity** – Daily check-ins, habit loops, reinforcement nudges, archetype alignment.

## 3. Experience Flow
1. **Onboarding**
   - Splash → Account creation → Profile/baseline intake → Goals & equipment
   - Wearable sync setup (OAuth flows, permissions)
   - Identity framing prompt transitions users into Dashboard.
2. **Dashboard**
   - Readiness/confidence/progress overview, quick actions, streak badges
   - AI Coach bubble surfaces contextual tips and actions.
3. **Primary Tabs**
   - **Plan** – Weekly overview, workout and meal views, swap modals, plan regeneration.
   - **Mindset** – Journaling, affirmations, identity check-ins, micro-habit builder.
   - **Metrics** – Body, nutrition, mindset, sleep dashboards, future 3-D visualizer.
   - **AI Coach** – Context-aware chat, motivation boosts, adaptive adjustments log.
   - **More** – Profile, settings, device management, notifications, billing, support.

## 4. Modular Breakdown
Refer to `docs/helix-architecture.md` for implementation details. High-level modules:
- **User Data Module** – Profiles, biometric baselines, onboarding workflows.
- **Wearables API Module** – OAuth, scheduled syncs, normalization, validation.
- **Planning Engine** – Adaptive weekly plans, readiness recalculations, notifications.
- **Meal System** – Macro calculations (AMDR), recipe catalog, grocery automation, compliance tracking.
- **Workout System** – Exercise library, session generation, progress logs, HRV-guided adjustments.
- **Mindset System** – Guided journaling, affirmations, identity habits, reappraisal triggers.
- **Visualization & Metrics** – Dashboards, aggregated metrics, phase-2 physique visualizer.
- **Identity Sync Engine** – Daily check-ins, reinforcement nudges, milestone rewards, difficulty calibration.
- **AI Coach Module** – Conversational guidance, personality rules, LLM orchestration, safety.

## 5. Key Workflows
1. **Onboarding Baseline**
   - Collect profile inputs → compute BMR/TDEE/macros → seed initial plan via EPE.
2. **Daily Sync Cycle**
   - Ingest wearable metrics → recompute readiness → adjust workouts/meals → notify user and coach.
3. **Meal Compliance Adjustment**
   - Compare logged intake vs targets → adjust next-day macros → update coach context.
4. **Identity Reinforcement**
   - Analyze adherence → issue nudges/badges → update confidence index view.
5. **Testing & Validation**
   - Unit tests for calculations, integration tests for data flows, performance and security checks.

## 6. Roadmap Anchors
- **MVP (Weeks 1–4)** – Auth, onboarding, baseline calculations, weekly plan generation, basic plan rendering, manual logging, Sentry integration.
- **Adaptive Layer (Weeks 5–8)** – Wearable connections (starting with Apple Health/Google Fit), readiness recalculations, identity archetype selection, push notifications.
- **AI & Mindset (Weeks 9–12)** – Journaling, affirmations, AI Coach edge functions, cognitive reappraisal triggers, confidence index dashboard.
- **Scale & Polish (Weeks 13+)** – Grocery automation, advanced analytics, reward marketplace, community features, 3-D physique pipeline.

## 7. Reference Materials
- Design & build guardrails: `docs/helix-rulebook.md`
- Modular architecture & schemas: `docs/helix-architecture.md`
- Product storytelling, workflows, and roadmap (this document)

> Keep this overview in sync with the architecture and rulebook whenever the product scope evolves.
