# Runbook: Excel Export Automation

_Last Updated: 2025-10-10 – Windows Task Scheduler flow adopted. Azure Container Apps job remains documented below as a legacy option._

## Current Workflow – Windows Task Scheduler + WSL (Preferred)

### Overview
- Leverages the existing WSL-based export script (`scripts/manual-export.sh`) that hydrates Azure Postgres and writes `exports/triage-forms-YYYYMMDD-HHmm.xlsx`.
- Windows Task Scheduler runs a PowerShell wrapper every two days at 10:00 AM ET and on startup. Logs land in `C:\Logs\TechTriageExport\`.
- No Azure RBAC changes required; the script reads `.env.export` inside WSL for credentials.

### Prerequisites
1. **WSL Distro**: Ubuntu (or equivalent) with the repository cloned at `/home/<user>/code_projects/Junk/tech-triage-platform`.
2. **Local script**: `tech-triage-platform/scripts/manual-export.sh` exists and is executable. It should call `npx dotenv -e .env.export -- npm run export-forms -- --destination local --output-dir exports`.
3. **Secrets file**: `.env.export` contains `DATABASE_URL`, `EXPORT_BLOB_CONTAINER`, `AZURE_STORAGE_CONNECTION_STRING` (kept up to date with rotations).

### One-Time Setup
1. Create directories on Windows for scripts and logs:
   ```powershell
   New-Item -ItemType Directory -Force -Path C:\Scripts
   New-Item -ItemType Directory -Force -Path C:\Logs\TechTriageExport
   ```
2. Create the PowerShell wrapper `C:\Scripts\run-tech-triage-export.ps1`:
   ```powershell
   # Runs the WSL export script and tees output to a timestamped log.
   $ErrorActionPreference = 'Stop'
   $logRoot = 'C:\Logs\TechTriageExport'
   if (!(Test-Path $logRoot)) { New-Item -ItemType Directory -Path $logRoot | Out-Null }

   $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
   $logFile = Join-Path $logRoot "export-$timestamp.log"

   $distro = 'Ubuntu'            # Replace if WSL distro name differs
   $scriptPath = '/home/matt/code_projects/Junk/tech-triage-platform/scripts/manual-export.sh'

   $log = & wsl.exe -d $distro $scriptPath 2>&1
   $exitCode = $LASTEXITCODE
   $log | Out-File -FilePath $logFile -Encoding UTF8

   if ($exitCode -ne 0) {
       Write-Error "Export failed with exit code $exitCode. See log at $logFile"
       exit $exitCode
   }

   Write-Output "Export completed successfully. Log saved to $logFile"
   ```
   Adjust `$distro` and `$scriptPath` if your environment differs.
3. (Optional) Enable lingering so user-level services keep WSL alive when logged out:
   ```bash
   sudo loginctl enable-linger <linux-user>
   ```
   _Not required when relying solely on Task Scheduler, but helpful if you add systemd timers later._

### Schedule the Task
1. Open **Task Scheduler** → **Create Task…**
2. General tab:
   - Name: `Tech Triage Export`
   - Select “Run whether user is logged on or not”
   - Check “Run with highest privileges”
3. Triggers tab:
   - Trigger 1: Daily at 10:00 AM; under “Advanced settings” set “Repeat every” = 2 days.
   - Trigger 2: “At startup” so a missed run executes when the machine boots.
4. Actions tab:
   - Action: “Start a program”
   - Program/script: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\Scripts\run-tech-triage-export.ps1"`
5. Conditions tab: Uncheck “Start the task only if the computer is on AC power” if needed for laptops.
6. Settings tab: Optional retries (e.g., restart every 1 hour, up to 3 attempts).
7. Save and supply Windows credentials so the task can run unattended.

### Verification
- Manual test: `powershell.exe -ExecutionPolicy Bypass -File C:\Scripts\run-tech-triage-export.ps1`
  - Should print success and drop a log file in `C:\Logs\TechTriageExport\`.
- Check the Task Scheduler history (enable “All Tasks History”) for success entries.
- Confirm new Excel file appears in `tech-triage-platform/exports/`.

### Ongoing Operations
- **Logs**: Review `C:\Logs\TechTriageExport\export-*.log` for success/failure. Delete or archive old logs periodically.
- **Credential rotation**: Update `.env.export` inside WSL; no script changes needed.
- **Distro name changes**: If you rename or reinstall WSL, update `$distro` in the PowerShell script and re-test.
- **Disable/Enable**: Use Task Scheduler UI or `schtasks /Change /TN "Tech Triage Export" /DISABLE`.

---

## Legacy Workflow – Azure Container Apps Job (Deprecated)

> Microsoft.App provider access is currently unavailable; these steps are retained for reference if RBAC hurdles clear in the future.

### Overview
- Runs the production container image on a schedule within Azure Container Apps.
- Uploads the generated workbook to Azure Blob Storage using connection string/secret injection.

### One-Time Setup
1. Build/publish the image if needed:
   ```bash
   az acr build --registry innovationventures --image tech-triage-platform:prod .
   ```
2. Provision or update the job via helper script:
   ```bash
   bash scripts/infra/create-export-job.sh
   ```
   - Default cron: every 2 days at 08:00 UTC (`0 8 */2 * *`)
   - Resources: 0.25 vCPU / 0.5 GiB RAM
   - Secrets: inject `AZURE_STORAGE_CONNECTION_STRING` as secret `storageconn`

### Ad-hoc Runs & Monitoring
```bash
az containerapp job start -g rg-eastus-hydroxyureadosing -n techtriage-export-job
az containerapp job execution list -g rg-eastus-hydroxyureadosing -n techtriage-export-job --output table
```
- Successful runs should produce `triage-forms-YYYYMMDD-HHmm.xlsx` in the configured blob container.

### Clean Up
```bash
az containerapp job delete -g rg-eastus-hydroxyureadosing -n techtriage-export-job --yes
```

Keep this section archived until Azure RBAC and provider registration are available again.
