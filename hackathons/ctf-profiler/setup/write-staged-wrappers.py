#!/usr/bin/env python3
"""Expose project-local Ruby dependencies without changing system gems."""
from pathlib import Path
import shlex

project = Path(__file__).resolve().parents[1]
gems = project / ".tools/gems"
wrapper = project / ".tools/bin/wpscan"
wrapper.write_text("#!/bin/sh\nexport GEM_HOME=" + shlex.quote(str(gems)) + "\nexport GEM_PATH=" + shlex.quote(str(gems)) + "\nexec /usr/bin/ruby " + shlex.quote(str(gems / "bin/wpscan")) + ' "$@"\n')
wrapper.chmod(0o755)
