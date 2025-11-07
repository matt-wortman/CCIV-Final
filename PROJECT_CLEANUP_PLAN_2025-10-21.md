# Project Documentation Cleanup & Organization Plan
**Date:** 2025-10-21

## Current Situation Analysis

### The Good News ✅
- **Code is working:** 86 TypeScript files, functional dynamic form system
- **Git practices are solid:** Proper submodule structure, good .gitignore
- **Active development:** Recent commits show bug fixes and improvements
- **Tests exist:** Database seeding, validation, performance tests

### The Problem ❌
- **90+ documentation files** scattered across two repository levels
- **Duplicate information:** Multiple CLAUDE.md, README.md, STATUS files
- **No single source of truth** for project status
- **Outdated documentation:** Files reference old architecture, removed features
- **Unclear what's current** vs historical/archived
- **Agent confusion:** Coding agents don't know which docs are authoritative

## Documentation Inventory

### Parent Repository (/home/matt/code_projects/Junk/)
**Root-level files (4):**
- README.md (2,464 lines) - Says code is in submodule
- REBUILD_PROJECT_NOTES.md (502 lines) - Proposal to rebuild with SurveyJS
- BRUTAL_PROJECT_CRITIQUE.md (1,010 lines) - Harsh critique of current approach
- CRITIQUE_CORRECTIONS.md (169 lines) - Corrections to critique

**docs/ directory (23+ files):**
- Multiple architecture proposals (FINAL-synthesis, FINAL-synthesis-v2, etc.)
- Multiple critiques and meta-analyses
- ADRs, guides, technical docs
- Planning documents for features

**Other directories:**
- agent-dialogue/ - Agent conversation tracking system
- agent-specs/ - Agent specification documents
- scripts/, src/, styles/ - Unclear purpose (duplicate of submodule?)

### Submodule (/tech-triage-platform/)
**Root-level files (10):**
- README.md (659 lines) - Main project documentation
- CLAUDE.md (548 lines) - AI agent instructions
- AZURE_HANDOVER.md, MVP_status.md, PRODUCTION_CODE_REVIEW.md, etc.

**docs/ directory (67+ files):**
- Release notes
- Architecture documentation
- Code reviews
- Deployment runbooks
- Guides
- Multiple archived versions in docs/.archive/

## Root Cause Analysis

### Why This Happened
1. **Iterative development** - Multiple architecture proposals and pivots
2. **AI-assisted development** - Agents created many planning documents
3. **Two-repo structure** - Parent for planning, submodule for code
4. **No cleanup policy** - Old docs never archived when superseded
5. **Multiple "final" versions** - architecture-FINAL-synthesis.md vs v2 vs critique

### The Core Issue
**No clear "source of truth" hierarchy** - When agents ask "what's the current status?", there are 10+ files that could answer, all with slightly different information.

## Proposed Solution: Three-Tier Documentation Structure

### Tier 1: Current Reality (What IS)
**Single source of truth files - Always kept up-to-date:**

1. **PROJECT_STATUS.md** (NEW master dashboard, created in `tech-triage-platform/docs/` by renaming the existing `STATUS_LOG.md` or replacing its content)
   - ✅ What's working now (deployed features)
   - 🚧 What's in progress (current sprint)
   - 📋 What's next (prioritized backlog)
   - 📊 Key metrics (code stats, deployment info)
   - 🔗 Quick links to Tier 2 docs

2. **README.md** (UPDATE - Technical quickstart)
   - Quick start commands
   - Tech stack
   - Current feature list
   - Link to PROJECT_STATUS.md

3. **CLAUDE.md** (UPDATE - AI agent instructions)
   - Current architecture only
   - Current development practices
   - Link to PROJECT_STATUS.md
   - Remove outdated sections

### Tier 2: Implementation Guides (How TO)
**Focused, task-oriented documentation:**

- docs/guides/deployment-guide.md (ONE deployment guide, not 3)
- docs/guides/development-setup.md
- docs/guides/testing-guide.md
- docs/runbooks/ (operational procedures)
- docs/architecture/ (current architecture only)

### Tier 3: History & Context (Why WE)
**Archived but preserved for reference:**

- docs/archive/planning/ (proposals, critiques, alternatives considered)
- docs/archive/legacy/ (old documentation from previous phases)
- docs/adrs/ (Architecture Decision Records - why we chose X over Y)
- docs/release-notes/ (historical releases)
- Parent repository `docs/` becomes archive-only, pointing readers to the submodule for authoritative docs

## Detailed Cleanup Plan

### Phase 1: Create Master Dashboard ⏱️ 30 min
**Action:** Convert `tech-triage-platform/docs/STATUS_LOG.md` into `PROJECT_STATUS.md` (rename file or replace contents, leaving a short redirect note if necessary)

**Content:**
```markdown
# Tech Triage Platform - Project Status Dashboard
Last Updated: 2025-10-21

## ✅ What's Working (Production Features)
- Dynamic form system (database-driven)
- Form builder interface
- PDF export functionality
- Azure deployment (tech-triage-app.azurewebsites.net)
- PostgreSQL database with Prisma ORM

## 🚧 Current Focus
[List active development tasks]

## 📋 Backlog (Prioritized)
[Next features to implement]

## 📊 Key Metrics
- Code: 86 TypeScript files
- Documentation: [X active files, Y archived]
- Tests: [test count and coverage]
- Deployment: Azure App Service
- Database: Azure PostgreSQL Flexible Server

## 🔗 Quick Links
- [README.md](README.md) - Setup & quick start
- [docs/guides/](docs/guides/) - How-to guides
- [docs/architecture/](docs/architecture/) - System architecture
- [CHANGELOG.md](CHANGELOG.md) - Version history
```

### Phase 2: Archive Parent-Level Planning Docs ⏱️ 30 min
**Actions:**

1. **Create archive directory:**
   ```
   mkdir -p ../docs/archive/planning-2025
   ```

2. **Move planning/critique documents:**
   ```
   mv ../REBUILD_PROJECT_NOTES.md ../docs/archive/planning-2025/
   mv ../BRUTAL_PROJECT_CRITIQUE.md ../docs/archive/planning-2025/
   mv ../CRITIQUE_CORRECTIONS.md ../docs/archive/planning-2025/
   mv ../docs/architecture-FINAL-*.md ../docs/archive/planning-2025/
   mv ../docs/architecture-proposal-*.md ../docs/archive/planning-2025/
   mv ../docs/architecture-evaluation-*.md ../docs/archive/planning-2025/
   ```

3. **Create archive index:**
   ```
   ../docs/archive/planning-2025/README.md
   ```
   Content: "These are architectural proposals and critiques from Oct 2025. The final architecture is documented in /tech-triage-platform/docs/architecture/"

### Phase 3: Consolidate Duplicate Documentation ⏱️ 45 min
**Actions:**

1. **README files:**
   - KEEP: tech-triage-platform/README.md (update for accuracy)
   - UPDATE: ../README.md (keep brief, point to submodule)

2. **CLAUDE.md files:**
   - KEEP: tech-triage-platform/CLAUDE.md (update)
   - ARCHIVE: docs/archive/root-legacy/CLAUDE.md (already archived)

3. **STATUS files:**
   - RENAME: STATUS_LOG.md → PROJECT_STATUS.md (or keep file name and add redirect section)
   - ARCHIVE: STATUS-2025-09-25.md → docs/archive/

4. **Deployment docs:**
   - CONSOLIDATE: Multiple deployment runbooks into ONE docs/guides/deployment-guide.md
   - ARCHIVE: Old versions to docs/archive/runbooks/

5. **Plan files:**
   - CONSOLIDATE: Multiple "master plans" into PROJECT_STATUS.md roadmap
   - ARCHIVE: Individual plan files to docs/archive/planning-2025/

### Phase 4: Update Active Documentation ⏱️ 45 min
**Actions:**

1. **Update README.md:**
   - Remove references to deleted static form
   - Update feature list to match current reality
   - Add link to PROJECT_STATUS.md at top
   - Verify all commands are current

2. **Update CLAUDE.md:**
   - Remove "static form frozen" sections (it's deleted)
   - Update to current architecture only
   - Remove outdated environment mode instructions
   - Add PROJECT_STATUS.md as primary reference
   - Keep evidence-based coding protocol

3. **Update docs/README.md:**
   ```markdown
   # Documentation Structure

   ## Start Here
   - [PROJECT_STATUS.md](../PROJECT_STATUS.md) - Current status & roadmap

   ## Implementation Guides
   - [guides/](guides/) - How-to documentation
   - [architecture/](architecture/) - System architecture
   - [runbooks/](runbooks/) - Operational procedures

   ## Reference
   - [release-notes/](release-notes/) - Version history
   - [reviews/](reviews/) - Code reviews
   - [archive/](archive/) - Historical documentation
   ```

### Phase 5: Create Documentation Rules ⏱️ 20 min
**Action:** Create docs/CONTRIBUTING.md

**Content:**
```markdown
# Documentation Contribution Guidelines

## The Documentation Hierarchy

1. **PROJECT_STATUS.md** - Single source of truth for "what is, what's next"
2. **README.md** - Technical quick start
3. **docs/guides/** - How-to documentation
4. **docs/archive/** - Historical context

## Rules to Prevent Documentation Sprawl

### Before Creating a New .md File:
1. ✅ Check if existing file can be updated instead
2. ✅ Ask: "Will this be updated regularly?" → Use PROJECT_STATUS.md
3. ✅ Ask: "Is this historical?" → Put in docs/archive/
4. ✅ Ask: "Is this a guide?" → Put in docs/guides/

### Status Updates:
- ✅ Update PROJECT_STATUS.md
- ❌ Don't create STATUS-[DATE].md files

### Completed Features:
- ✅ Update README.md feature list
- ✅ Update PROJECT_STATUS.md
- ✅ Archive planning docs to docs/archive/

### New Features/Ideas:
- ✅ Add to PROJECT_STATUS.md backlog
- ❌ Don't create separate PLAN files unless multi-week effort

### Architecture Decisions:
- ✅ Document in docs/adrs/NNNN-decision-name.md
- ✅ Update docs/architecture/ with final design
- ✅ Archive proposals to docs/archive/planning/

### Historical Documentation:
- ✅ Move to docs/archive/[category]/
- ✅ Add context in archive README
- ❌ Don't delete (Git history is not enough)
```

### Phase 6: Clean Up Unclear Directories ⏱️ 15 min
**Actions:**

1. **Investigate parent repo directories:**
   - Check if ../src/, ../scripts/, ../styles/ are duplicates
   - If duplicates: archive or remove
   - If unique: document purpose or move to appropriate location

2. **agent-dialogue/ and agent-specs/:**
   - Determine if still in use
   - If yes: Document purpose in parent README
   - If no: Archive to docs/archive/

3. **Remove old log files:**
   - ../next-dev.log, ../next-start*.log → DELETE (old logs)

## Expected Outcomes

### Before Cleanup
```
📁 Project Structure:
├── 90+ documentation files
├── No clear entry point
├── Duplicate information in 5+ places
├── Can't tell what's current vs historical
└── Agents confused about source of truth
```

### After Cleanup
```
📁 Project Structure:
├── 📊 PROJECT_STATUS.md ← START HERE
├── 📖 README.md ← Quick start
├── 🤖 CLAUDE.md ← AI instructions
├── 📝 CHANGELOG.md ← Version history
├── docs/
│   ├── guides/ ← How-to (10-15 files)
│   ├── architecture/ ← Current design (5-8 files)
│   ├── runbooks/ ← Operations (3-5 files)
│   └── archive/ ← History (60+ files, organized)
└── ✨ Clear hierarchy, easy to navigate
```

### Metrics
- **Active docs:** ~30 files (down from 90+)
- **Archived:** ~60 files (preserved, organized)
- **Duplicates eliminated:** ~10 files
- **Single source of truth:** PROJECT_STATUS.md
- **Time to find info:** < 2 minutes (vs 10+ minutes)

## Implementation Checklist

### Phase 1: Master Dashboard (30 min)
- [ ] Create PROJECT_STATUS.md with current reality
- [ ] Populate with actual deployed features
- [ ] Add current roadmap
- [ ] Test: Can I answer "what's done?" in 30 seconds?

### Phase 2: Archive Planning Docs (30 min)
- [ ] Create ../docs/archive/planning-2025/
- [ ] Move REBUILD_PROJECT_NOTES.md
- [ ] Move BRUTAL_PROJECT_CRITIQUE.md
- [ ] Move CRITIQUE_CORRECTIONS.md
- [ ] Move all architecture-FINAL-*.md files
- [ ] Create archive README explaining context

### Phase 3: Consolidate Duplicates (45 min)
- [ ] Update parent README.md (brief, points to submodule)
- [ ] Archive duplicate STATUS files
- [ ] Consolidate deployment docs into ONE guide
- [ ] Consolidate plan files into PROJECT_STATUS.md
- [ ] Archive old versions

### Phase 4: Update Active Docs (45 min)
- [ ] Update README.md (remove static form references)
- [ ] Update CLAUDE.md (current architecture only)
- [ ] Create CHANGELOG.md (consolidate release notes)
- [ ] Update docs/README.md (new structure)
- [ ] Verify all links work

### Phase 5: Documentation Rules (20 min)
- [ ] Create docs/CONTRIBUTING.md
- [ ] Add documentation workflow rules
- [ ] Add examples of what goes where
- [ ] Link from PROJECT_STATUS.md

### Phase 6: Clean Unclear Directories (15 min)
- [ ] Check ../src/, ../scripts/ for duplicates
- [ ] Document or archive agent-dialogue/, agent-specs/
- [ ] Delete old log files
- [ ] Update parent .gitignore if needed

### Phase 7: Validation (15 min)
- [ ] Test: Can I find deployment instructions in < 2 min?
- [ ] Test: Can I understand current status in < 1 min?
- [ ] Test: Can I find "what's next" in < 30 sec?
- [ ] Ask AI agent to find project status (should use PROJECT_STATUS.md)
- [ ] Review with fresh eyes: Is hierarchy clear?

## Total Estimated Time
**3 hours** (can be split across multiple sessions)

## Risk Assessment
- **Risk Level:** LOW
- **Why:** We're archiving, not deleting
- **Rollback:** Git history preserves everything
- **Testing:** Can validate each phase before proceeding

## Success Criteria
1. ✅ One file answers "what's the current status?" (PROJECT_STATUS.md)
2. ✅ AI agents consistently reference single source of truth
3. ✅ New team member can understand project in < 15 minutes
4. ✅ Active docs are accurate (match reality)
5. ✅ Historical context is preserved (in archive/)
6. ✅ Clear rules prevent future sprawl (CONTRIBUTING.md)

## Next Steps
1. Review this plan
2. Start with Phase 1 (create PROJECT_STATUS.md)
3. Proceed phase-by-phase
4. Validate after each phase
5. Celebrate organized documentation! 🎉
