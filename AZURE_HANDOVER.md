# Azure Deployment Handover

This document gives senior engineers everything needed to operate and extend the Tech Triage Platform in Azure. It summarizes the current architecture, resource inventory, deployment workflow, configuration, and operational runbooks.

## 1. Architecture Overview
- **Application**: Next.js 15 (App Router) running in a container. Prisma ORM talks to PostgreSQL.
- **Entry script**: `/usr/src/app/start.sh` runs Prisma migrations, optional seed, then launches `node server.js`.
- **Database**: Azure Database for PostgreSQL Flexible Server (v17). Prisma migrations manage schema.
- **Image pipeline**: Source lives in this repo. Images are built with `az acr build` into the Innovation Ventures ACR and pulled by the App Service. Latest tag (`prod`) digest: `sha256:63c43a9dfdadba3b277ff93299e3395532d3a156e9f40f03dd45de0bf87ff53b` (published 2025-10-04).
- **Health checks**: `/api/health` exercises the database connection and is wired into the App Service container health probe.

## 2. Resource Inventory
| Resource | Name | Notes |
| --- | --- | --- |
| Subscription | `IS SharedServices Sandbox` | Tenant: `cchmc` |
| Resource Group | `rg-eastus-hydroxyureadosing` | Shared with other apps; be cautious when applying policy changes. |
| Container Registry | `innovationventures` | Holds the image tag `tech-triage-platform:prod`. |
| App Service Plan | `techtriage-plan` | Linux, SKU `P1v3`, 1 worker. |
| Web App (Container) | `tech-triage-app` | Points to the ACR image, health check `/api/health`. |
| PostgreSQL Flexible Server | `techtriage-pgflex` | East US, SKU `Standard_B1ms`, 32 GiB storage, public access allowed to all Azure IPs. |
| Database | `triage_db` | Default schema created by Prisma migrations. |
| Supporting script | `scripts/deploy-to-azure.sh` | Idempotent CLI deployment script used below. |

> **Heads-up:** An earlier failed create left `techtriage-pgflex01` in `Dropping` state. Azure will remove it automatically; confirm before reusing that name.

## 3. Container Image & Build
1. Update code locally and ensure Dockerfile reflects changes.
2. Build inside ACR (no local Docker needed):
   ```bash
   az acr build --registry innovationventures \
     --image tech-triage-platform:prod .
   ```
3. Successful runs appear in the Azure portal under ACR > Tasks > Runs and produce a new digest (current prod digest: `sha256:63c43a9dfdadba3b277ff93299e3395532d3a156e9f40f03dd45de0bf87ff53b`).

## 4. Deployment Workflow
Two supported flows:

### 4.1 Incremental image update (routine release)
1. From repo root, build and push to Azure Container Registry:
   ```bash
   az acr build --registry innovationventures --image tech-triage-platform:prod .
   ```
2. Restart the Web App so it pulls the new digest:
   ```bash
   az webapp restart -g rg-eastus-hydroxyureadosing -n tech-triage-app
   ```
3. Verify the deployment:
   ```bash
   curl -s https://tech-triage-app.azurewebsites.net/api/health
   ```
   Expected response: `{ "status": "healthy", "database": "connected" }`.
4. Log the run in `docs/guides/deployment-guide.md` (incremental steps, timestamps, and troubleshooting notes).

### 4.2 Full provisioning / configuration refresh
Use `scripts/deploy-to-azure.sh` when infrastructure (Postgres, App Service plan, settings) needs to be created or re-synced.

> **Important:** Key Vault RBAC is not wired up for CI yet. If the script cannot read secrets (`ForbiddenByRbac`), export `POSTGRES_ADMIN`, `POSTGRES_PASSWORD`, and `NEXTAUTH_SECRET` in your shell before running the script. The script will honor pre-set env vars.

#### Required inputs
Provide secrets via environment variables (current strategy) or via Key Vault once RBAC issues are resolved.
```bash
export RESOURCE_GROUP="rg-eastus-hydroxyureadosing"
export LOCATION="eastus"
export POSTGRES_SERVER="techtriage-pgflex"
export POSTGRES_DB="triage_db"
export APP_PLAN="techtriage-plan"
export WEBAPP_NAME="tech-triage-app"
export POSTGRES_ADMIN="triageadmin"
export POSTGRES_PASSWORD="<strong password>"
export NEXTAUTH_SECRET="<32+ char random>"

./scripts/deploy-to-azure.sh
```

#### What the script does
1. Ensures the resource group exists.
2. Creates (or updates) the PostgreSQL flexible server using the low-cost B1ms SKU.
3. Ensures `triage_db` database exists and that the admin password matches the provided value.
4. Applies firewall rule `AllowAllAzureIPs` (public). Adjust per security requirements.
5. Creates the Linux App Service plan (`P1v3`).
6. Creates/updates the Web App and points it to `innovationventures.azurecr.io/tech-triage-platform:prod`.
7. Sets required app settings.
8. Configures the container health probe.
9. Restarts the Web App so the new configuration is live.

## 5. Application Settings & Secrets
Current App Service settings (`az webapp config appsettings list ...`):
- `DATABASE_URL` and `PRISMA_MIGRATE_DATABASE_URL`: values managed in `tech-triage-platform/.env.export`; load with `source tech-triage-platform/.env.export` before running Azure CLI commands.
- `NEXTAUTH_URL`: `https://tech-triage-app.azurewebsites.net`
- `NEXTAUTH_SECRET`: stored alongside other secrets in `.env.export`; rotate via script or portal.
- `RUN_PRISMA_SEED`: `false` (default; set to `true` only when you intentionally run the seed script).
- `SEED_ALLOW_PURGE`: `false` (required to be `true` only if you want the seed script to wipe/reload form tables).
- `SEED_DEMO_DATA`: `false` (flip to `true` to load sample submissions when seeding).
- `BASIC_AUTH_USERNAME` / `BASIC_AUTH_PASSWORD`: optional shared credentials enforced by middleware; leave blank to disable.
- `NODE_ENV`: `production`
- `WEBSITES_PORT`: `3000`
- `WEBSITES_CONTAINER_START_TIME_LIMIT`: `600`

> **Security note:** Secrets currently live in App Service settings. The long-term plan is to store them in Key Vault and reference them via managed identity once RBAC access is in place.

## 6. Database Operations
- Server: `techtriage-pgflex.postgres.database.azure.com`
- Admin user: `triageadmin`
- Port: `5432`
- SSL: required (`sslmode=require`).

### Connecting locally
```bash
source tech-triage-platform/.env.export
psql "$DATABASE_URL" -c '\l'
```

### Seeding behavior
- Container startup (`start.sh`) always runs `npx prisma migrate deploy`.
- If `RUN_PRISMA_SEED=true`, it invokes `npx prisma db seed`. This populates both the dynamic form templates and optional demo data (controlled by `SEED_DEMO_DATA`).
- After seeding once in production, return `RUN_PRISMA_SEED` to `false` to avoid re-inserting data on every restart.

### Firewall
A blanket rule `AllowAllAzureIPs` is active. For production hardening, replace with specific IP ranges or move to private network/VNet integration.

## 7. Operational Playbooks
### Restarting the Web App
```bash
az webapp restart -g rg-eastus-hydroxyureadosing -n tech-triage-app
```

### Viewing logs
```bash
az webapp log tail -g rg-eastus-hydroxyureadosing -n tech-triage-app
```
(Enable container logging first via the portal if not already.)

### Checking health
- Public health endpoint: `https://tech-triage-app.azurewebsites.net/api/health`
- Returns 200 with `{ "status": "healthy", "database": "connected" }` when Prisma can reach PostgreSQL.

### Scaling
- Current plan is `P1v3`. For lighter usage switch to `B1` or `B1ms`; for heavier workloads scale out or up via `az appservice plan update ...`.

### Rolling out a new image
1. Build/push image (`az acr build ...`). Container builds no longer require DATABASE_URL because `/dynamic-form/builder` renders dynamically.
2. Restart web app or run `./scripts/deploy-to-azure.sh` to ensure config points at the latest tag.
3. Validate `/api/health`, `/dynamic-form`, `/dynamic-form/builder`, and the PDF export flow (trigger `POST /api/form-exports`).

### Database migrations
- Apply via `npm run prisma:migrate` locally, commit the new migration, rebuild image, deploy.
- Startup script will run `prisma migrate deploy` automatically whenever the container starts.

## 8. Troubleshooting Checklist
| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| `/dynamic-form` 404/500 | Seed data missing | Temporarily set `RUN_PRISMA_SEED=true`, restart, set back to `false`. |
| `/api/health` returns 503 | DB unreachable | Check firewall, credentials, Postgres status (`az postgres flexible-server show`). |
| App stuck restarting | Prisma migrations failing | Inspect container logs (`az webapp log tail`); fix migration or seed script. |
| Build doesn’t reach ACR | CLI missing rights or `.dockerignore` excludes required files | Verify `az login`, ensure Dockerfile copies `scripts/start.sh`. |

## 9. Next Steps / Recommendations
- **Secrets**: Move DB password and NextAuth secret into Key Vault + managed identity.
- **Firewall**: Replace `AllowAllAzureIPs` with scoped rules or private networking.
- **Monitoring**: Consider enabling Application Insights for deeper telemetry.
- **Backups**: Default retention is 7 days; adjust via `--backup-retention` if required.
- **Automation**: Integrate the `deploy-to-azure.sh` steps into CI/CD (GitHub Actions, Azure DevOps) for consistent releases.

## 10. Contact & Ownership
- **Primary engineer**: (fill in once assigned)
- **ACR owner**: Innovation Ventures DevOps
- **Escalation**: CCHMC Cloud Ops for subscription-level issues.

Keep this README in sync with any infrastructure changes to ensure a smooth handover to future engineers.
