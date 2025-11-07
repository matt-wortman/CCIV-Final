# Critique: TECHNOLOGY_MULTI_FORM_MASTER_PLAN.md

**Date**: 2025-10-09
**Reviewer**: Claude Code
**Overall Assessment**: **8.5/10 - Strong production-ready plan with minor gaps**

This is the **most complete** of the three documents. It successfully merges the strengths of both predecessors while addressing most operational concerns. However, there are still some issues to address.

---

## ✅ What's Excellent

### 1. **Comprehensive Coverage**
- ✅ Schema design (section 1)
- ✅ Question catalog (section 2)
- ✅ Persona strategy (section 3)
- ✅ Governance (section 4)
- ✅ Migration plan (section 5)
- ✅ API layer (section 6)
- ✅ Calculated fields (section 7)
- ✅ Concurrency (section 8)
- ✅ Security (section 9)
- ✅ Testing (section 10)
- ✅ Implementation roadmap (section 11)

**All the major concerns are addressed.**

### 2. **Migration Plan is Production-Grade (Section 5)**
```
1. Preparation → Backup, seed catalog
2. Data Extraction → Choose authoritative source
3. Collision Handling → Generate reconciliation report ✅ CRITICAL
4. Dry Run → Staging verification
5. Cutover → Feature flag strategy
6. Rollback Plan → Restore backup
```

**This is excellent.** The collision handling step is **critical** and was missing from LIFECYCLE.

### 3. **Concurrency Strategy (Section 8)**
```
- rowVersion for optimistic locking ✅
- StageLock table for active edits ✅
- UI warns when another user editing ✅
```

**Production-essential.** Prevents data corruption in multi-user scenarios.

### 4. **API Design (Section 6)**
```
GET /technologies/:techId
GET /technologies/:techId/forms/:stage
POST /technologies/:techId/forms/:stage
```

**Clear service layer contract.** Makes frontend/backend boundary explicit.

### 5. **Testing Strategy (Section 10.1)**
```
- Unit tests (dictionary binding, locking, metrics)
- Integration tests (full lifecycle flow)
- Regression tests (compare pre/post migration API)
- UI snapshot tests (persona-specific forms)
```

**Comprehensive.** Builds confidence for production deployment.

---

## ⚠️ What Needs Improvement

### 1. **Schema Inconsistencies**

**Issue**: Section 1.1 vs Section 2.1 use different names for same concept

**Section 1.1:**
```prisma
model Technology {
  // No mention of rowVersion
}
```

**Section 2.1:**
```prisma
model QuestionDictionary {
  version String  // This is catalog versioning, not entity versioning
}
```

**Section 8 mentions:**
```
Add rowVersion (integer) to Technology and stage tables
```

**Problem**: The Prisma schema in section 1.1 doesn't include `rowVersion` field that's described in section 8.

**Fix**: Add to section 1.1:
```prisma
model Technology {
  // ... existing fields
  rowVersion    Int      @default(1)  // For optimistic locking
}
```

---

### 2. **Missing Critical Schema Elements**

**Section 1.2 mentions:**
```
StageHistory (append-only)
```

**But no schema is provided.** This is important for audit compliance.

**Needed:**
```prisma
model StageHistory {
  id            String   @id @default(cuid())
  technologyId  String
  stage         TechStage
  snapshot      Json     // Delta or full snapshot
  changedBy     String
  changedAt     DateTime @default(now())
  changeType    String   // "CREATED", "UPDATED", "PROMOTED"

  technology    Technology @relation(fields: [technologyId], references: [id])

  @@map("stage_history")
  @@index([technologyId, changedAt])
}
```

---

### 3. **Binding Path Ambiguity Still Exists**

**Section 2.1:**
```prisma
bindingPath    String   // e.g. "technology.inventorName"
```

**Section 2.3:**
```
Persist shared fields to Technology via bindingPath
```

**Questions:**
1. How does the code parse `"technology.inventorName"` → `Technology.inventorName` in Prisma?
2. What about nested paths like `"triageStage.competitors[].company"`?
3. Is binding path validated at catalog creation time or submission time?
4. What if binding path references a field that doesn't exist?

**Missing**: Type safety validation mechanism

**Suggestion**: Add section:
```
### 2.4 Binding Path Resolution

Rules:
- Format: {model}.{field} where model ∈ {technology, triageStage, viabilityStage}
- Validated against Prisma schema at catalog seed time
- Invalid paths rejected with error
- Arrays handled via RepeatableGroupResponse (existing pattern)

Implementation:
- src/lib/binding-path/resolver.ts validates paths
- Uses zod schema derived from Prisma types for safety
```

---

### 4. **Persona Matrix is Vague**

**Section 3:**
```
Personas (initial set): tech_manager, inventor, executive, legal, finance
Access matrix stored in personaConfig
```

**Section 14.2 shows example:**
```json
{
  "tech_manager": { "canEditShared": true, "canEditStage": true },
  "inventor":     { "canEditShared": false, "canEditStage": true, "sections": ["technical"] }
}
```

**Problems:**
1. Where does persona claim come from? JWT? Session cookie?
2. How is persona assigned to a user? (No User table shown)
3. What if user has multiple personas? (Inventor AND Legal?)
4. Who has permission to assign personas?

**Missing**: User/Persona relationship model

**Needed:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  personas  String[] // ["inventor", "tech_manager"]
}

// Or more complex many-to-many:
model UserPersona {
  userId    String
  persona   String
  grantedBy String
  grantedAt DateTime

  @@id([userId, persona])
}
```

---

### 5. **Calculated Metrics Implementation Too Abstract**

**Section 7:**
```
Store metric definitions in CalculatedMetric table
Recompute on submission or via background job
```

**Section 14.3 shows example:**
```json
{
  "key": "overallScore",
  "expression": "average(triageStage.impactScore, viabilityStage.technicalScore)"
}
```

**Questions:**
1. What evaluates the `expression`? JavaScript eval()? Custom DSL?
2. When do calculations fail? (Missing dependency, type mismatch?)
3. Are metrics validated at definition time?
4. What's the performance impact of recomputing on every submission?

**Missing**: Expression evaluation strategy and error handling

**Suggestion**: Be explicit:
```
### 7.1 Metric Expression Language

Use a restricted subset of JavaScript:
- Operators: +, -, *, /, average(), max(), min()
- Functions: Math.round(), Math.ceil()
- Access via bindingPath only (no arbitrary code)

Evaluation:
- Parse with @babel/parser, whitelist AST nodes
- Reject if dependencies unavailable
- Cache results in CalculatedMetric.value field
- Recompute only when dependencies change (tracked via binding paths)
```

---

### 6. **Migration Collision Handling Underspecified**

**Section 5.3:**
```
Detect conflicting values for shared fields; produce reconciliation report
Resolve manually or apply precedence rules (latest submission wins)
```

**Questions:**
1. What constitutes a "conflict"? Different inventor names for same Tech ID?
2. Who reviews the reconciliation report? How long does this take?
3. Can migration proceed with unresolved conflicts?
4. What happens to the losing values? Archived? Lost?

**Missing**: Concrete collision resolution workflow

**Needed:**
```
### 5.3 Collision Resolution Workflow

Definition: Conflict occurs when >1 TriageForm shares a Tech ID with different values for shared fields.

Process:
1. Script generates collision_report.csv with:
   - Tech ID
   - Field name
   - Value A (submission 1)
   - Value B (submission 2)
   - Recommended resolution (latest submission wins)
2. Admin reviews report, marks acceptance or override
3. Migration script uses approved resolution
4. Losing values written to StageHistory with note "MERGED_CONFLICT"

Blocker: Migration halts if >50 unresolved conflicts (manual review required)
```

---

### 7. **No Performance/Scalability Discussion**

**Missing entirely:**
- Query performance for persona dashboards
- Index strategy for Technology/Stage joins
- Caching strategy for question catalog
- Response time targets
- Concurrent user load expectations

**Concern**: Section 6 shows:
```
GET /technologies/:techId → core + supplements + metrics
```

**Problem**: This could be slow if Technology has 5 stages with nested data.

**Needed:**
```
## 15. Performance & Scalability

### 15.1 Query Optimization
- Add composite indexes on (technologyId, stage)
- Use Prisma query includes selectively (don't always load all stages)
- Implement cursor-based pagination for Technology lists

### 15.2 Caching Strategy
- Question catalog: Cache in Redis (TTL: 1 hour, invalidate on admin update)
- Technology core data: Cache for 5 minutes (stale reads acceptable)
- Calculated metrics: Cache until dependency changes

### 15.3 Response Time Targets
- Form load with prefill: <500ms p95
- Submission with audit log: <1000ms p95
- Persona dashboard with 50 techs: <2000ms p95

### 15.4 Load Testing
- Test with 100 concurrent users submitting forms
- Verify no deadlocks with concurrent edits to same Technology
```

---

### 8. **Testing Section Too High-Level**

**Section 10.1:**
```
Unit: dictionary binding resolution, optimistic locking, calculated metrics
Integration: Full triage submission flow → viability flow → persona read
```

**Problems:**
1. No mention of test coverage targets (80%? 90%?)
2. What about E2E tests with real browser automation?
3. How to test migration script? (Snapshot test of migrated data?)
4. Performance regression tests?

**Needed:**
```
### 10.1 Test Coverage Targets
- Unit tests: >85% coverage on service layer
- Integration tests: All happy paths + major error scenarios
- E2E tests (Playwright): Critical user journeys per persona
- Migration tests: Snapshot comparison of 10 sample Tech IDs pre/post
- Performance tests: Load test with 100 concurrent users

### 10.4 CI/CD Integration
- All tests run on PR
- E2E tests on staging after merge
- Performance tests nightly
- Migration dry-run required before prod deployment
```

---

### 9. **Open Decisions (Section 13) - Some Are Not Really "Open"**

**Listed as open:**
```
- Choose catalog versioning approach (semantic vs. hash)
```

**Problem**: Section 2.1 already shows `version String` in schema. Not actually open.

**Also listed:**
```
- Decide on conflict resolution UX (auto-merge vs. manual choice)
```

**Problem**: Section 5.3 already says "latest submission wins" OR "manual". Should pick one.

**Suggestion**: Section 13 should only list **truly unresolved** architectural choices, like:
- SSO provider selection (Azure AD vs. Okta vs. Auth0)
- Key Vault migration timeline (now vs. Phase 2)
- Whether to implement notification system in Phase 1

---

### 10. **No Error Handling Strategy**

**Missing:**
- What if Technology exists but TriageStage is NULL? (Orphaned record)
- What if binding path fails during submission? (Field doesn't exist)
- What if calculated metric evaluation throws error? (Division by zero)
- What if rowVersion check fails 3 times? (Infinite loop prevention)
- What if migration script crashes halfway? (Idempotency)

**Needed:**
```
## 16. Error Handling & Resilience

### 16.1 Data Integrity Checks
- Reject Technology without at least one stage supplement
- Validate binding paths at catalog creation time
- Gracefully handle missing calculated metric dependencies (return null)

### 16.2 Submission Failures
- If rowVersion fails: return 409 Conflict with latest data
- If binding path invalid: return 400 Bad Request with field name
- If partial write fails: rollback entire transaction (atomic)

### 16.3 Migration Safety
- Migration script is idempotent (can re-run safely)
- Checkpoint after each 1000 records
- Log progress to file for resume capability
```

---

### 11. **No UI/UX Guidance**

**Missing:**
- How does user know a field is "from Triage"? (Visual indicator?)
- How to show "This field is locked - contact admin to edit"?
- What happens if user tries to edit locked field?
- How to show "Another user is editing this - refresh to see changes"?
- What if user has slow connection and submission times out?

**This is critical for good UX but completely absent.**

**Needed:**
```
## 17. UI/UX Guidelines

### 17.1 Visual Indicators
- Read-only fields: Gray background + lock icon
- Carried from previous stage: Blue badge "From Triage"
- Currently editing by another user: Yellow banner at top
- Stale data (rowVersion mismatch): Red alert "Refresh required"

### 17.2 Error Messaging
- Locked field edit attempt: Modal explaining why + request override button
- Submission failure: Toast with retry button + "Contact support" link
- Conflict resolution: Side-by-side diff showing current vs. server values

### 17.3 Progressive Disclosure
- Persona-hidden sections: Don't show at all (not just grayed out)
- Long forms: Save draft every 30 seconds automatically
- Network errors: Offline indicator + queue submission for retry
```

---

## 📊 Section-by-Section Scores

| Section | Score | Notes |
|---------|-------|-------|
| 0. Executive Summary | 9/10 | Clear, concise ✅ |
| 1. Domain Architecture | 7/10 | Missing rowVersion, StageHistory schema |
| 2. Question Catalog | 7/10 | Binding path validation missing |
| 3. Persona Strategy | 6/10 | User/persona relationship unclear |
| 4. Workflow Governance | 9/10 | Excellent field locking rules ✅ |
| 5. Migration Plan | 8/10 | Good but collision handling underspecified |
| 6. Service & API Layer | 8/10 | Clean design ✅ |
| 7. Calculated Fields | 6/10 | Expression evaluation strategy missing |
| 8. Concurrency | 9/10 | Solid optimistic locking approach ✅ |
| 9. Security & Compliance | 7/10 | Good start, needs more detail |
| 10. Testing | 6/10 | Too high-level, no coverage targets |
| 11. Implementation Roadmap | 8/10 | Clear phases ✅ |
| 12. Future Enhancements | 9/10 | Good forward thinking ✅ |
| 13. Open Decisions | 5/10 | Some aren't really open |
| 14. Appendices | 7/10 | Helpful examples ✅ |
| **Missing Sections** | **0/10** | No performance, error handling, UI/UX |

**Average: 7.3/10**

---

## 🎯 Bottom Line

### This is a **strong foundation** for implementation, but needs:

1. **Complete the schema** (rowVersion, StageHistory, User/Persona)
2. **Clarify binding path** mechanism with validation strategy
3. **Add performance section** with caching, indexes, targets
4. **Add error handling section** with specific failure scenarios
5. **Add UI/UX section** for developer guidance
6. **Clean up "Open Decisions"** to only truly open items
7. **Expand testing section** with coverage targets and types

### What makes it better than the others:

✅ **Most comprehensive** - covers all major concerns
✅ **Migration plan** addresses collision handling
✅ **Concurrency strategy** with optimistic locking
✅ **Testing strategy** included
✅ **API design** explicit

### What would make it **production-ready** (9/10):

Add the 7 items above + one round of technical review by:
- Database architect (schema completeness)
- Frontend developer (UI/UX feasibility)
- DevOps engineer (migration safety, rollback)

**Recommendation**: This is **90% of the way there**. Fix the schema gaps, add performance/error handling sections, and you're ready to implement.

---

## Priority Fixes (In Order)

### Critical (Must Fix Before Implementation)
1. Add `rowVersion` to all entity schemas (prevents data corruption)
2. Define `StageHistory` schema (audit compliance requirement)
3. Add User/Persona relationship model (security foundation)
4. Specify binding path validation mechanism (type safety)

### High Priority (Fix During Phase A)
5. Add performance/scalability section with targets
6. Add error handling strategy section
7. Expand testing section with coverage targets

### Medium Priority (Can Address in Phase B)
8. Add UI/UX guidelines document
9. Clean up "Open Decisions" section
10. Clarify calculated metrics evaluation strategy

### Nice to Have (Polish)
11. Add sequence diagrams for key workflows
12. Add API response examples for all endpoints
13. Add troubleshooting guide for common issues
