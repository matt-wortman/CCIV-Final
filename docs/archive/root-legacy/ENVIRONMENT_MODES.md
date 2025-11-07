# Environment Modes & Dev Server Matrix

This project supports three distinct database/runtime modes. Use the tables and checklists below to pick the right one and avoid cross‑wiring credentials.

---
## Quick Reference

| Mode | DB Location | Start DB | Relevant `.env` | Next.js start command | Typical Use |
| --- | --- | --- | --- | --- | --- |
| Prisma Dev Server | Prisma-managed local service (prisma+postgres://) | `npm run prisma:dev` | `.env.prisma-dev` | `npm run dev` *(uses Turbopack unless otherwise noted)* | Fast local iteration without Docker |
| Local Docker Postgres | Docker compose (`localhost:5432`) | `docker-compose up -d database` | `.env` | `dotenv -e .env -- next dev` or `next start` | Integration testing against local Postgres |
| Azure Production | Azure Database for PostgreSQL Flex | (remote) | App Service settings (production) | container entry script (`next start` in image) | Live site |

> **Important:** Only one environment should be active at a time. Mixing `.env.prisma-dev` with Docker Postgres, or running `next dev` while `next start` still owns port 3000, causes the “ENOENT build-manifest” loop and 500s on every route.

---
## 1. Prisma Dev Server Mode (default for rapid dev)

### When to use
- Quick UI / API iteration when you don’t want Docker running.
- Need Prisma Studio locally without exposing Docker Postgres.

### Setup checklist
1. Install dependencies once: `npm install`
2. Start Prisma Dev Server *(first terminal)*:
   ```bash
   npm run prisma:dev
   ```
   - The first run prints a `prisma+postgres://` URL—copy it into `.env.prisma-dev`
   - Subsequent runs reuse the same URL
3. Run Next.js dev *(second terminal)*:
   ```bash
   npm run dev
   ```
   - Uses `.env.prisma-dev`
   - Currently defaults to Turbopack; use `npm run dev:turbopack` explicitly if you prefer classic dev (`next dev` without `--turbopack`).
4. Optional tools:
   - Studio: `npm run studio`
   - Seed dev DB: `npm run db:seed:dev`

### Tear down
- `Ctrl+C` both terminals.
- Prisma leaves a data directory under `.prisma-server`; no cleanup needed unless resetting.

---
## 2. Local Docker Postgres Mode

### When to use
- Need parity with Dockerized deployment (database + Next).
- Running integration tests that depend on the container database.

### Setup checklist
1. Launch Postgres container:
   ```bash
   docker-compose up -d database
   ```
2. Ensure `.env` points at `postgresql://triage_app:...@localhost:5432/triage_db`
3. Start Next.js using `.env`:
   ```bash
   dotenv -e .env -- next dev
   # or npm run dev:docker (create script if desired)
   ```
4. To build prod locally:
   ```bash
   npm run build
   npx next start -p 3001   # pick a free port
   ```

### Tear down
```bash
docker-compose down
```

---
## 3. Azure Deployment Mode

### When to use
- Production runtime.
- Debugging issues in Azure environment.

### Key settings
- `DATABASE_URL` and `PRISMA_MIGRATE_DATABASE_URL` set in Azure App Service.
- Entry script `scripts/start.sh` runs:
  1. `npx prisma migrate deploy`
  2. `npx prisma db seed` when `RUN_PRISMA_SEED=true`
- Control seeding via App Service configuration (`RUN_PRISMA_SEED`, `SEED_DEMO_DATA`).

### Manual operations
- SSH into container: `az webapp ssh -g <resource-group> -n <app-name>`
- Run Prisma commands with exported `DATABASE_URL`.
- Tail logs: `az webapp log tail ...`

---
## Switching Between Modes

| From → To | Steps |
| --- | --- |
| Prisma Dev → Docker | `Ctrl+C` dev server & Prisma; run `docker-compose up -d database`; start Next with `.env`. |
| Prisma Dev → Azure (local build) | Stop dev servers. `npm run build`. Use `next start -p 3001` locally or push container to Azure. |
| Docker → Prisma Dev | `docker-compose down`; run `npm run prisma:dev`; start `npm run dev`. |
| Any → Production Azure | Ensure migrations committed; push container (see `prisma_readme.md` §2); restart App Service. |

**Tip:** Before switching modes, kill any process holding the previous port:
```bash
lsof -ti:3000 | xargs -r kill -9
```

---
## Common Pitfalls & Fixes

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `ENOENT ... _buildManifest.js.tmp` during `next dev` | Mixing `.env.prisma-dev` with Docker env or duplicate dev server using Turbopack | Stop all dev servers, clear `.next`, restart with the intended env. |
| `listen EADDRINUSE :3000` | Another `next dev`/`next start` already running | Kill the process on port 3000 (`lsof -ti:3000 | xargs -r kill -9`). |
| Prisma throws `MODULE_NOT_FOUND @prisma/client` | `npm install` not run or Prisma client not generated | `npm install` and `npx prisma generate` (inside repo). |
| Dev DB contents missing | Prisma dev server was reset | Re-run `npm run prisma:dev` (regenerates data) or run `npm run db:seed:dev`. |
| Prod seeding reruns unexpectedly | `RUN_PRISMA_SEED` left true | Set `RUN_PRISMA_SEED=false` after initial seed. |

---
## Recommended Scripts (already in package.json)

```
npm run dev             # Uses .env.prisma-dev
npm run dev:turbopack   # Same but with Turbopack flag (optional)
npm run prisma:dev      # Prisma dev server
npm run studio          # Prisma Studio against dev server
npm run build           # next build --turbopack
npm start               # standalone start (port 3000)
```

Consider adding custom aliases in your shell profile:
```bash
alias devp="npm run prisma:dev"
alias devn="npm run dev"
alias devd="dotenv -e .env -- next dev"
```

---
## Updating This Document

- Keep this file alongside `prisma_readme.md` and `AZURE_HANDOVER.md`.
- Update the tables whenever environment scripts or URLs change.
- If you add Playwright, Cypress, or other tooling with environment needs, note them here.

