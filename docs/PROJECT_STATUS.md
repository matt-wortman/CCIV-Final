# Tech Triage Platform – Project Status Dashboard
_Last updated: 2025-10-28_

## ✅ Production Snapshot
- Dynamic triage form runtime (Next.js 15 + Prisma) is live at **https://tech-triage-app.azurewebsites.net**.
- Form builder UI enables template authoring with repeatable groups, conditional logic, and data-table fields.
- PDF export pipeline supports ad-hoc downloads and the scheduled Windows export task (every 48 hours).
- Azure PostgreSQL flexible server `techtriage-pgflex` is current through migrations `20251009162649_technology_foundation` and `20251010150000_add_form_question_dictionary_rel`.
- Evidence-based workflow (type-check, test, operational evidence) enforced via PR template.

## 🚧 Current Focus (Oct 2025)
1. **CI/CD guardrails (Phase 1 wrap‑up)** – branch protection enabled on `master` and `phase3-database-driven-form`; monitor nightly regression and keep pipelines green.
2. **Binding write-back** parity across Technology/Triage entities using `applyBindingWrites` regression tests.
3. **Optimistic locking UX** – surface stale draft messaging, retry flows, and autosave conflict handling.
4. **Catalog + validator coverage** for Viability stage questions and calculated metrics; wire `scripts/util/attach-dictionary-keys.ts` into CI.
5. **Phase 0 (QuestionRevision + stale detection) pilot** – shadow schema, backfill, and perf validation before enabling by default.
6. **Security hardening** – finalize Basic Auth timing-safe compare, prepare NextAuth adoption plan, and scrub hardcoded config.
7. **Persona enablement groundwork** – authorization matrix and visibility rules ahead of Viability dashboards.

## 📋 Next Up (Prioritized Backlog)
- Complete binding write-back rollout → unblock persona-aware dashboards.
- Finish optimistic locking UI tests → close remaining review findings.
- Expand catalog validator coverage → ensure builder and runtime stay aligned.
- Draft NextAuth/SSO decision ADR → unblock authentication implementation.
- Instrument monitoring/alerting (App Service logs, Azure Monitor) → tighten ops feedback loop.
- Execute Phase 0 question-revision pilot using [Implementation Guide](architecture/implementation-guide-question-revisions.md) → record evidence & go/no-go.

## 🔢 Key Metrics
| Metric | Value | Notes |
| --- | --- | --- |
| Source files | 86 TypeScript files | `tech-triage-platform/src` (dynamic form + builder) |
| Tests | Jest + Playwright suites | Autosave, binding, seeding coverage |
| Database | Azure PostgreSQL Flexible Server | `techtriage-pgflex.postgres.database.azure.com` |
| Exports | Windows task every 48h | Logs at `C:\Logs\TechTriageExport\` |
| Secrets | Rotated 2025-10-21 | Postgres password & storage key updated (see `.env.export`) |

## 🛠 Environments & Access
- **Production**: `https://tech-triage-app.azurewebsites.net`
- **Azure Resource Group**: `rg-eastus-hydroxyureadosing`
- **Database**: `postgresql://triageadmin:<password>@techtriage-pgflex.postgres.database.azure.com:5432/triage_db?sslmode=require`
- **Storage**: `rgeastushydroxyurea8c76` (connection string in `.env.export`)
- **Auth**: HTTP Basic Auth (shared credentials) + shared draft identity (`NEXT_PUBLIC_TEST_USER_ID`)

## 📄 Quick Links
- [README.md](../README.md) – developer quick start & environment setup
- [CLAUDE.md](../CLAUDE.md) – AI agent guidance
- [Architecture overview](architecture/TECHNOLOGY_LIFECYCLE_ARCHITECTURE.md)
- [Deployment guide](guides/deployment-guide.md)
- [Export runbook](runbooks/EXPORT_JOB_SETUP.md)
- [Release notes](release-notes/) – version history
- [Documentation structure](README.md)
- [Historical status log (≤2025-10-10)](archive/status-log-2025-10-10.md)
- [Question Library – design overview](architecture/reusable-question-library.md)
- [Implementation Guide – question revisions rollout](architecture/implementation-guide-question-revisions.md)

## 🆕 Recent Highlights (2025-10-28)
- Added `CI - Build & Test`, `Nightly Regression`, and `Security Scan` workflows; removed Codecov upload; verified green runs.
- Enabled branch protection with required `ci` status check (strict, admins included) on `master` and `phase3-database-driven-form`.
- Configured Dependabot (manual merge policy) and authored runbooks (`CI_PIPELINE_SETUP.md`, `SECURITY_MONITORING.md`) plus `github_transition.md`.

## 📝 Documentation Rules of Thumb
- Update this dashboard for status changes; avoid creating new `STATUS-<date>.md` files.
- Use `docs/guides/` for how-to content, `docs/runbooks/` for operational steps, and `docs/archive/` for historical plans/critiques.
- Submit ADRs under `docs/adrs/` when architecture decisions change.

## 🗄 Historical Notes
Older planning docs, critiques, and architecture explorations now live under `docs/archive/`. See [status-log-2025-10-10.md](archive/status-log-2025-10-10.md) for the previous running log.
