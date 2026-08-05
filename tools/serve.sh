#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

port="${1:-8642}"
if [[ "$#" -gt 1 ]]; then
  echo "Usage: $0 [port]" >&2
  exit 2
fi

exec python3 -m http.server "$port" --bind 127.0.0.1
