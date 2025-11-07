# Azure Deployment Runbook — Successful Push (Updated 2025-10-05)

This log captures every command and condition used to deploy the Tech Triage Platform container to Azure when applying an incremental image update despite ongoing Key Vault RBAC issues. The same sequence succeeded on 2025-10-03 (`ca6`) and again on 2025-10-04 (`ca9`).

---
## 0. Environment Prerequisites
- Signed in to the correct subscription (`az account show` → `IS SharedServices Sandbox`).
- Local repo up to date with latest code changes (PDF export, documentation updates).
- Able to run `az` CLI with permissions to ACR and App Service.
- Key Vault RBAC still **not** granting secret reads. Plan to supply secrets manually if using `scripts/deploy-to-azure.sh` (not needed for this build).
- Optional: Set `NEXT_PUBLIC_TEST_USER_ID` if you want the shared tester identity to display something other than the default `shared-user` label.

---
## 1. Build and Push Image to Azure Container Registry
```bash
# From repo root: /home/matt/code_projects/Junk/tech-triage-platform
az acr build --registry innovationventures --image tech-triage-platform:prod .
```
- Build succeeded (most recent run `caa` on 2025-10-05; previous runs `ca6` and `ca9` remain for reference).
- Latest resulting digest: `sha256:eb61a04a80a1cc7c7c8b17030c0d2d3e09860156b4763af2bb2fa05c308864ac`.
- Build log confirms Next.js build completed and image pushed.

> **Note:** Because `/dynamic-form/builder/page.tsx` exports `dynamic = 'force-dynamic'`, the build no longer needs a live `DATABASE_URL` during the static rendering step.

---
## 2. Restart Azure Web App to Pull New Image
```bash
az webapp restart -g rg-eastus-hydroxyureadosing -n tech-triage-app
```

---
## 3. Verify Health Endpoint
```bash
curl -s https://tech-triage-app.azurewebsites.net/api/health
```
Expected response:
```json
{"status":"healthy","timestamp":"2025-10-05T19:15:33.010Z","database":"connected"}
```

---
## 4. Optional: Document the Release
- Update `docs/release-notes/2025-10-03.md` (if desired) with the new digest and key changes.
- Share the digest and release date with the stakeholder chat to unblock their deployment attempts.

---
## Troubleshooting Notes
- If `az acr build` fails with `ForbiddenByRbac`, contact cloud admin to confirm access to the `innovationventures` ACR.
- Key Vault secret retrieval is still denied. If you must run the full provisioning script (`./scripts/deploy-to-azure.sh`), export:
  ```bash
  export POSTGRES_ADMIN="<user>"
  export POSTGRES_PASSWORD="<password>"
  export NEXTAUTH_SECRET="<secret>"
  ```
  before running the script.
- Always verify `/api/health` after restarts.

This sequence is the canonical reference for incremental pushes until CI/CD is automated. Use `./scripts/deploy-to-azure.sh` only when infrastructure needs to be provisioned or resynced.
