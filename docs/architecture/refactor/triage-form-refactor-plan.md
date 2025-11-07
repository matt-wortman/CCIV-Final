# Tech Triage Form – Architectural Refactor Plan

**Prepared:** October 7, 2025  
**Purpose:** Address the architectural issues raised in the recent code review so the triage form can evolve (persistence, validation, autosave, tests) without large rewrites each time.

---

## 1. Establish a Shared Form Schema Module

**Goal:** Move all form data shape definitions out of the React page and into a neutral module that UI, server actions, and utilities can share.

### Tasks
1. Create `src/lib/form-schema.ts`:
   - Define the Form data model with Zod (`triageFormSchema`).
   - Export derived TypeScript types (`TriageFormValues`, section types, scorings).
   - Include helpers for default/empty values.
2. Update `FormEngineProvider` (and tests) to consume the shared schema instead of the inline `FormState` definitions.
3. Swap all imports of `FormData`/`InitialFormData` from `page.tsx` or section files to come from the new schema module.
4. Document the schema in `docs/technical/architecture.md` (new “Forms and Validation” subsection) so future contributors know where to add fields.

### Acceptance Criteria
- No UI component imports types from page modules.
- A single source of truth for form defaults and validation (Zod schema).
- CI builds pass with the new types.

---

## 2. Encapsulate Form State and Navigation

**Goal:** Remove global form responsibilities from `src/app/form/page.tsx` and expose them via a dedicated hook/provider pair.

### Tasks
1. Create `src/lib/hooks/useTriageForm.ts`:
   - Accept template metadata & initial data.
   - Provide state for `currentSection`, `values`, `setFieldValue`, `setRepeatGroup`, `nextSection`, `previousSection`, `reset`.
   - Integrate autosave and dirty tracking moved from `DynamicFormNavigation`.
2. Create `src/components/form/TriageFormProvider.tsx` to wrap the hook and expose context (replacing `FormEngineProvider` or merging functionality).
3. Update the form page to become a thin composition layer:
   - Load template & initial draft data.
  - Render provider + layout + navigation.
   - Remove all direct state logic from the page.
4. Update tests to cover hook behavior (validation, navigation, autosave timers).

### Acceptance Criteria
- `page.tsx` is <120 lines and does not hold business logic.
- Autosave, navigation, and state are reusable for server actions/tests.
- Unit tests exist for `useTriageForm` (dirty detection, autosave debounce, section navigation).

---

## 3. Break Down Large Section Components

**Goal:** Reduce 200+ line sections into focused pieces that can be reused and tested independently.

### Targets & Tasks
1. **Market Analysis Section**
   - Extract competitor table logic into `CompetitorTable` component + hook (`useCompetitorRows`).
   - Move static copy into markdown/`description.ts` if needed for readability.
2. **Score & Recommendation Section**
   - Use existing `DynamicScoringMatrix` / `DynamicScoringSummary` components.
   - Create `ImpactValueMatrix` component (current matrix block).
   - Parent section orchestrates layout only.
3. **General Rule**
   - For any section >150 lines, create child components for:
     - rich tables or lists
     - repeated headings/descriptions
   - Add one Storybook entry or unit test where feasible to ensure rendering survives refactors.

### Acceptance Criteria
- Each section file is <150 lines and focused on composition.
- Shared widgets live under `src/components/form/widgets/*`.
- Scoring table, matrix, and competitor table have their own props/tests.

---

## 4. Decouple Scoring Utilities from UI

**Goal:** Ensure scoring logic can run in API routes or background jobs without importing React code.

### Tasks
1. Move `src/lib/scoring.ts` to `src/lib/scoring/calculations.ts` (pure functions).
2. Update functions to accept `TriageFormValues` from the shared schema.
3. Provide selectors/hooks under `src/lib/scoring/hooks.ts` that wrap the pure functions for React usage (memoization).
4. Update exports to ensure no React files import from the scoring module (only the hook wrapper does).

### Acceptance Criteria
- `calculations.ts` has zero React imports.
- React components import scoring results via the hook or directly from the pure module.
- Add a unit test for `calculateAllScores` verifying output for representative inputs.

---

## 5. Align Validation & Server Actions

**Goal:** Prepare for persistence and validation work by tying server operations to the shared schema/context.

### Tasks
1. Implement server actions for draft save / submit that:
   - Parse incoming data with the shared Zod schema.
   - Persist through Prisma.
   - Return typed results (success, errors).
2. Update `useTriageForm` to call the server actions (instead of direct API fetches).
3. Extend validation feedback to show section/field names (already partially implemented) and capture server validation errors.
4. Document the API contract in `docs/technical/architecture.md`.

### Acceptance Criteria
- Form submission path calls server actions that validate with Zod.
- Draft save returns field-level errors consumable by the UI.
- Manual test: entering invalid data surfaces the correct field/section message.

---

## Implementation Notes & Sequencing

1. **Start with the schema module (Section 1)** – unlocks type sharing for the rest of the tasks.
2. **Move form state into the hook/provider (Section 2).** Perform autosave/dirty logic adjustments after the schema is central.
3. **Refactor sections (Section 3)** once the shared hook is in place. This will reduce merge conflicts.
4. **Extract scoring utilities (Section 4)** after sections are lighter to avoid double work.
5. **Introduce server actions/validation (Section 5)** once the codebase is modular enough to support it.

### Recommended Branch Strategy
- Use feature branches per section (e.g., `refactor/schema-module`, `refactor/form-hook`, etc.).
- Merge in order to prevent type drift.

---

## Tracking & Follow-up

- Create GitHub issues for each numbered section above referencing this plan.
- Keep the plan updated as pieces ship (mark sections complete, note blockers).
- During code reviews, verify new files respect the shared schema and hook structure.

