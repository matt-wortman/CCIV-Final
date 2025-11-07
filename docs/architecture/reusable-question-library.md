# Reusable Question Library & Prefill – Design Overview (Plain English)

Last updated: 2025-10-22

## Why we’re doing this

We ask many of the same questions across different forms and stages (e.g., Tech ID, inventor info, common triage fields). We want to define each shared question once, let templates reference it, and allow users to pull in relevant past answers for the same Tech ID—without losing the exact wording that was used when an answer was given or a decision was made.

### Current pain points (October 2025 reality check)
- The builder can clone an entire template, but it cannot cherry-pick individual questions from multiple forms. In practice that means we **rewrite** shared fields like “Tech ID” by hand whenever we assemble a new template.
- Binding still depends on positional `fieldCode` values like `F0.1`. Those codes leak everywhere, confuse authors, and break whenever sections move.
- Prefill is an all-or-nothing affair; the user can’t select a Tech ID and have dependent questions auto-populate because the runtime cannot look up answers until the template has the right `dictionaryKey` wiring (added later via scripts).

The plan below addresses these gaps directly by introducing a catalog keyed by human-readable dictionary entries, not section-based field codes.

## What the “question library” is

Think of a shelf with one labeled card per question. A form builder picks cards off that shelf rather than retyping questions. If a card’s meaning changes later, we keep the previous version and publish a new one. New forms see the latest version; old snapshots show exactly what was asked at the time.

Where this lives in code today:
- Dictionary entries: `QuestionDictionary` rows plus a foreign key from `FormQuestion` → see `prisma/schema.prisma`.
- Hydration + prefill from the dictionary’s binding path → see `src/lib/technology/service.ts`.

## How answers and prefill work

Answers belong to the Technology (keyed by Tech ID) and its stage supplements (e.g., Triage). Templates are views into that data:
- When a form loads for a known Tech ID, we prefill fields by following the dictionary’s binding path into `Technology` or a stage table.
- For flexible questions that don’t warrant a dedicated column, we store values in a small JSON “extended data” area on the stage record.

Upcoming improvement: each stored answer will carry the exact `questionRevisionId` it answered. That lets the UI warn when the wording has changed since the answer was given and helps reviewers trust what they see.

## When questions change

Admins follow a simple policy:
- Typos or clarifications that don’t change meaning: new revision row, same version number.
- Meaning change (scope, options, validation, requiredness): new revision row, incremented version number.

On load, the form compares the answer’s saved `questionRevisionId` with the dictionary’s current revision id. If they differ, we show a gentle “stale answer” banner and let the editor keep, update, or clear it.

Reference policy: `docs/question-version-policy.md` (root repo)

## Freezing snapshots (“Freeze” button)

When it’s time for committee review, we capture a snapshot that includes:
- The Technology and stage data as of that moment.
- Every answer with its `questionRevisionId`.
- The complete set of question definitions as displayed (labels, options, validation), so the snapshot is self‑contained and reviewable years later.

We’ll add a dedicated table (or enrich `StageHistory.snapshot`) for this. A simple read‑only viewer will render directly from the frozen payload.

## What exists vs what’s next

Already in place
- Dictionary + form-question FK
- Binding paths and prefill/write-back
- StageHistory snapshots (first step toward “Freeze”)

Next steps
1) Add immutable `QuestionRevision` and point the dictionary at `currentRevisionId/currentVersion`.
2) Replace positional `fieldCode` lookups with named dictionary entries (e.g., `tech.techId`) as the source of truth for binding and reuse.
3) Store `questionRevisionId` with answers (for flexible fields, in stage `extendedData`).
4) Implement stale-answer detection in the loader.
5) Introduce the “import from history” drawer: show previous answers for this Tech ID and let the user opt-in to import per field.
6) Promote the snapshot to include question definitions and revision ids; add a basic snapshot viewer.

We will gate this behind the Phase 0 plan (`docs/phase-0-validation-plan.md`) to measure performance and data integrity before turning it on by default.

## Acceptance: what “done” looks like

- Builders pick questions from the library, not copy/paste.
- Opening a form for a known Tech ID offers relevant prior answers and marks anything stale.
- Decisions link to a snapshot that shows exactly what was asked and answered at the time.
- No user has to manage versions; the system handles it for them.

## Where to find things

- Dictionary & bindings: `prisma/schema.prisma`, `scripts/util/attach-dictionary-keys.ts`, `scripts/catalog/validate-binding-paths.ts`
- Prefill/write-back: `src/lib/technology/service.ts`, `src/app/dynamic-form/actions.ts`
- Plans & policies: `../../PROJECT_STATUS.md`, `../ARCHITECTURE_ROADMAP.md`, root `docs/question-version-policy.md`, root `docs/phase-0-validation-plan.md`

## Implementation note for the next session
- Immediate next task: update schema + services so forms reference questions by dictionary key (e.g., `tech.techId`) instead of generated field codes; document any temporary mapping layer required during migration.
- UX requirement: after the user selects or types an existing Tech ID, the runtime should fetch the latest answers for child questions (inventor info, mission alignment, etc.) and prefill them automatically, while marking anything stale if the wording changed.
