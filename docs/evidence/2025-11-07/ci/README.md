# CI Evidence — TEMPLATE

- **Workflow**: `ci.yml`
- **Git SHA**: `<fill>`
- **Run Number**: `<fill>`
- **Run URL**: `<fill>`
- **Logs URL**: `<fill>`
- **Start / End (UTC)**: `<fill>`
- **Integration Harness**: `RUN_INTEGRATION_TESTS=1`
- **Docker Image Digest**: `<fill>`
- **Prisma Migrate Hash**: `<fill>`

## Commands Executed After Download
1. `gh run view <run-id> --json name,runNumber,headSha,displayTitle,conclusion,createdAt,updatedAt,headBranch,repository,triggeringActor --log --jq '.' > metadata.json`
2. `gh run download <run-id> --dir artifacts`
3. `node scripts/coverage-report.ts --format json --output coverage-summary.json`
4. `cp coverage/coverage-final.json ./coverage-final.json`
5. `cp config/testing/coverage-guards.json ./guards.json`
6. `find . -type f -print0 | sort -z | xargs -0 md5sum > INTEGRITY.md5`

## Validation Checklist
- [ ] `metadata.json` shows `conclusion":"success"`
- [ ] Coverage summary statements ≥ 35% / branches ≥ 30%
- [ ] Guard report shows no failures
- [ ] Evidence folder committed with no secrets
- [ ] Entry added to `docs/status_log.md` (include workflow URL + folder path)

_Add short narrative here once populated (noting any anomalies, retries, or deviations)._ 
