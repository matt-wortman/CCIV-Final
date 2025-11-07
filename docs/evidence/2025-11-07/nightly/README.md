# Nightly Regression Evidence — TEMPLATE

- **Workflow**: `nightly-regression.yml`
- **Git SHA**: `<fill>`
- **Run Number**: `<fill>`
- **Run URL**: `<fill>`
- **Logs URL**: `<fill>`
- **Scheduled Timestamp (UTC)**: `<fill>`
- **ENV Flags**: `RUN_PERFORMANCE_TESTS=1 RUN_VALIDATION_FAILURE_TESTS=1 RUN_INTEGRATION_TESTS=1`
- **Docker Image Digest**: `<fill>`
- **Prisma Migrate Hash**: `<fill>`

## Commands After Download
1. `gh run view <run-id> --json ... --log > metadata.json`
2. `gh run download <run-id> --dir artifacts`
3. `node scripts/coverage-report.ts --format json --output coverage-summary.json`
4. `cp coverage/coverage-final.json ./coverage-final.json`
5. `cp config/testing/coverage-guards.json ./guards.json`
6. `find . -type f -print0 | sort -z | xargs -0 md5sum > INTEGRITY.md5`

## Additional Verification
- [ ] Nightly artifacts include `test-results/` for optional suites
- [ ] Coverage deltas recorded in `docs/status_log.md`
- [ ] Differences vs CI run documented below

### Notes
_Add summary + issues observed once populated._
