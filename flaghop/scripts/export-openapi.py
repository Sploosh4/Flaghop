"""Export native contracts without constructing a workspace or launching background jobs."""

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.api import create_app

schema = create_app().openapi()
output = ROOT / "frontend/openapi.json"
rendered = json.dumps(schema, indent=2, sort_keys=True) + "\n"
if "--check" in sys.argv:
    if not output.is_file() or output.read_text() != rendered:
        raise SystemExit("OpenAPI contract is stale. Run scripts/frontend.sh generate, then build.")
else:
    output.write_text(rendered)
