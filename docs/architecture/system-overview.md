# System Overview

**Last Updated:** 2025-10-05

## Architecture Summary

The Tech Triage Platform is a Next.js 15 application using the App Router with a clear separation between server and client components.

### Technology Stack
- **Framework:** Next.js 15 with App Router
- **Database:** PostgreSQL with Prisma ORM
- **UI:** React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Deployment:** Azure App Service + Azure Container Registry

### Core Architecture Patterns

#### App Router Structure
Pages live under `src/app/` following Next.js 15 conventions with server/client component splits.

#### Form Engine
Centralized in `src/lib/form-engine/` with builder-specific components in `src/components/form-builder/`.

**Key Components:**
- `types.ts` - Core type definitions (150 lines)
- `renderer.tsx` - Dynamic form rendering (490 lines)
- `field-mappings-simple.ts` - Field type mappings (103 lines)
- `conditional-logic.ts` - Conditional field logic (195 lines)
- `validation.ts` - Field validation engine (280 lines)
- `json-utils.ts` - JSON data utilities (187 lines)

#### Server Actions
Centralized in `src/app/dynamic-form/builder/actions.ts` with lightweight `ActionResult` helper to normalize success/error responses.

### Database Architecture

The Prisma schema supports:
- Dynamic sections/questions
- Form submissions with versioning
- Repeatable field groups
- Automatic scoring calculations
- Draft/publish workflow
- Cascading deletes for data consistency

**Dual System Support:**
- **Legacy System:** `TriageForm` model (original static form)
- **Dynamic System:** `FormTemplate` model (flexible form builder)

Clear separation allows gradual migration from static to dynamic forms.

### Environment Architecture

Three operational modes (see the [Deployment Guide](../guides/deployment-guide.md) for setup details):

| Mode | Connection | Use Case |
|------|------------|----------|
| Prisma Dev Server | `prisma+postgres://` (embedded) | Local development (default) |
| Local Docker | `postgresql://localhost:5432` | Testing production-like setup |
| Azure Production | Azure Flexible Server | Live deployment |

**Port Management:**
Always kill old processes on port 3000 before switching: `lsof -ti:3000 | xargs -r kill -9`

## Feature Status

### Completed Phases (0-11)

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Foundation & Schema | ✅ |
| 1 | Landing Page & Template CRUD | ✅ |
| 2 | Editor Layout | ✅ |
| 3 | Section Management | ✅ |
| 4 | Field Type Palette | ✅ |
| 5 | Field Selector & Configuration | ✅ |
| 6 | Field Management UI | ✅ |
| 7 | Preview Mode | ✅ |
| 8 | Save & Publish | ✅ |
| 9 | Template Metadata | ✅ |
| 10 | Polish & Error Handling | ✅ |
| 11 | Reporting & PDF Export | ✅ |

### Queued
- Phase 12: Integration testing (Playwright)

## Build & Deployment

**Build Status:** All checks passing ✅
- `npm run build` - Clean
- `npm run lint` - Clean
- Azure ACR build: `sha256:eb61a04a80a1cc7c7c8b17030c0d2d3e09860156b4763af2bb2fa05c308864ac` (deployed 2025-10-05 via run `caa`)

**Key Commands:**
```bash
npm run prisma:dev   # Start Prisma dev server
npm run dev          # Next dev using .env.prisma-dev
npm run dev:classic  # Next dev against Docker Postgres
npm run build        # Production build (standalone)
npm start            # Start built server
```

## Design Decisions

### Why Server Actions?
- Simplified data flow vs. separate API routes
- Better type safety with TypeScript
- Built-in Next.js optimization
- Cleaner error handling with `ActionResult` wrapper

### Why Dual Form Systems?
- Gradual migration path from static to dynamic
- Legacy forms remain functional during transition
- Reduced deployment risk
- Clear separation in codebase

### Why Prisma Dev Server Default?
- Fastest iteration cycle
- No Docker dependency
- Automatic migrations during development
- Embedded database simplifies onboarding

## Future Opportunities

1. **Service Layer Extraction:** Extract reusable service layer if builder domain logic grows
2. **Test Coverage:** Expand integration tests for builder workflows (currently limited to legacy Jest suites)
3. **Database Optimization:** Add `@@index` definitions for high-volume scenarios
4. **Secrets Management:** Migrate from inline secrets to Azure Key Vault + managed identity

## References

- [Data Model](./data-model.md) - Detailed Prisma schema documentation
- [Security Model](./security-model.md) - Authentication and security patterns
- [Code Reviews](../reviews/) - Technical audits and findings
- [Deployment Guide](../guides/deployment-guide.md) - Operational procedures
