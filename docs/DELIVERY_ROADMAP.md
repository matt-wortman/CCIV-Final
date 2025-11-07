# Delivery Roadmap

_Last updated: 2025-10-10_

## Completed Milestones (Oct 2025)
- Schema foundation (Technology aggregate, stage supplements, audit/history, personas, dictionary).
- Question catalog seed + validator script.
- Dynamic form hydration with bindings and UI merge flow.
- Azure submission recovery (`cmggn00zt0001gtn0lr6duogh`) and safety toggles hardening.
- Excel export CLI + Windows Task Scheduler automation for recurring backups.
- Documentation consolidation into `docs/` with single status log and curated overviews.

## Active Sprint Focus
| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| Binding write-back via `applyBindingWrites` | Platform team | In progress | Add regression tests for multi-value fields and repeat groups |
| Optimistic locking (rowVersion) | Platform team | Ready | Requires API contract update + UI conflict messaging |
| Catalog & validator expansion | Data steward + platform | Ready | Extend to Viability fields, calculated metrics, integrate attach script in CI |
| Review remediation (security + config) | Platform team | Ready | Address hardcoded config, missing indexes, middleware security, authentication |

## Upcoming (Next 2–4 Weeks)
1. **Persona enablement** – finalize matrix, enforce server-side visibility, adjust UI.
2. **Viability Stage launch** – leverage expanded catalog to deliver Viability form with prefills.
3. **Calculated metrics service** – extract scoring utilities and wire into submissions + exports.
4. **Monitoring & Alerts** – add export count/nightly checks; plan for Application Insights/metric dashboards.
5. **RBAC & Auth Improvements** – coordinate with identity team to unblock Key Vault + managed identity.

## Longer-Term Initiatives
- Stage locking workflow / state machine for multi-editor scenarios.
- Persona dashboards and executive summaries driven off Technology aggregate.
- CI coverage expansion (binding validation, destructive toggle guardrails).
- Integrations (SharePoint/Teams notifications, BI exports).

## Delivery Principles
- Ship in measurable increments (see [Refactor Execution – Incremental Steps](./architecture/refactor/triage-form-refactor-incremental-plan.md)).
- Update the [Status Log](./STATUS_LOG.md) after each session or release to capture operational learnings.
- Keep runbooks (e.g., [Excel Export Automation](./runbooks/EXPORT_JOB_SETUP.md)) up to date alongside automation changes.

## Dependencies & Risks
| Dependency | Impact | Mitigation |
|------------|--------|------------|
| Azure RBAC (`Microsoft.App`) | Blocks Container Apps jobs | Windows scheduler used; keep script archived for future |
| Authentication upgrades | Needed for persona enforcement | Coordinate with identity roadmap; maintain feature toggle |
| Catalog accuracy | Ensures bind/write + metrics success | Validator in CI, attach script after seeding |
| Manual backups | Requires Windows task to run | Review logs, plan for alerting on failure |

## Communication Cadence
- **Weekly**: Review delivery roadmap vs. status log during team sync.
- **Per milestone**: Update this roadmap and announce changes in release notes.
- **Ad hoc**: Capture operational incidents or decisions in the status log.
