#!/usr/bin/env bash
set -euo pipefail
SHARED_ROOT="${SECURITY_TOOLS_HOME:-$HOME/.local/share/security-tools}"
export PATH="$HOME/.local/bin:$PATH"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/security-tools.py" && "$SCRIPT_DIR" != "$SHARED_ROOT" ]]; then
  mkdir -p "$SHARED_ROOT"
  install -m 755 "$SCRIPT_DIR/security-tools.py" "$SHARED_ROOT/security-tools.py"
fi
restart_reader=false
if systemctl --user is-active --quiet hackathon-readers.service; then
  systemctl --user stop hackathon-readers.service
  restart_reader=true
fi
finish() {
  if "$restart_reader"; then
    systemctl --user start hackathon-readers.service
  fi
}
trap finish EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
exec_update() {
  python3 "$SHARED_ROOT/security-tools.py" update "$@"
}
exec_update "$@"
