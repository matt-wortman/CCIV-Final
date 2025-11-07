# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📊 Quick Reference

- **Project Status & Roadmap**: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
- **Getting Started Guide**: [docs/START-HERE.md](docs/START-HERE.md)
- **Architecture Overview**: [docs/architecture/system-overview.md](docs/architecture/system-overview.md)
- **Deployment Guide**: [docs/guides/deployment-guide.md](docs/guides/deployment-guide.md)

## Project Overview

Production web application for Cincinnati Children's Hospital Medical Center (CCHMC) that digitalizes their medical technology evaluation process. The platform is **live at https://tech-triage-app.azurewebsites.net**.

**Core Features:**
- Database-driven dynamic forms with visual builder
- Form submissions with draft/autosave capabilities
- PDF export with scoring graphics
- Automated export pipeline (Windows task every 48h)
- Multi-stage technology lifecycle tracking

**Tech Stack:** Next.js 15 (App Router), TypeScript, PostgreSQL (Prisma), Azure App Service, Tailwind CSS + shadcn/ui

## 🚨 Evidence-Based Development Protocol

This project follows a **mandatory three-evidence rule** for all code changes:

### 1. CONTEXTUAL EVIDENCE (Before writing code)
```bash
# Find similar implementations in this codebase:
grep -r "FormSubmission" --include="*.ts" src/
grep -r "questionResponse" --include="*.ts" prisma/
cat src/app/dynamic-form/actions.ts  # See how data is stored
```

### 2. TYPE EVIDENCE (While writing code)
```bash
npm run type-check     # Run after every 20 lines - MANDATORY
npm run lint          # Additional code quality checks
```

### 3. EXECUTION EVIDENCE (After writing code)
```bash
npm test                    # Run Jest tests
npm test -- <test-name>     # Run specific test
npx prisma studio           # Verify database data
tsx scripts/test-feature.ts # Custom verification scripts
```

### Critical Data Contract Rules
- Form field values use snake_case: `"medical_device"` not `"Medical Device"`
- Store data as proper types using `Prisma.InputJsonValue`, not `String(value)`
- Question responses expect exact option values from database
- All submissions must have valid templateId from existing FormTemplate

## 🎯 System Architecture

### Core Design Principles
1. **100% Database-Driven** - ALL form structure comes from database (questions, sections, options, validation rules)
2. **Zero Hardcoding** - Adding a question = database insert, NOT code change
3. **Multi-Stage Lifecycle** - Technology entities progress through Triage → Viability → Portfolio stages
4. **Binding Architecture** - Form submissions can bind to Technology entities for write-back tracking

### Key Routes
- `/` - Landing page
- `/dynamic-form` - Form runtime (database-driven)
- `/dynamic-form/builder` - Visual form builder interface
- `/dynamic-form/submissions` - Submission list view
- `/api/form-templates` - Template API
- `/api/form-exports` - PDF export endpoint

### Database Architecture
**Primary Models:**
- `FormTemplate` / `FormSection` / `FormQuestion` - Form structure definitions
- `FormSubmission` / `QuestionResponse` - User submissions and responses
- `Technology` / `TriageStage` / `ViabilityStage` / `PortfolioStage` - Entity lifecycle
- `QuestionDictionary` - Canonical question registry for reuse

**Scoring System:**
- 0-3 scale for all criteria
- Weighted: Impact (Mission Alignment 50% + Unmet Need 50%)
- Weighted: Value (State of Art 50% + Market 50%)
- Auto-calculated final scores with Impact vs Value matrix

See [docs/architecture/data-model.md](docs/architecture/data-model.md) for complete schema documentation.

### UI Component Library
- **shadcn/ui components** - Button, Input, Select, Textarea, Card, Badge, etc.
- **Form handling** - React Hook Form + Zod validation
- **Styling** - Tailwind CSS with design system colors (#2563EB primary blue)

## Environment Modes

This project supports **three distinct database/runtime modes**. Choose the right one for your workflow:

### 1. Prisma Dev Server Mode (Default - Fast Local Iteration)
**Best for**: Quick UI/API iteration without Docker overhead

**Start commands (in separate terminals):**
```bash
# Terminal 1: Start Prisma Dev Server
npx dotenv-cli -e .env.prisma-dev -- npx prisma dev

# Terminal 2: Start Next.js dev server
npm run dev  # Uses .env.prisma-dev, Turbopack enabled
```

**Relevant files**: `.env.prisma-dev`
**Database location**: Prisma-managed local service (`prisma+postgres://localhost:51213/...`)
**Ports**: Prisma runs on 51213-51215, Next.js on 3000

**Optional tools:**
```bash
npm run studio          # Prisma Studio (uses .env.prisma-dev)
npm run db:seed:dev     # Seed dev database
```

**Teardown:**
- `Ctrl+C` both terminals
- Prisma leaves data in `.prisma-server` directory (no cleanup needed)

---

### 2. Local Docker Postgres Mode (Integration Testing)
**Best for**: Testing against containerized Postgres, parity with deployment

**Start commands:**
```bash
# Start Postgres container
docker-compose up -d database

# Start Next.js with .env (not .env.prisma-dev)
npx dotenv-cli -e .env -- next dev

# OR for production build testing:
npm run build
npx next start -p 3001
```

**Relevant files**: `.env`
**Database location**: Docker container (`localhost:5432`)
**Ports**: Postgres on 5432, Next.js on 3000 (or custom)

**Teardown:**
```bash
docker-compose down
```

---

### 3. Azure Production Mode (Live Deployment)
**Best for**: Production runtime, debugging Azure-specific issues

**Database location**: Azure Database for PostgreSQL Flex (remote)
**Configuration**: App Service environment variables
**Entry script**: `scripts/start.sh` runs migrations + optional seed
**Control seeding**: Set `RUN_PRISMA_SEED=true/false` in App Service config

**Manual operations:**
```bash
# SSH into container
az webapp ssh -g <resource-group> -n <app-name>

# Tail logs
az webapp log tail -g <resource-group> -n <app-name>
```

---

### Switching Between Modes

**Important**: Only one mode should be active at a time. Before switching:
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs -r kill -9
```

| From → To | Steps |
|-----------|-------|
| **Prisma Dev → Docker** | Stop both dev terminals (`Ctrl+C`), run `docker-compose up -d database`, start Next with `.env` |
| **Prisma Dev → Azure** | Stop dev servers, `npm run build`, deploy container to Azure |
| **Docker → Prisma Dev** | Run `docker-compose down`, start Prisma dev + Next.js dev servers |

**See also**: `ENVIRONMENT_MODES.md` for detailed troubleshooting and pitfalls

---

## 🛠️ Development Commands

### Quick Start (Local Development)
```bash
# Terminal 1: Start Prisma Dev Server
npm run prisma:dev              # Uses .env.prisma-dev

# Terminal 2: Start Next.js
npm run dev                     # Uses .env.prisma-dev, Turbopack enabled

# Optional: Database browser
npm run studio                  # Open Prisma Studio
```

### Essential Commands
```bash
# Type Safety & Linting
npm run type-check              # TypeScript validation - MANDATORY after code changes
npm run lint                    # ESLint code quality

# Testing
npm test                        # Run Jest test suite
npm test -- <test-name>         # Run specific test file
npm test -- --watch             # Watch mode

# Database Operations
npm run db:seed:dev             # Seed dev database with test data
npx prisma migrate dev          # Create and apply migrations
npx prisma generate             # Regenerate Prisma client
npx prisma db push              # Push schema without migration (dev only)

# Build & Deploy
npm run build                   # Production build (Turbopack)
npm start                       # Start production server
npm run export-forms            # Manual form export script
```

### CI/CD Workflows (GitHub Actions)
```bash
# Automated pipelines in .github/workflows/
.github/workflows/ci.yml                # Build, lint, test on PR
.github/workflows/nightly-regression.yml # Daily regression suite
.github/workflows/security-scan.yml     # Weekly Trivy container scan
```

### Azure Deployment
```bash
# Incremental deployment (recommended)
az acr build --registry innovationventures --image tech-triage-platform:prod .
az webapp restart -g rg-eastus-hydroxyureadosing -n tech-triage-app

# Full provisioning (when infrastructure changes needed)
./scripts/deploy-to-azure.sh   # Requires env vars: POSTGRES_ADMIN, POSTGRES_PASSWORD, etc.
```

See [docs/guides/deployment-guide.md](docs/guides/deployment-guide.md) for detailed deployment procedures.

## 📋 Current Project Status

**See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for complete current status, roadmap, and metrics.**

### Production System Status: ✅ Live & Operational
- **Live URL**: https://tech-triage-app.azurewebsites.net
- **Database**: Azure PostgreSQL Flexible Server (`techtriage-pgflex`)
- **Deployment**: Azure App Service + Container Registry
- **CI/CD**: GitHub Actions (build, test, security scanning)
- **Automated Exports**: Windows task every 48 hours

### Current Development Focus (Oct 2025)
1. **Binding write-back parity** - Technology/Triage entity synchronization
2. **Optimistic locking UX** - Stale draft messaging and conflict handling
3. **Catalog validator coverage** - Builder/runtime alignment verification
4. **Phase 0 question revision pilot** - Shadow schema and performance validation
5. **Security hardening** - NextAuth adoption planning
6. **Persona enablement** - Authorization matrix for role-based access

## 📁 Key Directories & Files

```
src/
├── app/                                  # Next.js App Router
│   ├── dynamic-form/                     # Form runtime & builder
│   │   ├── page.tsx                      # Form runtime
│   │   ├── builder/[templateId]/         # Visual form builder
│   │   ├── submissions/                  # Submission views
│   │   └── actions.ts                    # Server actions
│   └── api/
│       ├── form-templates/               # Template CRUD API
│       ├── form-exports/                 # PDF export endpoint
│       └── health/                       # Health check
├── components/
│   ├── form-builder/                     # Builder UI (SectionCard, FieldCard, etc.)
│   └── ui/                               # shadcn/ui components
├── lib/
│   ├── form-engine/                      # Core form engine
│   │   ├── types.ts                      # Type definitions
│   │   ├── renderer.tsx                  # Dynamic rendering
│   │   ├── fields/FieldAdapters.tsx      # Field type adapters
│   │   ├── conditional-logic.ts          # Visibility rules
│   │   ├── validation.ts                 # Validation framework
│   │   └── pdf/FormPdfDocument.tsx       # PDF generation
│   ├── scoring/calculations.ts           # Auto-calculation engine
│   ├── technology/service.ts             # Technology entity service
│   └── prisma.ts                         # Database client
└── __tests__/                            # Jest test suite

prisma/
├── schema.prisma                         # Database schema
├── migrations/                           # Migration history
└── seed/                                 # Seed scripts

scripts/
├── deploy-to-azure.sh                    # Azure deployment script
├── export-forms.ts                       # Form export utility
└── catalog/validate-binding-paths.ts     # Catalog validator
```

## 🔒 Environment Variables

**Local Development:**
```env
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=..."  # Auto-generated by Prisma Dev
SEED_DEMO_DATA=true                      # Include demo submissions
```

**Production (Azure):**
```env
DATABASE_URL="postgresql://triageadmin:<password>@techtriage-pgflex.postgres.database.azure.com:5432/triage_db?sslmode=require"
AZURE_STORAGE_CONNECTION_STRING="<connection-string>"
NEXT_PUBLIC_TEST_USER_ID="test-user-1"  # For draft identity
RUN_PRISMA_SEED=false                    # Disable auto-seed in production
```

See [docs/guides/deployment-guide.md](docs/guides/deployment-guide.md) for complete environment setup.

## 📚 Reference Materials

- `Triage.pdf` - Original CCHMC form specification
- `Tech Triage Design System.jpg` - UI/UX design specifications
- [docs/architecture/](docs/architecture/) - Architecture documentation
- [docs/guides/](docs/guides/) - How-to guides
- [docs/runbooks/](docs/runbooks/) - Operational procedures

## ⚠️ Important Development Guidelines

- **NO hardcoding** - All form content must come from database
- **Evidence-based** - ALWAYS run type-check after code changes
- **Test before commit** - Run relevant tests for changed code
- **Database migrations** - Use `npx prisma migrate dev` for schema changes
- **Draft safety** - Implement optimistic locking for concurrent editing
- **Binding integrity** - Verify Technology write-backs with tests

---

**Note:** Do what has been asked; nothing more, nothing less. ALWAYS prefer editing existing files over creating new ones. NEVER proactively create documentation files unless explicitly requested.