# Tech Triage Form – Incremental Refactor Execution Plan

This file breaks the architectural refactor into deployable increments. Each increment has a build target, tests, and deployment checklist so we can ship improvements safely one step at a time.

Date: October 7, 2025

---

## Increment 1 – Shared Schema Bootstrap

**Goal**: Introduce a neutral form schema module without changing behavior.

**Changes**
- Add `src/lib/form-schema.ts` with Zod schema, TypeScript types, and default values.
- Add unit test confirming schema/defaults validate.

**Testing**
- `npm run lint && npm run test form-schema.test.ts`.
- Manual smoke: load form page to ensure nothing breaks.

**Deploy**
- Release note: “Internal: add shared triage form schema (no UI changes).”

---

## Increment 2 – Provider Uses Schema

**Goal**: Wire the new schema into the existing provider; keep UI identical.

**Changes**
- Update `FormEngineProvider` to consume schema defaults/types.
- Replace imports of `FormData`/`InitialFormData` with schema exports.
- Add test covering provider initialization with schema defaults.

**Testing**
- Increment 1 tests + new provider test.
- Manual: load form, ensure data renders; regression run of autosave + submit.

**Deploy**
- Release note: “Internal: form provider now consumes shared schema.”

---

## Increment 3 – Extract `useTriageForm` Hook

**Goal**: Move state/navigation logic into a reusable hook while keeping provider wrapper.

**Changes**
- Create `src/lib/hooks/useTriageForm.ts` (state, navigation, autosave/dirty flags).
- Update provider to call the hook; ensure page still supplies context.
- Port autosave timers and state from navigation component into the hook.
- Add unit test covering `nextSection`, `previousSection`, autosave debounce.

**Testing**
- Unit tests + manual check: autosave, draft save, navigation buttons.

**Deploy**
- Release note: “Internal: triage form state managed by shared hook; autosave unchanged.”

---

## Increment 4 – Thin Page Component

**Goal**: Make `src/app/form/page.tsx` a thin orchestrator.

**Changes**
- Remove inline state/handlers; import provider & hook outputs.
- Ensure template/draft loading still works.
- Update relevant tests (snapshots if any).

**Testing**
- Regression: paths with/without draft, autosave, submit.
- Build passes.

**Deploy**
- Release note: “Internal: refactor form page to rely on provider.”

---

## Increment 5 – Market Analysis Cleanup

**Goal**: Break the largest section into reusable pieces.

**Changes**
- Extract competitor table to `components/form/widgets/CompetitorTable` + `useCompetitorRows` hook.
- Keep parent to orchestrate copy + child components.
- Add simple component test or Storybook story for the table.

**Testing**
- Unit/UI test for new widget.
- Manual: fill competitor table, ensure save/autosave.

**Deploy**
- Release note: “Internal: Market Analysis section modularized.”

---

## Increment 6 – Score & Recommendation Cleanup

**Goal**: Similar cleanup for scoring section.

**Changes**
- Extract Impact/Value matrix to `ImpactValueMatrix` component.
- Keep `DynamicScoringMatrix`/summary as child components.
- Parent orchestrates layout.
- Add test verifying matrix renders markers given sample scores.

**Testing**
- Unit test + manual verification (0 scores, sample data).

**Deploy**
- Release note: “Internal: Score & Recommendation section modularized.”

---

## Increment 7 – Pure Scoring Utilities

**Goal**: Decouple scoring math from React.

**Changes**
- Create `src/lib/scoring/calculations.ts` (pure functions) and `hooks.ts` wrapper.
- Update functions to accept schema types.
- Add unit tests for `calculateAllScores`.

**Testing**
- Run new unit tests; manual verify scores in UI & exports.

**Deploy**
- Release note: “Internal: scoring logic extracted to pure module.”

---

## Increment 8 – Server Actions & Validation

**Goal**: Introduce server actions that reuse schema validation.

**Changes**
- Implement server actions for draft save/submit using Zod schema.
- Update hook/provider to call server actions instead of fetch.
- Enhance error feedback (field + section focus).
- Document API contract in `docs/technical/architecture.md`.

**Testing**
- Unit tests for server actions (valid/invalid payloads, mock Prisma).
- Manual: submit invalid data, confirm targeted toast & focus. Draft save path.

**Deploy**
- Release note: “Feature: server-side validation + targeted error messaging.”

---

## Ongoing Hygiene

- After each increment, update `ARCHITECTURE_REFACTOR_PLAN.md` (check off completed section).
- Track each increment as a GitHub issue (e.g., “Refactor – Increment 1”).
- Ensure CI passes and `/api/health` responds OK before declaring the increment done.

