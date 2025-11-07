#!/usr/bin/env bash
set -euo pipefail

# Local Excel export from Azure Postgres; results land in ./exports/
cd "$(dirname "${BASH_SOURCE[0]}")/.."
export PRISMA_CLIENT_ENGINE_TYPE=binary
npx dotenv -e .env.export -- npm run export-forms -- --destination local --output-dir exports
