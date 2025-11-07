# Feedback Capture Plan

Goal: Let users quickly submit qualitative feedback from any page in the Tech Triage Platform UI. A floating feedback button opens a small form (reuse Radix styles where possible). Submitted entries land in Postgres for easy querying.

## Summary Timeline
- Est. effort: 1 developer day (6–8 hours) once requirements are final.
- Deliverables: database migration, API endpoint, React feedback widget, documentation, smoke tests.

## Step-by-Step Plan

1. **Review Existing UI Patterns**
   - Confirm design tokens/shadcn components available for buttons, dialogs, textareas (`src/components` + `styles`).
   - Identify global layout file(s) where a site-wide button can be injected (likely `src/app/(auth)/layout.tsx` or `_app.tsx` equivalent).

2. **Design Feedback Data Model**
   - Add `Feedback` Prisma model with fields: `id`, `createdAt`, `updatedAt`, `pageUrl`, `message`, `contactInfo?`, `userId?`.
   - Generate Prisma migration; update client (`npx prisma generate`).
   - Note retention policy (e.g., keep indefinitely or archive after 1 year).

3. **Implement Server Endpoint**
   - Create Next.js route at `src/app/api/feedback/route.ts`.
   - Validate payload with `zod` (limit message length, optional contact field).
   - Persist to Postgres via Prisma; record request metadata (page URL, user agent).
   - Return success/failure with proper status codes.
   - Add simple rate limiting (e.g., per IP throttle or rely on existing middleware).

4. **Build Frontend Feedback Widget**
   - Create a reusable component `FeedbackWidget`:
     - Floating action button, bottom-right on desktop, bottom center on mobile.
     - Opens Radix `Dialog` or `Sheet` containing:
       - `Textarea` for feedback (required, ~500 char limit).
       - Optional email/contact field.
       - Submit & cancel buttons; show `sonner` toast on success/failure.
     - Include loading state and error UX.
   - Mount component in global layout so it appears on all authenticated pages; ensure it respects theme tokens.
   - Capture `window.location.pathname` for pageUrl; include user info if available in context.

5. **Testing & QA**
   - Add integration test for API route (Jest) covering valid submission and validation failure.
   - Manual QA in dev: submit feedback, confirm record appears in Postgres (`prisma.feedback.findMany()`).
   - Verify widget positions and styling across breakpoints (desktop, tablet, mobile).

6. **Documentation & Ops**
   - Update `docs/export-forms-plan.md` or create new README section outlining configuration and review process.
   - Add link in internal admin docs describing how to fetch feedback (e.g., via Prisma Studio or future admin page).
   - Optional: set up log/alert when feedback volume spikes.

7. **Deployment**
   - Merge migration + code.
  - Run `prisma migrate deploy` as part of container start (already handled).
   - Verify widget appears in staging; perform test submission before production release.

## Nice-to-Haves (Stretch)
- Auto-capture browser/OS info for triage.
- Allow attaching screenshot (future build).
- Slack/Email notification on new feedback (webhook).
- Admin UI to view and mark feedback as addressed.

## Progress Log
| Date (EST) | Task | Status | Notes |
|------------|------|--------|-------|
| 2025-10-08 | Added Prisma `Feedback` model and migration | ✅ Completed | Migration `20251008200841_add_feedback_model` generated via Prisma. |
| 2025-10-08 | Implemented `/api/feedback` endpoint with validation | ✅ Completed | Zod schema added; route stores feedback with metadata. |
| 2025-10-08 | Built feedback widget UI and Jest validation tests | ✅ Completed | Floating dialog with textarea/input, integrates with API and reuses existing styling. |
| 2025-10-09 | Rotated Azure Postgres admin password and refreshed tooling | ✅ Completed | Updated App Service `DATABASE_URL`/`PRISMA_MIGRATE_DATABASE_URL`, regenerated `.env.azurestudio.local`, and documented connection string in `matts_cheatsheet.md`. |
