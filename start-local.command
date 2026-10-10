#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js 24 LTS를 설치한 다음 다시 실행해 주세요: https://nodejs.org'
  exit 1
fi
node scripts/launch-local.mjs
