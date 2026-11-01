#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
project_root="$PWD"
python_bin="${LEGION_PYTHON:-$PWD/.venv/bin/python}"
if [[ -x "$PWD/.tools/node/bin/node" ]]; then
    export PATH="$PWD/.tools/node/bin:$PATH"
fi
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
    echo 'Node.js 24 LTS and npm are required for frontend development.' >&2
    exit 1
fi
export npm_config_cache="$PWD/.cache/npm"
export TMPDIR="$PWD/.tmp"
export PYTHONDONTWRITEBYTECODE=1
mkdir -p "$TMPDIR" "$npm_config_cache" "$PWD/.artifacts/disposable"
case "${1:-check}" in
    install) npm --prefix frontend ci ;;
    generate)
        "$python_bin" scripts/export-openapi.py
        npm --prefix frontend run generate
        ;;
    build)
        npm --prefix frontend run build
        "$python_bin" scripts/frontend-notices.py "$project_root/app/web/static/bundles"
        ;;
    check)
        "$python_bin" scripts/export-openapi.py --check
        npm --prefix frontend run generate -- --check
        npm --prefix frontend run test
        npm --prefix frontend run build -- --outDir "$project_root/.artifacts/disposable/frontend-check"
        "$python_bin" scripts/frontend-notices.py "$project_root/.artifacts/disposable/frontend-check"
        for artifact in workspace.js THIRD_PARTY_NOTICES.txt; do
            cmp "$project_root/app/web/static/bundles/$artifact" "$project_root/.artifacts/disposable/frontend-check/$artifact" || {
                echo 'Production frontend assets are stale. Run scripts/frontend.sh build.' >&2
                exit 1
            }
        done
        ;;
    *) echo 'Usage: scripts/frontend.sh {install|generate|build|check}' >&2; exit 2 ;;
esac
