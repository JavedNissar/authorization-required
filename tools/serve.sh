#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

port="${1:-8642}"
if [[ "$#" -gt 1 ]]; then
  echo "Usage: $0 [port]" >&2
  exit 2
fi

# Dev server: static files, no build step.
#  - Cache-Control: no-cache so browsers always revalidate (python's default
#    heuristic caching otherwise serves stale modules).
#  - Live reload: an SSE endpoint broadcasts when any source file changes;
#    the client snippet is injected into served HTML only, so the files on
#    disk (and the shipped ZIP) are never touched.
exec python3 - "$port" <<'PY'
import os, sys, time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RELOAD_SNIPPET = b'<script>new EventSource("/__livereload").onmessage=function(){location.reload()}</script>'
SKIP_DIRS = {'.git', 'dist', 'node_modules', '__pycache__'}

def stamp():
    newest = 0.0
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            try:
                newest = max(newest, os.path.getmtime(os.path.join(root, f)))
            except OSError:
                pass
    return newest

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_GET(self):
        if self.path == '/__livereload':
            return self._livereload()
        if self.path in ('/', '/index.html'):
            return self._index()
        super().do_GET()

    def _index(self):
        body = Path('index.html').read_bytes().replace(b'</body>', RELOAD_SNIPPET + b'</body>')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _livereload(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.end_headers()
        seen = stamp()
        try:
            self.wfile.write(b'retry: 1000\n\n')
            self.wfile.flush()
            while True:
                time.sleep(0.5)
                cur = stamp()
                if cur != seen:
                    seen = cur
                    self.wfile.write(b'data: reload\n\n')
                    self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), Handler).serve_forever()
PY
