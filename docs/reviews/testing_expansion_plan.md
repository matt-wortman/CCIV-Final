# Testing Expansion Plan — November 6, 2025

## 1. Objectives
- Raise overall Jest coverage from **9.6% statements / 9.1% branches / 6.3% functions** to **≥75% statements and ≥65% branches** by January 2026, with incremental gates added as we climb.
- Ensure every business-critical pathway (submission save, validation, export, PDF, catalog) is exercised by layered unit + integration suites that model user journeys without relying on browser automation.
- Automate execution evidence (CI + nightly) so every pull request and daily build surfaces regressions immediately, including required coverage thresholds per package.

## Status Update — November 6, 2025
- ✅ **Phase A (APIs)**: Added Jest suites for `/api/form-templates`, `/api/form-submissions` (POST/GET/PUT), and `/api/form-exports`, covering happy paths plus validation, Prisma failures, and PDF export hydration. Coverage lift is visible in pipeline runs; console noise during tests is intentional error-path assertions.
- ✅ **Phase B (Engine/UI)**: Landed renderer/provider tests (state machine, repeat groups, score calc), conditional-logic + validation unit suites, and interaction coverage for `DynamicFormNavigation` (progress, autosave, submission guardrails).
- 🔄 **Coverage trend**: Statement coverage has moved from 9.6% → ~26% locally (exact figure pending a full `jest --coverage` run). Remaining deltas hinge on middleware, technology services, and integration/database flows.

## Status Update — November 7, 2025
- 🚀 **Integration harness landed**: Added `docker-compose.db-test.yml`, `scripts/run-integration-tests.sh`, and `npm run test:integration` so we can spin up Postgres, run migrations/seeds, and execute Jest with `RUN_INTEGRATION_TESTS=1` locally and in CI.
- ✅ **First integration suite**: `tests/integration/dynamic-form-drafts.test.ts` now drives `saveDraftResponse`/`loadDraftResponse` against the real schema, persisting drafts, rebuilding answer metadata, and surfacing optimistic-lock conflicts.
- ✅ **Renderer scenario matrix v1**: Introduced `src/lib/form-engine/renderer.scenarios.test.tsx`, covering nested visibility gates, hide-on-trigger flows, and conditional `require` paths to raise coverage for `shouldShowField`/`shouldRequireField`.
- 🔁 **CI/Nightly integration**: `npm run test:integration` now runs inside `ci.yml` and `nightly-regression.yml`; next step is archiving the first workflow logs/artifacts for auditors.
- 📊 **Coverage trend**: Global coverage is now **36.18% statements / 35.60% branches / 29.29% functions** (lines mirror statements), clearing the Nov 22 35/30 milestone ahead of schedule while per-file guards stay green.

## Immediate Next Steps (Targeting Week of November 17, 2025)
1. **Middleware + technology services**: Finish Phase A by testing `middleware.ts`, `applyBindingWrites`, `buildSubmissionAnswerMetadata`, and `loadDraftResponse` with Prisma transaction mocks, then fold those suites under the existing coverage guards.
2. **Integration harness Stage 2**: Capture deterministic fixtures (draft reuse + submit/export) and extend the suite toward submit/export/attachment flows so we can enforce per-file guards on `submitFormResponse`.
3. **Renderer scenarios v2**: Layer repeatable-group + multi-select autosave cases (including hidden-field validation) into `renderer.scenarios.test.tsx`, then prepare to ratchet conditional helper branch thresholds.
4. **Evidence & doc updates**: Archive the first CI + nightly runs that include `npm run test:integration`, update `docs/status_log.md` with workflow URLs, and publish a short runbook so auditors can replay the harness.

## 2. Phased Workstreams

### Phase A — API & Service Layer (Target +15% statements)
1. **App Router APIs** *(✅ `/api/form-templates`, `/api/form-submissions`, `/api/form-exports`; next: `/api/feedback`, `/api/health`)*
   - `/api/form-templates`, `/api/form-submissions`, `/api/form-exports`, `/api/feedback`, `/api/health`.
   - Use request/response mocks plus Prisma client stubs (pattern established in `src/app/api/feedback/route.test.ts`).
2. **Middleware & edge cases**
   - Add tests for `middleware.ts` (Basic Auth, feature flags, preview routes) using `next/server` mocks.
3. **Technology services**
   - Unit-test `applyBindingWrites`, `buildSubmissionAnswerMetadata`, `loadDraftResponse`, and autosave flows using Jest with Prisma transaction mocks.

### Phase B — Form Engine & UI Logic (Target +20% statements)
1. **Renderer state machine** *(✅ renderer/provider suite merged)*
   - Cover `src/lib/form-engine/renderer.tsx` (responses, repeat groups, error handling, answerMetadata propagation) with React Testing Library.
2. **Conditional logic + validation** *(✅ suites merged)*
   - Add `jest` suites for `conditional-logic.ts`, `validation.ts`, and `form-schemas.ts` verifying rule evaluation, required/optional toggles, and cross-field dependencies.
3. **Component-level tests** *(✅ navigation + autosave; error boundary pending)*
   - Snapshot/interaction tests for navigation, progress indicators, autosave banner, and error boundary coverage.

### Phase C — Integration & Database Flows (Target +15% statements)
1. **Prisma-backed scenarios**
   - Use an ephemeral Postgres (Docker or `prisma dev`) to run integration tests for submission save/submit/draft, repeatable groups, calculated scores, and question revisions.
2. **Scripts & utilities**
   - Cover `scripts/export-forms.ts`, catalog validators, and stale-data helpers via Node-based jest suites (mocking filesystem/Azure interactions).
3. **PDF export smoke tests**
   - Snapshot the PDF React tree for a representative payload to ensure regression detection.

### Phase D — Scenario & Contract Tests (Target +10% statements, qualitative signal)
1. **Cross-layer journeys**
   - Drive draft → submit → export flows through Jest-powered integration suites that hit the app router, Prisma, and service helpers end-to-end (no browser).
2. **Admin/reporting flows**
   - Validate catalog management, demo seeding, and technology dashboard aggregations via contract tests that lock APIs to expected payloads.
3. **Accessibility + performance hooks**
   - Reuse the existing performance baseline instrumentation via Node scripts, ensuring renders stay within timing/error budgets without UI automation.

### Phase E — Tooling & Guardrails
1. **Coverage enforcement**
   - Add Jest `coverageThreshold` once Phase B lands (e.g., 40%/35% interim). Integrate Codecov or an equivalent badge for visibility.
2. **Nightly regression**
   - Keep the restored `.github/workflows/nightly-regression.yml` and extend it with the integration harness + scenario suites once Phase D is ready.
3. **Status logging discipline**
   - Update `docs/status_log.md` template to include a table of tests executed + coverage percentage for each work session.

## 3. Backlog Tracker

| Priority | Task | Owner | Target Date | Status |
| --- | --- | --- | --- | --- |
| P0 | Add unit tests for `/api/form-submissions`, `/api/form-templates`, `/api/form-exports` | Triage Platform | Nov 15 | ✅ Completed Nov 6 |
| P0 | Integration tests for `saveDraftResponse` + optimistic locking | Triage Platform | Nov 22 | 🚧 Baseline draft suite merged Nov 7; submit/resubmission coverage pending |
| P1 | Renderer reducer/unit tests (responses, repeat groups, metadata) | UI Team | Nov 29 | ✅ Completed Nov 6 |
| P1 | Scenario suite: draft → submit → PDF verify (integration harness) | QA | Dec 6 | ⏳ Not started (awaiting DB harness + fixtures) |
| P2 | Database integration harness (docker-compose service + seed) | Platform | Dec 13 | ✅ Compose + runner scripts merged Nov 7; CI Docker host still pending |
| P2 | Coverage thresholds enforced in Jest config | Platform | Dec 20 | ⏳ Pending Phase B hardening |
| P3 | Scenario suites for catalog validation + export scripts | Data/Exports | Jan 10 | ⏳ Not started |
| P3 | Performance instrumentation via Node scripts + dashboards | DevOps | Jan 17 | ⏳ Not started |

## 4. Metrics & Checkpoints
- **Weekly**: Track coverage deltas in `docs/status_log.md` every Friday (include `npx jest --coverage --runInBand` summary).
- **Bi-weekly**: Review failing tests in Nightly Regression, ensure follow-up issues opened within 24h.
- **Sprint Demo**: Show evidence of new suites (screenshots, coverage tables) and confirm that new functionality ships with dedicated tests as part of Definition of Done.

## 5. Week of November 10 Detailed Work Packages

### 5.1 Middleware & Technology Services Suite
- **Scope**: `middleware.ts`, `applyBindingWrites`, `buildSubmissionAnswerMetadata`, `loadDraftResponse`, autosave helpers.
- **Test design**:
  - Mock `NextRequest`/`NextResponse` for Basic Auth, preview, and feature flag branches.
  - Use Prisma transaction stubs to simulate optimistic locking conflicts and recovery.
  - Validate metadata builders against representative submission payloads (draft, submit, repeat groups).
- **Deliverables**: New Jest suites under `src/app/__tests__/middleware` and `src/lib/technology/__tests__`, plus fixtures in `__mocks__/formSubmission.ts` re-used by other suites.
- **Evidence**: Coverage deltas recorded in `docs/status_log.md` with screenshots of branch coverage per file; link failing-path console output to prove guard rails run.
- **Dependencies**: Shared factory utilities for Prisma mocks (extend the helper introduced for Phase A API tests) and finalized list of feature flag keys.

### 5.2 Integration Harness (Ephemeral Postgres)
- **Scope**: Compose file (`docker-compose.db-test.yml`), Prisma schema sync, seed script for draft/save/submit happy + conflict paths.
- **Test design**:
  - Spin up Postgres via `docker compose -f docker-compose.db-test.yml up -d` inside CI and local scripts.
  - Execute `prisma migrate deploy && prisma db seed` per test run to ensure deterministic fixtures.
  - Cover `saveDraftResponse`, `submitResponse`, binding writes, optimistic locking retries, and score calculation through Jest integration suites (`tests/integration/forms/*.test.ts`).
- **Deliverables**: Compose file, `scripts/run-integration-tests.sh`, dedicated `npm run test:integration` script, and CI job wiring (Phase C entry point).
- ✅ Compose file + runner script + npm entry merged on Nov 7; regenerated the Prisma client in binary mode, patched the duplicate index drop, and now run the harness via `npm run test:integration` locally **and** inside `ci.yml`/`nightly-regression.yml`.
- **Evidence**: Log attachments showing migration + seed output, plus LCOV sections for Prisma-backed files.
- ⚠️ Evidence capture: archive the first CI + nightly runs (workflow links/logs) so auditors can replay the Docker harness end-to-end.
- **Dependencies**: Docker availability in CI, secrets for Postgres creds, and sanitized fixture data that can be checked into source control.

### 5.3 Renderer Scenario Matrix
- **Scope**: Extend renderer/provider suite with realistic conditional visibility (`shouldShowField`) and requirement (`shouldRequireField`) combinations, covering nested repeaters and cross-field dependencies.
- **Test design**:
  - Table-driven cases with `describe.each` capturing permutations of state, validation, and metadata propagation.
  - Use React Testing Library + MSW to assert autosave + navigation interactions for hidden vs. visible fields.
- **Deliverables**: Additional renderer spec file (`renderer.scenarios.test.tsx`) and expanded fixtures under `src/lib/form-engine/__fixtures__` documenting each scenario.
- ✅ `src/lib/form-engine/renderer.scenarios.test.tsx` now covers nested show/hide/require permutations **plus** multi-select visibility/requirement cases and an autosave trigger that asserts `onSaveDraft` receives the latest responses.
- **Evidence**: Snapshot diffs stored with tests, coverage uplift for conditional helpers, and demo GIF for autosave guardrail run.
- **Dependencies**: Alignment with UX team on expected behavior for conflicting rules; final decision on whether autosave skip hidden fields.

### 5.4 Coverage Enforcement & Reporting
- **Scope**: Establish coverage gates, dashboards, and reporting hooks that prevent regressions once new suites land.
- **Implementation**:
  - ✅ Add `coverageThreshold` entries per package inside `jest.config.mjs`, starting at 30/25 and ratcheting to 50/40 once Middleware + Integration suites land.
  - ✅ Wire `npm run test:coverage:ci` to run `jest --coverage --runInBand` followed by `scripts/coverage-report.ts`, then upload artifacts/append deltas to `docs/status_log.md`.
  - ✅ Create a `scripts/coverage-report.ts` helper that summarizes coverage and enforces per-file thresholds once critical areas hit ≥80% statements.
  - ✅ Seed `config/testing/coverage-guards.json` with the highest-signal App Router APIs (`form-submissions`, `form-templates`, `feedback`) at ≥95% statements / ≥70–80% branches, and extend the same guardrail to `middleware.ts` (≥90%/≥80%) plus `src/lib/technology/service.ts` (≥80%/≥65%) now that those modules exceed the target thresholds.
- **Deliverables**: Updated Jest config, CI job enforcing coverage, documentation updates describing the ratchet schedule, and automation that comments coverage deltas on pull requests.
- **Evidence**: Screenshots of CI runs blocking on coverage, status logs with historical trendlines, and GitHub comment excerpts showing the automated summaries.
- **Dependencies**: Consensus on ratchet timeline, buy-in from repo maintainers for required checks, and access to Codecov or an equivalent badge service (optional but recommended).

## 6. Risk Register & Mitigations
| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Prisma transaction mocks drift from real schema | False confidence in autosave + metadata tests | Pair the service suites with integration harness once ready; run schema introspection snapshots weekly | Platform |
| Dockerized Postgres slows CI by >5 min | Reduced developer throughput, flaky jobs | Cache Docker layers, re-use container between jobs, and parallelize integration stage separate from lint/unit | DevOps |
| Renderer fixtures become brittle after schema updates | Frequent snapshot churn and reviewer fatigue | Introduce fixture builders tied to JSON schema versions and document expected diffs in PR template | UI Team |
| Scenario auth flows diverge from production SSO | Phase D contract tests misrepresent risks | Implement a deterministic test-only auth token issuer that mirrors production claims and run weekly audits against real SSO metadata | QA |
| Coverage goals unmet before Jan 2026 | Compliance gap and failed audit | Monthly executive review of coverage table, temporary moratorium on untested features, backlog reprioritization if metrics lag | Engineering Leadership |

## 7. Coverage Ramp Schedule
| Date | Statement Target | Branch Target | Focus Area | Guardrail |
| --- | --- | --- | --- | --- |
| Nov 22, 2025 | ≥35% | ≥30% | API + middleware suites merged, baseline thresholds enabled | CI fails if coverage <30% statements |
| Dec 13, 2025 | ≥55% | ≥45% | Integration harness + renderer scenarios complete | `scripts/coverage-report.ts` enforces file-level minimums |
| Jan 10, 2026 | ≥75% | ≥65% | Contract suites + service refactors finish, automation logging live | Release gating requires ≥65% branches per package |
| Jan 31, 2026 | Maintain ≥75/65 | Maintain ≥65 | Regression burndown + debt follow-up | Nightly regression trendline reviewed weekly |

**Ratcheting rules**
- Raise thresholds only after the preceding milestone holds green for five consecutive CI runs.
- For any module still below 60% statements at the target date, open a P0 follow-up ticket and block new feature work touching that file.
- Document every ratchet in `docs/status_log.md` so auditors can trace when coverage expectations changed.

## 8. Stage 2 Execution Checklist (Logged November 7, 2025 PM)

### 8.1 Integration Evidence Package
- Capture the first `ci.yml` + `nightly-regression.yml` runs that execute `npm run test:integration`; store workflow permalinks, job logs, and coverage artifacts under `docs/evidence/2025-11-07/`.
- ✅ Added `docs/runbooks/INTEGRATION_EVIDENCE.md` explaining how to replay the Docker harness locally (commands, env vars, expected log snippets) so auditors can self-serve.
- Track evidence capture inside `docs/status_log.md` (include workflow ID, coverage snapshot hash, and date) to maintain an auditable chain.
- ✅ Seeded `docs/evidence/2025-11-07/` (with `ci/` + `nightly/` subfolders, README templates, metadata examples, and integrity checklist) to remove ambiguity before the first artifacts land.

### 8.2 Submit/Export Integration Suite
- ✅ Added `tests/integration/form-submit-export.test.ts` covering first-time submit, stale-draft retry, and template-driven export flows (attachment conflict + catalog hook scenarios remain TODO per Section 11.2).
- ✅ Introduced `tests/integration/fixtures/formSubmission.ts` to centralize binding lookups and payload builders so both integration suites share deterministic data.
- ✅ Wired the suite into `scripts/run-integration-tests.sh` (`./scripts/run-integration-tests.sh --runInBand --testPathPatterns=tests/integration/form-submit-export.test.ts` runs in ~70s locally with Docker spins).
- ⏳ Follow-up: add attachment retry + catalog hook coverage once the attachment client + webhook stubs land (tracked in Section 11.6).

### 8.3 Guardrail Ratchet & Observability
- Update `config/testing/coverage-guards.json` to add `src/app/api/form-submissions/submitFormResponse` (≥90% statements / ≥75% branches) plus `middleware.ts` (≥90% / ≥80%) once the Stage 2 suites land.
- Teach `scripts/coverage-report.ts` to fail if any new guard regresses and to emit a terse JSON summary that can be archived with the evidence package.
- Document the ratchet in both this plan and `docs/status_log.md`, including the coverage snapshot that justified enabling the guard.

### 8.4 Ownership & Timeline
| Item | Owner | Target | Exit Criteria |
| --- | --- | --- | --- |
| Evidence package & runbook | Platform QA | Nov 8 | Workflow links + artifact bundle checked in under `docs/evidence/2025-11-07/`; runbook merged |
| Submit/Export integration suite | Platform + QA pairing | Nov 12 | `tests/integration/form-submit-export.test.ts` green locally + in CI; fixtures documented |
| Guardrail ratchet + reporting | Tooling | Nov 14 | Guard entries active, `scripts/coverage-report.ts` enforces them, and coverage snapshot pasted into status log |

## 9. Evidence Artifact Template (Draft)

### 9.1 Workflow Metadata
- Minimum fields per run: workflow name, Git SHA, run number, start/end timestamps (UTC), `RUN_INTEGRATION_TESTS` flag, Docker image digest, Prisma migrate hash.
- Capture via `gh run view <run-id> --log` and store the JSON summary under `docs/evidence/2025-11-07/<workflow>/metadata.json`.
- Add a short README inside the evidence folder that explains how to verify the SHA/branch alignment before treating the run as canonical.

### 9.2 Coverage Snapshot Requirements
- Save the raw `coverage/coverage-final.json` plus the summarized output from `scripts/coverage-report.ts --format json` for each audited run.
- Include a `guards.json` excerpt that lists every file-level threshold, its target, and the actual values so auditors can diff future ratchets quickly.
- Record the Jest command that produced the snapshot (e.g., `npm run test:coverage:ci`) inside `docs/evidence/2025-11-07/<workflow>/README.md` for replayability.

### 9.3 Artifact Storage & Retention
- Store only the most recent green run per workflow per week inside `docs/evidence/`; push older artifacts to an external archive if disk usage exceeds 250 MB.
- Ensure each artifact folder contains an `INTEGRITY.md5` file generated via `md5sum` to prove files were not altered after capture.
- Reference the artifact folder path in `docs/status_log.md` whenever a new run is added so the log doubles as an index.

## 10. Stage 2 Command Reference

- `npm run test:integration` — Runs the full Postgres-backed suite (drafts + submit/export). Use `RUN_INTEGRATION_TESTS=1` to ensure DB hooks activate when invoking Jest directly.
- `scripts/run-integration-tests.sh --keep-db` — Spins up the Docker harness once, leaves containers running for iterative spec development (speeds up debugging for submit/export flows).
- `npm run coverage:report` — Generates the guardrail summary that must be attached to each evidence bundle; rerun after every guard addition.
- `node scripts/coverage-report.ts --format json --output docs/evidence/<date>/coverage-summary.json` — Emits the machine-readable coverage snapshot referenced in Section 9.2.
- `gh run view CI --json url,logsUrl,conclusion,headSha --jq '{url,logsUrl,conclusion,headSha}'` — Quick command for grabbing workflow metadata when populating the evidence template.

## 11. Submit/Export Integration Suite Specification

### 11.1 Goals
- Validate the full journey from draft save → submit → export/PDF download using the same Prisma schema and seeds that run in production-like environments.
- Prove optimistic-lock handling and attachment retries behave identically between service-layer mocks and the real database harness.
- Generate deterministic coverage uplift for `submitFormResponse`, `exportFormResponse`, attachment helpers, and PDF hydration utilities so per-file guards can be enforced with confidence.

### 11.2 Scenario Matrix
| Scenario | Description | Key Assertions | Instrumentation |
| --- | --- | --- | --- |
| Draft → First Submit | Start from seeded draft, submit successfully | `rowVersion` increments, `status=SUBMITTED`, response payload matches snapshot | Capture Prisma query log, Jest snapshot of submission payload |
| Draft → Stale Submit Retry | Submit outdated draft, expect conflict, retry with updated payload | First attempt throws conflict error, second succeeds, audit log records retry | Inspect emitted `ConflictResolutionEvent`, assert metrics counter increments |
| Submit → Export PDF | After submit, trigger export resolver and PDF builder | PDF metadata contains revision ids + score breakdown, file stored in mock S3 bucket | Compare generated PDF hash to fixture, assert `exportFormResponse` returns download URL |
| Submit with Attachments | Upload two attachments, force one retry via simulated network error | Attachment service retries once, final manifest contains both files with stable IDs | Mock attachment service exposes call count + failure reason |
| Submit → Catalog Sync Hook | Fire fake webhook post-submit | Hook payload includes submission id, revision metadata, and calculated scores | Assert MSW handler receives payload <2s and stores ack |

### 11.3 Fixtures & Data Management
- Extend `tests/integration/__fixtures__/formResponses.ts` with builders for: base draft, stale draft (lower `rowVersion`), attachment payloads, and export expectations (scores, PDF metadata).
- Seed Postgres with `FORM-SUBMIT-001` (clean draft) and `FORM-SUBMIT-STALE-001` (stale) using a new `prisma/seed/integration-submit.ts` helper referenced by `scripts/run-integration-tests.sh`.
- Store golden artifacts (PDF hash, export manifest JSON) under `tests/integration/__fixtures__/golden/` to keep assertions deterministic.

### 11.4 Observability Hooks
- Add debug logging inside `submitFormResponse` guarded by `process.env.DEBUG_SUBMIT_SUITE` so integration runs can emit concise traces without polluting normal logs.
- Emit metrics counters (`submit.success`, `submit.optimistic_retry`, `attachment.retry`) via the existing instrumentation shim and assert on them in tests by inspecting the in-memory exporter.
- Capture Prisma query timings for submit/export flows and include them in the evidence README for performance context.

### 11.5 Definition of Done
- All scenarios in the matrix run under `npm run test:integration` in <3 min locally and in CI with Docker cache warm.
- Coverage for `submitFormResponse` and `exportFormResponse` exceeds 90% statements / 75% branches, unlocking the guardrail ratchet defined in Section 8.3.
- Evidence bundle for the first green CI run after these tests merge includes: workflow metadata JSON, coverage summary, guardrail report, PDF hash comparison output, and `INTEGRITY.md5`.
- Documentation updated (`docs/runbooks/INTEGRATION_EVIDENCE.md`, this plan, and `docs/status_log.md`) with links to the new artifacts and clear replay instructions.

### 11.6 Progress Log (as of 2025-11-07)
- ✅ Completed scenarios: Draft → First Submit, Draft → Stale Submit Retry, Submit → Export PDF, and live Template Export (see `tests/integration/form-submit-export.test.ts`).
- ⏳ Pending scenarios: Submit with Attachments (blocked on attachment service mocks) and Submit → Catalog Sync Hook (needs deterministic webhook/MSW handler).
- ✅ Shared fixtures (`tests/integration/fixtures/formSubmission.ts`) adopted by both integration suites to prevent payload drift and simplify future scenario additions.

## 12. Evidence Automation Backlog

- ### 12.1 Near-Term Automation Tasks
- ✅ Added `scripts/collect-evidence.ts` + `npm run evidence:collect` to orchestrate `gh run view/download`, copy coverage/guard snapshots, and emit `INTEGRITY.md5` automatically (supports `--dry-run`).
- ✅ Created `.github/workflows/evidence-collector.yml` so anyone can trigger `workflow_dispatch` with a run ID and automatically gather artifacts + upload them as a GitHub Actions artifact (uses the same script under the hood).

### 12.2 Validation & Guardrails
- Lint + unit-test the new script (mock `gh` responses) so CI enforces parsing correctness before we trust archived metadata.
- Include a checksum verification step inside `scripts/coverage-report.ts` to confirm the coverage summary embedded in evidence folders matches the raw LCOV data.
- Document rollback steps in case evidence automation stalls (manual commands mirroring Section 9) to prevent audit gaps.

### 12.3 Longer-Term Enhancements
- Integrate evidence metadata with the status log automatically by appending entries via a script (avoids manual drift).
- Explore uploading hashed coverage artifacts to object storage with signed URLs so auditors can fetch large files without bloating the repo.
- Add dashboarding (e.g., LiteDB/JSON feed) that visualizes coverage trendlines and guard statuses sourced from the archived JSON summaries.
