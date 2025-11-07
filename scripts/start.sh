#!/bin/sh
set -e

echo "🚀 Starting Tech Triage Platform..."

echo "⏳ Waiting for database to be ready..."
MIGRATE_URL="${PRISMA_MIGRATE_DATABASE_URL:-$DATABASE_URL}"
until DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy >/dev/null 2>&1; do
  echo "Database not ready, retrying in 5 seconds..."
  sleep 5
done

echo "✅ Database migrations applied."

echo "⚡ Generating Prisma client..."
npx prisma generate

RUN_SEED="${RUN_PRISMA_SEED:-false}"
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
    echo "  📊 Demo data will be included (SEED_DEMO_DATA=true)"
  else
    echo "  🧹 Clean database only (SEED_DEMO_DATA=false)"
  fi
  npx prisma db seed || echo "⚠️  Prisma seed failed or is not configured"
else
  echo "⏭️  Skipping database seed (RUN_PRISMA_SEED=${RUN_SEED})"
  echo "   Set RUN_PRISMA_SEED=true (and SEED_ALLOW_PURGE=true for destructive resets) to enable seeding."
fi

echo "🎉 Starting Next.js application..."

exec node server.js
