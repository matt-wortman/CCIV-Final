# Question Versioning System Refactor Plan

**Author**: Cline  
**Date**: October 31, 2025  
**Status**: Proposal

## Executive Summary

The current question versioning system is fundamentally flawed due to architectural decisions that prioritize backward compatibility over functional correctness. This document proposes a complete refactoring that will simplify the codebase, fix critical bugs, and create a maintainable system that actually works as intended.

**Core Problem**: Answers are stored in two places (structured columns and JSON fields), but only JSON fields can track version metadata. The code reads structured columns first, making version tracking appear broken even when it's technically implemented.

**Recommended Solution**: Clean break from the legacy schema. Implement a simple, three-table architecture that treats questions and answers as versioned entities from the ground up.

## Part 1: Current State Analysis

### The Fundamental Problems

#### 1. Dual Storage Antipattern
The system currently stores answer data in two places:
- **Structured columns** in `triage_stages`, `viability_stages` tables (e.g., `technologyOverview`, `missionAlignmentScore`)
- **JSON fields** (`extendedData`) that can store arbitrary data with metadata

This creates several critical issues:
- Code must check multiple locations to find an answer
- Only JSON storage supports version tracking metadata
- Read priority favors structured columns, which can't store versions
- Developers must remember which storage to use for which feature

#### 2. Read Priority Failure
The `buildInitialValues()` function in `src/lib/technology/service.ts` demonstrates the problem:
```
1. First, check structured database column (no version info)
2. If null/undefined, check extendedData JSON (has version info)
3. Return the first value found
```

This means if an answer exists in a structured column, version tracking is impossible.

#### 3. Overcomplicated Entity Model
The current system has too many overlapping concepts:
- `FormQuestion` - Questions in a form template
- `QuestionDictionary` - Reusable question definitions  
- `QuestionRevision` - Versioned question history
- `QuestionResponse` - Single answers
- `RepeatableGroupResponse` - Table row answers
- Structured stage columns - Direct database fields
- `extendedData` JSON - Flexible storage

These all represent variations of "questions and answers" but with incompatible storage mechanisms.

#### 4. Legacy Constraints Driving Design
The system is trying to maintain backward compatibility with:
- Existing structured columns that can't be easily removed
- Form templates that use positional codes (`F0.1`) instead of semantic keys
- Multiple storage patterns from different development phases

### Why This Matters

1. **Features Don't Work**: Stale answer detection only works if data happens to be in the right storage location
2. **Maintenance Nightmare**: Developers must understand multiple storage patterns and their interactions
3. **Testing is Difficult**: Can't reliably test features because behavior depends on data location
4. **Performance Issues**: Checking multiple storage locations for every field
5. **Data Integrity Risk**: Same data can exist in multiple places with different values

## Part 2: Proposed Architecture

### Design Principles

1. **Single Source of Truth**: Each piece of data lives in exactly one place
2. **Versioning by Default**: All questions and answers track versions natively
3. **Simplicity Over Flexibility**: Better to have clear constraints than confusing options
4. **Forward-Only Migration**: Don't try to maintain backward compatibility with broken patterns

### Core Schema Design

```sql
-- Questions are versioned entities with a stable ID
CREATE TABLE questions (
    id TEXT PRIMARY KEY,                    -- Stable question ID (never changes)
    current_version INTEGER NOT NULL,       -- Points to latest version
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Question versions contain the actual content
CREATE TABLE question_versions (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id),
    version_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    help_text TEXT,
    field_type TEXT NOT NULL,              -- 'text', 'number', 'select', etc.
    options JSON,                          -- For select/checkbox fields
    validation JSON,                       -- Validation rules
    created_by TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    change_reason TEXT,
    is_significant BOOLEAN DEFAULT true,
    
    UNIQUE(question_id, version_number)
);

-- Answers always reference both question and version
CREATE TABLE answers (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,           -- Links to form submission
    question_id TEXT NOT NULL REFERENCES questions(id),
    question_version INTEGER NOT NULL,
    answer_value JSON NOT NULL,            -- Stores any type of answer
    answered_at TIMESTAMP NOT NULL,
    answered_by TEXT NOT NULL,
    
    -- Foreign key to question_versions for referential integrity
    FOREIGN KEY (question_id, question_version) 
        REFERENCES question_versions(question_id, version_number)
);

-- Form templates define which questions appear
CREATE TABLE form_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL
);

-- Links questions to forms with ordering
CREATE TABLE form_questions (
    id TEXT PRIMARY KEY,
    template_id TEXT REFERENCES form_templates(id),
    question_id TEXT REFERENCES questions(id),
    section_name TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT false,
    conditional_logic JSON,
    
    UNIQUE(template_id, question_id)
);

-- Submissions track completed forms
CREATE TABLE form_submissions (
    id TEXT PRIMARY KEY,
    template_id TEXT REFERENCES form_templates(id),
    technology_id TEXT,                    -- Optional link to technology
    status TEXT NOT NULL,                  -- 'draft', 'submitted', 'reviewed'
    submitted_by TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP
);
```

### Key Improvements

1. **Clear Separation**: Questions, versions, and answers are distinct entities
2. **No Dual Storage**: Answers only exist in the `answers` table
3. **Version Tracking Built-In**: Every answer knows its question version
4. **Simple Relationships**: Clear foreign keys, no ambiguity
5. **Technology Agnostic**: Forms/questions don't care about technology stages

## Part 3: Implementation Plan

### Phase 1: Preparation (Week 1)

#### Tasks
1. Create feature flag `FEATURE_CLEAN_SCHEMA=false`
2. Document all existing data relationships
3. Build data extraction queries for migration
4. Create rollback plan and backup procedures

#### Deliverables
- Complete data inventory document
- Migration readiness checklist
- Rollback procedures document

### Phase 2: Parallel Schema (Week 2)

#### Tasks
1. Create new tables alongside existing schema
2. Build new service layer (`src/lib/questions-v2/`)
3. Implement dual-write logic (write to both old and new)
4. Create data migration scripts

#### Code Structure
```
src/lib/questions-v2/
├── schema.ts          # TypeScript types for new schema
├── service.ts         # Business logic layer
├── migration.ts       # Migration utilities
├── validation.ts      # Answer validation
└── __tests__/        # Comprehensive test suite
```

#### Deliverables
- New schema deployed to development
- Dual-write logic active
- Migration scripts tested

### Phase 3: Migration (Week 3)

#### Tasks
1. Run migration in development environment
2. Validate data integrity
3. Performance testing
4. Run migration in staging
5. User acceptance testing

#### Migration Strategy
```typescript
// Pseudo-code for migration logic
async function migrateToCleanSchema() {
  // 1. Create question entities
  for (const dictEntry of questionDictionary) {
    const questionId = await createQuestion({
      id: dictEntry.key,
      current_version: 1
    });
    
    await createQuestionVersion({
      question_id: questionId,
      version_number: 1,
      question_text: dictEntry.label,
      // ... other fields
    });
  }
  
  // 2. Migrate answers from structured columns
  for (const stage of triageStages) {
    for (const [field, value] of getStructuredFields(stage)) {
      if (value !== null) {
        await createAnswer({
          question_id: mapFieldToQuestionId(field),
          question_version: 1,
          answer_value: value,
          // ... metadata
        });
      }
    }
  }
  
  // 3. Migrate answers from extendedData
  for (const stage of allStages) {
    if (stage.extendedData) {
      for (const [key, data] of Object.entries(stage.extendedData)) {
        await createAnswer({
          question_id: key,
          question_version: data.questionRevisionId ? 
            getVersionFromRevisionId(data.questionRevisionId) : 1,
          answer_value: data.value,
          // ... metadata
        });
      }
    }
  }
}
```

#### Deliverables
- Successful migration in staging
- Performance benchmarks
- Data integrity report

### Phase 4: Cutover (Week 4)

#### Tasks
1. Update UI components to use new service layer
2. Switch read path to new schema
3. Disable writes to old schema
4. Monitor for issues
5. Remove feature flag

#### Validation Checklist
- [ ] All forms load correctly
- [ ] Historical data displays properly
- [ ] Stale answer detection works
- [ ] PDF exports include version info
- [ ] Performance meets benchmarks
- [ ] No data loss confirmed

#### Deliverables
- Production deployment
- Monitoring dashboard
- Incident response plan

### Phase 5: Cleanup (Week 5)

#### Tasks
1. Remove old schema code
2. Drop deprecated database columns
3. Update documentation
4. Team training on new architecture

#### Files to Remove/Update
```
REMOVE:
- src/lib/technology/service.ts (old binding logic)
- Complex extendedData handling
- Dual storage code paths

UPDATE:
- src/app/dynamic-form/actions.ts (use new service)
- src/lib/form-engine/renderer.tsx (simplified)
- All tests to use new schema
```

#### Deliverables
- Clean codebase
- Updated documentation
- Training materials

## Part 4: Risk Assessment and Mitigation

### Risks

#### High Risk
1. **Data Loss During Migration**
   - Mitigation: Complete backups, dry runs, validation scripts
   - Recovery: Restore from backup, replay from audit log

2. **Performance Degradation**
   - Mitigation: Load testing, query optimization, caching strategy
   - Recovery: Quick rollback to old schema if needed

#### Medium Risk
3. **Feature Parity Gaps**
   - Mitigation: Comprehensive test coverage, UAT phase
   - Recovery: Dual-write period allows fixing gaps

4. **Integration Breakage**
   - Mitigation: API versioning, compatibility layer
   - Recovery: Temporary shim layer if needed

#### Low Risk
5. **User Confusion**
   - Mitigation: Clear communication, training
   - Recovery: Additional support and documentation

### Success Metrics

1. **Performance**
   - Page load time < 2 seconds
   - Form save time < 1 second
   - No increase in database CPU usage

2. **Reliability**
   - Zero data loss
   - 99.9% uptime during migration
   - All tests passing

3. **User Experience**
   - Stale answer detection works 100% of time
   - No user-reported issues in first week
   - Improved developer satisfaction scores

## Part 5: Long-term Benefits

### Immediate Benefits

1. **Version Tracking Actually Works**: No more confusion about which storage location to use
2. **Simplified Mental Model**: Questions have versions, answers reference versions. Done.
3. **Better Testing**: Single code path makes testing straightforward
4. **Improved Performance**: No need to check multiple storage locations

### Future Benefits

1. **Easier Feature Development**: Clear schema makes new features simpler
2. **Better Audit Trail**: Complete history of all changes
3. **Improved Data Quality**: Single source of truth eliminates inconsistencies
4. **Reduced Maintenance Cost**: Less code, fewer bugs, happier developers

### Technical Debt Eliminated

- Dual storage antipattern
- Structured columns that can't evolve
- Complex read/write logic
- Ambiguous data location
- Version tracking workarounds

## Part 6: Alternative Approaches Considered

### Option 1: Incremental Fixes (REJECTED)
Keep patching the current system with more workarounds.
- **Pros**: Less risky, no migration needed
- **Cons**: Technical debt continues growing, features remain broken
- **Verdict**: Rejected - Just delays the inevitable

### Option 2: JSON-Only Storage (REJECTED)
Move everything to JSON fields, abandon structured columns.
- **Pros**: Flexible, supports metadata
- **Cons**: Loses type safety, query performance, referential integrity
- **Verdict**: Rejected - Trades one problem for another

### Option 3: Hybrid Approach (REJECTED)
Keep structured columns for non-versioned fields, JSON for versioned.
- **Pros**: Gradual migration possible
- **Cons**: Perpetuates dual storage confusion
- **Verdict**: Rejected - Doesn't solve core problem

## Part 7: Implementation Code Examples

### New Service Layer

```typescript
// src/lib/questions-v2/service.ts

export class QuestionService {
  async getQuestion(questionId: string): Promise<QuestionWithVersion> {
    const question = await prisma.questions.findUnique({
      where: { id: questionId },
      include: {
        versions: {
          where: { version_number: currentVersion },
          take: 1
        }
      }
    });
    
    return {
      id: question.id,
      currentVersion: question.current_version,
      text: question.versions[0].question_text,
      // ... other fields
    };
  }
  
  async saveAnswer(data: SaveAnswerInput): Promise<Answer> {
    // Always saves with version reference
    return await prisma.answers.create({
      data: {
        submission_id: data.submissionId,
        question_id: data.questionId,
        question_version: data.questionVersion || currentVersion,
        answer_value: data.value,
        answered_at: new Date(),
        answered_by: data.userId
      }
    });
  }
  
  async getAnswerWithStatus(
    submissionId: string, 
    questionId: string
  ): Promise<AnswerWithStatus> {
    const answer = await prisma.answers.findFirst({
      where: { submission_id: submissionId, question_id: questionId }
    });
    
    const currentVersion = await this.getCurrentVersion(questionId);
    
    return {
      ...answer,
      status: answer.question_version === currentVersion ? 
        'CURRENT' : 'STALE',
      currentVersion
    };
  }
}
```

### Migration Script

```typescript
// scripts/migrate-to-clean-schema.ts

async function main() {
  console.log('Starting clean schema migration...');
  
  // Step 1: Create question entities
  const questions = await migrateQuestions();
  console.log(`✓ Migrated ${questions.length} questions`);
  
  // Step 2: Migrate answers from all sources
  const answers = await migrateAnswers();
  console.log(`✓ Migrated ${answers.length} answers`);
  
  // Step 3: Validate data integrity
  const validation = await validateMigration();
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors}`);
  }
  console.log('✓ Validation passed');
  
  // Step 4: Create indexes for performance
  await createIndexes();
  console.log('✓ Indexes created');
  
  console.log('Migration completed successfully!');
}
```

## Part 8: Conclusion

The current question versioning system is fundamentally broken due to architectural decisions that prioritize backward compatibility over functional correctness. The dual storage pattern, combined with read priority that favors non-versioned storage, makes it impossible to reliably track question versions.

This refactoring plan provides a clear path to a simpler, more maintainable system that actually works as intended. While the migration requires effort, the long-term benefits far outweigh the short-term costs.

### Key Takeaways

1. **Simplicity Wins**: The new three-table schema is easier to understand and maintain
2. **Version Tracking Works**: Every answer knows its question version, always
3. **Single Source of Truth**: No more confusion about where data lives
4. **Future-Proof**: Clean architecture makes future changes easier

### Next Steps

1. Review this plan with the team
2. Get stakeholder approval
3. Begin Phase 1 preparation
4. Set up migration infrastructure
5. Execute the plan

The question isn't whether to do this refactoring, but how quickly we can complete it. Every day we delay is another day of accumulated technical debt and broken features. Let's fix this properly, once and for all.

---

**Remember**: Good architecture is not about what you can add, but what you can leave out. This refactoring removes complexity and adds clarity. That's the path to maintainable software.
