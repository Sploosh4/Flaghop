#!/usr/bin/env python3
"""Install current upstream tools into the account-wide shared location."""
from pathlib import Path
import subprocess
import sys

if __name__ == '__main__':
    subprocess.run([sys.executable, str(Path(__file__).resolve().parents[3] / 'scripts/security-tools.py'), 'update', '--only', 'nuclei', 'httpx', 'katana', 'dalfox', 'zap', 'fingerprintx', 'wpscan'], check=True)
