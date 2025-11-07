# Documentation Cleanup & Simplification Plan

**Created:** 2025-10-05
**Status:** Proposed - Ready for Review
**Purpose:** Consolidate scattered documentation into a clear, maintainable structure

---

## Executive Summary

The project currently has **significant documentation sprawl** with duplicates, outdated files, and confusing organization across multiple locations. This plan consolidates everything into a clear, industry-standard structure based on the `docs/` folder already started.

**Key Issues:**
- ❌ Duplicate files (root vs tech-triage-platform)
- ❌ 7+ outdated planning/review documents at root level
- ❌ Overlapping content between files
- ❌ No clear documentation index

**Solution:**
- ✅ Consolidate all docs into `tech-triage-platform/docs/`
- ✅ Archive outdated materials to `old_files/`
- ✅ Create clear navigation and index
- ✅ Follow industry-standard docs structure

---

## Current Documentation Inventory

### Root Level Files (22 markdown files)
```
/
├── CLAUDE.md                          (109 lines) ⚠️ DUPLICATE - outdated
├── MVP_status.md                      (59 lines)  ⚠️ DUPLICATE - outdated
├── ENVIRONMENT_MODES.md               (144 lines) ✓ Keep, relocate
├── claudeDocPlan.md                   (1078 lines) ✓ Good reference, relocate
├── codexDocPlan.md                    (302 lines) ❌ Redundant with claudeDocPlan
├── claudeFormCreator.md               (858 lines) ❌ Appears outdated
├── claudeAdminPageOptions.md          (437 lines) ❌ Appears outdated
├── codeMasterReport.md                (1049 lines) ❌ Old code review
├── codex-review.md                    (739 lines) ❌ Another old review
├── formBuilderImplementationPlan.md   (815 lines) ✓ Active plan, relocate
├── formBuilderScopeQandA.md           (600 lines) ✓ Active reference, relocate
└── [PDFs and other files...]
```

### tech-triage-platform/ Files (8+ markdown files)
```
tech-triage-platform/
├── CLAUDE.md                          (548 lines) ✓ CANONICAL VERSION
├── MVP_status.md                      (80 lines)  ✓ CURRENT VERSION
├── README.md                          (659 lines) ✓ Main README
├── AZURE_HANDOVER.md                  (167 lines) ✓ Deployment guide
├── TECHNOLOGY_OVERVIEW_NON_TECHNICAL.md (476 lines) ⚠️ Overlaps docs/overview.md
├── STATUS-2025-09-25.md               (87 lines)  ❌ Outdated (Sept 25)
├── prisma_readme.md                   (136 lines) ✓ Prisma-specific docs
├── codexResponseToCodeReview.md       (35 lines)  ❌ Response to old review
└── docs/
    ├── overview.md                    (59 lines)  ✓ Plain English overview
    ├── technical/architecture.md      (126 lines) ✓ Technical deep-dive
    ├── process/docs-maintenance.md    ✓ Maintenance guide
    └── adrs/0000-template.md          ✓ ADR template
```

### Old Files Archive
```
old_files/
├── DATA_VALIDATION_FIX_PLAN.md
├── codeMasterReport09-23-09-14.md
├── final-plan.md
├── holistic-code-guardian-review-2025-09-25.md
├── plan.md, plan_agent.md, planner.md
├── playwright-mcp-wsl2-fix-guide.md
└── questions_broken_out.txt
```

---

## Identified Problems

### 1. Duplicate Files (Root vs tech-triage-platform)

| File | Root Version | tech-triage-platform Version | Issue |
|------|-------------|------------------------------|-------|
| CLAUDE.md | 109 lines (basic) | 548 lines (comprehensive) | Root is **outdated** |
| MVP_status.md | 59 lines (Oct 1) | 80 lines (Oct 3) | Root is **outdated** |

**Impact:** Confusion about which file is authoritative, risk of updating wrong version.

### 2. Too Many Planning Documents at Root

Seven planning/review documents scattered at root level:
- `claudeDocPlan.md` - Comprehensive docs strategy (good, but misplaced)
- `codexDocPlan.md` - Alternative/redundant docs plan
- `claudeFormCreator.md` - Old form creator planning
- `claudeAdminPageOptions.md` - Old admin options planning
- `codeMasterReport.md` - Code review from unknown date
- `codex-review.md` - Another code review
- `formBuilderImplementationPlan.md` - **ACTIVE** - needs better location
- `formBuilderScopeQandA.md` - **ACTIVE** - needs better location

**Impact:** Cluttered root directory, unclear which docs are current/relevant.

### 3. Overlapping Content

- `TECHNOLOGY_OVERVIEW_NON_TECHNICAL.md` (476 lines) vs `docs/overview.md` (59 lines)
  - Both provide project overviews for non-technical audiences
  - Content should be consolidated

### 4. Outdated Status Files

- `STATUS-2025-09-25.md` - Status from September 25
- Current status is in `MVP_status.md` (updated Oct 3)

**Impact:** Risk of referencing outdated information.

### 5. Excellent Foundation Not Fully Utilized

The `docs/` folder structure already exists with good organization:
```
docs/
├── overview.md              # Plain English
├── technical/architecture.md # Technical deep-dive
├── process/docs-maintenance.md
└── adrs/0000-template.md
```

**But:** Most documentation hasn't been moved into this structure yet.

---

## Proposed Cleanup Actions

### Phase 1: Remove Duplicates

**Action:** Keep tech-triage-platform versions as canonical, delete root duplicates

| Action | File | Reason |
|--------|------|--------|
| **DELETE** | `/CLAUDE.md` | Outdated; tech-triage-platform/CLAUDE.md is canonical |
| **DELETE** | `/MVP_status.md` | Outdated; tech-triage-platform/MVP_status.md is current |

### Phase 2: Archive Outdated Materials

**Action:** Move to `old_files/archived_docs_2025-10-05/`

| Action | File | Reason |
|--------|------|--------|
| **MOVE** | `/codeMasterReport.md` | Old code review |
| **MOVE** | `/codex-review.md` | Another old code review |
| **MOVE** | `/codexDocPlan.md` | Redundant with claudeDocPlan.md |
| **MOVE** | `/claudeFormCreator.md` | Appears outdated (check date) |
| **MOVE** | `/claudeAdminPageOptions.md` | Appears outdated (check date) |
| **MOVE** | `tech-triage-platform/STATUS-2025-09-25.md` | Outdated status from Sept 25 |
| **MOVE** | `tech-triage-platform/codexResponseToCodeReview.md` | Response to old review |

### Phase 3: Organize Active Documentation

**Action:** Move active docs into proper structure under `tech-triage-platform/docs/`

#### Create New Directory Structure
```bash
tech-triage-platform/docs/
├── planning/        # NEW - Implementation plans
├── deployment/      # NEW - Deployment guides
└── [existing dirs]
```

#### File Relocations

| Action | From | To | Reason |
|--------|------|-----|--------|
| **MOVE** | `/ENVIRONMENT_MODES.md` | `tech-triage-platform/docs/deployment/environment-modes.md` | Deployment-related |
| **MOVE** | `/formBuilderImplementationPlan.md` | `tech-triage-platform/docs/planning/form-builder-implementation.md` | Active planning doc |
| **MOVE** | `/formBuilderScopeQandA.md` | `tech-triage-platform/docs/planning/form-builder-scope-qa.md` | Active reference doc |
| **MOVE** | `/claudeDocPlan.md` | `tech-triage-platform/docs/process/documentation-strategy.md` | Good reference material |
| **CONSOLIDATE** | `tech-triage-platform/TECHNOLOGY_OVERVIEW_NON_TECHNICAL.md` | Into `docs/overview.md` then DELETE | Eliminate duplication |

### Phase 4: Enhance Navigation & Structure

#### 4.1 Update Main README
**File:** `tech-triage-platform/README.md`

**Action:** Add clear "Documentation" section:
```markdown
## Documentation

### Quick Links
- [CLAUDE.md](./CLAUDE.md) - AI assistant context for development
- [Project Overview](./docs/overview.md) - Plain English project description
- [Technical Architecture](./docs/technical/architecture.md) - System design & decisions
- [Planning Documents](./docs/planning/) - Implementation plans & roadmaps
- [Deployment Guides](./docs/deployment/) - Environment setup & deployment
- [Process & Maintenance](./docs/process/) - Development workflows & standards
- [ADRs](./docs/adrs/) - Architecture Decision Records

### For Developers
- Start with [CLAUDE.md](./CLAUDE.md) for project context
- Review [Technical Architecture](./docs/technical/architecture.md) for system design
- Check [Planning](./docs/planning/) for current implementation status

### For Stakeholders
- Start with [Project Overview](./docs/overview.md) for high-level description
- Review [MVP Status](./MVP_status.md) for current progress
```

#### 4.2 Create Documentation Index
**File:** `tech-triage-platform/docs/README.md` (NEW)

**Content:** Master index of all documentation with descriptions:
```markdown
# Documentation Index

## Overview
- [Project Overview](./overview.md) - Plain English project description for all audiences

## Technical Documentation
- [System Architecture](./technical/architecture.md) - Technical design, state, and roadmap

## Planning & Roadmaps
- [Form Builder Implementation Plan](./planning/form-builder-implementation.md) - Sequential MVP implementation plan
- [Form Builder Scope Q&A](./planning/form-builder-scope-qa.md) - Feature decisions and scope

## Deployment
- [Environment Modes](./deployment/environment-modes.md) - Local, Docker, and Azure deployment modes
- [Azure Handover](../AZURE_HANDOVER.md) - Azure deployment reference

## Process & Maintenance
- [Documentation Maintenance](./process/docs-maintenance.md) - How to keep docs updated
- [Documentation Strategy](./process/documentation-strategy.md) - Overall docs approach

## Architecture Decisions
- [ADR Template](./adrs/0000-template.md) - Template for new ADRs
- *Future ADRs will be added here*

## Database
- [Prisma README](../prisma_readme.md) - Prisma-specific documentation
```

#### 4.3 Create Missing Deployment Docs
Based on `architecture.md` references, create:
- `docs/deployment/docker-setup.md` - Docker environment setup
- `docs/deployment/production-deployment.md` - Azure production deployment

---

## Final Directory Structure

### Root Level
```
/
├── tech-triage-platform/          # ✓ All project documentation here
├── triage-design-mockup/          # ✓ Separate design prototype
├── source_material/               # ✓ Original PDFs and references
├── old_files/
│   ├── archived_docs_2025-10-05/ # ✓ Newly archived docs
│   └── [existing archives]
├── .github/                       # ✓ GitHub configs
└── styles/                        # ✓ Branding guides
```

### tech-triage-platform/ (Organized)
```
tech-triage-platform/
├── README.md                      # ✓ Entry point with clear doc links
├── CLAUDE.md                      # ✓ AI assistant context
├── MVP_status.md                  # ✓ Current MVP progress
├── AZURE_HANDOVER.md              # ✓ Azure deployment reference
├── prisma_readme.md               # ✓ Database-specific docs
│
├── docs/                          # ✓ Structured documentation
│   ├── README.md                  # ✓ Documentation index (NEW)
│   │
│   ├── overview.md                # ✓ Plain English overview
│   │
│   ├── technical/
│   │   └── architecture.md        # ✓ Technical deep-dive
│   │
│   ├── planning/                  # ✓ Planning documents (NEW)
│   │   ├── form-builder-implementation.md
│   │   └── form-builder-scope-qa.md
│   │
│   ├── deployment/                # ✓ Deployment guides (NEW)
│   │   ├── environment-modes.md
│   │   ├── docker-setup.md        # (TO CREATE)
│   │   └── production-deployment.md # (TO CREATE)
│   │
│   ├── process/                   # ✓ Process docs
│   │   ├── docs-maintenance.md
│   │   └── documentation-strategy.md
│   │
│   └── adrs/                      # ✓ Architecture decisions
│       └── 0000-template.md
│
├── src/, prisma/, scripts/, etc.  # ✓ Code and configs
└── [other project files]
```

---

## Benefits of This Structure

### ✅ Single Source of Truth
- All documentation lives in `tech-triage-platform/docs/`
- No more duplicate files with conflicting information
- Clear canonical location for every document type

### ✅ Industry Standard
- Follows established open-source project patterns
- New developers immediately understand structure
- Easy to navigate with clear folder purposes

### ✅ Clear Organization by Audience
```
overview.md           → Everyone (Plain English)
technical/            → Senior developers
planning/             → Development team
deployment/           → Ops/DevOps
process/              → Contributors
adrs/                 → Decision makers & future maintainers
```

### ✅ Easier Maintenance
- Clear triggers for when to update each doc
- Documentation maintenance guide already in place
- No confusion about where to add new docs

### ✅ Better Navigation
- README points to all documentation
- docs/README.md provides comprehensive index
- Each document has clear purpose and audience

### ✅ Preserved History
- Outdated docs archived, not deleted
- Easy to reference historical decisions
- Audit trail maintained

---

## Implementation Checklist

### Phase 1: Remove Duplicates
- [ ] Delete `/CLAUDE.md`
- [ ] Delete `/MVP_status.md`

### Phase 2: Archive Outdated Materials
- [ ] Create `old_files/archived_docs_2025-10-05/`
- [ ] Move 7 outdated docs to archive (see Phase 2 table)
- [ ] Add README in archive explaining what's there and why

### Phase 3: Organize Active Documentation
- [ ] Create `tech-triage-platform/docs/planning/`
- [ ] Create `tech-triage-platform/docs/deployment/`
- [ ] Move 4 active docs (see Phase 3 table)
- [ ] Consolidate TECHNOLOGY_OVERVIEW_NON_TECHNICAL.md into docs/overview.md
- [ ] Delete TECHNOLOGY_OVERVIEW_NON_TECHNICAL.md after consolidation

### Phase 4: Enhance Navigation
- [ ] Update tech-triage-platform/README.md with Documentation section
- [ ] Create tech-triage-platform/docs/README.md (index)
- [ ] Create docs/deployment/docker-setup.md
- [ ] Create docs/deployment/production-deployment.md

### Phase 5: Verification
- [ ] All links in README work
- [ ] All cross-references between docs work
- [ ] No broken links remain
- [ ] Archive directory has README explaining contents

---

## Migration Notes

### Git Operations
All file moves should use `git mv` to preserve history:
```bash
git mv ENVIRONMENT_MODES.md tech-triage-platform/docs/deployment/environment-modes.md
```

### Link Updates
After moving files, update any cross-references:
- Update relative links in moved documents
- Update links in README files
- Check for links in code comments

### Commit Strategy
Suggested commit sequence:
1. `git commit -m "docs: Archive outdated documentation to old_files/"`
2. `git commit -m "docs: Remove duplicate files (root CLAUDE.md and MVP_status.md)"`
3. `git commit -m "docs: Reorganize active docs into docs/ structure"`
4. `git commit -m "docs: Add documentation index and navigation"`
5. `git commit -m "docs: Create missing deployment documentation"`

---

## Questions for Review

Before executing this plan, please confirm:

1. **Archival Decisions:** Are you comfortable archiving the files listed in Phase 2?
2. **TECHNOLOGY_OVERVIEW_NON_TECHNICAL.md:** Should we consolidate this into docs/overview.md or keep it separate?
3. **Deployment Docs:** Priority for creating docker-setup.md and production-deployment.md?
4. **ADRs:** Should we create initial ADRs for past decisions while we're cleaning up?
5. **Timeline:** When should this cleanup be executed? (Suggest: before next major development phase)

---

## Success Criteria

This cleanup will be successful when:
- ✅ No duplicate documentation exists
- ✅ All active docs are in `tech-triage-platform/docs/` with clear structure
- ✅ README provides clear navigation to all documentation
- ✅ Outdated materials are archived with context
- ✅ New developers can find docs in <2 minutes
- ✅ Documentation maintenance guide is being followed

---

**Next Steps:** Review this plan, answer questions above, then execute phases sequentially.

**Estimated Effort:** 3-4 hours for full cleanup and reorganization.

**Risk:** Low - All changes are documentation-only, no code impact.
