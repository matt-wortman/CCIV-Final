#!/bin/sh
set -e

echo "🐳 Starting Tech Triage Platform Container..."

# Initialize PostgreSQL if data directory is empty
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "📊 Initializing PostgreSQL database..."

    # Initialize the database
    su postgres -c "initdb -D $PGDATA"

    # Start PostgreSQL temporarily for setup
    su postgres -c "pg_ctl -D $PGDATA -l /tmp/postgres.log start"

    # Wait for PostgreSQL to be ready
    sleep 5

    # Create database and user
    su postgres -c "createdb triage_db"
    su postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\""

    echo "✅ PostgreSQL initialized successfully"
else
    echo "📊 Starting existing PostgreSQL database..."
    # Start PostgreSQL
    su postgres -c "pg_ctl -D $PGDATA -l /tmp/postgres.log start"
    sleep 5
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed the database if needed
echo "🌱 Seeding database..."
npx prisma db seed || echo "⚠️  No seed script found or seeding failed"

echo "🚀 Starting Next.js application..."

# Start the Next.js application
exec node server.js