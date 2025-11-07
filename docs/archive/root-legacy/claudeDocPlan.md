# Tech Triage Platform - Documentation Strategy & Plan

**Created:** 2025-10-01
**Project:** CCHMC Technology Triage Web Application
**Status:** Production Docker Deployment Complete

---

## 📋 Executive Summary

This document provides a comprehensive documentation strategy for the Tech Triage Platform, a database-driven web application for evaluating medical technology innovations. The strategy balances professional developer expectations with stakeholder accessibility while maintaining a single source of truth.

---

## 🎯 Recommended Documentation Architecture

### Industry-Standard Approach (RECOMMENDED)

```
tech-triage-platform/
├── README.md                 # High-level overview + quick start
├── ARCHITECTURE.md           # Technical deep-dive for senior devs
├── CONTRIBUTING.md           # How to maintain docs & contribute
└── docs/
    ├── adr/                  # Architecture Decision Records
    │   ├── 001-dynamic-form-engine.md
    │   ├── 002-database-schema-design.md
    │   ├── 003-docker-deployment.md
    │   └── template.md
    ├── deployment/           # Deployment guides
    │   ├── docker-setup.md
    │   └── production-deployment.md
    └── development/          # Development workflows
        ├── database-workflow.md
        ├── testing-strategy.md
        └── type-checking-protocol.md
```

### Why This Approach?

**Strengths:**
- ✅ **Industry standard** - Any developer immediately understands the structure
- ✅ **Single source of truth** - No duplicate/conflicting information
- ✅ **Scalable** - Grows naturally with project complexity
- ✅ **Decision transparency** - ADRs capture "why" we made specific choices
- ✅ **Easy navigation** - Each file has a clear, focused purpose
- ✅ **GitHub-friendly** - Renders beautifully in repository browsers

**Weaknesses:**
- ⚠️ Requires discipline to update after major changes
- ⚠️ More files to maintain (but each is focused)
- ⚠️ New contributors need to know which file to check

### Alternative: Dual-Audience Approach

If you prefer separate documents for different audiences:

```
tech-triage-platform/
├── PROJECT_OVERVIEW.md           # Plain English for stakeholders
├── TECHNICAL_SPECIFICATION.md    # Senior developer focused
└── DOCUMENTATION_GUIDE.md        # How to maintain both
```

**Use this if:**
- Non-technical stakeholders review docs regularly
- Complete separation of concerns is critical
- Audiences need very different information depth

**Drawbacks:**
- ❌ Content duplication requires synchronization
- ❌ Risk of conflicting information between documents
- ❌ Higher maintenance burden

---

## 📚 Document Specifications

### 1. README.md (Primary Entry Point)

**Target Audience:** Everyone (stakeholders, new developers, contributors)
**Length:** 200-400 lines
**Update Frequency:** After major features or deployment changes

**Required Sections:**

```markdown
# Tech Triage Platform

## Overview
[1-2 paragraph project description]

## Key Features
- Dynamic database-driven forms
- Auto-calculated scoring matrix
- Docker production deployment
- Real-time form validation

## Quick Start
### Prerequisites
### Installation
### Running Locally
### Running with Docker

## Project Status
[Current phase, what's working, what's next]

## Technology Stack
[Brief list with versions]

## Documentation
- [Architecture](./ARCHITECTURE.md) - Technical deep-dive
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [ADRs](./docs/adr/) - Decision records

## License & Contact
```

**Maintenance Triggers:**
- ✅ New major features completed
- ✅ Deployment method changes
- ✅ Technology stack updates
- ✅ Project status milestones reached

---

### 2. ARCHITECTURE.md (Technical Deep-Dive)

**Target Audience:** Senior developers, technical leads, future maintainers
**Length:** 500-1000 lines
**Update Frequency:** After architectural changes or new system components

**Required Sections:**

```markdown
# System Architecture

## System Overview
[High-level architecture diagram]

## Core Design Principles
1. Database-driven form generation
2. Separation of static reference vs dynamic implementation
3. Auto-calculation scoring engine
4. Type-safe data contracts

## Technology Stack & Rationale
### Frontend: Next.js 15 + TypeScript
[Why Next.js? Why App Router?]

### Database: PostgreSQL + Prisma ORM
[Why PostgreSQL? Why Prisma?]

### UI Components: shadcn/ui
[Why shadcn/ui over Material-UI or Chakra?]

## System Components

### 1. Dynamic Form Engine
[Detailed explanation of form-engine architecture]
- Field type system
- Conditional logic engine
- Validation framework
- State management

### 2. Database Schema
[Schema design philosophy]
- FormTemplate → FormSection → FormQuestion hierarchy
- Response storage strategy
- Repeatable groups handling

### 3. Scoring Calculation Engine
[How auto-calculations work]
- Impact score formula
- Value score formula
- Recommendation matrix logic

### 4. Docker Deployment
[Production deployment architecture]
- Multi-stage build process
- Database migration strategy
- Health check implementation

## Data Flow Diagrams
[Visual representations of key workflows]

## API Design
[Server Actions vs API Routes decision]

## Security Considerations
[Auth strategy, data protection, HIPAA considerations]

## Performance Optimization
[Caching, memoization, lazy loading strategies]

## Known Limitations & Trade-offs
[Honest assessment of current constraints]

## Future Architecture Plans
[Planned improvements, scalability considerations]
```

**Maintenance Triggers:**
- ✅ New system components added
- ✅ Major architectural refactoring
- ✅ Technology stack changes
- ✅ Performance optimization implementations
- ✅ Security updates

---

### 3. Architecture Decision Records (ADRs)

**Target Audience:** Future developers, decision makers
**Format:** One markdown file per major decision
**Update Frequency:** When significant technical decisions are made

**ADR Template:**

```markdown
# ADR-XXX: [Decision Title]

**Status:** Accepted | Superseded | Deprecated
**Date:** YYYY-MM-DD
**Deciders:** [Who made this decision]
**Technical Story:** [Link to issue/PR if applicable]

## Context and Problem Statement
[What is the issue we're trying to solve?]
[What constraints exist?]

## Decision Drivers
- [Driver 1: e.g., "Must support 100+ question forms"]
- [Driver 2: e.g., "Need to minimize database queries"]
- [Driver 3: e.g., "Must be maintainable by junior devs"]

## Considered Options
1. [Option 1]
2. [Option 2]
3. [Option 3]

## Decision Outcome
**Chosen option:** [Option X]

**Rationale:**
[Why we chose this option]

**Consequences:**
- **Positive:**
  - [Good consequence 1]
  - [Good consequence 2]
- **Negative:**
  - [Trade-off 1]
  - [Trade-off 2]

## Pros and Cons of Other Options

### [Option 1]
- **Pros:**
  - [Pro 1]
- **Cons:**
  - [Con 1]

### [Option 2]
- **Pros:**
  - [Pro 1]
- **Cons:**
  - [Con 1]

## Implementation Notes
[Key details about how this was implemented]

## References
- [Link to research]
- [Link to documentation]
```

**Recommended ADRs for This Project:**

1. **ADR-001: Dynamic Form Engine over Static Forms**
   - Why database-driven approach
   - Trade-offs of complexity vs flexibility
   - Why we kept static form as design reference

2. **ADR-002: Prisma ORM Selection**
   - Why Prisma over TypeORM or Sequelize
   - Type safety benefits
   - Migration strategy decisions

3. **ADR-003: Docker Deployment Strategy**
   - Multi-stage build rationale
   - `db push` vs `migrate deploy` decision
   - Health check implementation

4. **ADR-004: Next.js Server Actions over API Routes**
   - Why Server Actions for form submission
   - Type safety across client/server boundary
   - Trade-offs of tight coupling

5. **ADR-005: JSON Storage for Dynamic Question Responses**
   - Why `Json` field type in Prisma
   - Validation strategy
   - Query performance considerations

6. **ADR-006: Evidence-Based Coding Protocol**
   - Three-evidence rule implementation
   - Type-check before Docker build requirement
   - Real data contract enforcement

---

### 4. CONTRIBUTING.md (Maintenance Guide)

**Target Audience:** All contributors (including future Claude sessions)
**Length:** 200-300 lines
**Update Frequency:** When workflows or standards change

**Required Sections:**

```markdown
# Contributing Guide

## How to Contribute
[General contribution workflow]

## Development Workflow

### 1. Evidence-Based Coding Protocol
**MANDATORY: No code without three evidences**

#### Contextual Evidence (BEFORE coding)
```bash
# Find 3 similar implementations
grep -r "FormSubmission" --include="*.ts" src/
cat src/app/dynamic-form/actions.ts
```

#### Type Evidence (WHILE coding)
```bash
# After every 20 lines
npm run type-check
```

#### Execution Evidence (AFTER coding)
```bash
# Prove it works
npm test
tsx scripts/verify-feature.ts
```

### 2. Git Workflow
[Branching strategy, commit message format]

### 3. Database Changes
[Migration creation, seed data updates]

### 4. Testing Requirements
[When to write tests, coverage expectations]

## Documentation Maintenance

### When to Update Documentation

| Trigger Event | Update These Docs |
|--------------|-------------------|
| New major feature | README.md (features list, status) |
| Architectural change | ARCHITECTURE.md + new ADR |
| Technology change | ARCHITECTURE.md + README.md |
| Deployment change | README.md + docs/deployment/ |
| API change | ARCHITECTURE.md (API section) |
| Major decision | New ADR in docs/adr/ |

### How to Write an ADR
[Step-by-step guide using template]

### Documentation Review Process
- All PRs with code changes MUST update relevant docs
- Monthly documentation review for staleness
- ADRs are immutable (create new ADR to supersede)

## Code Standards

### TypeScript Rules
- Strict mode enabled
- No `any` types without justification
- Run `npx tsc --noEmit` before commits

### React Patterns
- Prefer Server Components
- Use Server Actions for mutations
- Memoize expensive calculations

### Database Patterns
- All schema changes require migrations
- Seed data must reflect production structure
- Use Prisma's type-safe queries

## Common Tasks

### Adding a New Form Question Type
[Step-by-step guide]

### Updating Scoring Logic
[Where to make changes, how to test]

### Creating a New Page
[App Router patterns, layout considerations]

## Getting Help
[Where to ask questions, how to report issues]
```

---

## 🎯 Current State Summary

### What's Been Built

**✅ COMPLETED:**
1. **Static Form (Design Reference Only)**
   - 9-section form matching original PDF
   - Auto-calculating scores with Excel-equivalent logic
   - Comprehensive testing validation
   - **Status:** FROZEN - use only as visual reference

2. **Dynamic Form Engine Foundation**
   - Database schema for FormTemplate, FormSection, FormQuestion
   - TypeScript types and interfaces
   - Form state management with reducer pattern
   - Conditional logic engine
   - Validation framework

3. **Docker Production Deployment**
   - Multi-stage Docker build successful
   - PostgreSQL container healthy
   - Application running on port 3000
   - API health check passing
   - TypeScript strict checking passed

**🔧 IN PROGRESS:**
- Wiring dynamic form engine to shadcn/ui components
- Extract UI patterns from static reference
- Database-driven form rendering

**📋 NEXT PRIORITIES:**
1. Export Reports Functionality (PDF/Excel)
2. Form Builder Interface (admin UI)
3. User Authentication (replace anonymous users)
4. Dashboard Analytics

### Technology Decisions Made

| Decision | Chosen Technology | Rationale |
|----------|------------------|-----------|
| Frontend Framework | Next.js 15 (App Router) | Server Components, type-safe Server Actions, excellent DX |
| Language | TypeScript (strict mode) | Type safety, IDE support, catches errors at compile time |
| UI Components | shadcn/ui + Radix UI | Accessible, customizable, headless components |
| Styling | Tailwind CSS v4 | Utility-first, consistent design system |
| Database | PostgreSQL | Relational data, ACID compliance, JSON field support |
| ORM | Prisma | Type-safe queries, excellent migrations, schema-first approach |
| Form Management | React Hook Form + Zod | Performance, validation, type inference |
| Deployment | Docker (multi-stage) | Reproducible builds, production-parity |

### Key Assumptions

1. **Form complexity will grow** - Dynamic form engine justified despite complexity
2. **Users need draft/resume capability** - SubmissionStatus enum includes DRAFT
3. **Scoring logic is stable** - Hardcoded formulas acceptable for Impact/Value calculation
4. **Single-tenant deployment initially** - No multi-tenancy architecture (can add later)
5. **HIPAA compliance required** - Confidential document handling, access controls planned

### Strengths

- ✅ **Type-safe end-to-end** - TypeScript + Prisma + Zod validation
- ✅ **Database-driven flexibility** - Add questions without code changes
- ✅ **Production-ready deployment** - Docker containers working
- ✅ **Evidence-based development** - Enforced verification workflow
- ✅ **Clear separation of concerns** - Static reference vs dynamic implementation
- ✅ **Comprehensive testing foundation** - Jest + Testing Library configured

### Known Weaknesses

- ⚠️ **No authentication** - Currently using anonymous submissions
- ⚠️ **Limited error handling** - Needs comprehensive error boundaries
- ⚠️ **No monitoring** - Missing logging, metrics, alerting
- ⚠️ **Single database instance** - No replication or backup strategy
- ⚠️ **Form versioning incomplete** - Can't migrate responses between template versions
- ⚠️ **No export functionality** - Can't generate PDF reports yet

### Trade-offs Accepted

1. **Complexity for Flexibility**
   - Dynamic form engine is more complex than static forms
   - Trade-off: Initial development time for long-term maintainability

2. **JSON Storage for Responses**
   - Storing answers in JSON field vs separate tables
   - Trade-off: Query flexibility for type safety at storage level

3. **Server Actions over API Routes**
   - Tighter coupling between client/server
   - Trade-off: Boilerplate reduction for architectural purity

4. **`db push` vs `migrate deploy` in Docker**
   - Using `prisma db push` instead of migrations in container startup
   - Trade-off: Simplicity for migration history tracking

---

## 🚀 Implementation Checklist

### Phase 1: Create Core Documentation (Immediate)

- [ ] **Create README.md** (Priority 1)
  - [ ] Write project overview
  - [ ] Add quick start instructions
  - [ ] Document current status
  - [ ] Link to other docs

- [ ] **Create ARCHITECTURE.md** (Priority 1)
  - [ ] System overview diagram
  - [ ] Technology stack rationale
  - [ ] Component deep-dives
  - [ ] Data flow diagrams
  - [ ] Known limitations

- [ ] **Create CONTRIBUTING.md** (Priority 2)
  - [ ] Evidence-based coding protocol
  - [ ] Documentation maintenance triggers
  - [ ] Common development tasks
  - [ ] Code standards

- [ ] **Set up ADR structure** (Priority 2)
  - [ ] Create `docs/adr/` directory
  - [ ] Add ADR template
  - [ ] Write ADR-001 (Dynamic Form Engine)
  - [ ] Write ADR-002 (Prisma ORM)
  - [ ] Write ADR-003 (Docker Deployment)

### Phase 2: Expand Documentation (Next Sprint)

- [ ] **Add deployment guides**
  - [ ] Create `docs/deployment/docker-setup.md`
  - [ ] Create `docs/deployment/production-deployment.md`
  - [ ] Document environment variables
  - [ ] Add troubleshooting guide

- [ ] **Add development workflows**
  - [ ] Create `docs/development/database-workflow.md`
  - [ ] Create `docs/development/testing-strategy.md`
  - [ ] Create `docs/development/type-checking-protocol.md`

- [ ] **Write remaining ADRs**
  - [ ] ADR-004 (Server Actions)
  - [ ] ADR-005 (JSON Storage)
  - [ ] ADR-006 (Evidence-Based Protocol)

### Phase 3: Maintain Documentation (Ongoing)

- [ ] **Monthly documentation review**
  - [ ] Check for stale information
  - [ ] Update project status
  - [ ] Verify setup instructions still work

- [ ] **PR documentation requirement**
  - [ ] All feature PRs update relevant docs
  - [ ] All architectural changes create ADRs

---

## 🔄 Documentation Maintenance Strategy

### Update Triggers

| Event Type | Action Required | Update Within |
|-----------|----------------|---------------|
| **New major feature completed** | Update README.md status and features list | Same PR |
| **Architectural change** | Create new ADR + update ARCHITECTURE.md | Same PR |
| **Technology stack change** | Update README.md + ARCHITECTURE.md + ADR | Same PR |
| **Deployment method change** | Update README.md + deployment docs | Same PR |
| **API contract change** | Update ARCHITECTURE.md API section | Same PR |
| **Major technical decision** | Create new ADR | Within 48 hours |
| **Bug fix** | No doc update unless changes workflow | N/A |

### Ownership Model

| Document | Primary Owner | Review Frequency |
|----------|--------------|------------------|
| README.md | Tech Lead | Monthly |
| ARCHITECTURE.md | Senior Developer | Quarterly |
| CONTRIBUTING.md | Tech Lead | When workflow changes |
| ADRs | Decision maker | Immutable after acceptance |
| Deployment docs | DevOps/Tech Lead | Before each deployment |

### Review Process

**Monthly Documentation Review (1st of each month):**
1. Read README.md - verify accuracy of status and features
2. Check ARCHITECTURE.md - ensure recent changes are reflected
3. Review latest ADRs - confirm implementation matches decisions
4. Test setup instructions - follow README.md from scratch
5. Update stale sections
6. Create issues for missing documentation

**PR Documentation Checklist:**
```markdown
- [ ] README.md updated if feature is user-facing
- [ ] ARCHITECTURE.md updated if system design changed
- [ ] New ADR created if major decision was made
- [ ] CONTRIBUTING.md updated if workflow changed
- [ ] Deployment docs updated if deployment process changed
```

---

## 💡 Best Practices for This Project

### 1. Evidence-Based Documentation

Just like the code requires three evidences, documentation should:
- **Contextual Evidence:** Reference actual files/code in documentation
- **Type Evidence:** Include TypeScript examples with proper types
- **Execution Evidence:** Show actual command outputs in setup guides

**Example (GOOD):**
```markdown
### Running Type Checks
```bash
npm run type-check
# Output: Found 0 errors. Watching for file changes.
```
This runs `tsc --noEmit` (see package.json:11).
```

**Example (BAD):**
```markdown
### Running Type Checks
Run the type check command to verify your code.
```

### 2. Actionable Over Descriptive

Documentation should enable action, not just describe:

**Example (GOOD):**
```markdown
### Adding a New Form Question
1. Create migration: `npx prisma migrate dev --name add_question`
2. Add to seed data in `prisma/seed/questions.ts`
3. Run seed: `npm run db:seed:dev`
4. Verify in Prisma Studio: `npm run studio`
```

**Example (BAD):**
```markdown
### Adding a New Form Question
Questions are stored in the database and can be added through migrations.
```

### 3. Link to Code, Don't Duplicate

Instead of explaining code in docs, link to the source:

**Example (GOOD):**
```markdown
### Scoring Calculation
Impact and Value scores are calculated using weighted averages.
See implementation: `src/lib/scoring/calculations.ts:15-42`
```

**Example (BAD):**
```markdown
### Scoring Calculation
The system calculates impact scores by taking mission alignment score,
multiplying by 0.5, then adding unmet need score multiplied by 0.5...
[repeating code logic in prose]
```

### 4. Version All Major Decisions

When changing an architectural decision:
- **DO NOT** edit the old ADR
- **DO** create a new ADR that supersedes it
- **DO** link them bidirectionally

**Example:**
```markdown
# ADR-002: Prisma ORM Selection
**Status:** Superseded by ADR-008
[original content]

# ADR-008: Migration to Drizzle ORM
**Status:** Accepted
**Supersedes:** ADR-002
[new decision content]
```

---

## 🎓 Learning from This Project

### What Worked Well

1. **Evidence-Based Protocol** - Caught type errors before Docker builds
2. **Static Reference Pattern** - Having working UI to reference saved time
3. **Database-First Approach** - Prisma schema guided TypeScript types
4. **Incremental Docker Fixes** - Systematic TypeScript error resolution

### What We'd Do Differently

1. **Start with ADRs** - Document major decisions as they happen, not retroactively
2. **README from Day 1** - Setup instructions written when memory is fresh
3. **Test deployment earlier** - Docker issues found late in development
4. **Version form templates** - Schema supports versioning but not implemented

### Advice for Future Contributors

1. **Read ARCHITECTURE.md first** - Understand the "why" before the "how"
2. **Follow evidence protocol** - Three evidences prevents rework
3. **Update docs in same PR** - Documentation debt compounds quickly
4. **Ask questions in ADRs** - Better to document uncertainty than pretend certainty

---

## 📞 Getting Help

**For Documentation Questions:**
1. Check CONTRIBUTING.md for maintenance guidance
2. Review ADR template for format questions
3. Ask in project chat: "How should I document [X]?"

**For Technical Questions:**
1. Check ARCHITECTURE.md for system design
2. Review relevant ADR for decision rationale
3. Read code comments and type definitions
4. Ask in project chat with code reference

**For Setup Issues:**
1. Follow README.md quick start exactly
2. Check deployment docs for troubleshooting
3. Verify environment variables match `.env.example`
4. Ask with full error output

---

## 🔗 References

### External Documentation Standards
- [ADR GitHub Organization](https://adr.github.io/) - ADR best practices
- [Divio Documentation System](https://documentation.divio.com/) - 4-part doc structure
- [Google Developer Documentation Style Guide](https://developers.google.com/style)

### Project-Specific Resources
- Original Form: `Triage.pdf`
- Design Mockups: `Tech Triage Design System.jpg`, `Tech Triage Landing Page.jpg`
- Database Schema: `tech-triage-platform/prisma/schema.prisma`
- Current Project Context: `CLAUDE.md` (this file provides context to AI assistants)

---

## 📝 Appendix: Document Templates

### A. README.md Template (Starter)

```markdown
# Tech Triage Platform

> A database-driven web application for evaluating medical technology innovations at Cincinnati Children's Hospital Medical Center (CCHMC).

## Overview

The Tech Triage Platform digitizes CCHMC's technology triage assessment process, providing a dynamic form system with auto-calculating scoring matrices to evaluate new medical device and software innovations.

## Key Features

- ✅ **Dynamic Database-Driven Forms** - Questions, sections, and options stored in database
- ✅ **Auto-Calculated Scoring** - Impact vs Value matrix with weighted calculations
- ✅ **Docker Production Deployment** - Containerized with PostgreSQL database
- ✅ **Type-Safe Architecture** - Full TypeScript with Prisma ORM
- ✅ **Real-Time Validation** - React Hook Form + Zod schemas

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for production)
- PostgreSQL 16+ (for local development)

### Installation

```bash
# Clone repository
git clone [repo-url]
cd tech-triage-platform

# Install dependencies
npm install

# Set up environment
cp .env.example .env.prisma-dev
# Edit .env.prisma-dev with your database URL

# Initialize database
npx prisma migrate dev
npm run db:seed:dev
```

### Running Locally

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Running with Docker

```bash
# Build and start containers
docker-compose up -d

# Check health
curl localhost:3000/api/health

# View logs
docker-compose logs -f app
```

## Project Status

**Current Phase:** Docker Deployment Complete
**Last Updated:** 2025-10-01

**Completed:**
- ✅ Static form design reference
- ✅ Dynamic form engine foundation
- ✅ Docker production deployment
- ✅ Database schema and migrations

**In Progress:**
- 🔧 Wiring dynamic form rendering
- 🔧 Extracting UI components from static reference

**Next Up:**
- 📋 Export functionality (PDF/Excel reports)
- 📋 Form builder admin interface
- 📋 User authentication

## Technology Stack

- **Frontend:** Next.js 15.5, React 19, TypeScript 5, Tailwind CSS 4
- **UI Components:** shadcn/ui, Radix UI
- **Backend:** Next.js Server Actions, Prisma ORM
- **Database:** PostgreSQL 16
- **Testing:** Jest, Testing Library, Playwright
- **Deployment:** Docker, Docker Compose

## Documentation

- [Architecture](./ARCHITECTURE.md) - Technical deep-dive and system design
- [Contributing](./CONTRIBUTING.md) - Development workflows and standards
- [ADRs](./docs/adr/) - Architecture decision records
- [Deployment Guide](./docs/deployment/docker-setup.md) - Production deployment

## License

[Your License]

## Contact

[Your Contact Info]
```

---

### B. Minimal ARCHITECTURE.md Template (Starter)

```markdown
# System Architecture

## System Overview

The Tech Triage Platform is a full-stack web application built on Next.js 15 with a PostgreSQL database, designed to replace paper-based technology assessment forms with a flexible, database-driven digital system.

**Core Philosophy:** Everything is data-driven. Form structure, questions, options, validation rules, and conditional logic all live in the database, not hardcoded in React components.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App (Port 3000)              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Static     │  │   Dynamic    │  │  API Routes  │ │
│  │   Routes     │  │   Form       │  │  (Health,    │ │
│  │   (Landing)  │  │   Engine     │  │   CRUD)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              Prisma ORM (Type-Safe Queries)             │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│          PostgreSQL Database (Port 5432)                │
│  ┌─────────────────┐  ┌────────────────────────────┐   │
│  │  Form Templates │  │  Form Submissions          │   │
│  │  └─ Sections    │  │  └─ Question Responses     │   │
│  │     └─ Questions│  │     └─ Calculated Scores   │   │
│  └─────────────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack Rationale

### Frontend: Next.js 15 + App Router
**Why?**
- Server Components reduce client-side JavaScript
- Server Actions provide type-safe RPC without API boilerplate
- Built-in optimization (images, fonts, code splitting)

**Trade-offs:**
- ❌ App Router is newer, fewer Stack Overflow answers
- ✅ Future-proof, better performance, superior DX

### Database: PostgreSQL + Prisma
**Why?**
- PostgreSQL: ACID compliance, JSON field support, proven reliability
- Prisma: Type-safe queries, schema-first workflow, excellent migrations

**Trade-offs:**
- ❌ Prisma adds abstraction layer
- ✅ Compile-time type safety prevents runtime errors

### UI: shadcn/ui + Tailwind CSS
**Why?**
- shadcn/ui: Copy-paste components, full customization control
- Tailwind: Utility-first consistency, no CSS conflicts

**Trade-offs:**
- ❌ More verbose HTML
- ✅ Faster development, easier maintenance

## Core System Components

### 1. Dynamic Form Engine

**Location:** `src/lib/form-engine/`

**Purpose:** Render forms dynamically from database schemas without hardcoding React components.

**Key Files:**
- `types.ts` - TypeScript interfaces for form structure
- `renderer.tsx` - Recursive form renderer component
- `field-mappings-simple.ts` - Maps field types to React components
- `validation.ts` - Zod schema generation from database rules
- `conditional-logic.ts` - Show/hide field logic engine

**Data Flow:**
```
Database (FormTemplate)
  → Load into context (FormEngineProvider)
    → Renderer maps to React components
      → User interacts with form
        → Validation via generated Zod schemas
          → Submit to database (FormSubmission)
```

### 2. Database Schema

**Location:** `prisma/schema.prisma`

**Key Models:**
- `FormTemplate` - Form definition (name, version, active status)
- `FormSection` - Groups of questions (e.g., "Header", "Market Analysis")
- `FormQuestion` - Individual fields (type, label, validation rules)
- `QuestionOption` - Dropdown/radio options
- `ScoringConfig` - Scoring criteria for questions
- `FormSubmission` - User's form submission
- `QuestionResponse` - Answers to each question (JSON storage)
- `CalculatedScore` - Auto-calculated scores (Impact, Value, Market)

**Design Philosophy:**
- Questions store validation as JSON (flexible, but loses type safety at storage level)
- Responses use `Json` field type (flexible querying, Prisma provides type safety in code)
- Repeatable groups (e.g., competitor table) have separate `RepeatableGroupResponse` model

### 3. Scoring Calculation Engine

**Location:** `src/lib/scoring/calculations.ts`

**Formulas:**
```typescript
Impact Score = (Mission Alignment * 50%) + (Unmet Need * 50%)
Value Score = (State of Art * 50%) + (Market * 50%)
Market Score = AVG(Market Size, Patient Population, # of Competitors)
```

**Recommendation Matrix:**
```
High Impact + High Value   → "Proceed"
High Impact + Low Value    → "Proceed" (mission-aligned)
Low Impact + High Value    → "Alternative Pathway"
Low Impact + Low Value     → "Close"
```

**Implementation:**
- Calculations in pure functions (testable)
- Triggered on form submission
- Stored in `CalculatedScore` table for audit trail

## API Design

**Approach:** Next.js Server Actions (not API routes)

**Why Server Actions?**
- Type-safe client-server communication
- No need for separate API layer
- Automatic serialization/deserialization
- Better error handling with React error boundaries

**Key Server Actions:**
- `submitFormSubmission()` - Save/update form submission
- `calculateScores()` - Trigger scoring engine
- `loadFormTemplate()` - Fetch form structure

**API Routes (limited use):**
- `/api/health` - Docker health check
- `/api/form-templates` - Public template listing
- `/api/form-submissions` - CRUD operations (fallback)

## Security Considerations

**Current State:**
- ⚠️ **No authentication** - Anonymous submissions (placeholder `submittedBy` field)
- ⚠️ **No authorization** - Any user can access any submission
- ⚠️ **No data encryption** - PostgreSQL unencrypted connections

**Planned:**
- 🔒 NextAuth.js integration
- 🔒 Row-level security in PostgreSQL
- 🔒 HIPAA compliance audit
- 🔒 SSL/TLS for database connections

## Known Limitations

1. **Form versioning incomplete** - Cannot migrate old submissions to new template versions
2. **No export functionality** - PDF/Excel report generation not implemented
3. **Single database instance** - No replication or failover
4. **Limited error handling** - Missing comprehensive error boundaries
5. **No monitoring** - No logging, metrics, or alerting infrastructure

## Future Architecture Plans

**Short-term (Next Quarter):**
- Add user authentication (NextAuth.js)
- Implement PDF export (react-pdf or Puppeteer)
- Add admin form builder UI

**Long-term (6-12 months):**
- Multi-tenancy support (separate databases per organization)
- Real-time collaboration (WebSocket form editing)
- Advanced analytics dashboard
- Form template marketplace

## References

See [ADRs](./docs/adr/) for detailed decision rationale.
```

---

**END OF DOCUMENTATION PLAN**

*This plan should be reviewed quarterly and updated as the project evolves.*
