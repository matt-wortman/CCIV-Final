# CI Pipeline Setup Runbook

Last updated: 2025-10-28

Use this runbook to configure and operate the Tech Triage Platform CI workflows that now run from `.github/workflows/`. Follow the steps in order whenever the repository is cloned to a new GitHub account or when workflow permissions are reset.

---

## 1. GitHub Actions Workflow Permissions
1. Navigate to **Settings → Actions → General** in the GitHub repository.
2. Under **Workflow permissions**, select **Read and write permissions**. This grants the `ci.yml` job enough scope to create pull request comments via `actions/github-script`.
3. Keep **Allow GitHub Actions to create and approve pull requests** disabled unless a future automation requires it.
4. Save the settings.

## 2. Optional: Re-enable Codecov Uploads (only if needed)
1. By default, the `CI - Build & Test` workflow no longer attempts a Codecov upload. If you want coverage reports in Codecov, restore the upload step in `.github/workflows/ci.yml` (see commit history for the block that was removed on 2025-10-28).
2. In Codecov, locate the repository token under **Settings → Access → Upload token**.
3. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret** and create `CODECOV_TOKEN` with that value.
4. Reference the secret in the restored upload step (`token: ${{ secrets.CODECOV_TOKEN }}`) so the action can authenticate.

## 3. Nightly Regression Workflow
- File: `.github/workflows/nightly-regression.yml`
- Schedule: nightly at 03:00 UTC (cron `0 3 * * *`).
- Purpose: Executes Jest with `RUN_PERFORMANCE_TESTS=true` and `RUN_VALIDATION_FAILURE_TESTS=true` so long-running performance checks and the currently failing validation regression run without holding the main CI.
- This workflow should remain optional; investigate failures the next morning and decide whether to promote fixes into the primary test suite.

## 4. Branch Protection Once CI Is Stable
1. After verifying the `ci.yml` workflow on multiple pull requests, go to **Settings → Branches → Branch protection rules**.
2. Edit or create a rule for `main`.
3. Enable **Require status checks to pass before merging** and select:
   - `CI - Build & Test`
   - `Nightly Regression (scheduled)` (optional; leave unchecked if you do not want nightly failures to block merges).
4. Enable **Require branches to be up to date before merging** if you want to enforce rebase/merge commits with the latest `main`.
5. Save the rule and communicate the change in Slack `#tech-triage-engineering`.

## 5. Manual Validation Commands (for debugging)
Run the same commands locally when reproducing CI failures:

```bash
npm run lint
npm run type-check
npm run test:coverage
npm run build
RUN_PERFORMANCE_TESTS=true RUN_VALIDATION_FAILURE_TESTS=true npm run test:coverage -- --runInBand
```

Capture the command output in Jira or the status log when escalating issues.

---

## Change Log
- **2025-10-28:** Initial version documenting workflow permissions, Codecov setup, nightly regression job, and branch protection guidance.
- **2025-10-28:** Updated to note that Codecov uploads are disabled by default; instructions now cover how to re-enable the step if desired.
