# Final Refactor Plan: Question & Answer Versioning Overhaul

## Summary
We will replace the legacy dual-storage design with a version-centric architecture where every answer references a single immutable question revision. The plan blends Claude’s clean schema vision, Codex’s phased delivery discipline, and Cline’s operational rigor to deliver a controlled migration with clear checkpoints, tooling, and validation.

## Goals
- Provide a reusable question library with explicit revision history.
- Store every answer once, always tied to the revision it answered.
- Surface stale/mismatched answers in the UI with clear actions.
- Migrate safely from the current mixed schema without data loss.

## Guiding Principles
1. **Single source of truth** – Answers live in a dedicated table referencing question revisions.
2. **Immutable revisions** – Each change creates a new revision row; compatibility metadata is explicit.
3. **Composable library** – Forms reference reusable questions by stable IDs, not field codes or column names.
4. **Measured rollout** – Dual-write/read, feature flags, and diagnostics guard the migration.
5. **Transparent documentation** – Architecture decisions, domain rules, and tooling are documented before change.

## High-Level Phases

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 0 | Alignment & architecture | Approved target schema, domain policy doc, dependency inventory |
| 1 | Schema & dual path foundation | New tables, services, feature flag, dual write/read diagnostics |
| 2 | Migration utilities & backfill | Idempotent migrator, coverage dashboards, staged dry runs |
| 3 | Service-layer cutover | New read/write paths, stale detection rewrite, updated UI |
| 4 | Documentation & cleanup | Updated docs/runbooks, admin tooling, legacy removal plan |
| 5 | Rollout & monitoring | Metrics dashboards, fallback plan, final column drop |

## Detailed Plan

### Phase 0 – Alignment & Architecture (1 week)
- Finalize target Prisma schema (`question`, `question_version`, `answer`, optional `stage_answer` view).
- Define revision policy (compatible vs breaking), UI behavior for stale answers, and admin workflows.
- Inventory downstream consumers (reports, exports, APIs) that rely on legacy columns; draft communication plan.
- Capture baseline metrics and database backups.

### Phase 1 – Schema & Dual Path Foundation (1–2 weeks)
- Create migrations for new tables with indexes and foreign keys.
- Implement new TypeScript models/services (`src/lib/questions-v2/`).
- Introduce feature flag `FEATURE_VERSIONED_ANSWERS_V2`.
- Add dual-write logic: submissions write to both legacy storage and the new `answer` table with revision IDs.
- Add dual-read diagnostics endpoint comparing legacy vs new outputs; log discrepancies.

### Phase 2 – Migration Utilities & Backfill (1–2 weeks)
- Build idempotent migration script:
  - Read structured stage columns and `extendedData`.
  - Resolve question dictionary keys to revisions; tag uncertain mappings (`migration_assumed`).
  - Insert into `answer` table and optional linking tables.
- Create dashboards tracking migration progress, discrepancy counts, and write failures.
- Execute migration in dev → staging → prod with validation at each step.

### Phase 3 – Service-Layer Cutover (1 week)
- Switch server read paths (`buildInitialValues`, APIs) to use the new `answer` table; keep feature flag fallback.
- Update write paths to stop populating legacy stores once parity metrics are stable.
- Simplify stale detection using revision comparisons directly.
- Update UI to display latest question wording, indicate mismatches, and offer “view answered wording” toggle.

### Phase 4 – Documentation, Tooling & Cleanup (1 week)
- Update architecture docs, runbooks, onboarding material.
- Provide admin interfaces for marking revision compatibility and reconciling migrated answers.
- Remove legacy scripts (e.g., `fix-stale-test-data.ts` workarounds) and redundant extendedData logic.
- Mark legacy columns read-only; plan removal date.

### Phase 5 – Rollout & Monitoring (ongoing)
- Monitor metrics: stale answer rate, migration coverage, performance benchmarks, error logs.
- Maintain rollback plan (feature flag to revert reads to legacy) during stabilization window.
- After sustained stability, drop legacy columns/tables and delete fallback code.

## Risks & Mitigations
- **Mapping gaps:** Some answers lack revision IDs. Mitigate with tagging, manual review tools, and stakeholder sign-off.
- **Integration drift:** Reports relying on stage columns must be updated; track dependencies from Phase 0 inventory.
- **Performance regressions:** Benchmark new queries; add indexes or caching if needed before cutover.
- **Operational surprises:** Dual write/read plus feature flag allow rapid rollback; dashboards surface anomalies early.

## Success Metrics
- Parity: 100% of legacy answers have corresponding records in the new `answer` table.
- Accuracy: Stale detection matches expected revision comparisons in automated tests.
- Performance: Answer reads/writes stay within current latency budgets.
- Adoption: Admins understand revision compatibility workflow; no critical regressions reported post-cutover.

## Conclusion
Executing this blended plan delivers a clean, version-first architecture while respecting operational realities. We invest early in documentation and diagnostics, migrate data with safety nets, and only then flip the application to the new model. This balances ambition with caution and positions the platform for sustainable growth.
