"""App-owned implementation audit, supplementing the standalone launcher audit.

Resolve supported launcher layouts without running shell/Ruby code. Unknown
layouts remain unmeasured. Shared OS libraries and arbitrary Ruby plugins are
outside this audit; do not infer a complete dependency inventory from it.
"""

import hashlib
from pathlib import Path
import re

MAX_BROWSER = 512 * 1024 * 1024
MAX_APP_BYTES = 64 * 1024 * 1024
MAX_APP_FILES = 2048


def identity(path, limit):
    path = Path(path).resolve(strict=True)
    size = path.stat().st_size
    if not path.is_file() or size > limit:
        raise ValueError("Implementation file is not bounded and ordinary.")
    digest, count = hashlib.sha256(), 0
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            count += len(chunk)
            if count > limit:
                raise ValueError("Implementation file grew past its audit budget.")
            digest.update(chunk)
    if count != size:
        raise ValueError("Implementation changed size during its audit.")
    return {"path": str(path), "bytes": size, "sha256": digest.hexdigest()}


def script(path):
    with Path(path).open("rb") as stream:
        header = stream.read(65537)
    return header[:65536].decode(errors="replace") if header.startswith(b"#!") else ""


def literals(text):
    return [Path(value) for value in re.findall(r"(?<![\w$])(/[^\s\"'`;$]+)", text)]


def browser_identity(launcher):
    path = Path(launcher).resolve(strict=True)
    with path.open("rb") as stream:
        direct = stream.read(4) == b"\x7fELF"
    candidates = [path] if direct else []
    text = script(path)
    # Google's documented wrapper layout resolves HERE from its own location.
    if "$HERE/chrome" in text or "${HERE}/chrome" in text:
        candidates.append(path.parent / "chrome")
    names = {"chrome", "chromium", "chromium-browser", "headless_shell"}
    candidates.extend(item for item in literals(text) if item.name in names)
    if re.search(r'APPNAME=["\x27]?chromium["\x27]?\s', text) and "/usr/lib/" in text:
        candidates.append(Path("/usr/lib/chromium/chromium"))
    binaries = []
    for candidate in dict.fromkeys(candidates):
        if candidate.is_file():
            with candidate.open("rb") as stream:
                if stream.read(4) == b"\x7fELF":
                    binaries.append(identity(candidate, MAX_BROWSER))
    if not binaries:
        raise ValueError("Chrome implementation could not be resolved from this launcher layout.")
    return {"status": "covered", "launcher": identity(path, MAX_BROWSER), "elf": binaries}


def wpscan_identity(launcher):
    path = Path(launcher).resolve(strict=True)
    text = script(path)
    roots = []
    for value in re.findall(r"(?:^|\n)(?:export\s+)?GEM_HOME=[\"']?(/[^\s\"']+)", text):
        roots.append(Path(value))
    # A shell launcher may point at a RubyGems generated binstub. Its parent
    # identifies the selected gem home; inspect every installed WPScan version.
    for target in [path, *literals(text)]:
        if target.name == "wpscan" and target.parent.name == "bin" and (target.parent.parent / "gems").is_dir():
            roots.append(target.parent.parent)
    files, total = {}, 0
    for root in dict.fromkeys(roots):
        for package in sorted((root / "gems").glob("wpscan-*")):
            paths = [p for p in package.rglob("*") if p.is_file()]
            spec = root / "specifications" / (package.name + ".gemspec")
            if spec.is_file():
                paths.append(spec)
            for item in sorted(paths):
                name = str(item.resolve())
                if name in files:
                    continue
                if len(files) >= MAX_APP_FILES:
                    raise ValueError("WPScan implementation exceeds its file-count audit budget.")
                fact = identity(item, MAX_APP_BYTES - total)
                files[name] = {"bytes": fact["bytes"], "sha256": fact["sha256"]}
                total += fact["bytes"]
    if not files or not any("/lib/" in name for name in files) or not any("/bin/wpscan" in name for name in files):
        raise ValueError("WPScan application entrypoint and library could not be resolved.")
    return {
        "status": "covered",
        "launcher": identity(path, 65536),
        "files": files,
        "files_count": len(files),
        "bytes": total,
        "scope": "WPScan application versions, assets and gemspecs in the selected launcher gem home",
    }


def snapshot(tools):
    result = {}
    for name, resolve in (("browser", browser_identity), ("wpscan", wpscan_identity)):
        launcher = tools.get(name)
        if not launcher:
            result[name] = {"status": "missing"}
            continue
        try:
            result[name] = resolve(launcher)
        except (OSError, ValueError) as exc:
            result[name] = {"status": "unmeasured", "reason": str(exc)[:500]}
    return result


def comparison(before, after):
    names = {"browser", "wpscan"}
    if set(before) != names or set(after) != names:
        raise ValueError("Implementation audit lacks required tool states.")
    if any(
        row.get("status") not in {"covered", "missing", "unmeasured"}
        for facts in (before, after)
        for row in facts.values()
    ):
        raise ValueError("Implementation audit contains an invalid coverage state.")
    changed = [name for name in before if before[name] != after.get(name)]
    unmeasured = [name for name, row in after.items() if row["status"] == "unmeasured"]
    return {
        "before": before,
        "after": after,
        "changed": changed,
        "unmeasured": unmeasured,
        "unchanged": not changed and not unmeasured,
        "limitations": ["Shared browser/OS libraries, Ruby dependencies and plugins are not exhaustively covered."],
    }
