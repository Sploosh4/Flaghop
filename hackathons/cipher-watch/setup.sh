#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
if [[ $(uname -s) != Linux || $(uname -m) != x86_64 ]]; then
  echo 'This pinned prototype setup supports Linux x86_64.' >&2
  exit 1
fi
mkdir -p .tools .tmp .cache
if command -v uv >/dev/null 2>&1; then
  UV_CACHE_DIR="$PWD/.cache/uv" uv venv --allow-existing .venv
  UV_CACHE_DIR="$PWD/.cache/uv" uv pip install --python .venv/bin/python -r requirements.txt
else
  python3 -m venv .venv
  .venv/bin/python -m pip install --cache-dir "$PWD/.cache/pip" -r requirements.txt
fi
.venv/bin/python setup_tools.py
