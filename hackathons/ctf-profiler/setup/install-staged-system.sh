#!/usr/bin/env bash
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'Administrator authentication is required'; exit 1; }
PROJECT_DIR=$(dirname -- "$(dirname -- "$(readlink -f -- "$0")")")
OWNER_UID=$(stat -c %u "$PROJECT_DIR/ctf_profiler.py")
OWNER_NAME=$(getent passwd "$OWNER_UID" | cut -d: -f1)
OWNER_DIRECTORY=$(getent passwd "$OWNER_UID" | cut -d: -f6)
[[ $OWNER_UID != 0 && -n $OWNER_NAME ]] || exit 1
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ffuf sqlmap golang-go ruby-dev build-essential libcurl4-openssl-dev libxml2-dev libxslt1-dev zlib1g-dev libffi-dev
runuser -u "$OWNER_NAME" -- env GOBIN="$PROJECT_DIR/.tools/bin" go install github.com/praetorian-inc/fingerprintx/cmd/fingerprintx@v1.1.19
runuser -u "$OWNER_NAME" -- gem install wpscan --version 4.2.0 --no-document --install-dir "$PROJECT_DIR/.tools/gems"
runuser -u "$OWNER_NAME" -- /usr/bin/python3 "$PROJECT_DIR/setup/write-staged-wrappers.py"
dpkg-query -W ffuf sqlmap golang-go ruby-dev
echo 'Staged tool installation complete.'
