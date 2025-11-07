# Prisma Operations Guide

Use this guide to work with Prisma in the Tech Triage Platform, from local development through production maintenance on Azure. For a quick matrix of environments (Prisma dev server vs. Docker Postgres vs. Azure), see `ENVIRONMENT_MODES.md`.

---
## 1. Local Development

### 1.1 Install dependencies
```bash
cd tech-triage-platform
npm install
```

### 1.2 Configure the Prisma dev connection
1. Run `npm run prisma:dev` once. Prisma will print a `prisma+postgres://...api_key=...` URL.
2. Copy that URL into `.env.prisma-dev` (replace the placeholder value). Prisma keeps the key stable until you reset the dev server.

### 1.3 Start the Prisma development server
```bash
npm run prisma:dev
```
- Launches the embedded Postgres server, applies migrations, and seeds demo data by default.
- Stops with `Ctrl+C`.

### 1.4 Run the Next.js app against the dev database
```bash
npm run dev
```
This script automatically loads `.env.prisma-dev`, so all Prisma client usage points to the embedded database.

### 1.5 View data with Prisma Studio (local)
```bash
npm run studio
```
- Opens `http://localhost:5555` in your browser using the same dev connection.

### 1.6 Useful scripts
- `npm run db:seed:dev` → Seeds the dev database using `.env.prisma-dev`.
- `npm run db:seed` → Seeds whichever database `DATABASE_URL` points to (Docker/Azure builds).
- `npx prisma migrate dev --name <change>` → Creates and applies a new migration locally (it reads `.env.prisma-dev` if you prefix with `dotenv -e .env.prisma-dev --`, or export `DATABASE_URL`).
- `npx prisma migrate reset` → Drops/recreates the dev database (requires `DATABASE_URL` to point at the dev URL).

---
## 2. Production / Azure Workflow

### 2.1 Connection string
Production uses Azure Database for PostgreSQL Flex. Set this URL to inspect or seed that database:
```
postgresql://triageadmin:<PASSWORD>@techtriage-pgflex.postgres.database.azure.com:5432/triage_db?sslmode=require
```
(Use the current password; rotate via Azure CLI if needed.)

Export it before running Prisma commands:
```bash
export DATABASE_URL="postgresql://triageadmin:..."
```

### 2.2 Seeding on Azure
- The container entry script `scripts/start.sh` runs:
  1. `npx prisma migrate deploy`
  2. `npx prisma db seed` when `RUN_PRISMA_SEED=true`
- App Service settings control seeding:
  - `RUN_PRISMA_SEED`: `true` to seed on next restart, `false` afterward.
  - `SEED_DEMO_DATA`: `true` adds demo submissions, `false` seeds only the form template.

Manual seed:
```bash
az webapp ssh -g rg-eastus-hydroxyureadosing -n tech-triage-app
DATABASE_URL=... npx prisma db seed
exit
```
(Or run from your machine after adding a temporary firewall rule.)

### 2.3 Prisma Studio against Azure

Quick launch from your machine:
```bash
echo "AZURE_DATABASE_URL=postgresql://triageadmin:...@techtriage-pgflex.postgres.database.azure.com:5432/triage_db?sslmode=require" > .env.azure.local
npm run studio:azure
```
- The script loads `.env.azure.local` (or `.env.azure`) and sets `DATABASE_URL` automatically.
- Remove `.env.azure.local` from version control (already git-ignored) and rotate the password if it ever leaks.

Option A: Temporary firewall rule
```bash
MY_IP=$(curl -s ifconfig.me)
az postgres flexible-server firewall-rule create \
  -g rg-eastus-hydroxyureadosing \
  -n techtriage-pgflex \
  -r AllowStudio-$USER \
  --start-ip-address $MY_IP --end-ip-address $MY_IP

export DATABASE_URL="postgresql://..."
npx prisma studio
# When done:
az postgres flexible-server firewall-rule delete \
  -g rg-eastus-hydroxyureadosing \
  -n techtriage-pgflex \
  -r AllowStudio-$USER
```

Option B: Run Studio inside Azure (no firewall change)
```bash
az webapp ssh -g rg-eastus-hydroxyureadosing -n tech-triage-app
npx prisma studio --hostname 0.0.0.0 --port 5555
# In another terminal:
az webapp remote-connection create \
  -g rg-eastus-hydroxyureadosing \
  -n tech-triage-app \
  --port 5555
# Visit http://localhost:5555
```
Stop Studio with `Ctrl+C` and close the remote connection.

### 2.4 Applying migrations in production
1. Generate migration locally (`npx prisma migrate dev --name <change>`).
2. Commit the migration files under `prisma/migrations/`.
3. Build and push the container (`az acr build ...`).
4. Restart the App Service; `start.sh` runs `prisma migrate deploy` using `PRISMA_MIGRATE_DATABASE_URL`.

---
## 3. Troubleshooting

| Issue | Fix |
| --- | --- |
| ACR build fails with `Environment variable not found: DATABASE_URL` | Update to commit 2025-10-02 or ensure `/dynamic-form/builder` is marked `export const dynamic = 'force-dynamic'`; older builds attempted to pre-render the builder during Docker builds. |
| `prisma generate` fails in Docker build | Ensure `node_modules` is present; run `npm install` before build stage locally. |
| Seed script wipes data unexpectedly | Set `RUN_PRISMA_SEED=false` before restarting production; seed only when needed. |
| `npx prisma studio` hangs on Azure DB | Confirm firewall rule includes your current IP and `sslmode=require` in `DATABASE_URL`. |
| `prisma migrate deploy` errors on startup | Check container logs via `az webapp log tail`; fix the migration locally and rebuild. |
| Prisma client logs noisy in dev | Adjust logging in `src/lib/prisma.ts`. |

---
## 4. Quick Reference Commands

| Task | Command |
| --- | --- |
| Start dev DB | `npx prisma dev` |
| Open Studio (local) | `npx prisma studio` |
| Seed database | `npm run db:seed` |
| Create migration | `npx prisma migrate dev --name <change>` |
| Deploy migrations (Azure) | Container restart (auto) or `az webapp ssh ... npx prisma migrate deploy` |
| Rotate admin password | `az postgres flexible-server update ... --admin-password <new>` |

Keep this doc alongside `AZURE_HANDOVER.md` and update it if workflows change.
