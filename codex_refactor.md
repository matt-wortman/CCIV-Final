# Refactoring Strategy for Question & Answer Versioning

## 1. Current-State Opinion

- **Two-layer storage is confusing.** Persisting answer values in structured stage columns while tacking revision metadata into `extendedData` creates two sources of truth. It keeps legacy reads working, but developers debate which source reflects reality, producing brittle tooling (`fix-stale-test-data.ts` had to blank columns just to view stale indicators).
- **Version intent is unclear.** The system records revisions, yet the domain rules (when to bump a version, when an answer can auto-carry forward) live in docs instead of code. The result is guesswork about whether a change is compatible.
- **Stale detection depends on side effects.** Metadata only exists if writers remembered to populate `extendedData`. Any missed path makes the UI think an answer is “UNKNOWN,” despite the value being present in columns.
- **Testing and scripts fight the schema.** Utilities must juggle structured columns, JSON, and revision tables, making it hard to create or reset samples. That friction signals over-complexity and suggests we should simplify the domain model rather than codify the workaround.
- **Forward-looking goals are blocked.** Building a reusable library and reporting pipeline requires stable question IDs, history, and deterministic answer linkage. The current hybrid blocks those features because we cannot trust a single storage path or easily rehydrate context.

**Bottom line:** We are preserving legacy structure at the expense of clarity. With the feature still in pilot, this is the right moment to adopt a clean, version-centric design, even if it means a deeper refactor.

## 2. Guiding Principles

1. **Single source of truth** – Store every persisted answer in one table referencing the exact question revision it answered.
2. **Immutable revisions** – Each change to wording/options produces a new revision row; old rows remain intact.
3. **Explicit compatibility** – Admins mark revisions as compatibility-breaking or not so the system knows whether to auto-accept past answers.
4. **Composable library** – Forms, reports, and APIs reference reusable questions by stable IDs, not field codes.
5. **Simple reads & writes** – Service code should not inspect multiple storage layers; ORM queries must stay straightforward.

## 3. Refactor Plan

### Phase 0 – Preparation (Docs & Alignment)
- Finalize acceptance rules with stakeholders: define “compatible change,” desired UI for stale answers, and rollout expectations.
- Update architecture docs to reflect the end-state model (question catalog + answer table).
- Capture backups of current dev/staging databases for rollback safety.

### Phase 1 – Schema Foundation
- **New tables**
  - `question_library` (existing `QuestionDictionary` can evolve): ensure stable `questionId`.
  - `question_revision` (already exists but verify fields: label, helpText, options JSON, validation JSON, `compatibilityHint` enum, `createdBy`, timestamps).
  - `question_answer` (new): fields `id`, `answerValue` (JSONB), `questionRevisionId` (FK), `techId` or `subjectId`, `context` (triage/viability/etc.), `answeredAt`, `answeredBy`, `source`.
- **Transition columns**
  - Add nullable FK pointers from stage tables to `question_answer` rows where direct joins are convenient (optional optimization).
- Write migrations to create new tables, indexes, and remove uniqueness constraints that hinder revision history (e.g., current `currentRevisionId` unique per dictionary row stays, but ensure cascade behavior is correct).

### Phase 2 – Migration Script
- Build an idempotent migration service:
  1. Iterate legacy stage columns and `extendedData` entries.
  2. Resolve the matching question dictionary key and locate the appropriate revision:
     - If metadata already has a `questionRevisionId`, use it.
     - If not, use `currentRevisionId` at the time of migration and mark the answer as “unversioned-migrated”.
  3. Create a `question_answer` row with the value & metadata.
  4. Record mapping from `(technologyId, dictionaryKey)` to new answer ID for backfill of links.
  5. Optionally populate a join table (e.g., `stage_answers`) linking stages to the new answer IDs.
- Mark legacy columns as read-only in code once migration is complete; later phases can drop them after confidence builds.

### Phase 3 – Service Layer Rewrite
- Replace `buildInitialValues` to load answers solely from `question_answer`, joined with the latest revision:
  - For each question, load the most recent answer row for the current tech/stage context.
  - Compute status: if `answer.questionRevisionId === currentRevisionId` → FRESH; else STALE with reference to original revision.
  - Provide both current and original question copy to the UI; default display uses current copy with a toggle.
- Rewrite write paths (`applyBindingWrites`) to:
  - Upsert answers into `question_answer` with the revision ID the UI submits.
  - Update stage summaries (if we keep text columns for search/export) by denormalizing from the answer table instead of direct writes.
- Remove `extendedData` usage for revision metadata; keep it only for truly dynamic ad-hoc fields if necessary, or eliminate it entirely.

### Phase 4 – UI & API Adjustments
- Update APIs to return:
  - `currentQuestion` (latest revision payload).
  - `originalQuestion` (revision the answer references) when different.
  - `answerValue`, `status`, and `answeredAt`.
- Adjust front-end components to show latest wording with a “View wording at time of answer” prompt when stale.
- Provide admins a UI to mark a new revision as compatible or breaking; tie that flag to default status outcomes.

### Phase 5 – Cleanup
- Remove or archive legacy scripts that assumed the mixed model.
- Drop unused columns (after observing metrics and ensuring exports/reporting migrate).
- Bake regression tests:
  - For writes: ensure the correct revision ID is stored.
  - For reads: ensure STALE/FRESH labels match expected scenarios.
  - End-to-end scenario: answer question → admin publishes compatible change → stale indicator appears with option to keep or update.

### Phase 6 – Rollout
- Deploy behind a feature flag (e.g., `FEATURE_VERSIONED_ANSWERS_V2`):
  - Local/dev first with mirrored datasets.
  - Staging soak with migration dry run and back-out plan.
  - Production: run migration during a maintenance window, verify count parity.
- Monitor metrics: number of stale answers surfaced, migration success counts, error logs, and user support tickets.

## 4. Risks & Mitigations
- **Data mapping uncertainty:** Some legacy answers lack revision IDs. Mitigate by tagging “migrated without exact revision” and providing admin tools to reconcile manually.
- **Report breakage:** Downstream exports that depend on stage columns must be updated to query the new table. Plan by auditing dashboards and providing compatibility views during the transition.
- **Rollback complexity:** Migration moves data into new tables. Maintain redo scripts and keep original columns untouched until the new flows prove stable.
- **Scope creep:** Resist bolting extra features onto the refactor. Focus first on completing the clean storage model, then tackle analytics/reporting upgrades.

## 5. Summary

To meet the goals—reusable question library and trustworthy answer history—we should fully embrace a revision-centric storage model. The refactor centers on one answer table referencing immutable question revisions, a clear migration path from legacy columns, simplified service logic, and UI patterns that surface mismatches gracefully. This approach removes the current double-storage confusion, makes stale detection deterministic, and prepares the platform for richer reuse and reporting down the line.
