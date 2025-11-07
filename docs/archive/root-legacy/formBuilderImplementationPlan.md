# Form Builder MVP - Sequential Implementation Plan

> **Progress Update (2025-10-01)**  
> Phases 0–10 are complete. Section management, field palette/configuration, preview mode, save/publish workflow, and template metadata editor are live. Phase 11 (additional polish & testing) is the next active milestone—see `MVP_status.md` for day-to-day status.

**Date:** 2025-10-01
**Based on:** formBuilderScopeQandA.md decisions
**Approach:** Work in order, complete each phase before moving to next
**Timeline:** 2-3 weeks (solo developer)

---

## 🎯 Success Metric Reminder
> "Inexperienced user can recreate a paper form in the form builder page"

---

## ❌ EXPLICITLY NOT IN MVP (Phase 2+)

The following features are **intentionally excluded** from this MVP implementation:

### User Experience Features
- ❌ **Undo/Redo** - No action history or undo functionality
- ❌ **Auto-Save** - Manual [Save Draft] button only (no automatic saving)
- ❌ **Version Control** - No snapshots, no version history, no rollback
- ❌ **Drag-and-Drop** - Arrow buttons for reordering only

### Advanced Builders
- ❌ **Visual Validation Builder** - Use JSON editor for validation rules in MVP
- ❌ **Visual Conditional Logic Builder** - Use JSON editor for conditional logic in MVP
- ❌ **Calculated Fields Builder** - Not implemented in MVP

### Field Types
- ❌ **Multi-Select Dropdown** - Excluded from 10 core types
- ❌ **Time Picker** - Not needed for MVP
- ❌ **DateTime Picker** - Not needed for MVP
- ❌ **Decimal Numbers** - Not needed for MVP
- ❌ **File Upload** - Not needed for MVP
- ❌ **Section Header** - Not needed for MVP
- ❌ **Rich Text Editor** - Not needed for MVP

### Permissions & Collaboration
- ❌ **Role-Based Access Control** - Hardcoded admin-only in MVP
- ❌ **Multi-User Editing** - Single user only
- ❌ **Audit Logs** - No change tracking

### Analytics
- ❌ **Usage Telemetry** - No event tracking
- ❌ **Analytics Dashboard** - No metrics collection

**If someone asks for these features, the answer is: "Phase 2"**

---

## 📋 Implementation Sequence

### Phase 0: Foundation Setup
**Goal:** Get database and environment ready

#### 0.1 Database Schema Migration
**Purpose:** Add any missing tables/fields needed for builder

**Tasks:**
- [ ] Review current Prisma schema at `prisma/schema.prisma`
- [ ] Verify these models exist and are correct:
  - `FormTemplate` with sections relationship
  - `FormSection` with questions relationship
  - `FormQuestion` with options relationship
  - `QuestionOption` for dropdown/radio/checkbox choices
  - `ScoringConfig` for scoring fields
  - `FormSubmission` for published form data
- [ ] Check if `FieldType` enum includes all 10 types:
  - SHORT_TEXT, LONG_TEXT, INTEGER, DATE
  - SINGLE_SELECT, CHECKBOX_GROUP
  - REPEATABLE_GROUP, SCORING_0_3, SCORING_MATRIX
  - (Note: Radio Group uses SINGLE_SELECT with metadata)
- [ ] Create migration if needed: `npx prisma migrate dev --name form_builder_prep`
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Test: Verify you can query FormTemplate in a test script

**Files Created/Modified:**
- `prisma/migrations/[timestamp]_form_builder_prep/migration.sql` (if needed)
- `prisma/schema.prisma` (if changes needed)

**Deliverable:** Database ready, Prisma client generated

---

### Phase 1: Builder Landing Page & Navigation
**Goal:** Create entry point to the form builder

#### 1.1 Builder Landing Page
**Purpose:** List all templates, provide create/edit/delete/clone actions

**Tasks:**
- [ ] Create file: `src/app/dynamic-form/builder/page.tsx`
- [ ] Create server actions file: `src/app/dynamic-form/builder/actions.ts`
- [ ] Implement landing page UI:
  - Header: "Form Builder" title
  - [+ Create New Template] button
  - List of existing templates (card layout)
  - Each card shows: template name, version, description, last updated
  - Each card has: [Edit], [Clone], [Delete] buttons
- [ ] Implement server action: `getTemplates()` - fetch all templates
- [ ] Implement server action: `createTemplate(name, description)` - create blank template
- [ ] Implement server action: `deleteTemplate(id)` - soft delete or hard delete
- [ ] Implement server action: `cloneTemplate(id)` - duplicate template with new ID
- [ ] Add navigation link from home page to `/dynamic-form/builder`
- [ ] Add "Back to Builder" link on dynamic form page

**Components to Create:**
- `src/app/dynamic-form/builder/page.tsx` - Main landing page
- `src/app/dynamic-form/builder/actions.ts` - Server actions

**Shadcn Components Needed:**
```bash
npx shadcn@latest add alert-dialog  # For delete confirmation
```

**Deliverable:** Can create, list, clone, delete templates

---

### Phase 2: Builder Editor Layout
**Goal:** Create the main builder editing interface

#### 2.1 Builder Editor Page
**Purpose:** Edit a specific template (sections and fields)

**Tasks:**
- [ ] Create file: `src/app/dynamic-form/builder/[templateId]/page.tsx`
- [ ] Implement layout:
  - Header: Template name, version, [Save Draft], [Preview], [Publish] buttons
  - Left sidebar (optional): Section navigation
  - Main content: Section cards with fields
  - Each section card shows: title, description, [+ Add Field] button
  - Each field shows: type icon, label, [Edit], [Delete], [↑], [↓] buttons
- [ ] Load template data: `getTemplate(templateId)` with sections and questions
- [ ] Create component: `src/components/form-builder/BuilderLayout.tsx`
- [ ] Create component: `src/components/form-builder/SectionCard.tsx`
- [ ] Create component: `src/components/form-builder/FieldCard.tsx`

**Files Created:**
- `src/app/dynamic-form/builder/[templateId]/page.tsx`
- `src/components/form-builder/BuilderLayout.tsx`
- `src/components/form-builder/SectionCard.tsx`
- `src/components/form-builder/FieldCard.tsx`

**Deliverable:** Can view template structure, but can't edit yet

---

### Phase 3: Section Management
**Goal:** Add, edit, delete, reorder sections

#### 3.1 Section CRUD Operations
**Purpose:** Manage form sections

**Tasks:**
- [ ] Add [+ Add Section] button at bottom of builder
- [ ] Create server action: `createSection(templateId, title, description, order)`
- [ ] Create server action: `updateSection(sectionId, title, description)`
- [ ] Create server action: `deleteSection(sectionId)` with confirmation
- [ ] Create server action: `reorderSection(sectionId, direction)` - move up/down
- [ ] Add inline edit for section title/description (click to edit)
- [ ] Add up/down arrows on each section card
- [ ] Add delete button with confirmation dialog

**Files Modified:**
- `src/app/dynamic-form/builder/actions.ts` - Add section actions
- `src/components/form-builder/SectionCard.tsx` - Add edit/delete UI

**Deliverable:** Can manage sections completely

---

### Phase 4: Field Type Palette
**Goal:** Visual selector for field types

#### 4.1 Field Type Configuration
**Purpose:** Define metadata for each field type

**Tasks:**
- [ ] Create file: `src/lib/form-builder/field-type-config.ts`
- [ ] Define configuration for each of 10 field types:
  ```typescript
  export const FIELD_TYPE_CONFIG = {
    SHORT_TEXT: {
      label: 'Short Text',
      icon: Type, // Lucide icon
      description: 'Single line text input',
      category: 'text',
      defaultProps: {
        placeholder: '',
        maxLength: null
      }
    },
    // ... etc for all 10 types
  }
  ```
- [ ] Export helper: `getFieldTypeConfig(type: FieldType)`
- [ ] Export helper: `getFieldTypesByCategory()`

**Files Created:**
- `src/lib/form-builder/field-type-config.ts`

**Deliverable:** Field type metadata ready for UI

---

#### 4.2 Field Type Icon Component
**Purpose:** Display field type with icon

**Tasks:**
- [ ] Create component: `src/components/form-builder/FieldTypeIcon.tsx`
- [ ] Props: `type: FieldType, size?: 'sm' | 'md' | 'lg'`
- [ ] Render appropriate Lucide icon based on type
- [ ] Add tooltip showing field type description

**Files Created:**
- `src/components/form-builder/FieldTypeIcon.tsx`

**Shadcn Components Needed:**
```bash
npx shadcn@latest add tooltip  # For field type hints
```

**Deliverable:** Can display field types visually

---

### Phase 5: Field Configuration Modal
**Goal:** Modal to add/edit fields

#### 5.1 Field Selector Modal
**Purpose:** Choose field type when adding new field

**Tasks:**
- [ ] Create component: `src/components/form-builder/FieldSelectorModal.tsx`
- [ ] Display grid of field type cards (icon + label)
- [ ] Organize by category: Text, Selection, Date/Time, Scoring, Complex
- [ ] On click: Open field configuration modal
- [ ] Open this modal when [+ Add Field] button clicked

**Files Created:**
- `src/components/form-builder/FieldSelectorModal.tsx`

**Shadcn Components Needed:**
```bash
npx shadcn@latest add dialog     # For modals
npx shadcn@latest add tabs       # For category tabs (optional)
```

**Deliverable:** Can select which field type to add

---

#### 5.2 Field Configuration Modal
**Purpose:** Configure field properties

**Tasks:**
- [ ] Create component: `src/components/form-builder/FieldConfigModal.tsx`
- [ ] Props: `mode: 'create' | 'edit', fieldType: FieldType, sectionId: string, existingData?: FormQuestion`
- [ ] Basic Tab:
  - Field Code (auto-generated or editable)
  - Label (required)
  - Help Text (optional)
  - Placeholder (optional)
  - Required toggle
- [ ] Options Tab (for SELECT, RADIO, CHECKBOX types):
  - List of options
  - [+ Add Option] button
  - Each option: label, value, [Delete] button
  - Up/down arrow buttons for reordering (no drag-and-drop in MVP)
- [ ] Advanced Tab:
  - Validation rules (JSON editor for MVP)
  - Conditional logic (JSON editor for MVP)
  - Metadata (JSON editor)
- [ ] Repeatable Table Tab (for REPEATABLE_GROUP):
  - Define columns (mini field configs)
  - Min/max rows
- [ ] Scoring Tab (for SCORING_0_3, SCORING_MATRIX):
  - Weight
  - Score labels
  - Group type (impact/value/market)
- [ ] [Cancel] and [Save] buttons
- [ ] Form validation before save

**Files Created:**
- `src/components/form-builder/FieldConfigModal.tsx`
- `src/components/form-builder/FieldConfigBasicTab.tsx`
- `src/components/form-builder/FieldConfigOptionsTab.tsx`
- `src/components/form-builder/FieldConfigAdvancedTab.tsx`
- `src/components/form-builder/FieldConfigRepeatableTab.tsx`
- `src/components/form-builder/FieldConfigScoringTab.tsx`

**Shadcn Components Needed:**
```bash
npx shadcn@latest add switch       # For required toggle
npx shadcn@latest add textarea     # For JSON editors
npx shadcn@latest add scroll-area  # For long modals
```

**Deliverable:** Can configure all field properties

---

#### 5.3 Field CRUD Server Actions
**Purpose:** Save field configurations to database

**Tasks:**
- [ ] Create server action: `createField(sectionId, fieldConfig)` - add new field
- [ ] Create server action: `updateField(fieldId, fieldConfig)` - update existing field
- [ ] Create server action: `deleteField(fieldId)` - delete with confirmation
- [ ] Create server action: `reorderField(fieldId, direction)` - move up/down within section
- [ ] Create server action: `duplicateField(fieldId)` - copy field
- [ ] Handle options creation/update for SELECT/RADIO/CHECKBOX fields
- [ ] Handle scoring config creation/update for SCORING fields
- [ ] Validate field codes are unique within template

**Files Modified:**
- `src/app/dynamic-form/builder/actions.ts`

**Deliverable:** Fields save to database correctly

---

### Phase 6: Field Management UI
**Goal:** Edit, delete, reorder fields

#### 6.1 Field Card Actions
**Purpose:** Add action buttons to field cards

**Tasks:**
- [ ] Update `FieldCard.tsx` to show:
  - Field type icon
  - Field label
  - Field code (small text)
  - [Edit] button - opens FieldConfigModal in edit mode
  - [Delete] button - confirmation dialog
  - [Duplicate] button - copies field
  - [↑] button - move up
  - [↓] button - move down
  - Required badge if isRequired=true
- [ ] Wire up buttons to server actions
- [ ] Show success toast after actions
- [ ] Handle errors gracefully

**Files Modified:**
- `src/components/form-builder/FieldCard.tsx`

**Shadcn Components Needed:**
```bash
npx shadcn@latest add badge     # For required indicator
npx shadcn@latest add sonner    # Already have, for toasts
```

**Deliverable:** Can manage fields completely

---

### Phase 7: Preview Mode
**Goal:** Toggle between edit and preview

#### 7.1 Preview Toggle
**Purpose:** See form as users will see it

**Tasks:**
- [ ] Add state: `const [previewMode, setPreviewMode] = useState(false)`
- [ ] Add toggle button in header: [Preview Mode] / [Edit Mode]
- [ ] When preview mode ON:
  - Hide all edit controls (buttons, arrows, [+ Add Field])
  - Render form using existing `DynamicFormRenderer` component
  - Pass template data to renderer
  - Disable form submission (or show fake success)
  - Show banner: "Preview Mode - changes won't be saved"
- [ ] When preview mode OFF:
  - Show edit controls
  - Show builder interface

**Files Modified:**
- `src/app/dynamic-form/builder/[templateId]/page.tsx`

**Reuse Existing:**
- `src/lib/form-engine/renderer.tsx` - DynamicFormRenderer component

**Deliverable:** Can preview form without leaving builder

---

### Phase 8: Save & Publish Workflow
**Goal:** Save changes and publish template

#### 8.1 Save Draft
**Purpose:** Save template without activating

**Tasks:**
- [ ] Add [Save Draft] button in header
- [ ] Create server action: `saveTemplate(templateId)` - just save, don't activate
- [ ] Show "Last saved: [time]" indicator
- [ ] Show toast: "Draft saved"
- [ ] No validation required for draft

**Files Modified:**
- `src/app/dynamic-form/builder/actions.ts`
- `src/app/dynamic-form/builder/[templateId]/page.tsx`

**Deliverable:** Can save work in progress

---

#### 8.2 Publish Template
**Purpose:** Activate template for use

**Tasks:**
- [ ] Add [Publish] button in header
- [ ] Validate template before publish:
  - Has at least one section
  - Each section has at least one field
  - No duplicate field codes
  - Required fields have valid configurations
- [ ] Show validation errors if any
- [ ] Create server action: `publishTemplate(templateId)` - set isActive=true
- [ ] Confirmation dialog: "Publishing will make this form live. Continue?"
- [ ] On success:
  - Show toast: "Template published successfully"
  - Redirect to builder landing page or stay on page
- [ ] Handle errors

**Files Modified:**
- `src/app/dynamic-form/builder/actions.ts`
- `src/app/dynamic-form/builder/[templateId]/page.tsx`

**Deliverable:** Can publish templates for use

---

### Phase 9: Template Metadata Editor (Optional Polish)
**Goal:** Edit template-level settings
**Note:** This phase improves UX but is not strictly required for MVP. Without it, template name/version can only be set during creation. Recommended to include (~2-3 hours) for better demo experience.

#### 9.1 Template Settings Modal
**Purpose:** Edit name, version, description

**Tasks:**
- [ ] Create component: `src/components/form-builder/TemplateSettingsModal.tsx`
- [ ] Add gear icon button in builder header to open modal
- [ ] Fields:
  - Template Name (required)
  - Version (text input, e.g., "1.0", "2.0")
  - Description (textarea)
  - Active status (toggle - readonly, set by publish)
- [ ] [Cancel] and [Save] buttons
- [ ] Create server action: `updateTemplateMetadata(templateId, name, version, description)`
- [ ] Validation: name required, version required

**Files Created:**
- `src/components/form-builder/TemplateSettingsModal.tsx`

**Files Modified:**
- `src/app/dynamic-form/builder/actions.ts`

**Deliverable:** Can edit template metadata

---

### Phase 10: Polish & Error Handling
**Goal:** Make builder robust and user-friendly

#### 10.1 Error States
**Purpose:** Handle errors gracefully

**Tasks:**
- [ ] Add try/catch to all server actions
- [ ] Return `{ success: boolean, error?: string }` from actions
- [ ] Show error toasts for failures
- [ ] Add loading states to buttons (disable + spinner)
- [ ] Handle database errors
- [ ] Handle network errors
- [ ] Add error boundary to builder pages

**Files Modified:**
- All action files
- All components with async operations

**Deliverable:** Builder handles errors gracefully

---

#### 10.2 Loading States
**Purpose:** Show progress for async operations

**Tasks:**
- [ ] Add loading spinners to:
  - [Save Draft] button while saving
  - [Publish] button while publishing
  - [Delete] buttons while deleting
  - Template list while loading
  - Builder page while loading template
- [ ] Disable buttons during operations
- [ ] Show skeleton loaders for initial page loads

**Files Modified:**
- All components with async operations

**Deliverable:** Clear feedback during operations

---

#### 10.3 Empty States
**Purpose:** Guide users when no data exists

**Tasks:**
- [ ] Builder landing page - no templates:
  - Show message: "No form templates yet"
  - Large [Create Your First Template] button
  - Maybe illustration or icon
- [ ] Template with no sections:
  - Show message: "Add your first section to get started"
  - Prominent [+ Add Section] button
- [ ] Section with no fields:
  - Show message: "Add fields to this section"
  - [+ Add Field] button

**Files Modified:**
- `src/app/dynamic-form/builder/page.tsx`
- `src/app/dynamic-form/builder/[templateId]/page.tsx`
- `src/components/form-builder/SectionCard.tsx`

**Deliverable:** Helpful guidance for new users

---

#### 10.4 UI Polish
**Purpose:** Match existing app design

**Tasks:**
- [ ] Ensure consistent spacing (use Tailwind classes from existing pages)
- [ ] Use card-based layouts like existing pages
- [ ] Match button styles from existing pages
- [ ] Use same color scheme (primary blue, gray backgrounds)
- [ ] Add Lucide icons consistently
- [ ] Ensure responsive design (mobile-friendly)
- [ ] Add smooth transitions/animations
- [ ] Test on different screen sizes

**Files Modified:**
- All builder components

**Deliverable:** Builder looks like part of the app

---

### Phase 11: Integration with Form Renderer
**Goal:** Published templates work in form renderer

#### 11.1 Form Renderer Integration
**Purpose:** Ensure templates work on `/dynamic-form` page

**Tasks:**
- [ ] Test: Create template in builder
- [ ] Test: Publish template
- [ ] Test: Navigate to `/dynamic-form` page
- [ ] Test: Verify template loads correctly
- [ ] Test: All 10 field types render correctly
- [ ] Test: Form submission works
- [ ] Test: Draft saving works
- [ ] Fix any integration issues

**Files Modified:**
- Potentially `src/app/dynamic-form/page.tsx` if issues found

**Deliverable:** Published templates work end-to-end

---

### Phase 12: Testing & Validation
**Goal:** Ensure builder meets success criteria

#### 12.1 Manual Testing Checklist
**Purpose:** Comprehensive testing of all features

**Tasks:**
- [ ] **Template Management:**
  - Create new template
  - Edit template name/version/description
  - Clone template
  - Delete template
  - List templates
- [ ] **Section Management:**
  - Add section
  - Edit section title/description
  - Delete section
  - Reorder sections (up/down)
- [ ] **Field Management (test each of 10 types):**
  - Add field
  - Edit field
  - Delete field
  - Duplicate field
  - Reorder fields
  - Configure options (for select/radio/checkbox)
  - Configure scoring (for scoring fields)
  - Configure repeatable columns (for repeatable table)
- [ ] **Preview Mode:**
  - Toggle preview on/off
  - All field types render correctly in preview
  - Form looks correct
- [ ] **Save & Publish:**
  - Save draft
  - Publish template
  - Verify template becomes active
  - Verify validation works
- [ ] **Published Template:**
  - Navigate to `/dynamic-form`
  - Published template loads
  - All fields work
  - Can fill out form
  - Can submit form
  - Can save draft
- [ ] **Edge Cases:**
  - Create template with no sections (should prevent publish)
  - Create section with no fields (should prevent publish)
  - Duplicate field codes (should show error)
  - Delete only section (should allow)
  - Delete only field (should allow)
  - Reorder first section up (should not move)
  - Reorder last section down (should not move)

**Deliverable:** All features work correctly

---

#### 12.2 Success Criteria Validation
**Purpose:** Test against primary success metric

**Tasks:**
- [ ] **Get inexperienced user** (non-developer)
- [ ] **Give them a paper form** (e.g., Triage.pdf or similar)
- [ ] **Ask them to recreate it** in the form builder
- [ ] **Observe:**
  - Can they figure out how to start?
  - Can they add sections and fields?
  - Can they configure field properties?
  - Do they get stuck anywhere?
  - Do they need help or documentation?
- [ ] **Success = ** User completes form without asking for help
- [ ] **Failure = ** User needs guidance or can't complete
- [ ] **Iterate:** Fix any UX issues discovered

**Deliverable:** Validation that inexperienced user can use builder

---

#### 12.3 Bug Fixes
**Purpose:** Fix issues found during testing

**Tasks:**
- [ ] Compile list of bugs found
- [ ] Prioritize: Critical, High, Medium, Low
- [ ] Fix critical and high priority bugs
- [ ] Re-test after fixes
- [ ] Document known issues (medium/low priority) for Phase 2

**Deliverable:** Critical bugs fixed, builder stable

---

### Phase 13: Documentation
**Goal:** Help users understand the builder

#### 13.1 Inline Help
**Purpose:** Contextual help within builder

**Tasks:**
- [ ] Add help icons (?) next to complex features
- [ ] Tooltips on field type icons
- [ ] Help text for validation JSON format
- [ ] Help text for conditional logic JSON format
- [ ] Example JSON snippets in modals

**Files Modified:**
- Various builder components

**Deliverable:** Help available where needed

---

#### 13.2 User Guide (Optional)
**Purpose:** Written documentation

**Tasks:**
- [ ] Create markdown file: `docs/form-builder-guide.md` (optional)
- [ ] Sections:
  - Getting started
  - Creating a template
  - Adding sections
  - Adding fields (with examples for each type)
  - Using preview mode
  - Publishing templates
  - Validation rules (JSON examples)
  - Conditional logic (JSON examples)
- [ ] Screenshots (optional)

**Files Created:**
- `docs/form-builder-guide.md` (optional)

**Deliverable:** Documentation available if needed

---

## 🎉 Project Complete!

### Final Checklist

**Core Features:**
- [x] Create, edit, delete, clone templates
- [x] Add, edit, delete, reorder sections
- [x] Add, edit, delete, reorder, duplicate fields
- [x] Support all 10 field types
- [x] Configure field properties
- [x] Preview mode
- [x] Save draft
- [x] Publish template
- [x] Integration with form renderer

**Quality:**
- [x] Error handling
- [x] Loading states
- [x] Empty states
- [x] UI polish matching existing app
- [x] Mobile responsive

**Validation:**
- [x] Manual testing complete
- [x] Success criteria met (inexperienced user test)
- [x] Critical bugs fixed

**Documentation:**
- [x] Inline help added
- [x] User guide written (optional)

---

## 📊 Estimated Timeline

**Phase 0: Foundation Setup** - 2-4 hours
**Phase 1: Landing Page** - 4-6 hours
**Phase 2: Editor Layout** - 4-6 hours
**Phase 3: Section Management** - 4-6 hours
**Phase 4: Field Type Palette** - 2-4 hours
**Phase 5: Field Configuration** - 8-12 hours (most complex)
**Phase 6: Field Management UI** - 3-4 hours
**Phase 7: Preview Mode** - 2-3 hours
**Phase 8: Save & Publish** - 3-4 hours
**Phase 9: Template Metadata** - 2-3 hours
**Phase 10: Polish** - 4-6 hours
**Phase 11: Integration** - 2-3 hours
**Phase 12: Testing** - 6-8 hours
**Phase 13: Documentation** - 2-4 hours

**Total: ~50-75 hours = 2-3 weeks for solo developer**

---

## 🚀 Phase 2 Roadmap (Future)

After MVP is complete and validated:

1. **Visual Validation Builder** (~3-5 days)
   - Replace JSON editor with visual rule builder
   - Drag-and-drop rule ordering

2. **Visual Conditional Logic Builder** (~5-7 days)
   - Replace JSON editor with visual IF/THEN builder
   - Field dependency graph visualization

3. **Version Control** (~3-5 days)
   - Snapshot on publish
   - Version history viewer
   - Rollback functionality
   - Diff viewer

4. **Auto-Save** (~2-3 days)
   - Debounced auto-save every 2 minutes
   - Conflict detection
   - "Saving..." indicator

5. **Drag-and-Drop Reordering** (~5-7 days)
   - Integrate @dnd-kit/core
   - Drag sections to reorder
   - Drag fields to reorder
   - Drag fields between sections

6. **Upgrade to Split-Panel UI** (~7-10 days)
   - Component palette panel
   - Canvas panel
   - Properties panel
   - Resizable panels

---

## 📝 Notes

- **Work sequentially** - complete each phase before moving to next
- **Test frequently** - don't wait until end to test
- **Commit often** - commit after each phase completion
- **Ask questions** - if anything is unclear, ask before implementing
- **Iterate** - if something doesn't work, adjust and try again
- **Focus on MVP** - don't add features not in the plan
- **User test early** - test with inexperienced user before considering "done"

---

*This plan is based on the Q&A session documented in formBuilderScopeQandA.md and represents a realistic, achievable MVP for a solo developer focused on quality over speed.*
