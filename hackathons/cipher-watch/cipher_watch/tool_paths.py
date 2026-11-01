"""Discover account-wide decoder commands without a private tool copy."""
from pathlib import Path
import shutil


def tool_path(name):
    return Path(shutil.which(name) or Path.home() / '.local/bin' / name).resolve()
