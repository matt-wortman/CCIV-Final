# Delivery Status Log (Archived)

_Log snapshot exported on 2025-10-10. Superseded by docs/PROJECT_STATUS.md._

## 2025-10-10

### Summary
- Dynamic form hydration is live through QuestionDictionary bindings, UI prefills now merge draft data, and backend normalization covers multi-select, repeatable groups, scoring integers, and ISO dates.
- Azure Postgres has migrations `20251009162649_technology_foundation` and `20251010150000_add_form_question_dictionary_rel` applied; `form_questions.dictionaryKey` exists in production.
- Windows Task Scheduler invokes `C:\Scripts\run-tech-triage-export.ps1` (which calls the WSL export script) every two days at 10:00 AM ET and on startup, writing logs to `C:\Logs\TechTriageExport\triage-forms-*.log`.
- Safety toggles (`RUN_PRISMA_SEED`, `SEED_ALLOW_PURGE`, `IMPORT_ALLOW_PURGE`) remain `false` in Azure to block destructive operations by default.
- Documentation tidy-up: refactor plans moved under `docs/architecture/refactor/`; legacy root markdown relocated to `docs/archive/root-legacy/` so all active project docs live inside `tech-triage-platform/docs/`. Added curated overview, architecture roadmap, and delivery roadmap for quick onboarding.
- Added optimistic-lock scaffolding: server actions now send row versions, `applyBindingWrites` enforces them, and autosave retries gracefully with conflict toasts. New Jest coverage exercises draft persistence and conflict paths.

### Current State
- Schema foundation deployed (Technology aggregate, stage supplements, audit/history tables, personas, question dictionary).
- Question catalog seed and validation script shipped.
- Export-to-Excel CLI with `.env.export` support works locally and against Azure.
- Azure submission `cmggn00zt0001gtn0lr6duogh` (Tech `D25-0046`) restored; production has 5 submitted + 5 draft records with no orphaned responses.
- Azure Container Apps job script remains on standby; RBAC/signup for `Microsoft.App` is blocked, so backups run via Windows scheduler instead.

### Next Actions (priority order)
1. **Binding write-back** – wire server actions to `applyBindingWrites`, ensuring Technology/Triage rows update on draft/submit. Add regression tests for multi-select, scores, and repeatable groups across local + Azure.
2. **Optimistic locking** – carry `rowVersion` through API payloads, reject stale submissions, and surface conflict messaging in the UI.
3. **Catalog + validator coverage** – extend dictionary to Viability stage and calculated metrics; integrate `scripts/util/attach-dictionary-keys.ts` into CI/seeding.
4. **Review remediation** – close out high-severity audit items (hardcoded config, indexes, middleware security, authentication) ahead of the next release.
5. **Persona enablement (after above)** – finalize persona taxonomy, authorization matrix, and UI visibility rules before expanding to Viability dashboards.

### Watch-outs & Runbooks
- Prefill issues: verify `form_questions.dictionaryKey` (`SELECT "dictionaryKey" FROM form_questions WHERE "fieldCode"='F2.2.a';`). Run `scripts/util/attach-dictionary-keys.ts` if null.
- Data restoration: set `IMPORT_ALLOW_PURGE=true` only for the session, revert immediately after.
- Quick backups: `scripts/util/export-dynamic-form-data.ts` writes a JSON snapshot to `backups/`.
- Azure verification: `psql ... -c "SELECT \"submissionId\", \"questionCode\" FROM question_responses WHERE \"submissionId\"='cmggn00zt0001gtn0lr6duogh';"`.
- Windows automation logs: `C:\Logs\TechTriageExport\`. Scheduled task **Tech Triage Export** runs `powershell.exe -ExecutionPolicy Bypass -File C:\Scripts\run-tech-triage-export.ps1`. Update credentials via `.env.export` inside WSL.
- Enable linger (`sudo loginctl enable-linger matt`) if exports must run while logged out.

### Safety Toggles
- `RUN_PRISMA_SEED=false` – set to `true` only when intentionally reseeding.
- `SEED_ALLOW_PURGE=false` – must be `true` to wipe/recreate form tables; never enable in persistent environments.
- `IMPORT_ALLOW_PURGE=false` – set to `true` only while running import scripts.

---

_For earlier logs, consult repository history._
