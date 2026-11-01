#!/usr/bin/env python3
"""Refresh shared WPScan and scanner launchers."""
from pathlib import Path
import subprocess
import sys

if __name__ == '__main__':
    subprocess.run([sys.executable, str(Path(__file__).resolve().parents[3] / 'scripts/security-tools.py'), 'launchers'], check=True)
