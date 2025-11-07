# Security Monitoring Runbook

Last updated: 2025-10-28

This runbook explains how we monitor automated security signals for the Tech Triage Platform and how to respond when alerts appear.

---

## 1. Dependabot Updates

- **Schedule:** Weekly (Mondays) for npm dependencies in `tech-triage-platform/` and for GitHub Actions workflows (`.github/dependabot.yml`).
- **Where to watch:** GitHub → Pull Requests filter `author:app/dependabot`.
- **Action:** Review, run `npm run lint && npm run type-check && npx jest --coverage --runInBand && npm run build` locally if the change touches runtime dependencies, then merge once CI passes. Keep the Dependabot PR queue under five to avoid backlog.

## 2. Security Scan Workflow

Workflow file: `.github/workflows/security-scan.yml`

### Triggers
- Every push to `main` that touches workflow or application code.
- Weekly cron (`0 2 * * 1`, Mondays at 02:00 UTC).

### Jobs & Response
| Job | What it does | Where to review | Typical Action |
| --- | --- | --- | --- |
| `trivy-fs` | Scans repository for CRITICAL/HIGH CVEs | GitHub → Security → Code scanning alerts (`category: trivy-fs`) | Investigate new alerts, patch dependency or suppress with justification. |
| `trivy-image` | Builds Docker target `final` and scans resulting image | GitHub → Security → Code scanning alerts (`category: trivy-image`) | Reduce base-image or system package CVEs; rebuild image after fix. |
| `dependency-check` | Runs `npm audit --audit-level=moderate`, exports SBOM artifact | Workflow run summary (Artifacts tab) | For high/critical advisories, patch immediately; SBOM is used for customer requests. |
| `codeql` | Performs CodeQL JavaScript analysis | GitHub → Security → Code scanning alerts (`CodeQL`) | Triage alerts, mark false positives, or patch vulnerable code. |

### Response SLA
- **Critical vulnerabilities (CRITICAL/HIGH)**: Acknowledge within 24 hours, remediate or document temporary mitigation within 3 business days.
- **Moderate vulnerabilities**: Plan remediation in the next sprint (≤ 2 weeks).

## 3. Enabling GitHub Security Alerts (one-time tasks)

Ensure these settings are enabled in GitHub → Settings → Code security and analysis:
- [x] Dependabot alerts
- [x] Dependabot security updates
- [ ] Secret scanning *(requires GitHub Advanced Security; unavailable for this personal repository)*
- [ ] Private vulnerability reporting *(requires GitHub Advanced Security; unavailable for this personal repository)*
- [ ] Code scanning default setup *(GitHub UI dashboards need Advanced Security; review CodeQL + Trivy results from workflow run logs until licensing changes)*

Document completion in `docs/security/SECURITY_CHECKLIST.md` (to be created when security hardening progresses).

## 4. Escalation Path

1. Create a ticket in the “Security” Jira board with severity matching CVSS score.
2. Tag DevOps lead and product owner in Slack `#tech-triage-engineering`.
3. For production-impacting vulnerabilities, follow the incident response playbook (`docs/runbooks/INCIDENT_RESPONSE.md` once authored).

## 5. Verification Commands

For local validation (optional when debugging pipeline issues):
```bash
# Filesystem scan
docker run --rm -v "$(pwd)/tech-triage-platform:/workspace" aquasec/trivy fs /workspace

# Image scan (after building locally)
docker build -t tech-triage:security-scan tech-triage-platform
docker run --rm aquasec/trivy image tech-triage:security-scan
```

Use these commands sparingly; CI is the source of truth.

---

## Change Log
- **2025-10-28:** Initial runbook covering Dependabot and security scans (CI/CD Phase 1).
