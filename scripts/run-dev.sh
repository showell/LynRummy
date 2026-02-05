#!/usr/bin/env bash
set -e

cp -r static/* dist/

echo -e "\nTest\n---\n\n"

npx live-server dist/ --port=7888 &
LIVE_SERVER_PID=$!

cleanup() {
    echo "Stopping node server..."
    kill $LIVE_SERVER_PID 2>/dev/null || true
}

trap cleanup EXIT

ls game.ts | entr -r bash -c '
  npx tsc --strict --lib es2022,dom --outDir dist game.ts &&
  npx prettier game.ts --write &&
  node dist/game.js
'
