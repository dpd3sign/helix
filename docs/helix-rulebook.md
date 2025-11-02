# HELIX Product Design & Build Rulebook

This document captures the complete operating instructions for HELIX product development.  
It mirrors the system / role prompts used in AI-assisted sessions so every contributor can reference a single, canonical source.

---

## 1. System Role
- Senior Product Architect, UX Director, and Engineering Guide for the HELIX mobile app (Expo + React Native + Supabase + Edge Functions in Deno).
- Every deliverable must follow the HELIX Rulebook to maintain unified design, code style, and product narrative.

---

## 2. Design Language — “Apple Glass” Aesthetic
1. **Glass & Depth**
   - Use `<BlurView intensity={40} tint="dark" />` for glass surfaces.
   - Apply overlay tint `rgba(255,255,255,0.06)` on dark backgrounds.
   - Corner radius: 18–28 px.
   - Shadows: subtle `rgba(0,0,0,0.4)` offsets (2 / 8 / 12 px).
   - Motion: soft fade / parallax ≤ 400 ms (Framer Motion or Reanimated).
2. **Typography**
   - Inter for body text; SF Pro Display for titles.
   - Headline weight 600–700; body 400; captions 300.
3. **Icons**
   - Lucide / SF Symbols outline style, 2 px stroke.
4. **Color Hierarchy** (defined in `/constants/theme.ts`)
   - `background`: `#0B0B0B`
   - `surface`: `#141414`
   - `overlay`: `rgba(14,14,14,0.55)`
   - `accent`: `#1F6FEB`
   - Maintain contrast ≥ 4.5 : 1 for text.

---

## 3. Layout & Grid
- Base unit: 8 px.
- Spacing: small 8 px · medium 16 px · large 24 px.
- SafeArea padding: 24 px.
- Tab bar height ≈ 90 px (blurred glass).
- Align all components to the 8-point grid.

---

## 4. Navigation & UX Rules
1. Each view answers one clear question.
2. Max two navigation levels; use modals for deeper actions.
3. Persistent tabs: **Home · Plan · Mindset · Coach · More** (current build uses Home/Plan/Mindset/Metrics/Coach + floating menu).
4. Cognitive flow: Overview → Detail → Action.
5. Present insights, not raw numbers (e.g., “HRV ↑ 12 % · Recovery improved”).
6. One primary CTA per view; secondary actions are outlined.

---

## 5. Component Standards

| Element | Style |
| --- | --- |
| Card | Glass surface `surface` color · radius 18 · padding 16 |
| Primary Button | Filled `accent` color · radius 22 |
| Secondary Button | Outline `accent` · transparent background |
| Input | Background `rgba(255,255,255,0.06)` · border `rgba(255,255,255,0.15)` |
| Modal / Sheet | Full-height blur overlay; drag-down dismiss |

---

## 6. Accessibility & Performance
- Dynamic Type friendly; aim for 60 fps.
- Avoid nested BlurViews or heavy shadows.
- Verify light / dark contrast each sprint.

---

## 7. Code Implementation Rules
1. All color tokens live in `/constants/theme.ts` — no inline hex values.
2. Components reference design tokens only.
3. Use Framer Motion or Reanimated for motion.
4. Icon filenames follow `ic_<function>_<state>.svg/png` under `/assets/icons/`.
5. Commit style updates with message prefix `[design]`.

---

## 8. Prompt Categories (Use one at a time)
1. Wearable Infrastructure
2. Data & Goal Refinement
3. Planning Engine MVP
4. Identity & Coach Prep
5. Testing & Automation
6. UI/UX Polish
7. HealthKit Integration (Post-Jan)
8. Multi-Device Aggregation (Optional)

Every prompt must end with **Apply HELIX Design Rules** to preserve visual and UX integrity.

---

## 9. Workflow Expectations
- Incremental “Bite” builds: complete & validate each stage before moving on.
- Document schema/component updates inline with code blocks and comments.
- Maintain strict folder organization: `/app`, `/components`, `/constants`, `/assets`, `/supabase/functions`, `/lib`, `/docs`.
- Every feature ships with a short UX rationale (value + placement).

---

## 10. Tech Stack Reference
- Frontend: Expo React Native (TypeScript)
- Backend: Supabase (Postgres, Auth, Edge Functions in Deno)
- CI/CD: EAS Build + GitHub Actions for tests
- Testing: Jest / Detox / pgTap / Deno tests for functions
- Design workflow: VS Code + Expo Preview extensions

---

## 11. QA Checklist (Apply before merging)
- Background token correct (`Colors.dark.background` etc.)
- Text contrast ≥ 4.5 : 1
- Layout follows 8 px grid
- Single primary CTA per screen
- Card & button specs match rulebook
- Animation ≤ 400 ms ease-out (if present)
- Accessibility labels present for interactive elements

---

## 12. Explainable Personalization Engine (EPE) Notes
- Derived metrics: Age via DOB; BMR via Mifflin-St Jeor; TDEE = BMR × PAL.
- Macros: Protein 1.6–2.4 g/kg (leaner/deficit bias higher), fat ≥0.6–1 g/kg & ≥20% kcal, carbs remainder.
- Rules produce WHY statements (fat loss deficit, carb bias for endurance, lean body raises protein, age-based recovery, equipment substitutions, allergy filters, motivation-sensitive tasks, etc.).
- Ensure functions return `explanations` array for coaching surfaces.

---

## 13. Security & Database Standards
- RLS must be enabled on user-specific tables (`plans`, `plan_days`, `workouts`, `meals`, etc.).
- Policies: user can select/insert/update only their rows; `exercises` and `recipes` are readable by all but updatable by staff/admin roles.
- Migrations should use additive changes (`IF NOT EXISTS`) and include constraints (non-negative macros, valid day indices, json arrays length checks).

---

## 14. Deployment Notes
- Use SQL migrations via `supabase migration new` / `supabase migration up`.
- Seeds executed with `supabase db execute -f path/to/seed.sql`.
- Edge Functions deployed with `supabase functions deploy <name> --env-file ../../.env`.
- Tests run with `deno test -A` (functions), `npm run lint`, Detox/Jest for UI when applicable.

---

## 15. HealthKit Integration Plan
- Use `react-native-health` module (Expo dev client) for Apple Health sync.
- Request permissions for steps, HRV, sleep; sync new data to `wearable_daily_metrics`.
- Apple Developer account required (planned January onboarding).
- Alternative aggregator (Terra / HumanAPI) is optional POC.

---

## 16. Apple Glass UI Reminders
- Surfaces: BlurView + `Colors.dark.surface` overlay.
- Floating menu & modals should use glass sheets with safe-area offsets.
- Primary CTA alignment: top-level button on blurred card.
- Keep animations subtle and avoid overloading GPU on older devices.

---

## 17. Past Deliverables Summary (context)
- Onboarding (account → baseline with metric/imperial inputs → goals/equipment → wearable sync → identity).
- Dashboard reworked with Hero, Quick Actions, Notifications, Coach bubble.
- Floating menu gives access to profile/settings/help/billing.
- Apple Health POC ready; requires Apple Developer account for full QA.
- EPE v1 backend generated (migrations, seeds, `generate_weekly_plan` edge function + tests) awaiting fixes listed in latest review.

---

Keep this document updated whenever the HELIX operational rules evolve.  
All contributors should read this file before starting a new feature or conversation.
