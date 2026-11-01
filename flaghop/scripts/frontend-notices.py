"""Keep bundled runtime licenses with the production frontend assets."""

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).resolve()
output.relative_to(ROOT)
notices = []
for name in ("react", "react-dom", "scheduler", "openapi-fetch"):
    package = ROOT / "frontend/node_modules" / name
    metadata = json.loads((package / "package.json").read_text())
    notices.append(f"{name} {metadata['version']}\n\n{(package / 'LICENSE').read_text().strip()}")
output.mkdir(parents=True, exist_ok=True)
(output / "THIRD_PARTY_NOTICES.txt").write_text("\n\n".join(notices) + "\n")
