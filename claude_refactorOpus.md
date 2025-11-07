# Comprehensive Code Refactoring Opinion and Plan

**Date:** 2025-10-31
**Author:** Claude (Opus reasoning mode)
**Subject:** Question Library and Answer Storage Architecture Redesign
**Status:** Recommendation for major refactoring

---

## Executive Summary

The current question/answer architecture has accumulated significant technical debt through incremental feature additions on top of a legacy structure. The system exhibits artificial complexity that makes it difficult to reason about, maintain, and extend. **I recommend a ground-up redesign of the schema and data flow.**

**Key Finding:** The disagreement about how question revision tracking works (documented in `claude_snapback.md`) is a symptom, not the disease. The disease is a fundamentally compromised architecture trying to serve modern requirements with legacy constraints.

**Recommendation:** Design and implement a clean schema optimized for question reusability and version tracking, then migrate existing data in a controlled cutover.

---

## Part 1: State of the Code Assessment

### 1.1 Current Architecture Overview

The system attempts to track question revisions and reusable questions across multiple storage layers:

**Question Storage (3 locations):**
1. `FormQuestion` - Questions embedded in dynamic forms
2. `QuestionDictionary` - Canonical question registry with binding paths
3. `QuestionRevision` - Version history for questions

**Answer Storage (2 locations):**
1. Structured columns - Typed database columns (`Technology.technologyOverview`, `TriageStage.missionAlignmentText`, etc.)
2. `extendedData` - JSON columns storing versioned answers with metadata

**Connection Mechanism:**
- "Binding paths" (e.g., `"triageStage.technologyOverview"`) connect form questions to structured columns
- Dictionary keys (e.g., `"triage.technologyOverview"`) connect to extendedData
- Code coordinates between both storage systems

### 1.2 Complexity Indicators

**Evidence of Over-Complexity:**

1. **Dual Value Paths:** Read values from structured columns, metadata from JSON
   ```typescript
   // src/lib/technology/service.ts:246
   const rawValue = resolveBindingValue(bindingPath, technology); // Structured
   // src/lib/technology/service.ts:265-274
   versioned = triageExtended[dictionaryKey] ?? null; // JSON metadata
   ```

2. **Cognitive Load:** Developer confusion about data flow
   - Original investigation concluded "must use extendedData only"
   - Critique corrected this, citing dual-storage design
   - Both were partially right, both missed nuances
   - **This shouldn't be debatable**

3. **Documentation Debt:** Multiple explanatory documents needed
   - `docs/architecture/reusable-question-library.md`
   - `docs/architecture/implementation-guide-question-revisions.md`
   - `claude_snapback.md` (this investigation)
   - `claude_refactorOpus.md` (this document)

4. **Test Complexity:** Required multiple specialized scripts
   - `scripts/inspect-revisions.ts`
   - `scripts/create-stale-test-data.ts`
   - `scripts/test-answer-metadata.ts`
   - `scripts/fix-stale-test-data.ts`
   - Empirical results were initially confusing

5. **Code Coordination Requirements:**
   - `buildInitialValues()` must coordinate two storage systems
   - `buildExtendedDataUpdates()` must keep them in sync
   - `resolveBindingValue()` only knows about structured columns
   - `getAnswerStatus()` only knows about JSON metadata
   - No single source of truth

### 1.3 Specific Problems

#### Problem 1: Three Question Tables
**Current state:**
- `FormQuestion` stores questions in forms (with fieldCode like "F2.1")
- `QuestionDictionary` stores canonical questions (with key like "triage.technologyOverview")
- `QuestionRevision` stores version history

**Issues:**
- Questions aren't truly reusable - each form creates its own FormQuestion
- Field codes are form-specific, not question-specific
- Dictionary "binding paths" are coupled to database schema
- Adding a question requires coordinating three tables

**User Impact:**
- Can't actually reuse questions across forms
- Editing a question doesn't update all uses
- Question library is conceptual, not actual

#### Problem 2: Dual Answer Storage
**Current state:**
- Answers written to BOTH structured columns AND extendedData
- Structured columns hold the value
- extendedData holds the value AGAIN plus metadata
- Code must keep them synchronized

**Issues:**
- Data duplication (same value in two places)
- Synchronization risk (what if they differ?)
- Unclear which is source of truth
- Migration complexity (can't remove either without breaking the other)

**Root cause:** Backward compatibility with pre-dynamic-form schema

#### Problem 3: Binding Paths
**Current state:**
- Questions have "binding paths" like `"triageStage.technologyOverview"`
- These paths reference structured columns
- Code must parse the path and navigate object trees
- Paths are brittle (rename a column = break all references)

**Issues:**
- Tight coupling between questions and database schema
- Can't rename database columns without updating all binding paths
- Can't reorganize data model without breaking questions
- Binding paths are string-based (no type safety)

**This is an anti-pattern:** Domain logic (questions) shouldn't know about data storage (column names)

#### Problem 4: Version Tracking Ambiguity
**Current state:**
- `QuestionDictionary.currentRevisionId` points to "latest" version
- `QuestionRevision.versionNumber` tracks version sequence
- Answers store `questionRevisionId` in extendedData
- But actual answer value comes from structured column (which has no version info)

**Issues:**
- Answer value and answer metadata are disconnected
- Can't tell which version of a question produced which answer value
- "Stale" detection only works if extendedData is populated
- No way to view historical answer in context of historical question

**User goal (from user message):**
> "I would want to see the latest question and have the latest answer even if they don't match but with an indicator that says they don't match and would I like to see the question that matches this answer."

**Current system:** Partially supports this, but in a convoluted way

### 1.4 Technical Debt Origins

**How did we get here?**

**Phase 1 (Original):** Static Technology model
- Typed columns for every field
- Simple, straightforward schema
- No dynamic forms, no reusability

**Phase 2:** Dynamic form engine added
- FormTemplate, FormSection, FormQuestion tables
- Forms are database-driven
- But Technology still uses typed columns

**Phase 3:** Question Dictionary added
- QuestionDictionary for "reusable" questions
- Binding paths to connect forms to Technology columns
- Questions still aren't truly reusable (each form creates its own)

**Phase 4:** Question revisions added
- QuestionRevision table for version history
- extendedData JSON for versioned metadata
- Must maintain backward compatibility with typed columns
- Two-tier storage system emerges

**Each phase added complexity without refactoring the foundation.**

This is classic technical debt: **incremental additions on a foundation not designed for them.**

### 1.5 Code Quality Metrics

**Positive Indicators:**
- ✅ Type safety with TypeScript + Prisma
- ✅ Comprehensive test coverage
- ✅ Well-documented functions
- ✅ CI/CD pipeline in place
- ✅ Feature flags for rollout control

**Negative Indicators:**
- ❌ Data flows through 2 storage layers
- ❌ 3 tables for "questions" concept
- ❌ String-based binding paths (no type safety)
- ❌ Developer confusion about data flow
- ❌ Specialized scripts needed for basic testing
- ❌ Multiple explanatory documents needed
- ❌ Can't achieve stated user goals cleanly

**Overall Assessment:** Well-executed implementation of a compromised design.

The code is high quality, but the architecture is fighting against itself.

---

## Part 2: Root Cause Analysis

### 2.1 The Core Mistake

**Original sin:** Building dynamic forms on top of static schema without refactoring the schema.

The Technology model was designed for a static form:
```prisma
model Technology {
  technologyName      String
  technologyOverview  String?
  inventorName        String
  // ... 20+ specific fields
}
```

When dynamic forms were added, the **correct** approach would have been:
1. Create generic Answer table
2. Migrate data from typed columns to Answers
3. Remove typed columns
4. Dynamic forms write to Answers

**Instead, the chosen approach:**
1. Keep typed columns
2. Add binding paths to connect forms to typed columns
3. Later: add JSON columns for metadata
4. Try to coordinate both systems

**Why this happened:** Understandable desire to avoid data migration and maintain backward compatibility.

**Result:** Technical debt compounding over time.

### 2.2 Architectural Principles Violated

**Single Source of Truth:**
- Answer values exist in structured columns AND extendedData
- "Current" question version exists in multiple places
- Code must reconcile multiple sources

**Separation of Concerns:**
- Questions (domain) know about database columns (persistence)
- Forms depend on Technology schema structure
- Can't change one without changing the other

**Don't Repeat Yourself (DRY):**
- Same answer value stored twice
- Question text duplicated across FormQuestion and QuestionDictionary
- Revision tracking logic scattered across multiple files

**Simple is Better Than Complex:**
- Developer confusion about data flow
- Multiple explanatory documents needed
- Specialized testing infrastructure required

### 2.3 Why It Matters

**User's stated goal:**
> "I want function to be as simple and robust as possible without deference to history or the current state of the database and schema."

**Current reality:** System is neither simple nor robust:
- Simple: No - requires coordination of multiple storage layers
- Robust: No - synchronization points are fragility points

**User's instinct is correct:** The disagreement about how the system works signals fundamental design issues.

---

## Part 3: The Ideal Design

### 3.1 Core Principles

If designing from scratch today, with no legacy constraints:

1. **Questions are library items** - stored once, referenced many times
2. **Answers point to question versions** - explicit versioning, no ambiguity
3. **Forms reference questions** - forms don't own questions, they reference them
4. **No domain logic in schema** - questions don't know about database columns
5. **Single storage layer** - one place for answers, not two

### 3.2 Clean Schema Design

#### Table: Question (The Reusable Question Library)
```prisma
model Question {
  id              String   @id @default(cuid())
  key             String   @unique  // "technology-overview" (semantic identifier)
  category        String?  // "triage", "viability", etc.
  currentVersion  Int      @default(1)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  createdBy       String?

  // Relations
  versions        QuestionVersion[]
  formQuestions   FormQuestion[]
}
```

**Key insights:**
- One record per conceptual question
- No binding paths (questions don't know about storage)
- No field codes (those are form-specific)
- Simple, semantic key for human reference

#### Table: QuestionVersion (Every Edit Creates a New Version)
```prisma
model QuestionVersion {
  id              String   @id @default(cuid())
  questionId      String
  versionNumber   Int

  // The actual question content
  text            String   // "Provide a concise summary of the technology"
  helpText        String?  // "Describe what it does and what problem it addresses"
  fieldType       FieldType  // TEXT, SELECT, CHECKBOX, etc.
  options         Json?    // For select/checkbox fields
  validation      Json?    // Required, min/max length, etc.

  // Version metadata
  createdAt       DateTime @default(now())
  createdBy       String?
  changeReason    String?  // "Added clarity about scope requirements"
  isSignificant   Boolean  @default(true)  // Does this require re-answering?

  // Relations
  question        Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers         Answer[]

  @@unique([questionId, versionNumber])
  @@index([questionId])
}
```

**Key insights:**
- Immutable version history
- Contains complete question content (not just metadata)
- Can compare any two versions
- Clear changelog with reasons

#### Table: Answer (Every Response to a Question)
```prisma
model Answer {
  id                 String   @id @default(cuid())
  questionVersionId  String
  technologyId       String

  // The actual answer
  value              Json     // Flexible: string, number, array, object

  // Answer metadata
  answeredAt         DateTime @default(now())
  answeredBy         String?
  source             String?  // "form-submission", "import", "migration", etc.

  // Relations
  questionVersion    QuestionVersion @relation(fields: [questionVersionId], references: [id])
  technology         Technology @relation(fields: [technologyId], references: [id], onDelete: Cascade)

  @@index([technologyId])
  @@index([questionVersionId])
  @@unique([technologyId, questionVersionId])  // One answer per question per technology
}
```

**Key insights:**
- One answer = one question version + one technology
- Value stored as JSON (flexible for any field type)
- Can't have ambiguity about which version was answered
- Simple join to get question text that was answered

#### Table: FormQuestion (Questions in Forms)
```prisma
model FormQuestion {
  id          String @id @default(cuid())
  formId      String
  sectionId   String
  questionId  String  // Reference to Question library

  order       Int
  isRequired  Boolean @default(false)

  // Relations
  form        Form @relation(fields: [formId], references: [id], onDelete: Cascade)
  section     FormSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  question    Question @relation(fields: [questionId], references: [id])

  @@index([formId])
  @@index([sectionId])
  @@index([questionId])
}
```

**Key insights:**
- Forms reference questions, don't own them
- Same question can appear in multiple forms
- Editing a question updates all forms that use it
- True reusability

#### Table: Technology (Simplified)
```prisma
model Technology {
  id              String   @id @default(cuid())
  techId          String   @unique

  // Only metadata about the technology itself
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  currentStage    Stage
  status          Status
  lastModifiedBy  String?
  lastModifiedAt  DateTime?

  // Relations
  answers         Answer[]

  // NO MORE: technologyOverview, missionAlignmentText, etc.
  // All those are now in Answer table
}
```

**Key insights:**
- Technology only stores technology metadata
- All form answers are in Answer table
- No TriageStage/ViabilityStage/PortfolioStage junction tables
- Dramatically simplified

### 3.3 How It Works

#### Scenario 1: Creating a Technology
1. User loads "Technology Triage Form"
2. System queries FormQuestion → Question → QuestionVersion (current version)
3. User fills out form
4. On submit: Create Answer records with questionVersionId + value
5. Done - no coordination, no dual storage

**Code simplicity:**
```typescript
// Load questions for form
const formQuestions = await prisma.formQuestion.findMany({
  where: { formId },
  include: {
    question: {
      include: {
        versions: {
          where: { versionNumber: question.currentVersion }
        }
      }
    }
  }
});

// Save answers
for (const response of responses) {
  await prisma.answer.create({
    data: {
      questionVersionId: response.questionVersionId,
      technologyId: technology.id,
      value: response.value,
      answeredAt: new Date(),
      answeredBy: userId,
    }
  });
}
```

**No special logic, no coordination, just straightforward database operations.**

#### Scenario 2: Admin Edits a Question
1. Admin edits question "Describe the technology"
2. System creates new QuestionVersion (version 2)
3. Updates Question.currentVersion = 2
4. Done - all forms using this question now show version 2

**Existing answers:**
- Still point to version 1
- System can detect mismatch (answer.questionVersionId ≠ question.currentVersion)
- Show warning: "This answer is for an older version"

#### Scenario 3: Viewing Old Technology (User's Goal)
1. Load Technology with ID = 123
2. Load all Answers for this technology
3. For each Answer:
   ```sql
   SELECT
     a.value,
     a.answeredAt,
     qv_answered.text as original_question,
     qv_current.text as current_question,
     qv_answered.versionNumber as answered_version,
     q.currentVersion as current_version
   FROM Answer a
   JOIN QuestionVersion qv_answered ON a.questionVersionId = qv_answered.id
   JOIN Question q ON qv_answered.questionId = q.id
   LEFT JOIN QuestionVersion qv_current ON q.id = qv_current.questionId
     AND qv_current.versionNumber = q.currentVersion
   WHERE a.technologyId = 123
   ```

4. Display:
   - Current question text
   - User's answer
   - If versions differ: Show warning with link to original question

**This is EXACTLY what the user asked for:**
> "I would want to see the latest question and have the latest answer even if they don't match but with an indicator that says they don't match and would I like to see the question that matches this answer."

**One query, no special logic.**

### 3.4 Benefits of Clean Design

**Simplicity:**
- One storage location for answers (Answer table)
- One storage location for questions (Question + QuestionVersion)
- Straightforward joins, no coordination logic

**Maintainability:**
- Change question = create new version, done
- No binding paths to update
- No schema coupling
- Clear data flow

**Extensibility:**
- Add new question to form = insert FormQuestion reference
- Questions truly reusable across forms
- Can build question search/filtering
- Can track question usage analytics

**Performance:**
- Indexed foreign keys
- Simple joins (no JSON parsing)
- Can denormalize if needed
- Clear query optimization path

**Correctness:**
- Single source of truth for each piece of data
- No synchronization risk
- Clear versioning semantics
- Impossible to have version ambiguity

---

## Part 4: Migration Plan

### 4.1 Philosophy

**Principle:** Parallel implementation with controlled cutover, not big-bang rewrite.

**Strategy:**
1. Build new system alongside old system
2. Feature flag to switch between them
3. Migrate data when confident
4. Remove old system

**Timeline:** 3-4 weeks for complete migration

### 4.2 Detailed Phase Plan

#### Phase 1: Schema Design & Validation (3-5 days)

**Objectives:**
- Finalize new schema design
- Create Prisma migrations
- Validate against all use cases
- Get stakeholder approval

**Tasks:**
1. **Day 1:** Complete schema design
   - Write full Prisma schema for new tables
   - Document all relationships
   - Identify foreign key constraints
   - Review with stakeholders

2. **Day 2:** Create migrations
   - Write `20251101_create_question_library` migration
   - Add new tables (Question, QuestionVersion, Answer)
   - Add indexes for performance
   - Test migration locally

3. **Day 3:** Data mapping analysis
   - Map existing FormQuestion → new Question/QuestionVersion
   - Map existing Answer storage → new Answer table
   - Identify data quality issues
   - Document transformation rules

4. **Day 4:** Test data generation
   - Create script to generate realistic test data in new schema
   - Populate with 100+ questions, 1000+ answers
   - Test query performance
   - Validate relationships

5. **Day 5:** Review & refinement
   - Stakeholder review of schema
   - Load testing with large datasets
   - Refine indexes and constraints
   - Get approval to proceed

**Deliverables:**
- Complete Prisma schema
- Migration scripts
- Data mapping documentation
- Test data generator
- Performance benchmarks

**Success criteria:**
- All use cases covered
- Performance meets requirements (<100ms for typical queries)
- Stakeholder approval obtained

#### Phase 2: Parallel Implementation (7-10 days)

**Objectives:**
- Build new code paths without breaking existing functionality
- Maintain 100% backward compatibility
- Create feature flag infrastructure

**Tasks:**

**Week 1: Core Services**
1. **Day 1-2:** Question library service
   ```typescript
   // src/lib/question-library/service.ts
   export async function getQuestion(id: string): Promise<Question>
   export async function getQuestionVersion(id: string): Promise<QuestionVersion>
   export async function getCurrentVersion(questionId: string): Promise<QuestionVersion>
   export async function createQuestionVersion(data: CreateVersionInput): Promise<QuestionVersion>
   ```

2. **Day 3-4:** Answer service
   ```typescript
   // src/lib/answers/service.ts
   export async function createAnswer(data: CreateAnswerInput): Promise<Answer>
   export async function getAnswersForTechnology(techId: string): Promise<AnswerWithMetadata[]>
   export async function getStaleAnswers(techId: string): Promise<StaleAnswer[]>
   ```

3. **Day 5:** Version comparison service
   ```typescript
   // src/lib/question-library/comparison.ts
   export async function compareVersions(v1: string, v2: string): Promise<VersionDiff>
   export async function getVersionsForAnswer(answerId: string): Promise<VersionContext>
   ```

**Week 2: Integration**
1. **Day 6-7:** Form loading with new system
   - Update form template loader to use new Question table
   - Add feature flag: `FEATURE_NEW_QUESTION_LIBRARY`
   - Fall back to old system if flag disabled

2. **Day 8-9:** Form submission with new system
   - Update form submission to create Answer records
   - Maintain dual-write to old system (for safety)
   - Verify both systems receive same data

3. **Day 10:** Technology viewing with new system
   - Update Technology detail page to load from Answer table
   - Show version mismatch warnings
   - Add link to view original question version

**Deliverables:**
- New service layer fully implemented
- Feature flag infrastructure
- Dual-write capability
- Unit test coverage >90%

**Success criteria:**
- All tests pass with new system enabled
- No regression with old system
- Performance equal or better than old system

#### Phase 3: Data Migration (5-7 days)

**Objectives:**
- Migrate existing data to new schema
- Maintain data integrity
- Validate migration success

**Tasks:**

**Migration Script Architecture:**
```typescript
// scripts/migrate-to-question-library.ts

interface MigrationStats {
  questionsCreated: number;
  versionsCreated: number;
  answersCreated: number;
  errors: MigrationError[];
}

async function migrate(): Promise<MigrationStats> {
  // 1. Migrate QuestionDictionary → Question + QuestionVersion
  // 2. Migrate FormQuestion (deduplicate, link to Question)
  // 3. Migrate structured columns → Answer
  // 4. Migrate extendedData → Answer (with version tracking)
  // 5. Validate referential integrity
  // 6. Generate migration report
}
```

**Day 1: Question Migration**
- Extract unique questions from QuestionDictionary
- Create Question records with semantic keys
- Create QuestionVersion (v1) for each question
- Update Question.currentVersion

**Day 2: Form Question Migration**
- Update FormQuestion to reference new Question.id
- Deduplicate questions used in multiple forms
- Validate all forms still load correctly

**Day 3: Answer Migration (Structured Columns)**
- For each Technology:
  - Read structured columns (technologyOverview, etc.)
  - Find matching QuestionVersion
  - Create Answer records
- Validate data completeness

**Day 4: Answer Migration (extendedData)**
- For each Technology with extendedData:
  - Parse JSON
  - Extract questionRevisionId
  - Map to new QuestionVersion
  - Create or update Answer records
- Resolve conflicts (if any)

**Day 5: Validation & Testing**
- Run data integrity checks
- Compare old vs new data
- Test all forms with migrated data
- Generate migration report

**Day 6-7: Buffer for Issues**
- Fix any data quality issues
- Re-run migration if needed
- Final validation

**Deliverables:**
- Migration script
- Dry-run capability (test mode)
- Rollback script
- Migration report showing:
  - Records migrated
  - Data quality issues found
  - Validation results

**Success criteria:**
- 100% of data migrated
- Zero data loss
- All forms work with migrated data
- Performance acceptable

#### Phase 4: Cutover (2-3 days)

**Objectives:**
- Switch production to new system
- Monitor for issues
- Quick rollback if problems

**Tasks:**

**Day 1: Staging Cutover**
1. Run migration on staging database
2. Enable `FEATURE_NEW_QUESTION_LIBRARY=true` in staging
3. Run full regression test suite
4. Manual QA of all forms
5. Performance monitoring

**Day 2: Production Cutover (Low-Traffic Window)**
1. Announce maintenance window
2. Run migration on production database (should be fast - dry run first)
3. Enable feature flag
4. Monitor error rates, performance, user feedback
5. Ready to rollback if issues

**Day 3: Monitoring & Stabilization**
1. Monitor production metrics
2. Fix any issues discovered
3. Collect user feedback
4. Document any edge cases

**Rollback Plan:**
- Feature flag off (instant rollback)
- Old data still in place (nothing deleted yet)
- Can switch back within 5 seconds

**Success criteria:**
- Zero increase in error rates
- Performance within 10% of baseline
- No user-facing issues
- Positive feedback from users

#### Phase 5: Cleanup (3-5 days)

**Objectives:**
- Remove old code and schema
- Complete migration
- Document new system

**Tasks:**

**Day 1-2: Code Cleanup**
- Remove old service functions
- Delete `resolveBindingValue()` and related code
- Remove `buildExtendedDataUpdates()`
- Remove binding path logic
- Update tests

**Day 3: Schema Cleanup**
- Create migration to drop structured columns:
  - TriageStage: technologyOverview, missionAlignmentText, etc.
  - ViabilityStage: technicalFeasibility, etc.
  - Technology: any answer-related columns
- Drop extendedData JSON columns
- Drop old QuestionDictionary (or archive it)

**Day 4: Documentation**
- Update architecture documentation
- Write API documentation for new services
- Create user guide for question library
- Update runbooks

**Day 5: Knowledge Transfer**
- Train team on new system
- Review migration results
- Document lessons learned
- Celebrate! 🎉

**Deliverables:**
- Clean codebase (old code removed)
- Simplified schema
- Complete documentation
- Team trained

**Success criteria:**
- No references to old system in code
- Schema is clean and normalized
- Documentation is complete
- Team confident with new system

### 4.3 Risk Management

**Risk 1: Data Loss During Migration**
- **Mitigation:** Dry-run mode, keep old data until validation complete
- **Rollback:** Feature flag off, old data still in place

**Risk 2: Performance Degradation**
- **Mitigation:** Load testing, index optimization, caching
- **Rollback:** Feature flag off

**Risk 3: Breaking Changes for Users**
- **Mitigation:** Maintain identical UI, progressive enhancement
- **Rollback:** Feature flag off

**Risk 4: Migration Takes Too Long**
- **Mitigation:** Incremental migration, can pause/resume
- **Rollback:** Not needed - migration is additive

**Risk 5: Undiscovered Use Cases**
- **Mitigation:** Comprehensive test coverage, long staging period
- **Rollback:** Feature flag off

### 4.4 Success Metrics

**Technical Metrics:**
- Migration coverage: 100% of data migrated
- Test coverage: >90% for new code
- Performance: <100ms for typical queries
- Error rate: <0.1% increase
- Zero data loss

**User Metrics:**
- Form load time: Same or better
- Submission success rate: Same or better
- User satisfaction: Same or better
- Support tickets: No increase

**Code Quality Metrics:**
- Lines of code: 30-40% reduction (remove old system)
- Cyclomatic complexity: 20-30% reduction
- Test maintainability: Easier to test (simpler architecture)
- Documentation clarity: Clear, single path

---

## Part 5: Alternative Approaches Considered

### 5.1 Approach A: Incremental Refactoring (NOT RECOMMENDED)

**Description:** Keep existing schema, gradually improve coordination logic

**Pros:**
- Lower upfront cost
- No data migration
- Less risky in short term

**Cons:**
- Doesn't solve root problem
- Technical debt continues to compound
- Future features still hard to build
- Developer confusion persists

**Verdict:** False economy - saves time now, costs more later

### 5.2 Approach B: Add Third Storage Layer (NOT RECOMMENDED)

**Description:** Keep both existing systems, add new Answer table for new data only

**Pros:**
- Backward compatible
- Can build new features on clean foundation

**Cons:**
- Now THREE places to look for data
- Even more complexity
- Migration never completes
- System gets worse, not better

**Verdict:** Worst of both worlds

### 5.3 Approach C: Full Rewrite (NOT RECOMMENDED)

**Description:** Start completely fresh, throw away all existing code

**Pros:**
- Cleanest possible result
- No legacy constraints

**Cons:**
- Months of work
- High risk
- Lose institutional knowledge
- May break subtle behaviors

**Verdict:** Too risky, too expensive

### 5.4 Approach D: Parallel Implementation with Migration (RECOMMENDED)

**Description:** Build new system alongside old, migrate data, cut over

**Pros:**
- Low risk (can rollback)
- Clean end state
- Controlled timeline
- Validates new design before committing

**Cons:**
- Some temporary complexity (two systems)
- Requires migration effort

**Verdict:** Best balance of risk, cost, and outcome

---

## Part 6: Technical Specifications

### 6.1 New Database Schema

```prisma
// Question Library - Core tables

model Question {
  id              String   @id @default(cuid())
  key             String   @unique  // Semantic key: "technology-overview"
  category        String?  // "triage", "viability", "portfolio"
  currentVersion  Int      @default(1)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  createdBy       String?
  updatedAt       DateTime @updatedAt

  versions        QuestionVersion[]
  formQuestions   FormQuestion[]

  @@index([category])
  @@index([isActive])
  @@map("questions")
}

model QuestionVersion {
  id              String    @id @default(cuid())
  questionId      String
  versionNumber   Int

  // Question content
  text            String    @db.Text
  helpText        String?   @db.Text
  fieldType       FieldType
  options         Json?
  validation      Json?

  // Version metadata
  createdAt       DateTime  @default(now())
  createdBy       String?
  changeReason    String?   @db.Text
  isSignificant   Boolean   @default(true)

  question        Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers         Answer[]

  @@unique([questionId, versionNumber])
  @@index([questionId])
  @@index([createdAt])
  @@map("question_versions")
}

model Answer {
  id                 String    @id @default(cuid())
  questionVersionId  String
  technologyId       String
  value              Json
  answeredAt         DateTime  @default(now())
  answeredBy         String?
  source             String?   @default("form-submission")

  questionVersion    QuestionVersion @relation(fields: [questionVersionId], references: [id])
  technology         Technology @relation(fields: [technologyId], references: [id], onDelete: Cascade)

  @@unique([technologyId, questionVersionId])
  @@index([technologyId])
  @@index([questionVersionId])
  @@index([answeredAt])
  @@map("answers")
}

enum FieldType {
  TEXT
  TEXTAREA
  SELECT
  MULTISELECT
  CHECKBOX
  RADIO
  DATE
  NUMBER
  EMAIL
}

// Form structure - Updated to reference Question library

model FormQuestion {
  id          String  @id @default(cuid())
  formId      String
  sectionId   String
  questionId  String  // NOW references Question, not a self-contained question
  order       Int
  isRequired  Boolean @default(false)

  form        FormTemplate @relation(fields: [formId], references: [id], onDelete: Cascade)
  section     FormSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  question    Question @relation(fields: [questionId], references: [id])

  @@index([formId])
  @@index([sectionId])
  @@index([questionId])
  @@map("form_questions")
}

// Technology - Simplified (no answer columns)

model Technology {
  id              String    @id @default(cuid())
  techId          String    @unique
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  rowVersion      Int       @default(1)
  currentStage    Stage
  status          Status
  lastModifiedBy  String?
  lastModifiedAt  DateTime?

  answers         Answer[]  // All answers now in this relation

  // REMOVED: All answer columns
  // technologyName, technologyOverview, inventorName, etc.
  // These are now in Answer table

  @@map("technologies")
}

// TO BE DROPPED: TriageStage, ViabilityStage, PortfolioStage
// Their data will be migrated to Answer table
```

### 6.2 API Specifications

#### Service: Question Library

```typescript
// src/lib/question-library/service.ts

export interface QuestionWithCurrentVersion {
  id: string;
  key: string;
  category: string | null;
  currentVersion: number;
  version: QuestionVersion;
}

export interface VersionComparison {
  questionId: string;
  questionKey: string;
  oldVersion: QuestionVersion;
  newVersion: QuestionVersion;
  changes: {
    textChanged: boolean;
    helpTextChanged: boolean;
    optionsChanged: boolean;
    validationChanged: boolean;
  };
}

/**
 * Get a question with its current version
 */
export async function getQuestionWithCurrentVersion(
  questionId: string
): Promise<QuestionWithCurrentVersion>;

/**
 * Create a new version of a question
 */
export async function createQuestionVersion(data: {
  questionId: string;
  text: string;
  helpText?: string;
  fieldType: FieldType;
  options?: unknown;
  validation?: unknown;
  changeReason?: string;
  isSignificant: boolean;
  createdBy?: string;
}): Promise<QuestionVersion>;

/**
 * Compare two versions of a question
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string
): Promise<VersionComparison>;

/**
 * Get all questions in a category
 */
export async function getQuestionsByCategory(
  category: string
): Promise<QuestionWithCurrentVersion[]>;
```

#### Service: Answers

```typescript
// src/lib/answers/service.ts

export interface AnswerWithContext {
  answer: Answer;
  questionVersion: QuestionVersion;
  question: Question;
  isStale: boolean;
  currentVersion?: QuestionVersion;
}

/**
 * Create an answer for a technology
 */
export async function createAnswer(data: {
  questionVersionId: string;
  technologyId: string;
  value: unknown;
  answeredBy?: string;
  source?: string;
}): Promise<Answer>;

/**
 * Get all answers for a technology with version context
 */
export async function getAnswersWithContext(
  technologyId: string
): Promise<AnswerWithContext[]>;

/**
 * Get stale answers (answers for old question versions)
 */
export async function getStaleAnswers(
  technologyId: string
): Promise<AnswerWithContext[]>;

/**
 * Update an answer value (creates new Answer, doesn't modify existing)
 */
export async function updateAnswer(
  technologyId: string,
  questionId: string,
  newValue: unknown,
  answeredBy?: string
): Promise<Answer>;
```

### 6.3 Migration Script Pseudocode

```typescript
// scripts/migrate-to-question-library.ts

async function migrateQuestions() {
  // 1. Get all unique questions from QuestionDictionary
  const dictionaries = await prisma.questionDictionary.findMany();

  for (const dict of dictionaries) {
    // Create Question
    const question = await prisma.question.create({
      data: {
        key: dict.key,
        category: inferCategory(dict.key), // "triage", "viability", etc.
        currentVersion: 1,
      }
    });

    // Create QuestionVersion (v1)
    await prisma.questionVersion.create({
      data: {
        questionId: question.id,
        versionNumber: 1,
        text: dict.label,
        helpText: dict.helpText,
        fieldType: inferFieldType(dict),
        options: dict.options,
        validation: dict.validation,
        createdAt: dict.createdAt,
        createdBy: 'migration-script',
        changeReason: 'Migrated from QuestionDictionary',
      }
    });
  }
}

async function migrateFormQuestions() {
  const formQuestions = await prisma.formQuestion.findMany({
    include: { /* ... */ }
  });

  for (const fq of formQuestions) {
    // Find matching Question by dictionaryKey
    const question = await prisma.question.findFirst({
      where: { key: fq.dictionaryKey }
    });

    if (question) {
      // Update FormQuestion to reference new Question
      await prisma.formQuestion.update({
        where: { id: fq.id },
        data: { questionId: question.id }
      });
    }
  }
}

async function migrateAnswers() {
  const technologies = await prisma.technology.findMany({
    include: { triageStage: true, viabilityStage: true }
  });

  for (const tech of technologies) {
    // Migrate structured columns
    if (tech.triageStage) {
      await migrateStructuredAnswers(tech.id, tech.triageStage, 'triage');
    }

    // Migrate extendedData
    if (tech.triageStage?.extendedData) {
      await migrateExtendedDataAnswers(tech.id, tech.triageStage.extendedData);
    }
  }
}

async function migrateStructuredAnswers(
  technologyId: string,
  stage: any,
  category: string
) {
  const fieldMapping = {
    technologyOverview: 'technology-overview',
    missionAlignmentText: 'mission-alignment-text',
    // ... etc
  };

  for (const [columnName, questionKey] of Object.entries(fieldMapping)) {
    const value = stage[columnName];
    if (!value) continue;

    // Find question and its current version
    const question = await prisma.question.findUnique({
      where: { key: questionKey },
      include: { versions: true }
    });

    if (!question) continue;

    // Use version 1 (initial version from migration)
    const version = question.versions.find(v => v.versionNumber === 1);

    await prisma.answer.create({
      data: {
        questionVersionId: version.id,
        technologyId,
        value,
        answeredAt: stage.updatedAt || stage.createdAt,
        source: 'migration-structured-column',
      }
    });
  }
}

async function migrateExtendedDataAnswers(
  technologyId: string,
  extendedData: any
) {
  for (const [questionKey, versionedAnswer] of Object.entries(extendedData)) {
    // Find the specific version that was answered
    const questionVersion = await findQuestionVersionByLegacyId(
      questionKey,
      versionedAnswer.questionRevisionId
    );

    if (!questionVersion) continue;

    await prisma.answer.upsert({
      where: {
        technologyId_questionVersionId: {
          technologyId,
          questionVersionId: questionVersion.id,
        }
      },
      create: {
        questionVersionId: questionVersion.id,
        technologyId,
        value: versionedAnswer.value,
        answeredAt: versionedAnswer.answeredAt,
        source: 'migration-extended-data',
      },
      update: {
        // If exists from structured column migration, update with more accurate data
        value: versionedAnswer.value,
        answeredAt: versionedAnswer.answeredAt,
      }
    });
  }
}
```

---

## Part 7: Recommendation Summary

### 7.1 Core Recommendation

**YES, start over with schema design.**

The current architecture is fighting against itself. The disagreement about how revision tracking works (documented in `claude_snapback.md`) is a symptom of fundamental design compromises.

### 7.2 Recommended Path

**Phase 1-2 (2 weeks):** Design + parallel implementation
**Phase 3-4 (1-2 weeks):** Migration + cutover
**Phase 5 (1 week):** Cleanup

**Total: 3-4 weeks to dramatically simpler system**

### 7.3 Expected Outcomes

**Code Quality:**
- 30-40% reduction in lines of code
- 20-30% reduction in complexity
- Elimination of dual-storage coordination
- Clear, obvious data flow

**Developer Experience:**
- No more confusion about data flow
- Straightforward testing
- Easy to add new questions
- Self-documenting code

**User Experience:**
- Same or better performance
- Exactly the features requested
- Future features easier to build

**Maintenance:**
- Clear upgrade path for future needs
- No technical debt accumulation
- Simple onboarding for new developers

### 7.4 Why This Matters

From user's message:
> "I want function to be as simple and robust as possible without deference to history or the current state of the database and schema."

**Current system:** Deferent to history (maintains backward compatibility at cost of complexity)

**Proposed system:** Simple and robust (optimized for current and future needs)

The user's instinct is correct: the system should be simple. The disagreement signals overcomplexity. Time to fix the foundation.

---

## Part 8: Next Steps

### 8.1 Decision Points

**Decision 1:** Commit to refactoring?
- If yes: Proceed with Phase 1 (schema design)
- If no: Document technical debt, plan for future refactoring

**Decision 2:** Timeline constraints?
- Fast path: 3 weeks (aggressive, full-time focus)
- Standard path: 4-5 weeks (reasonable, shared attention)
- Slow path: 6-8 weeks (careful, part-time)

**Decision 3:** Risk tolerance?
- High: Migrate production within 2 weeks
- Medium: 3-4 week staging period
- Low: 6+ week parallel operation

### 8.2 Immediate Actions

1. **Review this document** with stakeholders
2. **Validate user requirements** - ensure proposed design meets all needs
3. **Choose timeline** - fast/standard/slow path
4. **Assign resources** - who will work on this?
5. **Set milestone** - when should Phase 1 complete?

### 8.3 Success Criteria for Go/No-Go

**Proceed with refactoring if:**
- ✅ Stakeholders agree current system is too complex
- ✅ User requirements are clear and stable
- ✅ Team has 3-4 weeks available
- ✅ Risk mitigation plan is acceptable
- ✅ Benefits justify the effort

**Don't proceed if:**
- ❌ Urgent features need to ship first
- ❌ Requirements are still changing
- ❌ Team is unavailable
- ❌ Risk tolerance is very low
- ❌ Current system is "good enough"

---

## Appendix A: Code Examples

### A.1 Current System Complexity

```typescript
// Current approach - complex coordination
async function buildInitialValues(technology: Technology) {
  // Parse JSON
  const triageExtended = parseVersionedAnswerMap(
    technology.triageStage?.extendedData
  );

  // For each question
  for (const question of questions) {
    // Read structured column
    const rawValue = resolveBindingValue(question.bindingPath, technology);

    // Check if null
    if (rawValue === null) {
      // Read from JSON instead
      const versioned = triageExtended[question.dictionaryKey];
      // ... more logic
    } else {
      // Use structured value
      responses[fieldCode] = rawValue;

      // But metadata from JSON
      const versioned = triageExtended[question.dictionaryKey];
      answerMetadata[fieldCode] = getAnswerStatus(question, versioned);
    }
  }
}
```

**Complexity indicators:**
- Two storage layers
- Conditional logic based on which layer has data
- String-based binding paths
- Coordination between value and metadata

### A.2 Proposed System Simplicity

```typescript
// Proposed approach - straightforward join
async function getAnswersWithContext(technologyId: string) {
  return await prisma.answer.findMany({
    where: { technologyId },
    include: {
      questionVersion: {
        include: {
          question: {
            include: {
              versions: {
                where: { versionNumber: question.currentVersion }
              }
            }
          }
        }
      }
    }
  });
}

// Display logic - no special coordination
for (const answer of answers) {
  const currentVersion = answer.questionVersion.question.versions[0];
  const isStale = answer.questionVersion.id !== currentVersion.id;

  display({
    question: currentVersion.text,  // Current question
    answer: answer.value,            // User's answer
    isStale,                         // Simple comparison
    originalQuestion: isStale ? answer.questionVersion.text : null
  });
}
```

**Simplicity indicators:**
- One storage layer
- Straightforward join
- Type-safe references
- No coordination logic needed

---

## Appendix B: Glossary

**Binding Path:** String reference to database column (e.g., `"triageStage.technologyOverview"`). Anti-pattern that couples questions to schema.

**Dictionary Key:** Identifier for question in QuestionDictionary (e.g., `"triage.technologyOverview"`). Similar to binding path but for JSON storage.

**Dual Storage:** Storing same data in two places (structured columns + extendedData). Source of complexity.

**Field Code:** Form-specific identifier (e.g., "F2.1"). Currently used as primary key for questions, should be form-scoped only.

**Question Library:** Intended system for reusable questions. Not fully realized in current implementation.

**Structured Columns:** Typed database columns (e.g., `technologyOverview String?`). Legacy storage from pre-dynamic-form era.

**extendedData:** JSON column storing versioned answers with metadata. Added to support revision tracking without modifying structured columns.

**Version Tracking:** System for recording which version of a question was answered. Current implementation split across multiple tables.

---

**End of Document**

**Status:** Ready for stakeholder review and decision
**Recommendation:** Proceed with refactoring
**Estimated effort:** 3-4 weeks full-time
**Expected outcome:** 30-40% simpler codebase, clear data flow, user requirements met
