#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
mkdir -p .tools .tmp .cache
if ! command -v uv >/dev/null 2>&1; then
  echo 'Install uv, or create a Python 3.12 venv manually and follow README.md.' >&2
  exit 1
fi
UV_CACHE_DIR="$PWD/.cache/uv" uv venv --python 3.12 --allow-existing .venv
UV_CACHE_DIR="$PWD/.cache/uv" uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python bootstrap.py
.venv/bin/python relocate_runtime.py
.venv/bin/python patch_hashcat.py
private_root="$PWD/.tools/sysroot"
(
  cd .tools/john/src
  export CPPFLAGS="-I$private_root/usr/include -I$private_root/usr/include/x86_64-linux-gnu"
  export LDFLAGS="-L$private_root/usr/lib/x86_64-linux-gnu -Wl,-rpath,$private_root/usr/lib/x86_64-linux-gnu"
  export LD_LIBRARY_PATH="$private_root/usr/lib/x86_64-linux-gnu"
  ./configure CFLAGS='-O2 -march=native'
  make -sj4
) > .tmp/john-build.log 2>&1
make -C .tools/hashcat -sj4 > .tmp/hashcat-build.log 2>&1
.venv/bin/python record_install.py
