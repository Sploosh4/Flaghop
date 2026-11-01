#!/usr/bin/env bash
# One sudo authentication covers the privileged portion of this entire run.
set -euo pipefail
umask 077
SCRIPT_PATH=$(readlink -f -- "$0")
if [[ $EUID != 0 ]]; then
  exec sudo -- /bin/bash "$SCRIPT_PATH" "$@"
fi
LAB_DIR=$(dirname -- "$SCRIPT_PATH")
PROJECT_DIR=$(dirname -- "$LAB_DIR")
OWNER_UID=$(stat -c %u "$LAB_DIR/run_target.py")
OWNER_GID=$(stat -c %g "$LAB_DIR/run_target.py")
OWNER_NAME=$(getent passwd "$OWNER_UID" | cut -d: -f1)
OWNER_DIRECTORY=$(getent passwd "$OWNER_UID" | cut -d: -f6)
if [[ $OWNER_UID == 0 || -z $OWNER_NAME ]]; then
  echo 'The project must belong to a normal user' >&2
  exit 1
fi
STAGED=false
RESTART=false
for argument in "$@"; do
  case "$argument" in
    --staged) STAGED=true ;;
    --restart-lab) RESTART=true ;;
    *) echo 'Usage: bash lab/run_workflow.sh [--staged] [--restart-lab]' >&2; exit 1 ;;
  esac
done
RUN_PARENT="$PROJECT_DIR/validation/classified-lab"
if $STAGED; then RUN_PARENT="$PROJECT_DIR/validation/staged-lab"; fi
install -d -o "$OWNER_UID" -g "$OWNER_GID" -m 700 "$RUN_PARENT"
RUN_DIR="$RUN_PARENT/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -- "$RUN_DIR"
chown "$OWNER_UID:$OWNER_GID" "$RUN_DIR"
# Entire orchestration is already elevated; no sudo timestamp keeper, stored
# password, passwordless sudo configuration, or additional prompts are needed.
if $RESTART && systemctl is-active --quiet ctf-profiler-local-lab.service; then
  systemctl restart ctf-profiler-local-lab.service
fi
printf 'Run directory: %s\n' "$RUN_DIR"
DISCOVERY_ARGS=()
if $STAGED; then DISCOVERY_ARGS=(--udp); fi
bash "$LAB_DIR/start-and-scan.sh" "$RUN_DIR" "${DISCOVERY_ARGS[@]}" > "$RUN_DIR/setup-and-nmap.log" 2>&1
chown "$OWNER_UID:$OWNER_GID" "$RUN_DIR/setup-and-nmap.log"
USER_PATH="$OWNER_DIRECTORY/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
USER_PATH="$PROJECT_DIR/.tools/bin:$USER_PATH"
EXTRA_ARGS=()
if $STAGED; then EXTRA_ARGS=(--stages 1-5 --no-metasploit --skip metasploit_check --assessment-timeout 180 --validation-timeout 180); fi
echo 'Discovery complete. Running conditional follow-ups as the project owner.'
set +e
runuser -u "$OWNER_NAME" -- env PATH="$USER_PATH" /usr/bin/python3 "$PROJECT_DIR/ctf_profiler.py" \
  127.0.0.2 --from-nmap "$RUN_DIR/discovery/nmap.xml" \
  --ports 53,445,12222,18080,18443,18444 --dns-server 127.0.0.2 \
  --tool-timeout 45 --tls-timeout 240 --workspace ctf-profiler-classified-lab \
  --label 'Owned local CTF services' --out "$RUN_DIR/profile" \
  "${EXTRA_ARGS[@]}" \
  > "$RUN_DIR/profiler.log" 2>&1
PROFILE_STATUS=$?
set -e
chown "$OWNER_UID:$OWNER_GID" "$RUN_DIR/profiler.log"
if [[ $PROFILE_STATUS != 0 && $PROFILE_STATUS != 2 ]]; then
  echo "Profiling failed; inspect $RUN_DIR/profiler.log" >&2
  exit "$PROFILE_STATUS"
fi
if $STAGED; then
  runuser -u "$OWNER_NAME" -- env PATH="$USER_PATH" /usr/bin/python3 "$LAB_DIR/verify_staged_profile.py" "$RUN_DIR"
else
  runuser -u "$OWNER_NAME" -- env PATH="$USER_PATH" /usr/bin/python3 "$LAB_DIR/verify_classified_profile.py" "$RUN_DIR"
fi
# Metasploit execution/import verification is delegated to another agent.
chown "$OWNER_UID:$OWNER_GID" "$RUN_DIR"/*.log
echo "Workflow complete: $RUN_DIR"
exit "$PROFILE_STATUS"
