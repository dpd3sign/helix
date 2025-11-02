# HELIX Passdown Template

Use this checklist when preparing the summary for the next working session. Update each section with concise bullet points so the incoming agent can start immediately.

## 1. Context Snapshot
- **Branch / Environment:** e.g., `main`, feature branch, Supabase project used.
- **Latest Build/Test State:** note if metro/dev server running, last command output, and pending migrations.
- **Relevant Docs:** point to `docs/helix-rulebook.md`, `docs/helix-system-overview.md`, `docs/helix-architecture.md`, and any new specs.

## 2. Completed Since Last Handoff
- Bullet list of tasks finished (code merged, migrations created, docs updated).
- Mention validations run (tests, lint, simulator checks) with outcomes.

## 3. Outstanding Work
- Ordered list of high-priority items.
- Include file paths and specific actions needed (e.g., “Update RLS in `supabase/migrations/...`”).
- Flag blockers or dependencies (awaiting design sign-off, credentials, etc.).

## 4. Risks & Watchouts
- Known bugs, failing tests, or unstable features.
- External factors (e.g., Apple Developer account pending).

## 5. Next Suggested Steps
1. Immediate action that unblocks progress.
2. Secondary tasks to continue momentum.
3. Optional stretch goals if time permits.

## 6. Testing & Verification Plan
- Tests to rerun after making changes (unit, integration, e2e).
- Any manual QA steps (Expo simulator flows, API curl checks).

## 7. Communication Notes
- Stakeholder updates to share.
- Decisions made that affect roadmap or scope.

## 8. Artifacts & Links
- Pull requests, design files, external references.
- Credentials or secrets handling notes (never commit secrets; reference `.env` expectations).

> Keep passdowns concise (under ~250 words) but precise. Prioritize clarity over completeness—the goal is to get the next agent productive within minutes while honoring the HELIX Rulebook.

---

## Prompt Library

### Passdown Workflow Prompt
```
Follow the HELIX passdown checklist in docs/passdown-template.md. Summarize:
- Context snapshot (branch, environment, latest test state)
- Completed work since the last handoff
- Outstanding tasks with file paths
- Risks/watchouts
- Next suggested steps (ordered)
- Testing and verification plan
- Communication notes
- Artifacts & links
Keep it under 250 words, using concise bullets, and ensure every item aligns with the HELIX Rulebook.
```

### New Conversation Kickoff Prompt
```
You are continuing development on the HELIX mobile app (Expo + Supabase). Review:
- docs/helix-rulebook.md (design & build guardrails)
- docs/helix-system-overview.md (vision, flow, roadmap)
- docs/helix-architecture.md (module breakdowns)
- Any prior passdown summary
Start by restating the current objective, confirm outstanding tasks, and propose a short plan (3–5 steps) before executing work. Apply HELIX Design Rules to every suggestion.
```
