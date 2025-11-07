# Security Configuration Checklist

Last updated: 2025-10-28  
Owner: DevOps + Security

Use this checklist to track security hardening tasks across CI/CD Phase 1. Items marked ✅ are complete. Manual actions that must be performed outside the repository are listed for coordination.

---

## 1. Dependency & Vulnerability Scanning
- ✅ Dependabot weekly updates for npm (`tech-triage-platform/`) and GitHub Actions (`/.github`) configured (`.github/dependabot.yml`).
- ✅ Security scan workflow (`.github/workflows/security-scan.yml`) runs Trivy (fs), `npm audit`, and CodeQL on pushes to protected branches + weekly cron.
- ⚠️ Code scanning dashboards require GitHub Advanced Security for private repos. This repository is public; review CodeQL/Trivy SARIF in the repository’s Security tab. If visibility changes, fall back to reviewing workflow run logs.
- ✅ Dependabot policy: manual merges (no auto-merge) so CI and regression suites run before bumps land.

## 2. GitHub Security Settings
- ✅ Enable Dependency graph (Settings → Security → Advanced Security).
- ✅ Enable Dependabot alerts and security updates.
- ⚠️ Secret scanning & private vulnerability reporting require GitHub Advanced Security.
- ✅ Required status checks on `master` and `phase3-database-driven-form`: `CI - Build & Test` (strict updates; admins included).

## 3. Secrets & Identity (Deferred until Azure work resumes)
- ☐ Execute Azure ↔︎ GitHub OIDC setup (`docs/runbooks/AZURE_GITHUB_OIDC_SETUP.md`) — deferred.
- ☐ Remove legacy Azure client secrets from GitHub after OIDC verification (manual; no automated rotation) — deferred.
- ☐ Document manual secret rotation cadence in operations calendar — deferred.

## 4. Observability & Incident Response (Deferred)
- ☐ Author `docs/runbooks/INCIDENT_RESPONSE.md` — deferred.
- ☐ Instrument alert routing (Azure Monitor, App Service diagnostics) — deferred.

---

## Usage
- Update this checklist whenever a task transitions.
- Reference in Sprint planning to ensure Week 2 deliverables reach completion.
- Linked from `docs/README.md` and security runbooks for quick access.
