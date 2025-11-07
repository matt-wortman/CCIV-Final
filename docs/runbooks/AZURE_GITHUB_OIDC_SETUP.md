# Azure ↔︎ GitHub OIDC Setup Runbook

Last updated: 2025-10-28  
Owner: DevOps Lead

This runbook documents how to configure Azure Active Directory (Entra ID) to trust GitHub Actions via OpenID Connect (OIDC). Using OIDC allows us to remove long-lived Azure credentials from GitHub secrets while respecting the current directive to avoid automated secret rotation.

---

## 1. Scope & Prerequisites

- Azure subscription with Owner or `User Access Administrator` on the target subscription/resource group.
- GitHub repository admin access.
- Azure CLI `>= 2.60` installed locally (or use Azure Cloud Shell).

### Resources OIDC Will Access
| Resource | Purpose |
| --- | --- |
| Azure Container Registry (`innovationventures.azurecr.io`) | Push container images from CI |
| App Service `tech-triage-app` | Deploy production release |
| Staging App Service (future) | Deploy staging release |

---

## 2. Create Azure App Registration

1. `az ad app create --display-name "github-actions-tech-triage"`  
   Note the returned `appId` and `objectId`.
2. `az ad sp create --id <appId>` to create the service principal.
3. `az ad app federated-credential create --id <appId> --parameters ./federated-credential.json`

### Sample `federated-credential.json`
```json
{
  "name": "github-actions-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:InnovationVentures/tech-triage-platform:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
```
- Create additional credentials for other branches/environments as needed (e.g., `workflow_dispatch` with `subject` `repo:...:pull_request`).

---

## 3. Assign Azure RBAC Roles

Grant the service principal least-privilege access:

```bash
SUBSCRIPTION_ID=<subscription>
APP_ID=<appId>

# Allow deployments to the resource group
az role assignment create \
  --assignee $APP_ID \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-eastus-hydroxyureadosing"

# Allow pushes to ACR
az role assignment create \
  --assignee $APP_ID \
  --role "AcrPush" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-eastus-hydroxyureadosing/providers/Microsoft.ContainerRegistry/registries/innovationventures"
```

> Keep existing secrets in GitHub as a fallback until the OIDC workflow has been verified in production. Disable them manually afterward; no automated rotation script is introduced.

---

## 4. Configure GitHub Environments

1. GitHub → Settings → Environments → `staging` / `production`
2. Add environment protection rules (manual approvals, required reviewers).
3. Add environment variables:
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`
   - `AZURE_CLIENT_ID` (the `appId` from step 2)
4. Remove stored Azure secrets only after verifying OIDC deploys successfully.

---

## 5. Update Workflows

- Ensure `permissions: id-token: write` is present (already configured in `security-scan.yml` and planned `deploy.yml`).
- Replace `azure/login` credentials in deployment workflows with environment references:
  ```yaml
  - name: Azure Login
    uses: azure/login@v2
    with:
      client-id: ${{ vars.AZURE_CLIENT_ID }}
      tenant-id: ${{ vars.AZURE_TENANT_ID }}
      subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
  ```
- Verify the workflow succeeds before decommissioning existing secrets.

---

## 6. Validation Checklist

- [ ] `az ad app list --display-name github-actions-tech-triage` returns the app registration.
- [ ] `az ad app federated-credential list --id <appId>` contains entries for each branch/workflow.
- [ ] GitHub deployment workflow uses OIDC and passes.
- [ ] Old GitHub secrets (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`) removed once OIDC verified.

---

## 7. Rollback Plan

If OIDC authentication fails:
1. Temporarily restore the prior service principal secret in GitHub.
2. Investigate the workflow logs for `azure/login` (common causes: incorrect subject string or missing role assignment).
3. Re-run workflow; once fixed, remove the secret again.

---

## Change Log
- **2025-10-28:** Initial version documenting manual OIDC setup without automated secret rotation.
