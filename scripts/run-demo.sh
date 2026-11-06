#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
export SPRING_PROFILES_ACTIVE=demo
export REACT_APP_DEMO_MODE=true
export REACT_APP_API_BASE=/api
export DATABASE_PORT="${DATABASE_PORT:-5434}"
export DATABASE_NAME="${DATABASE_NAME:-tripmate}"
export DATABASE_USERNAME="${DATABASE_USERNAME:-tripmate}"
(
  cd frontend
  if [ ! -d node_modules ]; then npm ci; fi
  npm run build
)
cd backend
exec ./gradlew bootRun
