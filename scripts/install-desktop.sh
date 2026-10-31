#!/usr/bin/env bash
# Install this checkout's desktop entry, backend service and storage watcher.
set -euo pipefail
legion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
mountpoint --quiet "$legion_root" || { printf '%s\n' 'Mount the capped project filesystem before installing.' >&2; exit 1; }
python3 "$legion_root/skills/project-storage-cap/scripts/storage_guard.py" --root "$legion_root" --check
"$legion_root/.venv/bin/python" -c 'from PyQt6.QtWebEngineWidgets import QWebEngineView'
export LEGION_INSTALL_ROOT="$legion_root"
python3 - <<'PY'
import os
from pathlib import Path
import shlex

root = Path(os.environ['LEGION_INSTALL_ROOT'])
home = Path.home()
units = home / '.config/systemd/user'
apps = home / '.local/share/applications'
bin_dir = home / '.local/bin'
for path in (units, apps, bin_dir):
    path.mkdir(parents=True, exist_ok=True)
for path in ('.state/config', '.state/tmp', '.cache'):
    (root / path).mkdir(parents=True, exist_ok=True)

def quote(value):
    # systemd quoted values; percent expansion must be escaped as well.
    return '"' + str(value).replace('\\', '\\\\').replace('"', '\\"').replace('%', '%%') + '"'

guard = root / 'skills/project-storage-cap/scripts/storage_guard.py'
units.joinpath('legion.service').write_text(f'''[Unit]
Description=FlagHop local workspace backend
After=graphical-session.target

[Service]
Type=simple
WorkingDirectory={str(root).replace('%', '%%')}
ExecStartPre=/usr/bin/mountpoint --quiet {quote(root)}
ExecStartPre=/usr/bin/python3 {quote(guard)} --root {quote(root)} --check
Environment={quote(f"LEGION_HOME={root}/.state/config")}
Environment={quote(f"TMPDIR={root}/.state/tmp")}
Environment={quote(f"XDG_CACHE_HOME={root}/.cache")}
Environment=PYTHONDONTWRITEBYTECODE=1
Environment={quote(f"PATH={root}/.venv/bin:{home}/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin")}
ExecStart={quote(root / '.venv/bin/python')} {quote(root / 'legion.py')} --web --web-port 5000
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
''')
units.joinpath('legion-storage-guard.service').write_text(f'''[Unit]
Description=FlagHop project storage budget watcher

[Service]
Type=simple
ExecStart=/usr/bin/python3 {quote(guard)} --root {quote(root)} --watch
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
''')
units.joinpath('legion-desktop.service').write_text(f'''[Unit]
Description=FlagHop desktop application
After=graphical-session.target

[Service]
Type=simple
WorkingDirectory={str(root).replace('%', '%%')}
ExecStart={quote(root / 'scripts/launch-desktop.sh')}
''')
launcher = bin_dir / 'flaghop'
launcher.write_text('#!/usr/bin/env bash\nexec ' + shlex.quote(str(root / 'scripts/launch-desktop.sh')) + ' "$@"\n')
launcher.chmod(0o755)
# Preserve the existing command as a compatibility alias.
legacy_launcher = bin_dir / 'legion'
if not legacy_launcher.exists() or str(root) in legacy_launcher.read_text():
    legacy_launcher.write_text(launcher.read_text())
    legacy_launcher.chmod(0o755)
apps.joinpath('flaghop.desktop').write_text(f'''[Desktop Entry]
Type=Application
Name=FlagHop
Comment=Local security investigation workspace
Exec="{launcher}"
Icon={root}/images/icons/flaghop.svg
Terminal=false
Categories=Network;Development;
Keywords=FlagHop;Legion;Nmap;CTF;Security;
StartupNotify=true
StartupWMClass=FlagHop
''')
old_entry = apps / 'legion.desktop'
if old_entry.exists() and str(root) in old_entry.read_text():
    old_entry.unlink()
PY
systemctl --user daemon-reload
systemctl --user enable --now legion.service legion-storage-guard.service
if command -v update-desktop-database >/dev/null; then
    update-desktop-database "$HOME/.local/share/applications"
fi
printf '%s\n' 'Installed. Search Applications for FlagHop, or run flaghop.'
