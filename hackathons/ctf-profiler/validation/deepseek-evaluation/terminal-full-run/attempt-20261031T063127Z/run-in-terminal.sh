#!/usr/bin/env bash
set -uo pipefail
umask 077
cd /home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler
CONTROL="$(cd -- "$(dirname -- "$0")" && pwd)"
printf '%s\n' 'Full staged test against the owned local lab (127.0.0.2).' 'Enter your sudo password at the prompt below. The test will then continue automatically.' 'Metasploit is excluded.'
date -u +%FT%TZ > "$CONTROL/started-at.txt"
touch "$CONTROL/RUNNING"
bash lab/run_workflow.sh --staged --restart-lab 2>&1 | tee "$CONTROL/terminal-stdout.log"
RESULT=${PIPESTATUS[0]}
printf '%s\n' "$RESULT" > "$CONTROL/exit-status.txt"
date -u +%FT%TZ > "$CONTROL/finished-at.txt"
rm -f "$CONTROL/RUNNING"
printf '\nFull workflow exit status: %s\nLogs: %s\nPress Enter to close this terminal.\n' "$RESULT" "$CONTROL"
read -r
