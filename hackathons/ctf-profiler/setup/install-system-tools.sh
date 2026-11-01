#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    printf '%s\n' 'Run this reviewed installer with administrator privileges.' >&2
    exit 1
fi

setup_dir="$(dirname -- "$(readlink -f -- "$0")")"
official_installer="$setup_dir/msfinstall.official.sh"
expected_sha256="d12fea4d1339ebecb09d8cc36920d9f5e5e7e9fffbe092b1e1cd09255cc16825"
printf '%s  %s\n' "$expected_sha256" "$official_installer" | sha256sum --check -

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
    whatweb testssl.sh smbclient samba-common-bin \
    python3-ldap3 python3-yaml python3-impacket

# Official Rapid7 installer adds its signed APT repository and Framework package.
bash "$official_installer"
dpkg-query -W whatweb testssl.sh smbclient samba-common-bin \
    python3-ldap3 python3-yaml python3-impacket metasploit-framework
