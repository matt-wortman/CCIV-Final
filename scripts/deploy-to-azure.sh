#!/usr/bin/env bash
set -euo pipefail

# Azure deployment script for Tech Triage Platform.
# Reads secrets from Azure Key Vault when RBAC allows; otherwise
# export POSTGRES_ADMIN/POSTGRES_PASSWORD/NEXTAUTH_SECRET before running.

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-tech-triage}"
LOCATION="${LOCATION:-eastus}"
POSTGRES_SERVER="${POSTGRES_SERVER:-techtriage-pg}"
POSTGRES_DB="${POSTGRES_DB:-triage_db}"
APP_PLAN="${APP_PLAN:-techtriage-plan}"
WEBAPP_NAME="${WEBAPP_NAME:-tech-triage-app}"
ACR_NAME="${ACR_NAME:-innovationventures}"
IMAGE_TAG="${IMAGE_TAG:-innovationventures.azurecr.io/tech-triage-platform:prod}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-techtriage-kv}"
POSTGRES_ADMIN_SECRET_NAME="${POSTGRES_ADMIN_SECRET_NAME:-TechTriage-PostgresAdminUser}"
POSTGRES_PASSWORD_SECRET_NAME="${POSTGRES_PASSWORD_SECRET_NAME:-TechTriage-PostgresAdminPassword}"
NEXTAUTH_SECRET_SECRET_NAME="${NEXTAUTH_SECRET_SECRET_NAME:-TechTriage-NextAuthSecret}"
POSTGRES_VERSION="${POSTGRES_VERSION:-17}"
POSTGRES_TIER="${POSTGRES_TIER:-Burstable}"
POSTGRES_SKU="${POSTGRES_SKU:-Standard_B1ms}"
POSTGRES_STORAGE_SIZE="${POSTGRES_STORAGE_SIZE:-32}"
POSTGRES_HIGH_AVAILABILITY="${POSTGRES_HIGH_AVAILABILITY:-Disabled}"

function read_secret() {
  local vault_name="$1"
  local secret_name="$2"

  az keyvault secret show \
    --vault-name "$vault_name" \
    --name "$secret_name" \
    --query value -o tsv
}

# Resolve required secrets. Prefer environment variables (current workflow)
# and only fall back to Key Vault when a value is missing.
if [[ -z "${POSTGRES_ADMIN:-}" || -z "${POSTGRES_PASSWORD:-}" || -z "${NEXTAUTH_SECRET:-}" ]]; then
  if [[ -z "${POSTGRES_ADMIN:-}" ]]; then
    POSTGRES_ADMIN="$(read_secret "$KEY_VAULT_NAME" "$POSTGRES_ADMIN_SECRET_NAME")"
  fi

  if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
    POSTGRES_PASSWORD="$(read_secret "$KEY_VAULT_NAME" "$POSTGRES_PASSWORD_SECRET_NAME")"
  fi

  if [[ -z "${NEXTAUTH_SECRET:-}" ]]; then
    NEXTAUTH_SECRET="$(read_secret "$KEY_VAULT_NAME" "$NEXTAUTH_SECRET_SECRET_NAME")"
  fi
fi

if [[ -z "$POSTGRES_ADMIN" || -z "$POSTGRES_PASSWORD" || -z "$NEXTAUTH_SECRET" ]]; then
  echo "Required secrets could not be resolved. Ensure Key Vault entries exist or pass env vars." >&2
  exit 1
fi

az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

if az postgres flexible-server show --resource-group "$RESOURCE_GROUP" --name "$POSTGRES_SERVER" >/dev/null 2>&1; then
  echo "Postgres server '$POSTGRES_SERVER' already exists; updating admin password."
  az postgres flexible-server update \
    --resource-group "$RESOURCE_GROUP" \
    --name "$POSTGRES_SERVER" \
    --admin-password "$POSTGRES_PASSWORD"
else
  az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$POSTGRES_SERVER" \
    --location "$LOCATION" \
    --version "$POSTGRES_VERSION" \
    --tier "$POSTGRES_TIER" \
    --sku-name "$POSTGRES_SKU" \
    --storage-size "$POSTGRES_STORAGE_SIZE" \
    --high-availability "$POSTGRES_HIGH_AVAILABILITY" \
    --admin-user "$POSTGRES_ADMIN" \
    --admin-password "$POSTGRES_PASSWORD" \
    --public-access 0.0.0.0
fi

if az postgres flexible-server db show --resource-group "$RESOURCE_GROUP" --server-name "$POSTGRES_SERVER" --database-name "$POSTGRES_DB" >/dev/null 2>&1; then
  echo "Database '$POSTGRES_DB' already exists; skipping create."
else
  az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$POSTGRES_SERVER" \
    --database-name "$POSTGRES_DB"
fi

POSTGRES_FQDN=$(az postgres flexible-server show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --query fullyQualifiedDomainName -o tsv)

az postgres flexible-server firewall-rule create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --rule-name AllowAllAzureIPs \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

az appservice plan create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_PLAN" \
  --location "$LOCATION" \
  --sku P1v3 \
  --is-linux

az webapp create \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_PLAN" \
  --name "$WEBAPP_NAME" \
  --deployment-container-image-name "$IMAGE_TAG"

ACR_USER=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASS=$(az acr credential show --name "$ACR_NAME" --query passwords[0].value -o tsv)

az webapp config container set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEBAPP_NAME" \
  --container-image-name "$IMAGE_TAG" \
  --container-registry-url "https://${ACR_NAME}.azurecr.io" \
  --container-registry-user "$ACR_USER" \
  --container-registry-password "$ACR_PASS"

DATABASE_URL="postgresql://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_FQDN}:5432/${POSTGRES_DB}?sslmode=require"

az webapp config appsettings set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEBAPP_NAME" \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    PRISMA_MIGRATE_DATABASE_URL="$DATABASE_URL" \
    NEXTAUTH_URL="https://${WEBAPP_NAME}.azurewebsites.net" \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    RUN_PRISMA_SEED=false \
    SEED_DEMO_DATA=false \
    NODE_ENV=production \
    WEBSITES_PORT=3000 \
    WEBSITES_CONTAINER_START_TIME_LIMIT=600

az webapp config set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEBAPP_NAME" \
  --linux-fx-version "DOCKER|$IMAGE_TAG"

az webapp update \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEBAPP_NAME" \
  --set siteConfig.healthCheckPath="/api/health"

az webapp restart \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEBAPP_NAME"

echo "Deployment complete. Visit https://${WEBAPP_NAME}.azurewebsites.net"
