#!/usr/bin/env bash
# Post-deploy smoke tests against production API and web URLs.
# Requires: PRODUCTION_API_URL, PRODUCTION_WEB_URL (canonical HTTPS URL, no trailing slash).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=smoke-common.sh
source "$SCRIPT_DIR/smoke-common.sh"

API_URL="${PRODUCTION_API_URL:-}"
WEB_URL="${PRODUCTION_WEB_URL:-}"

if [[ -z "$API_URL" ]]; then
  echo "::error::PRODUCTION_API_URL secret is not set"
  exit 1
fi
if [[ -z "$WEB_URL" ]]; then
  echo "::error::PRODUCTION_WEB_URL secret is not set"
  exit 1
fi

API_URL="${API_URL%/}"
WEB_URL="${WEB_URL%/}"

check_api_health() {
  local json
  json="$(curl -fsS "$API_URL/health")" || return 1
  echo "$json" | jq -e '.status == "ok" and .mongo == "connected"' >/dev/null
}

echo "Waiting for API health at $API_URL/health ..."
api_ok=false
for i in $(seq 1 30); do
  if check_api_health; then
    api_ok=true
    echo "API healthy (attempt $i)"
    break
  fi
  echo "API not ready (attempt $i/30), retrying in 20s ..."
  sleep 20
done
if [[ "$api_ok" != "true" ]]; then
  echo "::error::API did not become healthy within timeout"
  exit 1
fi

echo "Smoke: GET $API_URL/v1/site"
site_json="$(curl -fsS "$API_URL/v1/site")"
echo "$site_json" | jq -e '.data.buildingName != null' >/dev/null

echo "Waiting for web home at $WEB_URL ..."
web_ok=false
for i in $(seq 1 15); do
  if smoke_web_home_ok "$WEB_URL"; then
    web_ok=true
    echo "Web healthy (attempt $i)"
    break
  fi
  echo "Web not ready (attempt $i/15), retrying in 10s ..."
  sleep 10
done
if [[ "$web_ok" != "true" ]]; then
  smoke_web_debug_headers "$WEB_URL"
  echo "::error::Web home did not return HTTP 2xx within timeout"
  echo "::error::Set PRODUCTION_WEB_URL to the canonical HTTPS URL (e.g. https://your-app.vercel.app)"
  exit 1
fi

echo "Production smoke passed."
