# Technology Lifecycle Architecture: Multi-Form System Design

**Purpose**: Enable technology data to flow through multiple lifecycle stages (Triage → Viability → Commercial → etc.) with shared fields, persona-based views, and zero duplication.

**Last Updated**: 2025-10-09

---

## Executive Summary

This architecture creates a **single source of truth** for technology data across all lifecycle stages. Core data (inventor, tech ID, reviewer) lives in one place and is reused across multiple forms. Each stage adds its own supplemental data without duplicating shared fields.

**Key Innovation**: Question Catalog - define reusable questions once, use everywhere.

---

## 1. Database Architecture: Technology-Centric Model

### 1.1 Core Domain Model (Prisma Schema)

```prisma
// ===== CORE TECHNOLOGY ENTITY (Anchor/Aggregate Root) =====

model Technology {
  id                String   @id @default(cuid())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Core identifiers (shared across ALL stages)
  techId            String   @unique  // User-facing ID like "T-12345"
  inventorName      String
  inventorTitle     String?
  inventorDept      String?
  reviewerName      String
  domainAssetClass  String

  // Lifecycle tracking
  currentStage      TechStage @default(TRIAGE)
  status            TechStatus @default(ACTIVE)

  // Audit fields
  lastStageTouched  TechStage?
  lastModifiedBy    String?
  lastModifiedAt    DateTime?

  // Core descriptive fields
  technologyName    String
  shortDescription  String?

  // Relationships
  triageStage       TriageStage?
  viabilityStage    ViabilityStage?
  attachments       Attachment[]
  auditLog          TechnologyAuditLog[]

  @@map("technologies")
  @@index([techId])
  @@index([currentStage])
}

enum TechStage {
  TRIAGE
  VIABILITY
  COMMERCIAL
  MARKET_READY
  ARCHIVED
}

enum TechStatus {
  ACTIVE
  ON_HOLD
  ABANDONED
  COMPLETED
}

// ===== STAGE-SPECIFIC SUPPLEMENT TABLES =====

model TriageStage {
  id            String   @id @default(cuid())
  technologyId  String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Triage-specific fields only
  technologyOverview      String
  missionAlignmentText    String
  missionAlignmentScore   Int    @default(0)
  unmetNeedText           String
  unmetNeedScore          Int    @default(0)
  stateOfArtText          String
  stateOfArtScore         Int    @default(0)
  marketOverview          String
  marketScore             Int    @default(0)

  // Scoring
  impactScore       Float  @default(0)
  valueScore        Float  @default(0)
  recommendation    String @default("")

  // Relationships
  technology        Technology @relation(fields: [technologyId], references: [id], onDelete: Cascade)
  competitors       TriageCompetitor[]
  experts           TriageSME[]

  @@map("triage_stages")
  @@index([technologyId])
}

model ViabilityStage {
  id            String   @id @default(cuid())
  technologyId  String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Viability-specific fields only
  technicalFeasibility    String
  regulatoryPathway       String
  costAnalysis            String
  timeToMarket            Int?  // months
  resourceRequirements    String
  riskAssessment          String

  // Viability scoring
  technicalScore          Float @default(0)
  commercialScore         Float @default(0)
  overallViability        String @default("")

  // Relationships
  technology              Technology @relation(fields: [technologyId], references: [id], onDelete: Cascade)

  @@map("viability_stages")
  @@index([technologyId])
}

// ===== SHARED ENTITIES =====

model Attachment {
  id            String   @id @default(cuid())
  technologyId  String
  uploadedBy    String
  uploadedAt    DateTime @default(now())
  fileName      String
  fileSize      Int
  mimeType      String
  storageUrl    String
  description   String?

  technology    Technology @relation(fields: [technologyId], references: [id], onDelete: Cascade)

  @@map("attachments")
  @@index([technologyId])
}

model TechnologyAuditLog {
  id            String   @id @default(cuid())
  technologyId  String
  timestamp     DateTime @default(now())
  userId        String
  action        String   // "CREATED", "UPDATED", "STAGE_PROMOTED"
  stage         TechStage
  fieldPath     String?  // e.g., "Technology.inventorName"
  oldValue      Json?
  newValue      Json?

  technology    Technology @relation(fields: [technologyId], references: [id], onDelete: Cascade)

  @@map("technology_audit_logs")
  @@index([technologyId])
  @@index([timestamp])
}
```

### 1.2 Question Catalog System

```prisma
// ===== REUSABLE QUESTION CATALOG =====

model QuestionCatalog {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Question identity
  questionCode    String   @unique  // e.g., "Q_INVENTOR_NAME", "Q_TECH_ID"
  version         Int      @default(1)

  // Display information
  label           String
  helpText        String?
  placeholder     String?

  // Field configuration
  fieldType       FieldType

  // Data binding (CRITICAL - connects question to domain model)
  dataSource      DataSource?
  bindingPath     String?  // e.g., "Technology.inventorName" or "TriageStage.marketScore"

  // Validation
  isRequired      Boolean  @default(false)
  validation      Json?

  // Reusability
  isReusable      Boolean  @default(true)  // Can be used across multiple templates
  tags            String[] // ["header", "core_identity", "triage"]

  // Lifecycle
  isActive        Boolean  @default(true)
  deprecatedAt    DateTime?
  replacedBy      String?  // Question code that replaces this one

  // Relationships
  options         QuestionOption[]
  scoringConfig   ScoringConfig?
  usages          FormQuestion[]

  @@map("question_catalog")
  @@index([questionCode])
  @@index([isReusable, isActive])
}

enum DataSource {
  TECHNOLOGY_CORE      // Shared field in Technology table
  STAGE_SPECIFIC       // Field in stage supplement table
  CALCULATED           // Computed/derived value
  SUBMISSION_ONLY      // Stored only in FormSubmission responses
}

// ===== ENHANCED FORM SYSTEM =====

model FormQuestion {
  id             String   @id @default(cuid())
  sectionId      String

  // Link to catalog (NEW)
  catalogQuestionId  String?  // NULL for non-reusable questions

  // Question definition (can override catalog)
  fieldCode      String
  label          String
  type           FieldType
  helpText       String?
  placeholder    String?

  // Data binding (inherited from catalog or defined here)
  dataSource     DataSource?
  bindingPath    String?

  // Editability rules
  isReadOnly     Boolean  @default(false)
  readOnlyInStages String[]  // ["VIABILITY", "COMMERCIAL"] - read-only after these stages

  // Configuration
  validation     Json?
  conditional    Json?
  repeatableConfig Json?
  order          Int
  isRequired     Boolean  @default(false)

  // Relationships
  section        FormSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  catalogQuestion QuestionCatalog? @relation(fields: [catalogQuestionId], references: [id])
  options        QuestionOption[]
  scoringConfig  ScoringConfig?

  @@map("form_questions")
  @@index([sectionId])
  @@index([catalogQuestionId])
}
```

---

## 2. Form System Enhancement

### 2.1 How Binding Paths Work

**Binding Path Format**: `{TableName}.{fieldName}`

**Examples**:
- `Technology.inventorName` → writes to `technologies.inventor_name`
- `TriageStage.marketScore` → writes to `triage_stages.market_score`
- `ViabilityStage.technicalFeasibility` → writes to `viability_stages.technical_feasibility`
- `null` → writes only to `question_responses` (JSON storage)

**Submission Logic**:
```typescript
// Pseudocode for form submission
async function submitForm(formData, technologyId, stage) {
  const technologyUpdates = {}
  const stageUpdates = {}
  const jsonResponses = {}

  for (const [fieldCode, value] of Object.entries(formData)) {
    const question = await getQuestion(fieldCode)

    if (question.bindingPath) {
      const [table, field] = question.bindingPath.split('.')

      if (table === 'Technology') {
        technologyUpdates[field] = value
      } else if (table === 'TriageStage') {
        stageUpdates[field] = value
      }
      // Add audit log entry
      await logFieldChange(technologyId, question.bindingPath, oldValue, value)
    } else {
      // No binding path = store in JSON responses only
      jsonResponses[fieldCode] = value
    }
  }

  // Atomic transaction
  await db.transaction([
    db.technology.update(technologyId, technologyUpdates),
    db.triageStage.upsert(technologyId, stageUpdates),
    db.questionResponse.createMany(jsonResponses)
  ])
}
```

### 2.2 Template Inheritance/Composition

```typescript
// Example: Viability form reuses questions from Triage
const viabilityTemplate = {
  sections: [
    {
      title: "Technology Identity (from Triage)",
      questions: [
        { catalogQuestionId: "Q_TECH_ID", isReadOnly: true },
        { catalogQuestionId: "Q_INVENTOR_NAME", isReadOnly: true },
        { catalogQuestionId: "Q_REVIEWER_NAME", isReadOnly: false } // Can update reviewer
      ]
    },
    {
      title: "Viability Assessment (New)",
      questions: [
        { fieldCode: "V1.1", label: "Technical Feasibility", bindingPath: "ViabilityStage.technicalFeasibility" },
        { fieldCode: "V1.2", label: "Regulatory Pathway", bindingPath: "ViabilityStage.regulatoryPathway" }
      ]
    }
  ]
}
```

### 2.3 Form Pre-population

```typescript
async function loadForm(templateId: string, technologyId?: string) {
  const template = await getTemplate(templateId)

  if (!technologyId) {
    // New technology - empty form
    return { template, responses: {} }
  }

  // Load existing technology data
  const technology = await db.technology.findUnique({
    where: { id: technologyId },
    include: {
      triageStage: true,
      viabilityStage: true
    }
  })

  const responses = {}

  // Hydrate form from bound fields
  for (const section of template.sections) {
    for (const question of section.questions) {
      if (question.bindingPath) {
        const [table, field] = question.bindingPath.split('.')
        const value = table === 'Technology'
          ? technology[field]
          : technology[`${table.toLowerCase()}`]?.[field]

        if (value !== undefined) {
          responses[question.fieldCode] = value
        }
      }
    }
  }

  return { template, responses }
}
```

---

## 3. Persona-Based Views

### 3.1 Persona Configuration (Prisma)

```prisma
model FormTemplate {
  id          String   @id @default(cuid())
  name        String
  version     String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Persona configuration (NEW)
  visibleToPersonas String[]  // ["tech_manager", "inventor", "executive"]
  personaConfig     Json?     // Per-persona field visibility rules

  sections    FormSection[]
  submissions FormSubmission[]

  @@map("form_templates")
}
```

### 3.2 Persona Configuration Example

```json
{
  "tech_manager": {
    "canViewAll": true,
    "canEditAll": true,
    "hiddenSections": []
  },
  "inventor": {
    "canViewAll": false,
    "canEditAll": false,
    "visibleFields": ["Q_TECH_ID", "Q_INVENTOR_NAME", "Q_TECH_OVERVIEW"],
    "editableFields": ["Q_TECH_OVERVIEW"],
    "hiddenSections": ["scoring", "recommendation"]
  },
  "executive": {
    "canViewAll": false,
    "canEditAll": false,
    "visibleSections": ["header", "summary", "scoring"],
    "collapsedByDefault": ["technical_details", "competitors"]
  }
}
```

### 3.3 Persona View Implementation

```typescript
function filterFormByPersona(template, responses, persona) {
  const config = template.personaConfig[persona]

  if (config.canViewAll) {
    return { template, responses }
  }

  const filteredSections = template.sections
    .filter(section => !config.hiddenSections?.includes(section.code))
    .map(section => ({
      ...section,
      questions: section.questions.filter(q =>
        config.visibleFields?.includes(q.fieldCode)
      ).map(q => ({
        ...q,
        isReadOnly: !config.editableFields?.includes(q.fieldCode)
      }))
    }))

  return {
    template: { ...template, sections: filteredSections },
    responses
  }
}
```

---

## 4. Implementation Strategy

### Phase A: Database Refactoring (Week 1-2)

**Goal**: Establish core domain model

1. ✅ Create `Technology` core entity table
2. ✅ Create `TriageStage` and `ViabilityStage` supplement tables
3. ✅ Create `QuestionCatalog` table
4. ✅ Add `dataSource` and `bindingPath` fields to `FormQuestion`
5. ✅ Create `Attachment` and `TechnologyAuditLog` tables
6. ✅ Run migration: `npx prisma migrate dev --name add_technology_domain_model`

**Migration Script**:
```typescript
// scripts/migrate-existing-triage-data.ts
// Migrate existing TriageForm data to new Technology + TriageStage model
```

### Phase B: Question Catalog Setup (Week 3)

**Goal**: Define reusable questions

1. ✅ Seed question catalog with common questions:
   - Tech ID (Q_TECH_ID)
   - Inventor Name (Q_INVENTOR_NAME)
   - Reviewer (Q_REVIEWER_NAME)
   - Domain/Asset Class (Q_DOMAIN_ASSET_CLASS)
2. ✅ Update existing form templates to reference catalog questions
3. ✅ Create admin UI to manage question catalog

### Phase C: Form System Enhancement (Week 4-5)

**Goal**: Implement binding path logic

1. ✅ Update `submitFormResponse()` to handle binding paths
2. ✅ Update `loadDraftResponse()` to hydrate from Technology entity
3. ✅ Add validation to prevent duplicate Technology IDs
4. ✅ Implement audit logging for bound field changes
5. ✅ Create "New from Triage" flow for Viability forms

**Code Changes**:
- `src/app/dynamic-form/actions.ts` - submission logic
- `src/lib/form-engine/renderer.tsx` - pre-population logic
- Add `src/lib/technology/service.ts` - Technology CRUD operations

### Phase D: Viability Form Creation (Week 6)

**Goal**: Prove the architecture works

1. ✅ Create Viability form template using form builder
2. ✅ Link shared questions from catalog (read-only)
3. ✅ Add viability-specific questions with ViabilityStage bindings
4. ✅ Test end-to-end: Triage → Viability transition
5. ✅ Verify shared fields don't duplicate

### Phase E: Persona System (Week 7-8)

**Goal**: Enable role-based views

1. ✅ Add `visibleToPersonas` and `personaConfig` to templates
2. ✅ Implement persona filtering in form renderer
3. ✅ Create persona-specific dashboards
4. ✅ Add permission checks for editing shared vs. stage-specific data
5. ✅ Build "Technology Detail" page showing all stages consolidated

---

## 5. Operational Playbook

### Workflow: Technology Lifecycle

```
1. CREATE TECHNOLOGY
   → User starts new Triage form
   → Assigns Tech ID: "T-12345"
   → System creates Technology record

2. COMPLETE TRIAGE
   → User fills Triage-specific fields
   → System writes to:
     - Technology table (shared fields)
     - TriageStage table (triage-specific fields)
     - QuestionResponse table (JSON responses)
   → Audit log records all changes

3. PROMOTE TO VIABILITY
   → User clicks "Create Viability Assessment"
   → System:
     a. Creates ViabilityStage record linked to Technology
     b. Loads Viability form template
     c. Pre-populates shared fields from Technology (read-only)
     d. Presents viability-specific questions (editable)

4. COMPLETE VIABILITY
   → User fills viability fields
   → Can optionally update shared fields (with audit trail)
   → System writes to:
     - Technology table (if shared fields changed)
     - ViabilityStage table (viability-specific fields)
   → Audit log shows "Updated by Viability stage"

5. GENERATE REPORTS
   → System queries Technology + all stage tables
   → Applies persona filters
   → Shows consolidated view:
     - Inventor: sees tech details only
     - Manager: sees all data
     - Executive: sees summary + scores
```

### Governance Rules

**Field Locking**:
- After Triage submission: Triage fields become read-only in Viability form
- Override requires admin permission + justification
- All overrides logged to audit trail

**Audit Requirements**:
- Every change to Technology table = audit log entry
- Track: who, when, which stage, old/new values
- Retention: 7 years (compliance)

**Workflow States**:
- Technology.currentStage tracks lifecycle position
- Stage tables have independent status (draft/submitted/reviewed)
- Can't promote to next stage until current stage submitted

---

## 6. Best Practices Applied

✅ **Single Source of Truth** (DDD Aggregate Root)
- Technology entity is the canonical source for core data
- Stage supplements extend but don't duplicate

✅ **Question Catalog** (Don't Repeat Yourself)
- Define "Inventor Name" once, use 5+ times
- Update label once, affects all forms

✅ **Binding Paths** (Data Integrity)
- Explicit mapping from form field → database column
- Type-safe, trackable, auditable

✅ **Normalization** (Database Design)
- 3rd Normal Form compliance
- No transitive dependencies
- Efficient storage, clean queries

✅ **Audit Trail** (Compliance)
- WHO changed WHAT, WHEN, in WHICH stage
- Immutable log for regulatory requirements

✅ **Persona Views** (Security by Design)
- Same data, different lenses
- No data duplication for access control
- Configurable, evolvable permissions

✅ **Phased Rollout** (Risk Management)
- Incremental implementation
- Backward compatibility during migration
- Rollback capability at each phase

---

## 7. Benefits Summary

| Benefit | Before | After |
|---------|--------|-------|
| **Data Entry** | Re-enter inventor in 5 forms | Enter once, reuse everywhere |
| **Consistency** | Manual sync, errors common | Single source of truth, automatic sync |
| **Reporting** | Query 5 different tables | Query 1 Technology table + joins |
| **New Forms** | Copy/paste questions | Reference catalog, minutes to create |
| **Governance** | No audit trail | Complete history with stage tracking |
| **Personas** | Build separate views | Filter same data |
| **Maintenance** | Update 5 places | Update 1 place |

---

## 8. Future Enhancements

### Performance Optimization
- Add indexes on Technology.techId, currentStage
- Cache frequently accessed question catalog entries
- Implement GraphQL layer for efficient persona queries

### Advanced Features
- Workflow engine (state machine for stage transitions)
- Notification system (alerts on stage promotions)
- Bulk import (Excel → Technology records)
- Version snapshots (freeze Technology state at each stage)

### Integration
- SSO/SAML for enterprise auth
- Export to patent management systems
- API for external applications

---

## Appendix: Migration Checklist

### Pre-Migration
- [ ] Backup production database
- [ ] Test migration script on staging
- [ ] Document rollback procedure
- [ ] Communicate downtime window

### Migration
- [ ] Run Prisma migration (new tables)
- [ ] Run data migration script (TriageForm → Technology + TriageStage)
- [ ] Verify data integrity (count checks, spot checks)
- [ ] Seed question catalog
- [ ] Update form templates to reference catalog

### Post-Migration
- [ ] Smoke test: Create new triage
- [ ] Smoke test: View existing triage
- [ ] Smoke test: Create viability from triage
- [ ] Monitor error logs for 48 hours
- [ ] Update documentation

### Rollback Plan
If migration fails:
1. Restore database from backup
2. Revert code deployment
3. System returns to pre-migration state
4. No data loss (old TriageForm table preserved)
