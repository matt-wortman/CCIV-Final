#!/usr/bin/env bash
set -euo pipefail

# Azure Container Apps Job — scheduled export to Azure Blob
# This script creates (or updates) a scheduled job that runs the existing
# tech-triage-platform container image every 2 days and uploads the Excel
# workbook to the configured blob container.
#
# Prerequisites:
#  - az CLI logged in with access to the subscription/resource group
#  - ACR image already pushed (we use :prod)
#
# Notes on cost: On the Container Apps Consumption plan, the job incurs
# compute only while it runs (typically seconds/minutes). Between runs, $0.

RG="rg-eastus-hydroxyureadosing"
LOCATION="eastus"
ENV_NAME="techtriage-jobs-env"
JOB_NAME="techtriage-export-job"
ACR_SERVER="innovationventures.azurecr.io"
IMAGE_REPO="tech-triage-platform"
IMAGE_TAG="prod"

# Schedule: every 2 days at 08:00 UTC (~03:00 ET during Standard Time)
CRON="0 8 */2 * *"

# Export settings — sourced from .env.export by default
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ENV_FILE="$PROJECT_ROOT/tech-triage-platform/.env.export"

if [ -f "$ENV_FILE" ]; then
  echo "Loading secrets from $ENV_FILE"
  set -a
  # shellcheck source=/dev/null
  . "$ENV_FILE"
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL must be set (see .env.export)}"
: "${EXPORT_BLOB_CONTAINER:?EXPORT_BLOB_CONTAINER must be set (see .env.export)}"
: "${AZURE_STORAGE_CONNECTION_STRING:?AZURE_STORAGE_CONNECTION_STRING must be set (see .env.export)}"

# Optional: low resource profile for the job
CPU="0.25"
MEMORY="0.5Gi"

echo "Creating/ensuring Container Apps environment: $ENV_NAME ($LOCATION)"
az containerapp env create \
  -g "$RG" \
  -n "$ENV_NAME" \
  -l "$LOCATION" \
  --only-show-errors 1>/dev/null || true

echo "Creating scheduled job: $JOB_NAME"
# Store the storage connection string as a secret and reference it from an env var
az containerapp job create \
  -g "$RG" \
  -n "$JOB_NAME" \
  --environment "$ENV_NAME" \
  --image "$ACR_SERVER/$IMAGE_REPO:$IMAGE_TAG" \
  --trigger-type Schedule \
  --cron-expression "$CRON" \
  --replica-timeout 900 \
  --replica-retry-limit 2 \
  --cpu "$CPU" \
  --memory "$MEMORY" \
  --registry-server "$ACR_SERVER" \
  --set-env-vars \
      DATABASE_URL="$DATABASE_URL" \
      EXPORT_BLOB_CONTAINER="$EXPORT_BLOB_CONTAINER" \
  --secrets storageconn="$AZURE_STORAGE_CONNECTION_STRING" \
  --env-vars AZURE_STORAGE_CONNECTION_STRING=secretref:storageconn \
  --command "bash" \
  --args "-lc","npm run export-forms -- --destination blob" \
  --only-show-errors 1>/dev/null || true

echo "Job created/updated. You can run it ad-hoc with:"
echo "  az containerapp job start -g $RG -n $JOB_NAME"
