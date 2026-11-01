"""Child environment policy and tool-specific runtime preparation."""
from __future__ import annotations

import os
from pathlib import Path


def child_environment():
    # Use a small environment allowlist: no proxy, authentication, or tool-option
    # variables from the caller. curl's user configuration is disabled separately.
    names = ("PATH", "HOME", "TMPDIR", "SYSTEMROOT", "WINDIR")
    env = {name: os.environ[name] for name in names if name in os.environ}
    env.update({"LANG": "C.UTF-8", "LC_ALL": "C.UTF-8", "TERM": "dumb"})
    return env


def prepare_tool_environment(workspace, tool, isolated=False):
    """Prepare a child environment and its recorded runtime paths."""
    metadata = {}
    environment = child_environment()
    environment.update(workspace.environment())
    metadata["tmpdir"] = environment["TMPDIR"]
    if tool == "browser":
        # One short shared browser TMPDIR under the owned workspace keeps
        # Chrome's singleton socket below its path limit while remaining
        # inside the measured root.
        browser_scratch = workspace.path("b")
        browser_scratch.mkdir(mode=0o700, parents=True, exist_ok=True)
        environment["TMPDIR"] = str(browser_scratch)
        metadata["scratch_root"] = str(browser_scratch)
    if isolated:
        tool_home = workspace.path("tools", tool)
        tool_home.mkdir(mode=0o700, parents=True, exist_ok=True)
        environment["HOME"] = str(tool_home)
        environment["XDG_CONFIG_HOME"] = str(tool_home / "config")
        environment["XDG_CACHE_HOME"] = str(tool_home / "cache")
        if tool == "wpscan":
            # WPScan resolves its vulnerability database under XDG_CACHE_HOME.
            # Use the already-installed shared database read-only while keeping
            # HOME/config isolated; an operator may point this at a declared
            # shared cache explicitly.
            wpscan_cache = os.environ.get("CTF_PROFILER_WPSCAN_CACHE")
            if wpscan_cache:
                environment["XDG_CACHE_HOME"] = wpscan_cache
            else:
                installed_cache = Path.home() / ".cache"
                if (installed_cache / "wpscan" / "db").is_dir():
                    environment["XDG_CACHE_HOME"] = str(installed_cache)
    return environment, metadata
