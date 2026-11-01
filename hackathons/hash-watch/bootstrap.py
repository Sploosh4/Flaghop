"""Compatibility entry point for the unpinned shared tool installer."""
from pathlib import Path
import subprocess
import sys

if __name__ == '__main__':
    subprocess.run([sys.executable, str(Path(__file__).resolve().parents[2] / 'scripts/security-tools.py'), 'update', '--only', 'john', 'hashcat'], check=True)
