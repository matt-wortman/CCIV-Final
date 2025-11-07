# Evidence Capture Template — 2025-11-07 Baseline

This directory stores the first audited CI and nightly runs that execute `npm run test:integration`. All artifacts follow the structure mandated in `docs/reviews/testing_expansion_plan.md` (Section 9).

## Required Files per Workflow Run
| File | Description | Source Command |
| --- | --- | --- |
| `metadata.json` | Output from `gh run view <run-id> --log --json ...` (see runbook) | `gh run view` |
| `coverage-summary.json` | Machine-readable summary emitted by `scripts/coverage-report.ts --format json` | `node scripts/coverage-report.ts --format json --output <path>` |
| `guards.json` | Snapshot of `config/testing/coverage-guards.json` values at capture time | `node scripts/coverage-report.ts --format json --includeGuards true` *(placeholder flag; update if CLI changes)* |
| `coverage-final.json` | Raw LCOV-to-JSON export from Jest | Produced during `npm run test:coverage:ci` |
| `artifacts/` | Downloaded workflow artifacts (logs, LCOV, screenshots) | `gh run download <run-id>` |
| `INTEGRITY.md5` | Checksums for every file in the workflow folder | `find . -type f -print0 | sort -z | xargs -0 md5sum` |
| `README.md` | Human-readable summary (commands executed, env vars, validation notes) | Manually authored via runbook |

## Directory Layout
```
/docs/evidence/2025-11-07/
  README.md                 # You are here
  ci/
    README.md               # Fill per run
    metadata.json           # Required
    coverage-summary.json   # Required
    coverage-final.json     # Required
    guards.json             # Required
    artifacts/              # Downloaded workflow artifacts
    INTEGRITY.md5           # Required after files in place
  nightly/
    ...                     # Same structure as ci/
```

Populate `ci/` first (latest green `ci.yml` run on Nov 7) and `nightly/` after the 2025-11-08 UTC execution completes. Replace placeholder files once real data is available.
