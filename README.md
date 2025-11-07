# Technology Triage Platform

A sophisticated web application that digitalizes the Cincinnati Children's Hospital Medical Center (CCHMC) technology triage evaluation process. Built with a modern, database-driven architecture.

## 📌 Current Status

**For complete project status, roadmap, and metrics:** See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)

**Quick Facts:**
- ✅ Live at: https://tech-triage-app.azurewebsites.net
- ✅ Database-driven dynamic forms with builder interface
- ✅ PDF export with scoring graphics
- ✅ Azure PostgreSQL + App Service deployment
- ✅ Automated export pipeline (Windows task every 48h)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git
- Terminal access

### 1. Start Development Environment

```bash
# Clone and setup (if first time)
cd tech-triage-platform
npm install

# Start both servers (required for full functionality)
npm run dev              # Terminal 1: Web server
npx prisma dev          # Terminal 2: Database server
```

> **Need captured logs?** Use the `:logs` variants to mirror output into the `logs/` directory while still streaming to the console:

```bash
npm run dev:logs         # Writes logs/next-dev-YYYYMMDD-HHMMSS.log
npm run prisma:dev:logs  # Writes logs/prisma-dev-YYYYMMDD-HHMMSS.log
```

**Access Points:**
- **Web App**: http://localhost:3000
- **Database**: Running on ports 51213-51215
- **Prisma Studio** (optional): `npx prisma studio`

## ☁️ Azure Deployment Overview

We support two deployment paths. Use the lightweight incremental push for routine releases; fall back to the full provisioning script when infrastructure elements need to be (re)created.

1. **Incremental update (recommended day-to-day)**
   - Build and push the image from repo root:
     ```bash
     az acr build --registry innovationventures --image tech-triage-platform:prod .
     ```
   - Restart the container so the Web App pulls the new digest:
     ```bash
     az webapp restart -g rg-eastus-hydroxyureadosing -n tech-triage-app
     ```
   - Verify `/api/health` returns `{"status":"healthy","database":"connected"}`.
   - Reference: `docs/guides/deployment-guide.md` (incremental steps and troubleshooting tips).

2. **Full provisioning / configuration refresh**
   - Export required secrets (`POSTGRES_ADMIN`, `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, etc.) in your shell **before** running the script if Key Vault reads are blocked.
   - Execute the automation script:
     ```bash
     ./scripts/deploy-to-azure.sh
     ```
   - Script ensures resource group, Postgres Flexible Server, App Service plan, Web App settings, and container image configuration are up to date.
   - Reference: `AZURE_HANDOVER.md` (Section “Deployment Workflow”) for detailed explanations of each step.

> **Tip:** In production environments avoid demoting the last active form template. If the dynamic form shows “Failed to load form template,” confirm at least one template has `isActive = true` in the Azure database.

### 2. Quality Checks

```bash
npm run lint         # ESLint + TypeScript-aware linting
npm run type-check   # Strict TypeScript validation with tsc --noEmit
npm run test -- custom-validation  # Targeted validation rule tests
npm test -- demo-seeding # Prisma demo data integrity tests
```

### 3. Available Form Implementations

**Two Completely Separate Form Systems:**

- ✅ **Hardcoded Form**: `/form` - 100% hardcoded, production-ready, NO database usage
- ✅ **Dynamic Form**: `/dynamic-form` - 100% database-driven prototype (needs enhancement)
- ✅ **Landing Page**: `/` - Marketing homepage with design system
- ✅ **PDF Export**: `/api/form-exports` - Generates print-ready PDF reports (see "🧾 PDF Export & Reporting")

## 🧾 PDF Export & Reporting

The dynamic form now supports PDF exports that mirror the in-browser scoring experience but render in a report-first layout. The export endpoint is designed to work for blank templates, active drafts, or fully submitted responses.

### Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/form-exports` | Returns a PDF attachment summarizing the supplied form state or stored submission |

### Request Payloads

```jsonc
// Live form state (current user session)
{
  "templateId": "tmpl_123",
  "responses": { "F0.1": "1024-AC", "F2.1.a": "Aligned with ..." },
  "repeatGroups": {
    "F4.5": [ { "name": "Competitor A", "comments": "..." } ]
  },
  "status": "IN_PROGRESS" // BLANK | IN_PROGRESS | DRAFT | SUBMITTED, defaults to IN_PROGRESS
}

// Stored submission re-download
{
  "submissionId": "subm_456"
}
```

The API normalizes option labels, repeatable group rows, and scoring metrics before generating the PDF.

### Output Features
- Numbered question/response layout with concise typography
- Repeatable group tables rendered as row blocks
- Scoring matrix table (Impact & Value sections with weights/totals)
- Impact vs Value quadrant graphic with recommendation pill
- Automatic page break before analytics section to keep graphics intact

If the export should include additional branding (logos, headers) drop assets in `public/` and update `src/lib/form-engine/pdf/FormPdfDocument.tsx`.

## 📊 Current Project Status

### ✅ Phase 1: Foundation (COMPLETED - Production Ready)
- [x] Next.js 14+ with App Router, TypeScript, Tailwind CSS
- [x] Complete design system (#2563EB blue theme, shadcn/ui)
- [x] Prisma ORM with PostgreSQL database
- [x] Landing page with 3D visuals and branding
- [x] Comprehensive database schema (hardcoded + dynamic models)

### ✅ Phase 2: Hardcoded Form System (COMPLETED - Production Ready)
**Location**: `/form` route - **ZERO database usage**
- [x] **Static React components** - all questions hardcoded in TSX files
- [x] **Complete 9-section form** with pixel-perfect UI
- [x] **Auto-calculation engine** replicating Excel scorecard logic
- [x] **All sections implemented**:
  - HeaderSection.tsx, TechnologyOverviewSection.tsx, MissionAlignmentSection.tsx
  - UnmetNeedSection.tsx, StateOfArtSection.tsx, MarketAnalysisSection.tsx
  - DigitalConsiderationsSection.tsx, ScoreRecommendationSection.tsx, SummarySection.tsx
- [x] **Reusable components**: ScoringComponent, dynamic tables, navigation
- [x] **Complete E2E testing** with Playwright validation
- [x] **Production ready** but requires code changes to modify questions

### ✅ Phase 3: Database-Driven Form Engine (COMPLETED - Basic Implementation)
**Location**: `/dynamic-form` route - **100% database-driven**
- [x] **Database schema** with FormTemplate/Section/Question models
- [x] **Dynamic form renderer** with field adapters for all types
- [x] **Form state management** using React Context and reducer
- [x] **API integration** loading form structure from `/api/form-templates`
- [x] **Field adapters**: text, select, scoring, checkbox, repeatable groups
- [x] **Conditional logic engine** for field visibility
- [x] **Seed data** with structured F0–F6 sections and optional demo submissions

- ### 🔧 Phase 4: Enhanced Dynamic Forms & Reporting (IN PROGRESS)
**Highlights (2025-10-03 build):**
- [x] **PDF export service** – `/api/form-exports` streams blank/draft/submitted forms with a print-first layout and scoring visuals
- [x] **Report layout polish** – numbered question/response list, scoring matrix, impact vs value quadrant, automatic page break handling
- [x] **Builder build optimization** – `/dynamic-form/builder` renders dynamically at runtime so container builds succeed without DATABASE_URL
- [x] **Data Table configurator** – authors define table columns, input types, required flags, and row limits directly in the builder (stored in Prisma `repeatableConfig`)
- [x] **Data Table with Selector** – new field type with predefined stakeholder rows, include checkbox, and conditional notes column
- [x] **Dropdown UX improvements** – labeled database keys, underscore slug normalization, and enforced option limits using shared constants
- [x] **Server log capture** – `npm run dev:logs` / `npm run prisma:dev:logs` mirror terminal output into `logs/` for offline review
- [ ] **Integration tests** – Need Playwright coverage for export flows, data table editing, and regression checks
- [ ] **Dynamic guidance capture** – Info boxes remain hidden in exports; future work: render as callouts

### 📋 Phase 5+: Production Features (PLANNED)
- [ ] Authentication & user management (NextAuth.js)
- [ ] PDF report generation and export
- [ ] Admin dashboard for form management
- [ ] Analytics and submission tracking
- [ ] CCHMC SSO integration

## 🏗️ Software Architecture & Design

### Technology Stack
- **Frontend Framework**: Next.js 14 with App Router
- **Languages**: TypeScript, JavaScript, CSS
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context + useReducer pattern
- **Database ORM**: Prisma with PostgreSQL
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Testing**: Playwright for E2E testing

### Architecture Overview

The platform contains **two completely separate form systems** - one hardcoded and one database-driven:

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│  React Components │  Form State   │  UI Components         │
│  (form sections)  │  Management   │  (shadcn/ui)           │
├─────────────────────────────────────────────────────────────┤
│                  Next.js App Router                         │
├─────────────────────────────────────────────────────────────┤
│     API Routes    │  Server Actions │   Dynamic Renderer   │
│   (form-templates)│   (coming)      │   (Form Engine)      │
├─────────────────────────────────────────────────────────────┤
│                    Prisma ORM                               │
├─────────────────────────────────────────────────────────────┤
│               PostgreSQL Database                           │
│  • TriageForm (hardcoded)  • FormTemplate (dynamic)        │
│  • Competitor data         • FormSection/Question          │
│  • SME data               • FormSubmission                 │
└─────────────────────────────────────────────────────────────┘
```

### Two Separate Form Systems

#### **System 1: Hardcoded Form** (`/form`)
- **React components with hardcoded questions** - all text/labels in TSX files
- **No database interaction** - pure client-side React state
- **Production-ready** with complete 9-section form
- **Requires code changes** to modify any question or text
- **Files**: HeaderSection.tsx, MissionAlignmentSection.tsx, etc.

#### **System 2: Database-Driven Form** (`/dynamic-form`)
- **100% database-driven** - questions loaded from API
- **Field adapters** render UI based on database field types
- **Form engine** with React Context state management
- **Admin configurable** - change questions via database updates
- **Files**: FormEngineProvider, DynamicFormRenderer, FieldAdapters

### Project Structure
```
tech-triage-platform/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── page.tsx                   # Landing page (✅)
│   │   ├── form/page.tsx              # ✅ HARDCODED FORM (no DB)
│   │   ├── dynamic-form/page.tsx      # ✅ DATABASE FORM (100% DB)
│   │   ├── api/form-templates/        # API for dynamic form only
│   │   └── globals.css                # Design system styles
│   ├── components/
│   │   ├── form/                      # HARDCODED form components
│   │   │   ├── HeaderSection.tsx      # ✅ Hardcoded questions
│   │   │   ├── TechnologyOverviewSection.tsx
│   │   │   ├── MissionAlignmentSection.tsx
│   │   │   ├── UnmetNeedSection.tsx
│   │   │   ├── StateOfArtSection.tsx
│   │   │   ├── MarketAnalysisSection.tsx
│   │   │   ├── DigitalConsiderationsSection.tsx
│   │   │   ├── ScoreRecommendationSection.tsx
│   │   │   ├── SummarySection.tsx
│   │   │   ├── ScoringComponent.tsx   # Shared scoring UI
│   │   │   └── DynamicFormNavigation.tsx # Guides database-driven flow
│   │   └── ui/                        # shadcn/ui components (shared)
│   └── lib/
│       ├── prisma.ts                  # ✅ Database client
│       ├── scoring.ts                 # ✅ Hardcoded form calculations
│       ├── utils.ts                   # Utility functions
│       └── form-engine/               # DATABASE-DRIVEN form system
│           ├── index.ts               # Exports context + hooks
│           ├── types.ts               # TypeScript definitions
│           ├── renderer.tsx           # Dynamic form renderer
│           ├── conditional-logic.ts   # Field visibility rules
│           ├── validation.ts          # Validation framework
│           ├── json-utils.ts          # Repeatable group helpers
│           ├── field-mappings-simple.ts
│           └── fields/
│               └── FieldAdapters.tsx  # Maps DB fields to UI
├── prisma/
│   ├── schema.prisma                  # Database schema
│   ├── migrations/                    # Database version control
│   └── seed/
│       ├── index.ts                   # Orchestrates seeding pipeline
│       ├── form-structure.ts          # Dynamic form seed data
│       ├── demo-submissions.ts        # Demo submission generator
│       ├── option-mapper.ts           # Canonical option lookups
│       ├── prisma-factory.ts          # Shared Prisma client creator
│       └── types.ts                   # Seed-specific typings
├── scripts/
│   ├── start.sh                       # Docker entrypoint
│   ├── create-synthetic-submissions.ts # Generate large demo datasets
│   └── verify-demo-data.ts            # Validates seeded demo data
├── NEXT_STEPS.md                      # Development roadmap
├── IMPLEMENTATION_PLAN.md             # Detailed Phase 4 plan
├── CLAUDE.md                          # Project context & history
└── package.json                       # Dependencies
```

### Form State Management

#### **Hardcoded Form State**
```typescript
// Uses React state with form navigation
const [currentStep, setCurrentStep] = useState(0);
const [formData, setFormData] = useState<FormData>({...});
```

#### **Dynamic Form State**
```typescript
// Uses React Context + useReducer pattern
interface FormState {
  template: FormTemplateWithSections;
  responses: Record<string, unknown>;
  repeatGroups: Record<string, unknown>;
  currentSection: number;
  isLoading: boolean;
  errors: Record<string, string>;
}

#### Usage note: passing `initialData` safely
- When using `FormEngineProvider`, pass a memoized `initialData` object so the provider doesn’t rehydrate on every parent re-render.
- Example:

```tsx
const memoInitialData = useMemo(() => initialFormData ? {
  responses: initialFormData.responses,
  repeatGroups: initialFormData.repeatGroups,
} : undefined, [initialFormData]);

<FormEngineProvider template={template} initialData={memoInitialData}>
  {/* ... */}
</FormEngineProvider>
```

- The provider also includes an internal deep-equality guard and will only rehydrate when the contents of `initialData` change. Passing `undefined` later will not clear in-progress user input.
```

### Data Flow

#### **Form Loading**
1. Client requests `/dynamic-form`
2. `useEffect` calls `/api/form-templates`
3. API queries database via Prisma
4. Returns FormTemplate with nested sections/questions
5. FormEngineProvider initializes state
6. DynamicFormRenderer renders current section

#### **User Interaction**
1. User interacts with field component
2. FieldAdapter calls `onChange` handler
3. FormContext `setResponse` updates state
4. Conditional logic re-evaluates field visibility
5. Auto-calculations trigger for scoring fields
6. UI re-renders with updated state

## 🗄️ Database Schema

### **Hardcoded Form Models** (Production Data)
```prisma
model TriageForm {
  id                    String   @id @default(cuid())
  reviewer              String   # Form header
  technologyId          String
  inventorsTitle        String
  domainAssetClass      String

  # Content sections
  technologyOverview    String
  missionAlignmentText  String
  missionAlignmentScore Int      # 0-3 scale
  unmetNeedText         String
  unmetNeedScore        Int      # 0-3 scale
  stateOfArtText        String
  stateOfArtScore       Int      # 0-3 scale
  marketOverview        String
  marketScore           Int      # Auto-calculated

  # Auto-calculated final scores
  impactScore           Float    # (Mission + Need) / 2
  valueScore            Float    # (Art + Market) / 2
  recommendation        String   # "Proceed" | "Alternative"

  # Related data
  competitors           Competitor[]
  experts               SubjectMatterExpert[]
}
```

### **Dynamic Form Models** (Form Engine)
```prisma
model FormTemplate {
  id          String        @id @default(cuid())
  name        String        # "CCHMC Technology Triage Form"
  version     String        # "1.0.0"
  isActive    Boolean       # Multiple versions support
  sections    FormSection[] # Ordered sections
}

model FormSection {
  id          String         @id @default(cuid())
  code        String         # "F0", "F1", "F2"
  title       String         # "Header and Identifiers"
  order       Int            # Display order
  questions   FormQuestion[] # Section questions
}

model FormQuestion {
  id           String          @id @default(cuid())
  fieldCode    String          # "F0.1", "F1.1.a"
  label        String          # "Technology ID"
  type         FieldType       # Enum: SHORT_TEXT, SCORING_0_3, etc.
  helpText     String?         # Help tooltip content
  conditional  Json?           # Show/hide logic
  order        Int             # Question order
  options      QuestionOption[] # For select fields
  scoringConfig ScoringConfig? # For scoring fields
}
```

### **Form Submission Storage**
```prisma
model FormSubmission {
  id           String            @id @default(cuid())
  templateId   String            # Which form version
  status       SubmissionStatus  # DRAFT | SUBMITTED | REVIEWED
  submittedBy  String            # User identifier
  responses    QuestionResponse[] # All answers
  scores       CalculatedScore[]  # Auto-calculated values
}
```

### **Field Types & Adapters**
```typescript
enum FieldType {
  SHORT_TEXT      // Input component
  LONG_TEXT       // Textarea component
  INTEGER         // Number input
  SINGLE_SELECT   // Select dropdown
  MULTI_SELECT    // Checkbox group
  SCORING_0_3     // ScoringComponent (0-3 scale)
  REPEATABLE_GROUP // Dynamic table (competitors, SME)
  CHECKBOX_GROUP  // Multiple checkboxes
  DATE            // Date picker
}
```

### **Scoring & Calculation Logic**
```typescript
// Auto-calculation formulas (matching original Excel)
Impact Score = (Mission Alignment × 50%) + (Unmet Need × 50%)
Value Score = (State of Art × 50%) + (Market Score × 50%)
Market Score = (Market Size + Patient Population + Competitors) ÷ 3

// Recommendation matrix based on Impact vs Value positioning
if (impact >= 2 && value >= 2) → "Proceed"
else → "Alternative Pathway"
```

## 🎨 Design System

### Colors
- **Primary**: #2563EB (blue-600)
- **Secondary**: #3B82F6, #6366F1, #1F2937
- **Neutral**: #4B5563, #E5E7EB, #FFFFFF

### Typography
- **Headings**: Poppins/Inter (modern sans-serif)
- **Body**: Open Sans (clean sans-serif)

## 🛠️ Development Setup & Commands

### **Server Startup** (Required for Development)
```bash
# Terminal 1: Web server
npm run dev                 # → http://localhost:3000

# Terminal 2: Database server
npx prisma dev             # → ports 51213-51215

# Optional: Database browser
npx prisma studio          # → http://localhost:5555
```

### **Essential Commands**
```bash
# Development workflow
npm run dev              # Start Next.js development server
npm run build           # Production build
npm run lint            # ESLint code quality check
npm run type-check      # TypeScript validation
npx playwright test     # Run E2E tests

# Database operations
npx prisma generate     # Generate TypeScript client
npx prisma migrate dev  # Create and apply migrations
npm run db:seed         # Reset database with fresh data
npx prisma studio       # Visual database browser
```

### **Database Management**
```bash
# Fresh database setup
npx prisma migrate reset    # ⚠️ Destroys all data
npm run db:seed            # Populates with test data

# Production deployment
npx prisma migrate deploy  # Apply migrations to production
npx prisma generate        # Update client for production

# Debugging
npx prisma db push         # Push schema without migration
npx prisma migrate status  # Check migration state
```

### **Development Workflow**
1. **Start servers**: `npm run dev` + `npx prisma dev`
2. **Make changes**: Edit components or schema
3. **Database changes**: Run `npx prisma migrate dev`
4. **Test changes**: Use both form implementations
5. **Commit**: Standard git workflow

### **Component Development**
```bash
# Add new shadcn/ui component
npx shadcn@latest add button    # Installs to src/components/ui/

# Run type checking during development
npm run type-check -- --watch

# Run tests in watch mode
npx playwright test --ui        # Interactive test runner
```

## 📚 Documentation & References

### Project Files
- `CLAUDE.md` - Detailed development guide and progress tracking
- `Triage.pdf` - Original CCHMC form reference
- `Tech Triage Design System.jpg` - UI/UX specifications
- `Tech Triage Landing Page.jpg` - Design mockups

### Form Requirements
Based on the original CCHMC triage form:
1. **Header Section**: Reviewer, Technology ID, Inventors, Domain
2. **Technology Overview**: Detailed description
3. **Scoring Sections**: Mission Alignment, Unmet Need, State of Art (0-3 scale)
4. **Market Analysis**: Overview + competitor table with auto-scoring
5. **Digital Considerations**: 4 yes/no questions
6. **Results**: Auto-calculated Impact vs Value matrix with recommendations

## 🚀 Next Development Steps (Phase 4)

### **Immediate Priority Tasks**
Based on NEXT_STEPS.md roadmap:

1. **Enhanced Question Structure** (1-2 days)
   - Update seed data with 60+ questions from questions_broken_out.txt
   - Implement proper field codes (F0.1, F1.1.a, etc.)
   - Add conditional logic for context-dependent questions

2. **Functional Repeatable Groups** (2-3 days)
   - Replace RepeatableGroupField placeholder with functional component
   - Implement competitor table with add/remove/edit capabilities
   - Create SME table with dynamic row management

3. **Form Persistence** (2-3 days)
   - Create form submission API endpoints
   - Implement auto-save draft functionality (every 30 seconds)
   - Add form resume capability from saved drafts

4. **Validation Framework** (1-2 days)
   - Create comprehensive Zod validation schemas
   - Add real-time validation feedback
   - Implement required field indicators

### **Development Priorities**
- **Phase 4 Focus**: Transform dynamic form from prototype to production-ready
- **Timeline**: ~8-10 working days for complete implementation
- **Success Metric**: Full feature parity with hardcoded form + database persistence

## 🔧 Environment & Configuration

### **Required Environment Variables**
Copy `.env.example` to `.env.local` and update values:
```env
# Database (auto-generated by Prisma dev server)
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=..."

# Demo data configuration (default: true for new installations)
SEED_DEMO_DATA=true    # Include 4 sample submissions
# SEED_DEMO_DATA=false # Clean database for production
```

### **Local Development Setup**
1. **Install dependencies**: `npm install`
2. **Configure environment**: `cp .env.example .env.local`
3. **Start database**: `npx prisma dev` (background process, includes demo data by default)
4. **Start web server**: `npm run dev`
5. **Open browser**: http://localhost:3000

### **Demo Data Control**
The seeding pipeline in `prisma/seed/index.ts` now supports configurable demo submissions and repeatable verification:

**Fast local resets:**
```bash
npm run db:seed                     # Seeds structure + demo submissions by default
SEED_DEMO_DATA=false npm run db:seed # Seeds structure only (clean database)
```

**Development Mode (default):**
```bash
SEED_DEMO_DATA=true npm run dev   # Starts app + Prisma with demo data hydrated
```

**Production Mode:**
```bash
SEED_DEMO_DATA=false npm run dev  # Runs without inserting demo submissions
```

**Docker Environment:**
```bash
docker-compose up -d                                # Includes demo data by default
SEED_DEMO_DATA=false docker-compose up -d          # Clean production database
```

**Verification & tooling:**
```bash
npx tsx scripts/verify-demo-data.ts        # Validates seeded submissions + score types
npx tsx scripts/create-synthetic-submissions.ts # Generates large synthetic datasets on demand
```

**Sample Demo Data Included:**
- ✅ Smart Insulin Pump (High Impact/High Value → Proceed)
- ✅ VR Pain Therapy (Medium Impact/Medium Value → Alternative Pathway)
- ✅ Rapid Genetic Screening (High Impact/Low Value → Consider Alternative)
- 📝 AI Radiology Assistant (Draft submission, partially completed)

### **Troubleshooting**
```bash
# Database connection issues
npx prisma db push          # Force schema sync
npx prisma generate         # Regenerate client

# Port conflicts
lsof -ti:3000 | xargs kill  # Kill Next.js server
lsof -ti:51213 | xargs kill # Kill Prisma server

# Clean restart
npm run build               # Verify build works
rm -rf .next prisma/dev.db  # Clean cache
```

## 📚 Key Resources

### **Project Documentation**
- `IMPLEMENTATION_PLAN.md` - Detailed Phase 4 implementation guide
- `NEXT_STEPS.md` - Complete project roadmap through Phase 6
- `CLAUDE.md` - Development context and project history
- `questions_broken_out.txt` - Complete question requirements (60+ questions)

### **Reference Materials**
- `Triage.pdf` - Original CCHMC form specification
- `Tech Triage Design System.jpg` - UI/UX design requirements
- Design system implementation at `/` (landing page)

### **Form Requirements Summary**
1. **60+ granular questions** across 7 main sections
2. **Auto-calculation engine** replicating Excel scorecard logic
3. **Dynamic tables** for competitor analysis and SME recommendations
4. **Conditional logic** for field visibility based on user inputs
5. **Draft persistence** with auto-save and resume capabilities
6. **Comprehensive validation** with real-time feedback

### **Architecture Decisions**
- **Two separate systems**: Hardcoded (immediate use) + Database-driven (flexible future)
- **No code sharing**: Each system is completely independent
- **Shared UI components**: Both use same shadcn/ui components for visual consistency
- **Different state management**: Hardcoded uses useState, Dynamic uses Context+reducer
- **TypeScript first**: Comprehensive type safety throughout both systems
