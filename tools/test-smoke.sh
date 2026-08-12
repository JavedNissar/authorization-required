#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

port="${SMOKE_PORT:-8642}"
log="${TMPDIR:-/tmp}/authorization-required-smoke-server.log"
server_pid=""

cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# Reuse a developer's existing server; otherwise start one for this test run.
if ! curl --silent --fail --max-time 1 "http://127.0.0.1:$port/index.html" >/dev/null 2>&1; then
  tools/serve.sh "$port" >"$log" 2>&1 &
  server_pid=$!
  for _ in {1..50}; do
    if curl --silent --fail --max-time 1 "http://127.0.0.1:$port/index.html" >/dev/null 2>&1; then
      break
    fi
    if ! kill -0 "$server_pid" 2>/dev/null; then
      echo "Smoke-test server failed to start:" >&2
      cat "$log" >&2
      exit 1
    fi
    sleep 0.1
  done
fi

if ! curl --silent --fail --max-time 1 "http://127.0.0.1:$port/index.html" >/dev/null; then
  echo "Timed out waiting for the smoke-test server on port $port" >&2
  exit 1
fi

SMOKE_BASE_URL="http://127.0.0.1:$port" node tools/smoke.mjs
