# Form Builder MVP - Scope Definition Q&A

**Date:** 2025-10-01
**Purpose:** Clarify priorities and scope for the form builder MVP through structured questions

---

## Section 1: Timeline & Resources

### Q1.1: Timeline Expectations
**Question:** The original plan estimated 2-3 weeks, but the reviewer flagged this as unrealistic given the scope. What is your actual timeline constraint?

- [ ] A) We MUST ship something in 2-3 weeks (hard deadline)
- [ ] B) We prefer 2-3 weeks but can extend to 4-6 weeks if needed
- [x] C) Timeline is flexible - quality and completeness matter more than speed
- [ ] D) Other: _______________

**Your Answer:** C - Timeline is flexible, quality matters most

**Follow-up:** If there's a hard deadline, what date/event is driving it?

**Your Answer:** Demo coming soon but timeline is uncertain

**📝 Interpretation:** Build it right rather than fast. Demo provides soft target but not hard deadline. Can take time to do quality work.

---

### Q1.2: Team Size
**Question:** How many developers will work on this, and full-time or part-time?

**Your Answer:** Just me (solo developer)

**📝 Interpretation:** Timeline estimates should assume single developer, no parallel work streams. Need to prioritize sequential tasks.

---

## Section 2: Core MVP Scope

### Q2.1: Minimum Success Criteria
**Question:** What is the ABSOLUTE MINIMUM for this to be useful? Pick ONE:

- [x] A) Admin can create a simple form with text fields and dropdowns, then publish it
- [ ] B) Same as A, plus visual validation rule builder (no JSON editing)
- [ ] C) Same as B, plus conditional logic (show/hide fields)
- [ ] D) Same as C, plus version control and auto-save

**Your Answer:** A - Basic form creation and publishing

**📝 Interpretation:** MVP = Form CRUD operations only. Visual builders for validation/conditional logic are Phase 2 features. This is a clean, achievable scope.

---

### Q2.2: Workarounds for MVP
**Question:** For MVP, are you okay with these temporary workarounds?

| Feature | Workaround | Acceptable? |
|---------|-----------|-------------|
| Validation rules | Edit JSON directly in modal | ☑ Yes ☐ No |
| Conditional logic | Edit JSON directly in modal | ☑ Yes ☐ No |
| Field reordering | Up/down arrow buttons (no drag-drop) | ☑ Yes ☐ No |
| Template settings | Hardcoded admin-only access | ☑ Yes ☐ No |
| Auto-save | Manual [Save Draft] button only | ☑ Yes ☐ No |

**Your Answers:** YES to all workarounds

**📝 Interpretation:** Comfortable with JSON editing for advanced features. Arrow buttons for reordering. Manual save. This significantly reduces MVP complexity - excellent for solo dev timeline.

---

### Q2.3: Field Types Priority
**Question:** Which field types MUST work in MVP? Check all that apply:

**Existing Types (Already Built):**
- [x] Short Text (text input)
- [x] Long Text (textarea)
- [x] Integer (number input)
- [x] Date (calendar picker)
- [x] Single Select (dropdown)
- [x] Radio Group (radio buttons)
- [x] Checkbox Group (multiple checkboxes)
- [ ] Multi-Select (searchable multi-dropdown)
- [x] Repeatable Table (dynamic rows like competitor table)
- [x] Scoring 0-3 (rating scale)
- [x] Scoring Matrix (complex scoring grid)

**New Types (Need Implementation):**
- [ ] Time Picker
- [ ] DateTime Picker
- [ ] Decimal Numbers (with decimal places)
- [ ] File Upload
- [ ] Section Header (visual divider)
- [ ] Calculated Fields (auto-computed)

**Your Answer:** Need all existing types EXCEPT Multi-Select dropdown (10 out of 11 field types)

**Follow-up:** Can new types wait for Phase 2?
- [x] Yes, existing types are enough for MVP
- [ ] No, we need: _______________

**Your Answer:** Yes - no new field types needed for MVP

**📝 Interpretation:** Comprehensive field type support needed (10 types), but all already exist in the renderer. No new field type implementation required. Multi-Select can be added later if needed.

---

## Section 3: User Experience Features

### Q3.1: Undo/Redo
**Question:** The plan conflicts on this. Which is your preference?

- [x] A) No undo/redo in MVP - version control rollback is enough
- [ ] B) Need undo/redo for individual actions (adds ~1 week to timeline)
- [ ] C) Not sure - what do you recommend?

**Your Answer:** A - No undo/redo (already covered in Q2.2 workarounds)

**📝 Interpretation:** Undo/redo is Phase 2 feature. Users can manually revert changes before saving if needed.

---

### Q3.2: Auto-Save
**Question:** Auto-save adds complexity (conflict handling, performance). For MVP:

- [x] A) Manual save button only - admin clicks [Save Draft] when ready
- [ ] B) Auto-save every 2-3 minutes (adds ~2-3 days to implement)
- [ ] C) Not sure - what do you recommend?

**Your Answer:** A - Manual save only (already covered in Q2.2 workarounds)

**📝 Interpretation:** [Save Draft] button for explicit saving. No auto-save complexity in MVP. Can add in Phase 2.

---

### Q3.3: Preview Mode
**Question:** How important is live preview?

- [x] A) Critical - must see form as users will see it
- [ ] B) Nice to have - can test by publishing to test environment
- [ ] C) Not sure - what do you recommend?

**Your Answer:** A - Preview mode is critical

**📝 Interpretation:** Must include preview toggle. Fortunately, can reuse existing DynamicFormRenderer component - minimal additional work.

---

### Q3.4: Version Control
**Question:** Version control for rollback. For MVP:

- [x] A) No version control - single "current" version only
- [ ] B) Simple: Create snapshot when publishing (can rollback to last published)
- [ ] C) Advanced: Save snapshot on every save + diff viewer (adds ~1 week)

**Your Answer:** A - No version control in MVP

**📝 Interpretation:** Direct overwrite. Can add versioning in Phase 2 if needed. Saves ~3-5 days of development.

---

## Section 4: Advanced Features

### Q4.1: Validation Builder
**Question:** Visual validation rule builder (required, min/max, patterns):

- [ ] A) Critical for MVP - can't expect admins to write JSON
- [ ] B) Nice to have - admins can edit JSON for MVP
- [ ] C) Phase 2 feature - JSON is fine for now

**Your Answer:**

---

### Q4.2: Conditional Logic Builder
**Question:** Visual conditional logic builder (show field if another field = value):

- [ ] A) Critical for MVP - our forms need this
- [ ] B) Nice to have - can add later
- [ ] C) Phase 2 feature - JSON is fine for now

**Your Answer:**

---

### Q4.3: Permissions & Access Control
**Question:** Who can edit form templates?

- [ ] A) MVP: Admin only (hardcoded) - fine for now
- [ ] B) MVP: Need role-based permissions (admin, editor, viewer)
- [ ] C) Not sure - what's simplest?

**Your Answer:**

---

### Q4.4: Template Management
**Question:** What template operations do you need in MVP?

- [x] Create new blank template
- [x] Edit existing template
- [x] Delete template
- [x] Clone/duplicate template
- [x] List all templates

**Your Answers:** All template operations needed

**📝 Interpretation:** Full template CRUD + clone functionality. Comprehensive template management required for MVP.

---

## Section 5: Database & Schema

### Q5.1: Schema Changes
**Question:** The plan requires adding new tables and field types. When should this happen?

- [x] A) Week 1 Day 1 - before any coding starts (recommended)
- [ ] B) As we go - add tables when we need them
- [ ] C) Not sure - what do you recommend?

**Your Answer:** A - Day 1 schema migrations

**📝 Interpretation:** Do all database migrations upfront. Clean foundation before building.

---

### Q5.2: Backwards Compatibility
**Question:** What happens to existing forms when we add new field types?

**Your expectation:**
- [ ] A) Existing forms must continue working exactly as before
- [x] B) Can break existing forms if needed (not many in production)
- [ ] C) We can break existing forms if needed (not many in production)

**Your Answer:** B - Can break if needed (few forms in production)

**📝 Interpretation:** Low risk environment, can make breaking changes if necessary. Simplifies migration planning.

---

## Section 6: Testing & Quality

### Q6.1: Testing Strategy
**Question:** What testing level do you need for MVP?

- [ ] A) Manual testing only - we'll click through it
- [ ] B) Manual + basic automated tests for critical paths
- [ ] C) Comprehensive test coverage before release
- [x] D) Not sure - what do you recommend?

**Your Answer:** D - Claude's recommendation

**📝 RECOMMENDATION:** **Option A - Manual testing only for MVP**

**Rationale:**
- ✅ Solo developer - automated tests slow down initial iteration
- ✅ Can break existing forms (low risk environment)
- ✅ Quality over speed means careful manual testing is appropriate
- ✅ Can add automated tests in Phase 2 once UI stabilizes
- ✅ Focus dev time on features, not test infrastructure

**Testing Plan:**
- Manual click-through of all features
- Test each field type in builder + preview
- Verify publish workflow
- Test on demo form before considering "done"

---

### Q6.2: User Testing
**Question:** Will you have users test the builder before "official" launch?

- [ ] A) Yes - internal alpha test with 2-3 users
- [ ] B) Yes - beta test with 5-10 users
- [ ] C) No - ship to production immediately
- [ ] D) Not sure yet

**Your Answer:**

---

## Section 7: Success Metrics

### Q7.1: How Will You Measure Success?
**Question:** What tells you the MVP is "good enough"?

**Your Answer:** "Inexperienced user can recreate a paper form in the form builder page"

**📝 Interpretation - Success Criteria:**
- ✅ **Primary Goal:** Non-technical user can digitize an existing paper form
- ✅ **Key Test:** User with no coding knowledge can use builder independently
- ✅ **Validation:** Recreate actual paper form (like Triage.pdf) successfully
- ✅ **Completion:** Published form works correctly in form renderer
- ✅ **Quality Bar:** Intuitive enough that user doesn't need help/documentation

---

### Q7.2: Analytics & Telemetry
**Question:** Do you need to track usage metrics in the builder?

- [ ] A) Yes - track events like "field added", "form published", etc.
- [ ] B) No - not needed for MVP
- [ ] C) Not sure - what's the cost/benefit?

**Your Answer:**

**If Yes:** When do you need this?
- [ ] MVP (adds ~1-2 days)
- [ ] Phase 2 (can add later)

---

## Section 8: UI Approach

### Q8.1: Builder UI Style (from claudeAdminPageOptions.md)
**Question:** Which UI approach do you prefer?

- [ ] A) Option 1: Split-panel with drag-and-drop (most polished, 4-6 weeks)
- [ ] B) Option 2: Modal-based builder (balanced, 3-4 weeks for full featured)
- [ ] C) Option 3: Inline editor (simplest, 1-2 weeks but limited)
- [x] D) Your recommendation based on my answers

**Your Answer:** D - Claude's recommendation

**📝 RECOMMENDATION:** **Option 2 - Modal-Based Builder**

**Rationale:**
- ✅ Matches your quality-over-speed preference
- ✅ Accommodates 10 field types without clutter
- ✅ Modal pattern already used in your app (consistent UX)
- ✅ Arrow buttons work fine (you already said yes to this)
- ✅ Can upgrade to drag-and-drop later if desired
- ✅ Realistic for solo developer: **~2-3 weeks for stripped MVP**
- ✅ Good balance between functionality and complexity

**NOT Option 1 because:** 4-6 weeks is long for solo dev, drag-and-drop not needed yet
**NOT Option 3 because:** 10 field types would be cluttered in inline accordion view

---

### Q8.2: Drag-and-Drop
**Question:** For reordering fields and sections:

- [ ] A) Must have drag-and-drop in MVP
- [ ] B) Up/down arrow buttons are fine for MVP
- [ ] C) Not sure - what's the complexity difference?

**Your Answer:**

---

## Section 9: Risk Tolerance

### Q9.1: Technical Debt
**Question:** Are you okay with taking shortcuts in MVP that require refactoring later?

- [ ] A) Yes - speed matters, we can refactor in Phase 2
- [ ] B) No - build it right the first time
- [ ] C) Depends on the shortcut - case by case

**Your Answer:**

---

### Q9.2: Breaking Changes
**Question:** If we discover the MVP design doesn't scale, are you okay with:

- [ ] A) Major refactor after MVP (even if it means rewriting parts)
- [ ] B) Better to take more time upfront and avoid breaking changes
- [ ] C) Not sure - what's your recommendation?

**Your Answer:**

---

## Section 10: Dependencies & Blockers

### Q10.1: Existing System Dependencies
**Question:** Are there any dependencies on other systems or features?

**Examples:**
- Authentication system for user permissions
- File storage for file uploads
- Email notifications when forms are published
- Integration with other internal tools

**Your Answer:**

---

### Q10.2: Current Blockers
**Question:** Is there anything that would prevent starting this work immediately?

**Your Answer:**

---

## Section 11: Communication & Review

### Q11.1: Review Cadence
**Question:** How often do you want to review progress?

- [ ] A) Daily standup/check-in
- [ ] B) Every 2-3 days
- [ ] C) Weekly only
- [ ] D) Ad-hoc as needed

**Your Answer:**

---

### Q11.2: Decision Making
**Question:** Who makes final decisions on scope changes or trade-offs?

**Your Answer:**

---

## 📊 EXECUTIVE SUMMARY - MVP SCOPE DEFINITION

**Date Finalized:** 2025-10-01
**Solo Developer:** Matt
**Target:** Demo (flexible timeline)
**Success Metric:** Inexperienced user can recreate a paper form without help

---

### ✅ CORE MVP FEATURES (MUST HAVE)

#### Template Management
- ✅ Create new blank template
- ✅ Edit existing template
- ✅ Delete template
- ✅ Clone/duplicate template
- ✅ List all templates

#### Form Building
- ✅ Add/edit/delete/reorder sections
- ✅ Add/edit/delete/reorder fields within sections
- ✅ Configure field properties (label, help text, placeholder, required)
- ✅ Support 10 field types:
  - Short Text, Long Text, Integer, Date
  - Single Select, Radio Group, Checkbox Group
  - Repeatable Table, Scoring 0-3, Scoring Matrix
- ✅ Preview mode (toggle to see form as users will)
- ✅ Publish template to database

#### UI Approach
- ✅ **Modal-based builder** (Option 2)
- ✅ Click [+ Add Field] → Modal opens → Configure → Save
- ✅ Arrow buttons for reordering (no drag-and-drop)
- ✅ Card-based layout matching existing pages

---

### ❌ EXCLUDED FROM MVP (Phase 2+)

#### Advanced Builders
- ❌ Visual validation rule builder (edit JSON directly for MVP)
- ❌ Visual conditional logic builder (edit JSON directly for MVP)
- ❌ Calculated fields builder

#### User Experience
- ❌ Undo/redo functionality
- ❌ Auto-save (manual [Save Draft] button only)
- ❌ Version control / snapshots
- ❌ Drag-and-drop reordering

#### Field Types
- ❌ Multi-Select dropdown
- ❌ Time Picker
- ❌ DateTime Picker
- ❌ Decimal Numbers
- ❌ File Upload
- ❌ Section Header
- ❌ Rich Text Editor

#### Permissions & Collaboration
- ❌ Role-based access control (hardcoded admin-only)
- ❌ Multi-user editing
- ❌ Audit logs

#### Analytics
- ❌ Usage telemetry
- ❌ Analytics dashboard

---

### 🎯 ACCEPTABLE WORKAROUNDS FOR MVP

| Feature | Workaround | Status |
|---------|-----------|---------|
| Validation rules | Edit JSON in modal | ✅ Acceptable |
| Conditional logic | Edit JSON in modal | ✅ Acceptable |
| Field reordering | Up/down arrow buttons | ✅ Acceptable |
| Template permissions | Admin-only hardcoded | ✅ Acceptable |
| Auto-save | Manual save button | ✅ Acceptable |

---

### 📅 TIMELINE ESTIMATE

**Approach:** Quality over speed, flexible timeline
**Developer:** Solo (Matt)
**Estimated Duration:** **2-3 weeks** for stripped MVP

#### Week 1: Foundation
- Day 1: Database schema migrations
- Day 2-3: Builder page + section CRUD
- Day 4-5: Field palette + basic field adding

#### Week 2: Core Features
- Day 1-2: Field configuration modal (10 field types)
- Day 3: Field edit/delete/reorder
- Day 4: Preview mode toggle
- Day 5: Template management (list, create, edit, delete, clone)

#### Week 3: Polish & Testing
- Day 1-2: Publish workflow
- Day 3: Bug fixes and edge cases
- Day 4-5: Manual testing with paper form recreation
- Final: Demo readiness

---

### ✅ SUCCESS CRITERIA

**Primary Metric:**
> "Inexperienced user can recreate a paper form in the form builder page"

**Validation Tests:**
1. ✅ Non-technical user can use builder without documentation
2. ✅ Can recreate existing paper form (e.g., Triage.pdf)
3. ✅ Published template renders correctly in form page
4. ✅ All 10 field types work in builder + preview
5. ✅ Zero database errors or corruption
6. ✅ User doesn't need developer help to complete task

---

### 🛠️ TECHNICAL DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **UI Approach** | Modal-based (Option 2) | Balance of quality + solo dev timeline |
| **Field Types** | 10 existing types | All already work in renderer |
| **Schema Migration** | Day 1 upfront | Clean foundation |
| **Backwards Compat** | Can break if needed | Low risk environment |
| **Testing** | Manual only | Solo dev, focus on features |
| **Version Control** | None in MVP | Phase 2 feature |
| **Reordering** | Arrow buttons | No drag-drop complexity |
| **Preview** | Critical - included | Reuse existing renderer |

---

### 🚀 IMPLEMENTATION APPROACH

1. **Start:** Database schema migration (Day 1)
2. **Build:** Modal-based builder with 10 field types
3. **Test:** Manual testing with paper form
4. **Validate:** Inexperienced user test
5. **Demo:** Show form recreation capability

---

### 🎓 KEY INSIGHTS FROM Q&A

**Strengths of This Scope:**
- ✅ Realistic for solo developer
- ✅ Clear success metric (inexperienced user test)
- ✅ All field types already built in renderer
- ✅ Flexible timeline allows quality work
- ✅ Comfortable with JSON editing workarounds
- ✅ Low risk environment (can break things)

**Risk Mitigation:**
- Schema migrations Day 1 (avoid late surprises)
- Manual testing (appropriate for MVP)
- Preview mode included (catch issues early)
- JSON editing acceptable (delays complex builders)
- No version control (saves ~5 days development)

**Phase 2 Upgrade Path:**
- Add visual validation builder (~3-5 days)
- Add conditional logic builder (~5-7 days)
- Add version control (~3-5 days)
- Add drag-and-drop (~5-7 days)
- Upgrade to split-panel UI (~7-10 days)

---

### 📝 NEXT STEPS

1. ✅ Review this summary with stakeholders
2. ⏭️ Create detailed day-by-day implementation plan
3. ⏭️ Set up development environment
4. ⏭️ Day 1: Run database migrations
5. ⏭️ Begin Week 1 development

---

*This scope definition was created through structured Q&A to ensure alignment between business needs and technical reality for a solo developer working on a quality-focused MVP.*
