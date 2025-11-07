# Data Model

**Last Updated:** 2025-10-02
**Source:** `prisma/schema.prisma` (241 lines)

## Overview

The Tech Triage Platform uses PostgreSQL with Prisma ORM. The schema supports both a legacy static form system and a modern dynamic form builder.

## Schema Strengths

✅ **Well-structured models** for both static and dynamic form systems
✅ **Proper cascade deletes** on all relations (`onDelete: Cascade`)
✅ **Type-safe enums** (`FieldType`, `SubmissionStatus`)
✅ **Clear separation** between legacy and dynamic systems
✅ **Flexible JSON storage** for dynamic data (`value`, `validation`, `conditional`)

## Core Models

### Dual System Architecture

#### Legacy System
**Model:** `TriageForm`
Original static form implementation. Maintained for backward compatibility during migration.

#### Dynamic System
**Models:** `FormTemplate`, `FormSection`, `FormQuestion`

The dynamic system allows administrators to create custom forms without code changes:
- **FormTemplate** - Top-level form definition (name, version, status)
- **FormSection** - Logical groupings within a form (ordered)
- **FormQuestion** - Individual fields with type, validation, and conditional logic

**Key Features:**
- Draft/publish workflow
- Version tracking
- Dynamic field types via `FieldType` enum
- JSON-based validation rules
- Conditional field visibility

### Submission System

**Model:** `FormSubmission`

Captures form responses with:
- Link to form template (with version snapshot)
- Submission status tracking
- User identification
- Timestamp tracking (created/updated)

**Related Models:**
- **QuestionResponse** - Individual field answers (JSON value storage)
- **RepeatableGroupResponse** - Support for repeatable field groups
- **CalculatedScore** - Auto-calculated scoring results

### Data Types

#### FieldType Enum
Supported field types (exactly as declared in `schema.prisma`):
- `SHORT_TEXT`
- `LONG_TEXT`
- `INTEGER`
- `SINGLE_SELECT`
- `MULTI_SELECT`
- `CHECKBOX_GROUP`
- `DATE`
- `REPEATABLE_GROUP`
- `SCORING_0_3`
- `SCORING_MATRIX`
- `DATA_TABLE_SELECTOR`

#### SubmissionStatus Enum
- `DRAFT` — In-progress submission that can still be edited
- `SUBMITTED` — Completed submission awaiting review
- `REVIEWED` — Post-review state used for archival/audit
- `ARCHIVED` — Retired submissions retained for history

## Key Relationships

```
FormTemplate (1) ──┬─→ (n) FormSection
                   └─→ (n) FormSubmission

FormSection (1) ────→ (n) FormQuestion

FormSubmission (1) ─┬─→ (n) QuestionResponse
                    ├─→ (n) RepeatableGroupResponse
                    └─→ (n) CalculatedScore
```

All relationships use `onDelete: Cascade` to maintain referential integrity.

## Database Connection Patterns

### Prisma Singleton
**File:** `src/lib/prisma.ts`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why this pattern:**
- Prevents multiple client instances during Next.js hot reload
- Conditional logging based on environment
- Follows Next.js official best practices

## Performance Considerations

### Missing Indexes ⚠️

The schema currently lacks indexes on frequently queried fields. As data volume grows, queries may become slow.

**Recommended indexes:**

```prisma
model QuestionResponse {
  // ...existing fields...

  @@index([submissionId])
  @@index([questionCode])
}

model FormQuestion {
  // ...existing fields...

  @@index([sectionId])
  @@index([fieldCode])
}

model FormSection {
  // ...existing fields...

  @@index([templateId])
}

model RepeatableGroupResponse {
  // ...existing fields...

  @@index([submissionId])
}

model CalculatedScore {
  // ...existing fields...

  @@index([submissionId])
}
```

**Impact:** Significant performance improvement for:
- Form loading (sections by template)
- Submission retrieval (responses by submission)
- Field lookups (questions by section)
- Scoring calculations

## JSON Field Usage

### Dynamic Data Storage

Several models use JSON fields for flexibility:

**FormQuestion.validation**
```json
{
  "required": true,
  "minLength": 10,
  "maxLength": 500,
  "pattern": "^[A-Za-z0-9 ]+$"
}
```

**FormQuestion.conditional**
```json
{
  "showIf": {
    "fieldCode": "tech_category",
    "operator": "equals",
    "value": "software"
  }
}
```

**QuestionResponse.value**
```json
{
  "text": "Example response",
  "metadata": {
    "wordCount": 2,
    "lastModified": "2025-10-02T10:30:00Z"
  }
}
```

### Trade-offs

✅ **Pros:**
- Schema flexibility without migrations
- Easy to extend validation rules
- Complex nested data structures

⚠️ **Cons:**
- No database-level validation
- Harder to query JSON fields efficiently
- Type safety requires runtime validation

## Migration Strategy

### Environment-Specific Workflows

**Development (Prisma Dev Server):**
```bash
npm run prisma:dev  # Auto-migrates on schema changes
```

**Local Docker:**
```bash
dotenv -e .env -- npx prisma migrate dev
```

**Production (Azure):**
```bash
# Automatic on container restart
prisma migrate deploy && node seed.js
```

### Database Seeding

The project includes seed data for development. Seeding runs automatically in development environments.

## Future Improvements

1. **Add database indexes** for performance
2. **Implement soft deletes** for audit trails (currently hard deletes via Cascade)
3. **Version snapshots** - Store template version with submissions (partially implemented)
4. **Audit logging** - Track who changed what and when
5. **Full-text search** indexes for form content

## References

- [System Overview](./system-overview.md) - Architecture context
- [Security Model](./security-model.md) - Authentication patterns
- [Code Review: Database Layer](../reviews/2025-10-initial-review/01-database-layer.md) - Detailed analysis
