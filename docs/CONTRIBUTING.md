# Documentation Contribution Guidelines

## Hierarchy
1. **PROJECT_STATUS.md** – source of truth for "what is" and "what's next".
2. **README.md** – developer setup, quick start, architecture summary.
3. **docs/guides/** – how-to topics (deployment, admin, testing, etc.).
4. **docs/runbooks/** – operational playbooks.
5. **docs/archive/** – historical context, proposals, critiques.

## Update Rules
- **Status or roadmap change?** Update `docs/PROJECT_STATUS.md`.
- **Implementation details?** Update or create a guide in `docs/guides/`.
- **New decision?** Capture it as an ADR under `docs/adrs/`.
- **Historical artifact?** Move it to `docs/archive/` with a short README explaining context.

## Before Adding a New Document
1. Check whether an existing doc can be updated instead.
2. Verify that the content will stay current; if not, put it in `docs/archive/`.
3. Link new guides or runbooks from `docs/README.md`.
4. Cross-link supporting evidence (PRs, ADRs, code paths) for traceability.

## Pull Request Checklist
- [ ] `docs/PROJECT_STATUS.md` reflects the change (if applicable).
- [ ] Related guides/runbooks updated.
- [ ] Outdated docs archived or removed.
- [ ] ADR recorded for notable decisions.

Keeping to this structure helps humans and AI agents find the latest information in under a minute.
