# HELIX Mobile App

HELIX is a next-generation self-development ecosystem synchronizing mind, body, and identity. The mobile client is built with Expo (React Native + TypeScript) and powered by Supabase (Postgres, Auth, Edge Functions). This README points you to project setup steps and the canonical product documentation stored in the `docs/` directory.

## Quick Start

```bash
npm install
npx expo start
```

- Use the Expo CLI output to launch on an iOS simulator, Android emulator, development build, or Expo Go.
- Environment variables are loaded from `.env`. Keep `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in sync with the Supabase project being used.

## Core Documentation

- `docs/helix-rulebook.md` – Design language, UX guardrails, coding standards, and workflow expectations (Apple Glass aesthetic, navigation, testing philosophy).
- `docs/helix-system-overview.md` – Product vision, experience flow, key modules, and roadmap anchors.
- `docs/helix-architecture.md` – Detailed modular architecture for onboarding, wearables, planning engine, meals, workouts, mindset, metrics, identity sync, and AI coach.
- `docs/passdown-template.md` – Checklist for preparing handoffs between working sessions.

Read these files before building new features to ensure design and implementation stay aligned with the HELIX rulebook.

## Supabase Tooling

```bash
# run pending migrations
supabase migration up

# execute seeds
supabase db execute -f supabase/seed/helix_exercises.sql
supabase db execute -f supabase/seed/helix_recipes.sql
```

- Edge functions live under `supabase/functions`. Use `supabase functions serve generate_weekly_plan` for local testing when working on the Explainable Personalization Engine (EPE).
- Review `supabase/functions/generate_weekly_plan/README.md` for payload examples and deployment notes.

## Development Workflow

1. Consult the rulebook and architecture docs for guidance on UX, navigation, and module responsibilities.
2. Build features inside the `app`, `components`, `lib`, and `supabase` directories following the 8 px grid and Apple Glass aesthetic.
3. Run tests and type checks before committing:
   ```bash
   npm run lint
   npm run test
   deno test supabase/functions/generate_weekly_plan
   ```
4. Document significant changes in the passdown template when handing off the project.

## Additional Notes

- Observability: The client integrates Sentry; Supabase logs and edge function tracing should be wired to the same monitoring plane.
- Builds & distribution: Use EAS for iOS/Android deployment. Apple Developer enrollment is pending (target January), so focus on local simulator validation until accounts are active.
- Secrets: Never commit `.env` with real keys. Share environment values through secure channels only.

For questions or new contributors, point them to the documentation above and the HELIX Slack/Notion spaces (if applicable) for broader context. Apply the HELIX Design Rules to every UI change to maintain a consistent experience.
