#!/usr/bin/env bash
# Smoke-test the local Docker Compose stack (mongo + api + web).
# Used by CI "integration" job — not production URLs.
# For production, use scripts/smoke-production.sh (PRODUCTION_API_URL, PRODUCTION_WEB_URL).
# Env: API_URL (default http://localhost:8080), WEB_URL (default http://localhost:3000)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=smoke-common.sh
source "$SCRIPT_DIR/smoke-common.sh"

API_URL="${API_URL:-http://localhost:8080}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
API_URL="${API_URL%/}"
WEB_URL="${WEB_URL%/}"

echo "Smoke: API at $API_URL"
health_json="$(curl -fsS "$API_URL/health")"
echo "$health_json" | jq -e '.status == "ok" and .mongo == "connected"' >/dev/null

echo "Smoke: GET /v1/site"
site_json="$(curl -fsS "$API_URL/v1/site")"
echo "$site_json" | jq -e '.data.buildingName != null and (.data.buildingName | length) > 0' >/dev/null

echo "Smoke: Web home at $WEB_URL"
if ! smoke_web_home_ok "$WEB_URL"; then
  smoke_web_debug_headers "$WEB_URL"
  echo "::error::Web home did not return HTTP 2xx"
  exit 1
fi

echo "Stack smoke passed."
