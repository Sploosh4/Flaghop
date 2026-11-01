#!/usr/bin/env bash
# One authenticated process performs setup and the owned local workflow.
set -euo pipefail
SCRIPT_PATH=$(readlink -f -- "$0")
if [[ $EUID != 0 ]]; then
  exec sudo -- /bin/bash "$SCRIPT_PATH"
fi
PROJECT_DIR=$(dirname -- "$(dirname -- "$SCRIPT_PATH")")
OWNER_UID=$(stat -c %u "$PROJECT_DIR/ctf_profiler.py")
OWNER_GID=$(stat -c %g "$PROJECT_DIR/ctf_profiler.py")
[[ $OWNER_UID != 0 ]] || exit 1
LOG="$PROJECT_DIR/setup/staged-system-install.log"
install -o "$OWNER_UID" -g "$OWNER_GID" -m 600 /dev/null "$LOG"
echo "Installing local tools. Log: $LOG"
bash "$PROJECT_DIR/setup/install-staged-system.sh" > "$LOG" 2>&1
echo 'Tools installed. Waiting for the workflow code checks to finish.'
for ((attempt=0; attempt<1200; attempt++)); do
  if [[ -f "$PROJECT_DIR/setup/staged-workflow-ready" ]]; then
    exec /bin/bash "$PROJECT_DIR/lab/run_workflow.sh" --staged --restart-lab
  fi
  sleep 2
done
echo 'The workflow was not marked ready within 40 minutes; setup finished, test not started.' >&2
exit 1
