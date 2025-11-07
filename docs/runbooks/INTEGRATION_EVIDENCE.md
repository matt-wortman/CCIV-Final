# Integration Evidence Capture Runbook

_Last updated: 2025-11-07_

## 1. Purpose
This runbook standardizes how we capture auditable artifacts for CI (`ci.yml`) and nightly (`nightly-regression.yml`) runs that execute the Postgres-backed integration harness (`npm run test:integration`). It aligns with Sections 8–12 of `docs/reviews/testing_expansion_plan.md` so auditors can replay the harness using the same commands we run in GitHub Actions.

## 2. Prerequisites
- GitHub CLI (`gh`) authenticated with repo scope.
- Local workspace synced to the commit whose CI run you are archiving.
- Docker + Node.js installed (for rerunning coverage scripts locally).
- `RUN_INTEGRATION_TESTS` compatible environment (if re-running tests for verification).

## 3. Quick Start (CI Run)
1. Identify the successful CI run ID:
   ```bash
   gh run list --workflow "ci.yml" --branch master --status success --limit 5
   ```
2. Use the automation helper (recommended):
   ```bash
   npm run evidence:collect -- --workflow ci --run <run-id> --coverage-summary coverage/summary.json --coverage-final coverage/coverage-final.json --guards config/testing/coverage-guards.json
   ```
   The script wraps Steps 2–5 below (metadata, logs, artifact download, optional file copies, and integrity hash). Pass `--dry-run` to preview actions or `--output <dir>` to override the default folder.

3. Manual alternative (if the script cannot be used): export helper variables and run the commands below.
   ```bash
   RUN_ID=1234567890
   EVIDENCE_DIR=docs/evidence/2025-11-07/ci
   mkdir -p "$EVIDENCE_DIR"
   ```
4. Capture metadata + logs:
   ```bash
   gh run view "$RUN_ID" \
     --json name,runNumber,headSha,headBranch,displayTitle,conclusion,createdAt,updatedAt,runAttempt,actor \
     --log > "$EVIDENCE_DIR/metadata.json"
   gh run download "$RUN_ID" --dir "$EVIDENCE_DIR/artifacts"
   ```
5. Collect coverage + guard data (reruns locally for determinism):
   ```bash
   npm run test:coverage:ci
   node scripts/coverage-report.ts --format json --output "$EVIDENCE_DIR/coverage-summary.json"
   cp coverage/coverage-final.json "$EVIDENCE_DIR/coverage-final.json"
   cp config/testing/coverage-guards.json "$EVIDENCE_DIR/guards.json"
   ```
6. Compute integrity hashes:
   ```bash
   (cd "$EVIDENCE_DIR" && find . -type f -print0 | sort -z | xargs -0 md5sum > INTEGRITY.md5)
   ```
7. Fill in `README.md` (template already placed in the folder) with run metadata, commands, and anomalies.
8. Update `docs/status_log.md` with the workflow URL + evidence folder path.

## 4. Nightly Regression Variant
Follow the same steps with `EVIDENCE_DIR=docs/evidence/2025-11-07/nightly` and env flags:
```bash
RUN_PERFORMANCE_TESTS=1 RUN_VALIDATION_FAILURE_TESTS=1 RUN_INTEGRATION_TESTS=1 npm run test:coverage:ci
```
Document additional optional-suite outputs (performance metrics, validation failures) inside the nightly `README.md`.

## 5. Directory Structure & Naming
- Root folder: `docs/evidence/<YYYY-MM-DD>/<workflow>/`
- Required files: `README.md`, `metadata.json`, `coverage-summary.json`, `coverage-final.json`, `guards.json`, `INTEGRITY.md5`, and `artifacts/` (raw downloads).
- Optional files: `pdf-hashes.txt`, `prisma-migrate.log`, `docker-inspect.json` if relevant.

## 6. Replacement Policy
- Keep only the most recent green run per workflow per week in the repo.
- Move older runs to external archival storage (see `docs/security/SECURITY_CHECKLIST.md` for retention requirements).

## 7. Troubleshooting
| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| `gh run download` fails with 404 | Run ID belongs to a fork or is not accessible | Verify repository/branch, re-run `gh run list` with `--repo` flag |
| Coverage summary mismatches workflow data | Local rerun used different commit | Checkout the CI commit (`git checkout <sha>`) before rerunning coverage |
| Guard failures blocking capture | Coverage regressed since CI run | Investigate regression, re-run tests, or document exception in `README.md` |
| `INTEGRITY.md5` changes after capture | Files edited post-checksum | Regenerate checksum and note reason in `README.md` |

## 8. Future Automation Hooks
- `scripts/collect-evidence.ts` (planned) will encapsulate Steps 1-5. Track progress in Section 12 of the testing plan.
- A dedicated GitHub Action can call the script nightly to avoid manual intervention; until then, follow this runbook.

## 9. Contacts
- Evidence Owner: Platform QA (tech-triage-platform@internal)
- Escalation: Engineering Manager — Test Automation
