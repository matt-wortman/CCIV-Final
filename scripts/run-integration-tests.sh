#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.db-test.yml"
SERVICE_NAME="integration-db"
INTEGRATION_DB_PORT="${INTEGRATION_DB_PORT:-5448}"
INTEGRATION_DB_NAME="${INTEGRATION_DB_NAME:-triage_integration}"
INTEGRATION_DB_USER="${INTEGRATION_DB_USER:-postgres}"
INTEGRATION_DB_PASSWORD="${INTEGRATION_DB_PASSWORD:-postgres}"
DATABASE_URL="postgresql://${INTEGRATION_DB_USER}:${INTEGRATION_DB_PASSWORD}@127.0.0.1:${INTEGRATION_DB_PORT}/${INTEGRATION_DB_NAME}?schema=public"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run integration tests" >&2
  exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Missing compose file at ${COMPOSE_FILE}" >&2
  exit 1
fi

cleanup() {
  docker compose -f "${COMPOSE_FILE}" down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "🔧 Starting integration database on port ${INTEGRATION_DB_PORT}..."
docker compose -f "${COMPOSE_FILE}" up -d --quiet-pull

READY=0
for attempt in $(seq 1 60); do
  if docker compose -f "${COMPOSE_FILE}" exec -T "${SERVICE_NAME}" pg_isready -U "${INTEGRATION_DB_USER}" -d "${INTEGRATION_DB_NAME}" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
  echo "   waiting for database (attempt ${attempt}/60)..."
done

if [ "${READY}" != "1" ]; then
  echo "Database failed to become ready" >&2
  exit 1
fi

echo "📦 Applying Prisma migrations..."
( cd "${ROOT_DIR}" && DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy )

echo "🌱 Seeding deterministic fixtures..."
( cd "${ROOT_DIR}" \
  && DATABASE_URL="${DATABASE_URL}" \
  RUN_PRISMA_SEED=true \
  SEED_DEMO_DATA=false \
  SEED_ALLOW_PURGE=true \
  npx prisma db seed )

export DATABASE_URL
export TEST_DATABASE_URL="${DATABASE_URL}"
export RUN_PRISMA_SEED=true
export SEED_DEMO_DATA=false
export SEED_ALLOW_PURGE=true
export RUN_INTEGRATION_TESTS=1
export NODE_ENV=test

JEST_ARGS=("$@")
if [ ${#JEST_ARGS[@]} -eq 0 ]; then
  JEST_ARGS=(--runInBand --testPathPatterns=tests/integration)
fi

echo "🧪 Running Jest integration suites..."
( cd "${ROOT_DIR}" && npx jest "${JEST_ARGS[@]}" )
