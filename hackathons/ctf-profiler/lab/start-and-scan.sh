#!/usr/bin/env bash
# Authenticate through pkexec; only the localhost lab and Nmap need privileges.
set -euo pipefail
if [[ $EUID != 0 ]]; then
  echo 'Run: pkexec bash /absolute/path/to/lab/start-and-scan.sh' >&2
  exit 1
fi
LAB_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(dirname -- "$LAB_DIR")
SCAN_DIR=${1:-"$PROJECT_DIR/validation/live-lab"}
OWNER_UID=$(stat -c %u "$LAB_DIR/run_target.py")
OWNER_GID=$(stat -c %g "$LAB_DIR/run_target.py")
OWNER_NAME=$(getent passwd "$OWNER_UID" | cut -d: -f1)
if [[ $OWNER_UID == 0 || -z $OWNER_NAME ]]; then
  echo 'The lab must belong to a normal user' >&2
  exit 1
fi
install -d -o "$OWNER_UID" -g "$OWNER_GID" -m 700 "$LAB_DIR/runtime" "$SCAN_DIR" "$SCAN_DIR/discovery"
if systemctl is-active --quiet ctf-profiler-local-lab.service; then
  echo 'The local lab is already running'
else
  systemd-run --unit=ctf-profiler-local-lab --collect \
    --description='Owned localhost CTF profiling target' \
    --property="User=$OWNER_NAME" --property="WorkingDirectory=$LAB_DIR" \
    --property=AmbientCapabilities=CAP_NET_BIND_SERVICE \
    --property=CapabilityBoundingSet=CAP_NET_BIND_SERVICE \
    --property=NoNewPrivileges=yes --property=ProtectSystem=strict \
    --property=ProtectHome=read-only --property="ReadWritePaths=$LAB_DIR/runtime" \
    --property=PrivateTmp=yes --property=ProtectKernelTunables=yes \
    --property=ProtectControlGroups=yes --property=RestrictSUIDSGID=yes \
    --property=TasksMax=128 --property=MemoryMax=512M \
    "$LAB_DIR/.venv/bin/python" -u "$LAB_DIR/run_target.py"
fi
"$LAB_DIR/.venv/bin/python" - <<'PY'
import socket, time
deadline = time.monotonic() + 20
while True:
    try:
        for port in (53, 445, 12222, 18080, 18443):
            with socket.create_connection(('127.0.0.2', port), timeout=1):
                pass
        break
    except OSError:
        if time.monotonic() > deadline:
            raise
        time.sleep(0.5)
PY
echo 'Scanning only owned target 127.0.0.2'
SCAN_FLAGS=(-p 53,445,12222,18080,18443,18444)
if [[ ${2:-} == '--udp' ]]; then SCAN_FLAGS=(-sU -p T:53,445,12222,18080,18443,18444,U:53); fi
/usr/bin/nmap -sS -sV -n -Pn --reason -O --osscan-limit \
  --script ssl-cert "${SCAN_FLAGS[@]}" \
  --host-timeout 300s -oX "$SCAN_DIR/discovery/nmap.xml" 127.0.0.2 \
  > "$SCAN_DIR/discovery/nmap.log" 2>&1
chown "$OWNER_UID:$OWNER_GID" "$SCAN_DIR/discovery/nmap.xml" "$SCAN_DIR/discovery/nmap.log"
echo 'Local lab running; privileged Nmap discovery saved.'
