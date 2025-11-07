# GitHub Repository Cleanup Plan (REVISED)
**Date:** October 7, 2025
**Revision:** 2 - Keep production code, remove only internal working files
**Goal:** Remove internal scratch/working files from GitHub while keeping all production code and documentation

---

## Executive Summary

Remove **only internal working files** (drafts, screenshots, scratch notes) from GitHub tracking. **Keep all production code and documentation** so other developers can clone and run the project.

**Key Change from Previous Version:** Production code (`tech-triage-platform`) STAYS on GitHub!

**Safety:** No files will be deleted from local disk. Everything stays available for your work.

---

## What You Wanted (Clarified)

✅ **KEEP on GitHub** - So others can clone and run the project:
- Production code (`tech-triage-platform/`)
- Documentation (`CLAUDE.md`, `docs/`)
- Source materials (original requirements, designs)
- Everything needed to set up and run the application

❌ **REMOVE from GitHub** - Internal scratch/temporary files:
- AI artifacts (screenshots from sessions)
- Experimental projects (`triage-design-mockup/`)
- Planning/session documents (claude*.md, codex*.md, etc.)
- Working draft PDFs
- Log files
- "Scratch pad" files - anything that's just our internal notes

---

## Current State Analysis

### Files Currently Tracked in Git (18 total)

#### ✅ KEEP on GitHub (13 essential files)

**Production Code:**
1. `tech-triage-platform` - **Full production application** (as submodule)
2. `.gitmodules` - Submodule configuration

**Documentation:**
3. `.github/PULL_REQUEST_TEMPLATE.md` - GitHub workflow template
4. `.gitignore` - Git ignore rules (already configured)
5. `CLAUDE.md` - Project instructions for developers
6. `docs/adrs/0000-template.md` - Architecture decision record template
7. `docs/overview.md` - Project overview
8. `docs/process/docs-maintenance.md` - Documentation process
9. `docs/technical/architecture.md` - Technical architecture docs

**Source Materials:**
10. `source_material/Tech Triage Design System.jpg` - Original design reference
11. `source_material/Tech Triage Landing Page Head-on View.jpg` - Design reference
12. `source_material/Tech Triage Landing Page.jpg` - Design reference
13. `source_material/Triage.pdf` - Original requirements document

**Total: 13 files to KEEP** ✅

---

#### ❌ REMOVE from GitHub (5 internal working files)

**Working Draft PDFs:**
14. `2cchmc-technology-triage-form-draft-20251002T131157.pdf` - Session draft
15. `cchmc-technology-triage-form-draft-20251002T131157.pdf` - Duplicate draft
16. `invention disclosure d21-0030.pdf` - Working document

**Session Screenshots:**
17. `Screenshot 2025-10-02 092247.png` - Session screenshot
18. `Screenshot 2025-10-04 102057.png` - Session screenshot

**Total: 5 files to REMOVE** ❌

---

## Files on Local Disk (Already in .gitignore)

These files are already excluded by `.gitignore` and won't be added to GitHub:

### Already Protected (Stay Local Only)
**Planning Documents:**
- `DOCUMENTATION_CLEANUP_PLAN.md`
- `ENVIRONMENT_MODES.md`
- `MVP_status.md`
- `claudeAdminPageOptions.md`
- `claudeDocPlan.md`
- `claudeFormCreator.md`
- `codeMasterReport.md`
- `codex-review.md`
- `codexDocPlan.md`
- `formBuilderImplementationPlan.md`
- `formBuilderScopeQandA.md`

**Log Files:**
- `next-dev.log`
- `next-start-3001.log`
- `next-start.log`

**Other Working Files:**
- `TTO roles in medical centers.pdf`

### Directories Already Protected
- `.playwright-mcp/` - AI browser automation (45+ screenshots)
- `.claude/` - Claude AI settings
- `.superdesign/` - Design iteration files
- `.vscode/` - IDE settings
- `agent-specs/` - AI agent specifications
- `old_files/` - Archived working files
- `styles/` - Working style guides
- `triage-design-mockup/` - Experimental design project (40+ files)

---

## Detailed Action Plan

### Step 1: Remove 5 Working Files from Git Tracking

**Action:** Remove files from Git index while keeping them on local disk

**Commands:**
```bash
# Remove working draft PDFs
git rm --cached "2cchmc-technology-triage-form-draft-20251002T131157.pdf"
git rm --cached "cchmc-technology-triage-form-draft-20251002T131157.pdf"
git rm --cached "invention disclosure d21-0030.pdf"

# Remove session screenshots
git rm --cached "Screenshot 2025-10-02 092247.png"
git rm --cached "Screenshot 2025-10-04 102057.png"
```

**Impact:**
- Removes 5 files from Git tracking
- **Files remain on your local disk** (in current location)
- Git will no longer track changes to these files
- They won't appear on GitHub

---

### Step 2: Commit Changes

**Action:** Create a commit documenting the cleanup

**Commit Message:**
```
chore: Remove internal working files from repository

Remove session drafts and screenshots from Git tracking. Keep all
production code and documentation needed by other developers.

## Files Removed from GitHub Tracking (5 items)

### Working Draft PDFs
- 2cchmc-technology-triage-form-draft-20251002T131157.pdf
- cchmc-technology-triage-form-draft-20251002T131157.pdf
- invention disclosure d21-0030.pdf

### Session Screenshots
- Screenshot 2025-10-02 092247.png
- Screenshot 2025-10-04 102057.png

## Files Retained on GitHub (13 items)

### Production Code
- tech-triage-platform/ (full application code as submodule)
- .gitmodules (submodule configuration)

### Documentation
- CLAUDE.md (project instructions)
- docs/ (architecture, process, technical docs)
- .github/ (GitHub templates)

### Source Materials
- source_material/ (original requirements and designs)

## Impact

- GitHub shows clean, professional repository
- Other developers can clone and run the project
- All internal working files remain on local disk
- Production code fully accessible on GitHub

Files removed from tracking but remain locally for development.
```

**Command:**
```bash
git commit -m "<message above>"
```

---

### Step 3: Push to GitHub

**Action:** Push the commit to update GitHub repository

**Command:**
```bash
git push origin master
```

**Impact:**
- Updates GitHub repository
- Removes 5 working files from public view
- Keeps production code visible and accessible
- GitHub shows clean, professional repository

---

## Final Repository Structure

### On GitHub (Public View - What Others See)
```
junk-triage/
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
├── .gitignore
├── .gitmodules
├── CLAUDE.md
├── docs/
│   ├── adrs/
│   │   └── 0000-template.md
│   ├── overview.md
│   ├── process/
│   │   └── docs-maintenance.md
│   └── technical/
│       └── architecture.md
├── source_material/
│   ├── Tech Triage Design System.jpg
│   ├── Tech Triage Landing Page Head-on View.jpg
│   ├── Tech Triage Landing Page.jpg
│   └── Triage.pdf
└── tech-triage-platform @ 131b3b5 (submodule - clickable link)

Total: 13 essential files
```

**When clicked:** `tech-triage-platform` links to full production code at:
`https://github.com/matt-wortman/junk-triage/tree/phase3-database-driven-form`

---

### On Your Local Disk (Complete Development Environment)
```
/home/matt/code_projects/Junk/
├── Everything on GitHub above PLUS:
│
├── Internal Working Files (removed from GitHub):
│   ├── 2cchmc-technology-triage-form-draft-20251002T131157.pdf
│   ├── cchmc-technology-triage-form-draft-20251002T131157.pdf
│   ├── invention disclosure d21-0030.pdf
│   ├── Screenshot 2025-10-02 092247.png
│   └── Screenshot 2025-10-04 102057.png
│
├── Already Protected by .gitignore:
│   ├── .claude/ (AI settings)
│   ├── .playwright-mcp/ (45+ screenshots)
│   ├── .superdesign/ (design iterations)
│   ├── .vscode/ (IDE settings)
│   ├── agent-specs/ (AI specs)
│   ├── old_files/ (archived work)
│   ├── styles/ (style guides)
│   ├── triage-design-mockup/ (40+ files)
│   ├── All planning markdown files
│   └── All log files
│
└── tech-triage-platform/ (FULL PRODUCTION CODE)
    ├── .git/ (complete Git history)
    ├── src/ (source code)
    ├── prisma/ (database)
    ├── docs/ (production docs)
    └── All production files...

Total: 150+ files and directories (everything for development)
```

---

## What Other Developers Will See

When someone visits your GitHub repository, they see:

✅ **Available:**
1. Full production code (via submodule link)
2. Complete documentation
3. Original requirements and designs
4. Instructions to set up and run
5. GitHub contribution templates

❌ **Not Visible:**
- Your session screenshots
- Your working draft PDFs
- Your internal notes and planning docs
- Your experimental projects (triage-design-mockup)
- Your AI working files

**Result:** Clean, professional repository with everything needed to clone and run the project

---

## Safety Guarantees

### ✅ What Stays Safe
1. **All files remain on your local disk** - Nothing is deleted
2. **Production code stays on GitHub** - Fully accessible
3. **Full Git history preserved** - Both repos keep their history
4. **Work continues normally** - Local development unaffected
5. **Fully reversible** - Can add files back to GitHub if needed

### ✅ What You Can Still Do
1. Work on production code in `tech-triage-platform/`
2. Commit and push to `tech-triage-platform` branch
3. Access all working files locally
4. Use experimental projects and design mockups
5. Keep all your planning documents and notes

### ✅ What Changes
1. GitHub shows clean, professional repository
2. 5 working files no longer visible on public GitHub
3. Production code remains fully accessible
4. Other developers can clone complete working project

---

## Verification Steps

After executing the plan:

### 1. Verify Files Removed from Git
```bash
git ls-files | grep -E "Screenshot|pdf"
# Should NOT show the 5 removed files
```

### 2. Verify Files Still on Local Disk
```bash
ls -la *.pdf *.png
# Should show: All files still present locally
```

### 3. Verify Production Code Kept
```bash
git ls-files | grep tech-triage-platform
# Should show: tech-triage-platform (as submodule reference)
```

### 4. Check GitHub
Visit: https://github.com/matt-wortman/junk-triage
- Should show: CLAUDE.md, docs/, source_material/, tech-triage-platform link
- Should NOT show: The 5 working files (PDFs, screenshots)
- Can click tech-triage-platform to see full production code

---

## Comparison: Before vs After

### Before This Cleanup
**GitHub shows:**
- Production code ✅
- Documentation ✅
- Source materials ✅
- **5 working files (PDFs, screenshots)** ❌ _Should not be public_

### After This Cleanup
**GitHub shows:**
- Production code ✅
- Documentation ✅
- Source materials ✅
- **Working files removed** ✅ _Clean and professional_

**Your local disk:**
- Still has everything ✅ _Nothing lost_

---

## Rollback Plan (If Needed)

If you want to undo these changes:

### Option 1: Restore Specific Files
```bash
# Add files back to Git tracking
git add "2cchmc-technology-triage-form-draft-20251002T131157.pdf"
git add "Screenshot 2025-10-02 092247.png"
# ... (add others as needed)

git commit -m "Restore working files to repository"
git push origin master
```

### Option 2: Restore Previous Commit
```bash
# Undo the cleanup commit entirely
git reset --hard HEAD~1

# Force push to GitHub (overwrites remote)
git push origin master --force
```

**Warning:** Option 2 rewrites history. Only use if absolutely necessary.

---

## Questions & Answers

### Q: Will I lose any code?
**A:** No. All files remain on your local disk exactly where they are. Nothing is deleted.

### Q: Can others still see the production code?
**A:** Yes! `tech-triage-platform` stays on GitHub as a submodule. They can click it to see all production code.

### Q: What if someone clones the repo?
**A:** They get:
- Full production code (via submodule)
- Complete documentation
- Everything needed to set up and run
- A clean, professional repository

### Q: Can I still work on the removed files locally?
**A:** Yes. The 5 PDFs and screenshots remain on your local disk. You can view, edit, use them normally.

### Q: What's the difference from the previous plan?
**A:** Previous plan removed production code from GitHub (wrong!). This plan keeps production code and only removes internal working files (correct!).

### Q: Is this a common practice?
**A:** Yes. Professional repositories keep production code and docs on GitHub, but exclude internal notes, drafts, and scratch files.

---

## Approval Checklist

**Before proceeding, confirm:**
- [x] Production code (`tech-triage-platform`) STAYS on GitHub ✅
- [x] Documentation STAYS on GitHub ✅
- [x] Only 5 working files removed from GitHub ✅
- [x] All files remain on local disk ✅
- [x] Other developers can clone and run the project ✅
- [ ] I understand and approve this plan

**To proceed:** Reply "approved" or "execute the plan"
**To modify:** Describe what you'd like to change
**To cancel:** Reply "cancel" or "don't do this"

---

**Plan Status:** Ready for approval
**Expected Duration:** 2-3 minutes to execute
**Risk Level:** Very Low (no deletions, fully reversible)
