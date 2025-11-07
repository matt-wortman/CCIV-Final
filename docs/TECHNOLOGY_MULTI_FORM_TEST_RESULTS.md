# Technology Multi-Form Foundation Tests (2025-10-09)

## 1. Migration Status
```
npx dotenv-cli -e .env.prisma-dev -- npx prisma migrate status --schema prisma/schema.prisma
```
Result: `Database schema is up to date!` – migration `20251009162649_technology_foundation` applied.

## 2. New Tables Present in Database
```
npx dotenv-cli -e .env.prisma-dev -- npx tsx scripts/util/list-new-tables.ts
```
Result:
```
attachments
calculated_metrics
personas
question_dictionary
stage_history
technologies
technology_audit_log
triage_competitors
triage_smes
triage_stages
user_personas
users
viability_stages
```
All expected tables exist.

## 3. Foreign Key Enforcement
```
npx dotenv-cli -e .env.prisma-dev -- npx tsx scripts/util/test-fk.ts
```
Result: `insert failed as expected: P2010` – database rejected triage stage without a Technology parent.

## 4. Question Dictionary Seed Verification
```
npx dotenv-cli -e .env.prisma-dev -- npx tsx scripts/util/list-catalog.ts
```
Result:
```json
[
  { "key": "tech.inventorName", "bindingPath": "technology.inventorName" },
  { "key": "tech.reviewerName", "bindingPath": "technology.reviewerName" },
  { "key": "triage.missionAlignmentText", "bindingPath": "triageStage.missionAlignmentText" },
  { "key": "triage.technologyOverview", "bindingPath": "triageStage.technologyOverview" },
  { "key": "viability.technicalFeasibility", "bindingPath": "viabilityStage.technicalFeasibility" }
]
```
Seed produced five initial catalog entries.

## 5. Catalog Validation Script
```
npm run catalog:validate
```
Result: `All 5 catalog entries look good!`

## 6. Technology Insert and Defaults
```
npx dotenv-cli -e .env.prisma-dev -- npx tsx scripts/util/insert-technology.ts
```
Result: Technology created with `rowVersion: 1` and timestamp – confirms defaults.

## 7. Persona/User Assignment
```
npx dotenv-cli -e .env.prisma-dev -- npx tsx scripts/util/insert-persona.ts
```
Result: Persona `tech_manager` and user `manager@example.com` created and linked (unique constraint enforced by upsert).

## 8. Calculated Metric Entry
```
npx dotenv-cli -e .env.prisma-dev -- npx tsx scripts/util/insert-metric.ts
```
Result: Metric stored with `status: "PENDING"`, `calculatedAt: null` – verifies defaults and array column.

## 9. Audit Log Entry
```
npx dotenv-cli -e .env.prisma-dev -- npx tsx scripts/util/insert-audit.ts
```
Result: Audit row created (id + timestamp) – table accepts entries referencing Technology.

## 10. Stage History Entry
```
npx dotenv-cli -e .env.prisma-dev -- npx tsx scripts/util/insert-stage-history.ts
```
Result: Stage history row created (id + timestamp) – confirms audit trail table.

## 11. Seeding Pipeline
```
npm run db:seed:dev
```
Result: Question dictionary seeded, form template recreated, demo submissions inserted (see command log).

## 12. TypeScript Safety Net
```
npm run type-check
```
Result: `tsc --noEmit` completed successfully – compile-time integrity intact.

All tests executed against the Prisma dev database (`.env.prisma-dev`). Outputs above provide direct evidence that the schema, migrations, seeding, validation, and supporting tables are functioning as intended.
