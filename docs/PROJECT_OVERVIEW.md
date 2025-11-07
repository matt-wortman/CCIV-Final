# Project Overview

_Last updated: 2025-10-10_

## Mission
Give the Technology Triage team a single, trustworthy system for capturing invention details, evaluating readiness across stages, and sharing tailored views with each stakeholder. The platform eliminates duplicate data entry, preserves audit trails, and powers consistent decision-making from triage through viability and beyond.

## Problem We’re Solving
- Inventor + reviewer data lives in multiple spreadsheets, leading to conflicts and rework.
- Stage-specific forms can’t reference shared answers, so teams retype information and lose history.
- Analytics and exports require custom work each time because questions aren’t standardized.
- Safety controls (seeding, imports) were easy to misconfigure, risking production data.

## Solution Snapshot
- **Technology aggregate** as the system of record, with stage supplements (Triage today; Viability next).
- **Question Dictionary + Templates** so every form references the same catalog and binding paths to real data fields.
- **Dynamic Form Engine** that hydrates prefills, enforces validation, and will soon write back through bindings.
- **Excel Backup Automation** on Windows Task Scheduler to guarantee accessible, non-technical backups every 48 hours.
- **Safety Toggles** (`RUN_PRISMA_SEED`, `SEED_ALLOW_PURGE`, `IMPORT_ALLOW_PURGE`) default to safe values in Azure.

## Value Highlights
- No duplicate entry: prefills move answers forward automatically.
- Consistent scoring: shared calculations will run the same in UI, exports, and future dashboards.
- Persona-ready foundation: catalog + bindings allow filtered views without data copies.
- Audit confidence: migrations and restore scripts verified in Azure; nightly/adhoc exports available.

## Stakeholders & Personas
- **Tech Managers** – own evaluation workflow, need full edit access and audit history.
- **Inventors/Researchers** – provide technical detail, limited edit rights on shared fields (future).
- **Executives / Commercialization** – consume summaries and scores, primarily read-only.
- **Ops / Data Stewards** – maintain catalog, run exports, ensure compliance.

## Current Capability (Oct 10, 2025)
- Schema foundation with stage supplements, audit tables, personas, calculated metric scaffolding.
- Question dictionary seeded; validator ensures each question binds to a valid field.
- Form engine hydrates initial responses & repeat groups from bindings; UI merges with drafts.
- Azure database migrations applied (`20251009162649_technology_foundation`, `20251010150000_add_form_question_dictionary_rel`).
- Excel export CLI produces local workbooks; Windows automation delivers every-two-day backups.
- Production submission recovery completed (`cmggn00zt0001gtn0lr6duogh` restored and verified).

## Upcoming Milestones
1. **Binding Write-Back** – persist submissions via `applyBindingWrites` so Technology + stage tables stay in sync.
2. **Optimistic Locking** – enforce `rowVersion` in payloads and surface conflict resolution in UI.
3. **Catalog Expansion** – cover Viability stage questions + calculated metrics; integrate attach script into CI.
4. **Persona Enforcement** – finalize matrix and gate data by persona once binding + locking are stable.
5. **Viability Stage rollout** – launch stage supplement and form once the above guardrails are complete.

## How to Dive Deeper
- [Architecture Roadmap](./ARCHITECTURE_ROADMAP.md) – current system design and future architecture moves.
- [Delivery Roadmap](./DELIVERY_ROADMAP.md) – deliverables, sequencing, and ownership.
- [Status Log](./STATUS_LOG.md) – dated entries of detailed progress, runbooks, and operational notes.
