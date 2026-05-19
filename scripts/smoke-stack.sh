#!/usr/bin/env bash
# Smoke-test the local Docker Compose stack (mongo + api + web).
# Usage: ./scripts/smoke-stack.sh
# Env: API_URL (default http://localhost:8080), WEB_URL (default http://localhost:3000)

set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

echo "Smoke: API at $API_URL"
health_json="$(curl -fsS "$API_URL/health")"
echo "$health_json" | jq -e '.status == "ok" and .mongo == "connected"' >/dev/null

echo "Smoke: GET /v1/site"
site_json="$(curl -fsS "$API_URL/v1/site")"
echo "$site_json" | jq -e '.data.buildingName != null and (.data.buildingName | length) > 0' >/dev/null

echo "Smoke: Web at $WEB_URL/en"
code="$(curl -fsS -o /dev/null -w "%{http_code}" "$WEB_URL/en")"
if [[ "$code" != "200" ]]; then
  echo "::error::Expected HTTP 200 from $WEB_URL/en, got $code"
  exit 1
fi

echo "Stack smoke passed."
