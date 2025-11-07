# Implementation Guide: Question Revisions, Prefill, and Snapshots

Last updated: 2025-11-03

This is the hands-on playbook for rolling out the question library enhancements discussed in ADR-0001 and the reusable-question overview. Follow the steps in order; each produces evidence we can capture for the Phase 0 validation gate.

## 0. Prerequisites

- Local dev environment running (`npm run dev`, `npx prisma dev`).
- Access to the Azure staging database (for Phase 0 later).
- Familiarity with Prisma migrations and TypeScript.
- Feature flags handled via `.env.local` / App Service settings.

## 1. Schema & Migrations

1. Update `prisma/schema.prisma` with:
   - New `QuestionRevision` model (immutable rows).
   - Add `currentRevisionId` (FK) and `currentVersion` to `QuestionDictionary`.
   - Add optional `extendedData` JSON column to `TriageStage`/`ViabilityStage` (stores flexible answers with revision ids).
   - Add `TechnologySnapshot` table (or expand `StageHistory.snapshot`) per ADR.
   - Introduce stable, human-readable dictionary keys (e.g., `tech.techId`) as the primary identifier for reused questions; record them explicitly on `FormQuestion` and plan the migration path away from positional `fieldCode` references.
2. Generate a migration (name: `20251022_add_question_revisions`), review SQL, ensure foreign keys cascade correctly.
3. Create a follow-up migration `20251022_seed_current_revisions` for backfilling (see Step 2).
4. Run `npx prisma migrate dev` locally; confirm Prisma Client re-generates.

Reference snippet:
```prisma
model QuestionRevision {
  id                String   @id @default(cuid())
  questionKey       String
  versionNumber     Int
  label             String
  helpText          String?
  options           Json?
  validation        Json?
  createdAt         DateTime @default(now())
  createdBy         String
  changeReason      String?
  significantChange Boolean   @default(true)
  dictionary        QuestionDictionary @relation(fields: [dictionaryId], references: [id])
  dictionaryId      String

  @@unique([questionKey, versionNumber])
  @@index([dictionaryId])
}

model QuestionDictionary {
  id                String   @id @default(cuid())
  key               String   @unique
  currentVersion    Int      @default(1)
  currentRevisionId String
  // existing fields…
  currentRevision   QuestionRevision @relation("CurrentRevision", fields: [currentRevisionId], references: [id])
  revisions         QuestionRevision[]
}
```

## 2. Backfill Script

Location: `prisma/seed/backfill-question-revisions.ts`

Steps:
1. Iterate `QuestionDictionary` entries, create a `QuestionRevision` row mirroring existing columns.
2. Update every dictionary row with `currentRevisionId` and `currentVersion = 1`.
3. Log counts, wrap in a transaction. Include a one-time mapping from legacy `fieldCode` values (e.g., `F0.1`) to the new dictionary keys so existing templates retain bindings after the migration.
4. Expose CLI task: `npm run migrate:backfill-revisions` (register in package.json).

Validation: run script twice; second run should be a no-op (idempotent).

## 3. Read Path: Stale Detection

- Add `getAnswerStatus(question, answer)` helper in `src/lib/technology/answer-status.ts`. It compares `answer.questionRevisionId` vs `question.currentRevisionId`.
- Update `loadTemplateWithBindings` in `src/lib/technology/service.ts` to:
  - Fetch dictionary revisions for all bound questions (include `currentRevisionId`).
  - When building `initialResponses`, attach `answerStatus` metadata for the UI.
- Expose status through the API to the dynamic form page.
- When rehydrating drafts (`loadDraftResponse`), call `buildSubmissionAnswerMetadata` so stored `questionRevisionId` values reconstruct `answerMetadata` after the form auto-saves and redirects to `?draft=…`.
- UI change: show a banner/tooltip when status = `STALE`.

## 4. Write Path: Stamping Revision IDs

- In `applyBindingWrites` (`src/lib/technology/service.ts`), when writing to:
  - `Technology` / stage columns: continue as-is.
  - `extendedData`: store objects shaped like `{ value, questionRevisionId, answeredAt }`.
- Update `FormSubmission` persistence (`src/app/dynamic-form/actions.ts`) so drafts/submissions include the revision id in their stored responses if we need to rehydrate.

Types snippet:
```ts
type VersionedAnswer = {
  value: unknown;
  questionRevisionId: string;
  answeredAt: string;
};
```

## 5. Import From History Drawer

- Add a new service function `listPreviousAnswers(techId, dictionaryKeys)` returning latest VersionedAnswer per key.
- UI: Drawer component under `/dynamic-form` that lists prior answers with checkboxes.
- On confirm, merge selected answers into form state, marking them as “imported”.
- Audit: record imports by storing `importedFromRevisionId` along with `questionRevisionId`.

## 6. Freeze Snapshots

- Create `technologySnapshot` route handler (`src/app/api/technology/[techId]/snapshot/route.ts`).
- Move snapshot creation logic to `src/lib/technology/snapshot.ts` with explicit payload:
  ```ts
  type SnapshotPayload = {
    technology: Technology;
    stages: { triage?: StagePayload; viability?: StagePayload };
    questions: Record<string, QuestionRevisionPayload>;
    answers: Record<string, VersionedAnswer>;
    template: RenderTemplate;
  };
  ```
- Add read-only viewer at `/snapshots/[snapshotId]`.

## 7. Feature Flags & Config

- Add `.env` flags:
  - `FEATURE_QUESTION_REVISIONS=off`
  - `FEATURE_PREFILL_IMPORT=off`
  - `FEATURE_TECH_SNAPSHOT=off`
- Wrap new logic in guards so we can deploy without exposing unfinished UI.
- Document toggle procedure in `docs/runbooks/feature-flags.md` (existing or new).
- Document interim behavior: until form authoring moves fully to the dictionary-driven picker, the builder still auto-generates `fieldCode` values. Keep the mapping layer in place and note any manual steps (e.g., running `scripts/util/attach-dictionary-keys.ts`) required during the transition.

## 8. Tests & Validation

- Unit tests:
  - `src/__tests__/technology/answer-status.test.ts`
  - Update existing binding write tests to assert `questionRevisionId` is saved.
- Integration tests:
  - Add Playwright scenario: create revision → mark answer stale → user keeps answer.
  - Snapshot creation + render flow.
- Performance harness (Phase 0 docs): place scripts under `scripts/perf/workloadA|B|C.ts`; export metrics as JSON.
- Capture evidence in `docs/phase-0-validation-report.md` (new file once runs complete).

## 9. Rollout Sequence

1. **Local** — run migrations + backfill + tests with flags off; toggle locally to verify UI.
2. **Dev/Feature env** — deploy migrations, run backfill, execute workloads A/B/C (record results).
3. **Staging** — repeat with production-like data; soak test stale detection for 48h.
4. **Go/No-Go** — update `docs/phase-0-validation-plan.md` checklist and ADR status.
5. **Production** — enable `FEATURE_QUESTION_REVISIONS`, then `FEATURE_PREFILL_IMPORT`, finally `FEATURE_TECH_SNAPSHOT` once viewer is ready.

## 10. Rollback Plan

- Disable flags (reverts to legacy behavior without removing schema).
- If needed, `prisma migrate resolve --rolled-back` and redeploy previous image (schema is backward-compatible because columns are additive).
- Backfill script is idempotent; rerun after rollback if partial.
- Document incident in `docs/runbooks/rollback-log.md` (create if absent).

## 11. File Map / Touchpoints

| Area | Files |
| ---- | ----- |
| Schema | `prisma/schema.prisma`, `prisma/migrations/**` |
| Seed/Backfill | `prisma/seed/backfill-question-revisions.ts`, `package.json` scripts |
| Service Layer | `src/lib/technology/service.ts`, `src/lib/technology/answer-status.ts`, `src/lib/technology/snapshot.ts` |
| UI | `src/app/dynamic-form/page.tsx`, `src/app/dynamic-form/components/ImportDrawer.tsx`, `src/app/snapshots/[snapshotId]/page.tsx` |
| API | `src/app/api/technology/[techId]/snapshot/route.ts`, existing form submission actions |
| Tests | `src/__tests__/technology/*`, new Playwright specs under `tests/e2e/` |
| Docs | This file, ADR-0001, `docs/question-version-policy.md`, `docs/phase-0-validation-plan.md`

## 12. Deliverables Checklist

- [ ] Migrations merged and applied
- [ ] Backfill script committed and documented
- [ ] Stale detection UI merged behind flag
- [ ] Import drawer merged behind flag
- [ ] Snapshot API/viewer merged behind flag
- [ ] Workloads A/B/C results recorded
- [ ] Phase 0 validation report published
- [ ] Flags enabled in production

Keep this document up to date as the work progresses. If implementation differs, note deviations here and update ADR-0001 if the decision itself changes.
