# Phase 1: Documentation Migration - Move & Patch Plan

## Overview
This phase focuses on restructuring the documentation without content changes. All files will be moved to their new locations and all cross-references will be updated to prevent broken links.

## Current Structure
```
docs/
├── code-review-final-report.md
├── code-review-section-1.md
├── code-review-section-2.md
├── code-review-section-3.md
├── code-review-sections-4-13-summary.md
├── codeMasterReport.md
├── release-notes/
│   └── 2025-10-02.md
├── runbooks/
│   └── deployment-runbook-2025-10-03.md
└── tutorials/
    └── non-technical-admin-guide.md
```

## Target Structure
```
docs/
├── README.md                          # New: docs homepage with index
├── architecture/
│   ├── README.md                      # Overview of architecture docs
│   ├── system-overview.md            # From: codeMasterReport.md (extracted section)
│   ├── data-model.md                 # From: code-review-section-1.md (extracted section)
│   └── security-model.md             # From: code-review-section-2.md (extracted section)
├── reviews/
│   ├── README.md                      # Index of code reviews
│   ├── 2025-10-initial-review/
│   │   ├── 01-database-layer.md      # From: code-review-section-1.md
│   │   ├── 02-form-engine.md         # From: code-review-section-2.md
│   │   ├── 03-ui-components.md       # From: code-review-section-3.md
│   │   ├── 04-13-summary.md          # From: code-review-sections-4-13-summary.md
│   │   ├── final-report.md           # From: code-review-final-report.md
│   │   └── master-report.md          # From: codeMasterReport.md
├── guides/
│   ├── README.md                      # Index of guides
│   ├── admin-guide.md                # From: tutorials/non-technical-admin-guide.md
│   └── deployment-guide.md           # From: runbooks/deployment-runbook-2025-10-03.md
├── release-notes/
│   ├── README.md                      # Index of releases
│   └── v1.0.0-2025-10-02.md         # From: release-notes/2025-10-02.md
└── .archive/                          # Original files for Phase 2 reference
    └── (original files copied here)
```

## Migration Steps

### Step 1: Create New Directory Structure
```bash
# Create new directories
mkdir -p docs/architecture
mkdir -p docs/reviews/2025-10-initial-review
mkdir -p docs/guides
mkdir -p docs/.archive

# Existing directories (keep)
# - docs/release-notes (rename files only)
```

### Step 2: Move Files (Simple Relocations)
These files move as-is with filename changes only:

```bash
# Archive originals
cp -r docs/*.md docs/.archive/
cp -r docs/release-notes docs/.archive/
cp -r docs/runbooks docs/.archive/
cp -r docs/tutorials docs/.archive/

# Move code review files
mv docs/code-review-section-1.md docs/reviews/2025-10-initial-review/01-database-layer.md
mv docs/code-review-section-2.md docs/reviews/2025-10-initial-review/02-form-engine.md
mv docs/code-review-section-3.md docs/reviews/2025-10-initial-review/03-ui-components.md
mv docs/code-review-sections-4-13-summary.md docs/reviews/2025-10-initial-review/04-13-summary.md
mv docs/code-review-final-report.md docs/reviews/2025-10-initial-review/final-report.md
mv docs/codeMasterReport.md docs/reviews/2025-10-initial-review/master-report.md

# Move guides
mv docs/tutorials/non-technical-admin-guide.md docs/guides/admin-guide.md
mv docs/runbooks/deployment-runbook-2025-10-03.md docs/guides/deployment-guide.md

# Move release notes
mv docs/release-notes/2025-10-02.md docs/release-notes/v1.0.0-2025-10-02.md

# Remove old directories
rmdir docs/tutorials
rmdir docs/runbooks
```

### Step 3: Update Cross-References

#### Known Links to Update:
1. **code-review-section-1.md** → **01-database-layer.md**
   - Line 475: `[Section 2: Form Engine Core](./code-review-section-2.md)`
   - Update to: `[Section 2: Form Engine Core](./02-form-engine.md)`

#### Pattern-Based Link Updates:
Search for all markdown links and update paths:
```bash
# Search pattern
grep -rn '\[.*\](\..*\.md)' docs/reviews/2025-10-initial-review/
```

### Step 4: Create Index Files

#### docs/README.md
```markdown
# Tech Triage Platform Documentation

## Quick Links
- [Admin Guide](./guides/admin-guide.md)
- [Deployment Guide](./guides/deployment-guide.md)
- [Latest Release Notes](./release-notes/v1.0.0-2025-10-02.md)

## Documentation Sections
- [Architecture](./architecture/) - System design and architecture
- [Reviews](./reviews/) - Code reviews and audits
- [Guides](./guides/) - User and deployment guides
- [Release Notes](./release-notes/) - Version history and changes
```

#### docs/reviews/README.md
```markdown
# Code Reviews

## 2025-10 Initial Review
- [01: Database Layer](./2025-10-initial-review/01-database-layer.md)
- [02: Form Engine](./2025-10-initial-review/02-form-engine.md)
- [03: UI Components](./2025-10-initial-review/03-ui-components.md)
- [04-13: Summary](./2025-10-initial-review/04-13-summary.md)
- [Final Report](./2025-10-initial-review/final-report.md)
- [Master Report](./2025-10-initial-review/master-report.md)
```

#### docs/guides/README.md
```markdown
# Guides

- [Admin Guide](./admin-guide.md) - Non-technical administrator guide
- [Deployment Guide](./deployment-guide.md) - Deployment procedures and runbook
```

#### docs/release-notes/README.md
```markdown
# Release Notes

- [v1.0.0 (2025-10-02)](./v1.0.0-2025-10-02.md) - Initial release
```

### Step 5: Verification
```bash
# Check for broken links
grep -r '\[.*\](\..*\.md)' docs/ | grep -v '.archive'

# Verify all files moved
ls -la docs/reviews/2025-10-initial-review/
ls -la docs/guides/
ls -la docs/release-notes/

# Ensure archive is complete
ls -la docs/.archive/
```

## Link Update Patterns

### Update Rule
- Old pattern: `./code-review-section-X.md`
- New pattern: `./0X-<descriptive-name>.md`

### Example Transformations
- `./code-review-section-2.md` → `./02-form-engine.md`
- `../tutorials/non-technical-admin-guide.md` → `../../guides/admin-guide.md`

## Rollback Plan
If issues arise, restore from `.archive/`:
```bash
cp -r docs/.archive/* docs/
```

## Success Criteria
- [ ] All files moved to new locations
- [ ] No broken internal links
- [ ] All index/README files created
- [ ] Original files preserved in `.archive/`
- [ ] Can navigate between related docs via links

## Phase 2 Preview
After Phase 1 completes, Phase 2 will:
- Extract architecture sections from review docs
- Consolidate redundant content
- Improve content organization
- Remove `.archive/` directory
