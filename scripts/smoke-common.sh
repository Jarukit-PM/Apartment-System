#!/usr/bin/env bash
# Shared helpers for smoke-stack.sh and smoke-production.sh (source, do not execute directly).

# Returns 0 when the web app home responds with 2xx after redirects.
# Tries base URL with and without trailing slash (avoids Vercel 308 slash loops).
smoke_web_home_ok() {
  local base="${1%/}"
  local url code

  for url in "$base" "$base/"; do
    code="$(
      curl -sS -o /dev/null -w "%{http_code}" \
        -L --max-redirs 25 \
        --connect-timeout 15 --max-time 60 \
        "$url" 2>/dev/null || echo "000"
    )"
    if [[ "$code" =~ ^2[0-9]{2}$ ]]; then
      echo "Web OK: $url → HTTP $code (after redirects)"
      return 0
    fi
    echo "Web probe $url → HTTP $code"
  done
  return 1
}

# Print redirect chain for debugging failed web checks.
smoke_web_debug_headers() {
  local base="${1%/}"
  echo "--- curl -sSI -L $base/ ---"
  curl -sSI -L --max-redirs 10 "$base/" 2>&1 | head -40 || true
}
