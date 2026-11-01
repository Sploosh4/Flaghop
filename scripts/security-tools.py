#!/usr/bin/env python3
"""Install/update shared account-wide tools from current upstream releases."""

import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request
import zipfile

ROOT = Path(os.environ.get("SECURITY_TOOLS_HOME", Path.home() / ".local/share/security-tools"))
BIN = Path.home() / ".local/bin"
RELEASES = {
    "nuclei": ("projectdiscovery/nuclei", r"_linux_amd64\.zip$"),
    "httpx": ("projectdiscovery/httpx", r"_linux_amd64\.zip$"),
    "katana": ("projectdiscovery/katana", r"_linux_amd64\.zip$"),
    "dalfox": ("hahwul/dalfox", r"-linux-x86_64-musl\.tar\.gz$"),
    "ciphey": ("bee-san/Ciphey", r"^ciphey-linux-x86_64\.tar\.gz$"),
    "zap": ("zaproxy/zaproxy", r"_Linux\.tar\.gz$"),
    "fingerprintx": ("praetorian-inc/fingerprintx", None),
    "hashcat": ("hashcat/hashcat", None),
}
STATE = ROOT / "installed.json"


def fetch(url, limit=500_000_000):
    request = urllib.request.Request(url, headers={"User-Agent": "shared-security-tools"})
    with urllib.request.urlopen(request, timeout=180) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError("Download exceeds limit: " + url)
    return data


def api(path):
    return json.loads(fetch("https://api.github.com/repos/" + path, 5_000_000))


def sha(path):
    with Path(path).open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def write_state(state):
    temporary = STATE.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, indent=2) + "\n")
    temporary.replace(STATE)


def command(argv, **kwargs):
    subprocess.run([str(arg) for arg in argv], check=True, timeout=1200, **kwargs)


def symlink(name, target):
    path = BIN / name
    if path.is_symlink() and path.resolve() == target.resolve():
        return
    if path.exists() and not path.is_symlink():
        raise ValueError("Refusing to overwrite unmanaged command: " + str(path))
    temporary = path.with_name(path.name + ".new")
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target)
    temporary.replace(path)


def launcher(name, text):
    path = ROOT / "launchers" / name
    path.parent.mkdir(exist_ok=True)
    path.write_text("#!/bin/sh\nset -eu\n" + text)
    path.chmod(0o755)
    symlink(name, path)


def launchers():
    BIN.mkdir(parents=True, exist_ok=True)
    for name in ("nuclei", "httpx", "katana", "dalfox", "fingerprintx", "ciphey", "base64dump.py"):
        target = ROOT / "bin" / name
        if target.exists():
            symlink(name, target)
    if (ROOT / "bin/base64dump.py").exists():
        launcher("base64dump", f'exec python3 {shlex.quote(str(ROOT / "bin/base64dump.py"))} "$@"\n')
    compute = ROOT / "compute"
    libs = compute / "sysroot/usr/lib/x86_64-linux-gnu"
    # Captured absolute paths also work when a caller isolates HOME.
    runtime = (
        f"export LD_LIBRARY_PATH={shlex.quote(str(libs))}${{LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}}\n"
        f'export OCL_ICD_VENDORS="${{OCL_ICD_VENDORS:-{compute}/vendors}}"\n'
        f'export POCL_PATH_CLANG={shlex.quote(str(compute / "sysroot/usr/bin/clang-18"))}\n'
        f'export POCL_PATH_LLVM_SPIRV={shlex.quote(str(compute / "sysroot/usr/bin/llvm-spirv-18"))}\n'
        f'export HASH_WATCH_OPENCL_HEADERS={shlex.quote(str(compute / "sysroot/usr/lib/llvm-21/lib/clang/21/include"))}\n'
        'export RUSTICL_ENABLE="${RUSTICL_ENABLE:-radeonsi}"\n'
        f'if [ ! -e .clc ]; then ln -s {shlex.quote(str(compute / "sysroot/usr/lib/clc"))} .clc; fi\n'
    )
    for name, target in (("john", compute / "john/run/john"), ("hashcat", compute / "hashcat/hashcat")):
        if target.exists():
            launcher(name, runtime + f'exec {shlex.quote(str(target))} "$@"\n')
    for target in (compute / "john/run").glob("*2john*"):
        if target.is_file():
            interpreter = "python3 " if target.suffix == ".py" else "perl " if target.suffix == ".pl" else ""
            launcher(target.name, runtime + f'exec {interpreter}{shlex.quote(str(target))} "$@"\n')
    if (ROOT / "gems/bin/wpscan").exists():
        launcher(
            "wpscan",
            f'export GEM_HOME={shlex.quote(str(ROOT / "gems"))}\nexport GEM_PATH="$GEM_HOME"\nexec /usr/bin/ruby {shlex.quote(str(ROOT / "gems/bin/wpscan"))} "$@"\n',
        )
    if (ROOT / "zap/zap.sh").exists():
        launcher("zap.sh", f'exec {shlex.quote(str(ROOT / "zap/zap.sh"))} "$@"\n')


def replace_tree(source, destination):
    backup = destination.with_name(destination.name + ".previous")
    if backup.exists():
        raise ValueError("Unresolved previous installation: " + str(backup))
    if destination.exists():
        destination.rename(backup)
    try:
        source.rename(destination)
    except BaseException:
        if backup.exists():
            backup.rename(destination)
        raise
    if backup.exists():
        shutil.rmtree(backup)


def sources(repo, ref, temporary):
    archive = temporary / "source.tar.gz"
    archive.write_bytes(fetch(f"https://codeload.github.com/{repo}/tar.gz/{ref}"))
    destination = temporary / "source"
    destination.mkdir()
    with tarfile.open(archive) as bundle:
        bundle.extractall(destination, filter="data")
    return next(destination.iterdir()), sha(archive)


def build(name, repo, ref, temporary):
    source, source_hash = sources(repo, ref, temporary)
    compute = ROOT / "compute"
    sysroot = compute / "sysroot"
    env = dict(os.environ)
    libs = sysroot / "usr/lib/x86_64-linux-gnu"
    env.update(
        LD_LIBRARY_PATH=str(libs),
        CPPFLAGS=f"-I{sysroot}/usr/include -I{sysroot}/usr/include/x86_64-linux-gnu",
        LDFLAGS=f"-L{libs} -Wl,-rpath,{libs}",
    )
    if name == "john":
        command(["./configure", "CFLAGS=-O2 -march=native"], cwd=source / "src", env=env)
        command(["make", "-sj4"], cwd=source / "src", env=env)
        command([source / "run/john", "--list=build-info"], env=env)
    else:
        # Keep the existing opt-in workaround for the account's relocated Mesa ICD.
        backend = source / "src/backend.c"
        text = backend.read_text()
        needle = 'int build_options_len = snprintf(build_options_buf, build_options_sz, "-D KERNEL_STATIC ");'
        addition = '\n const char *hw_headers = getenv ("HASH_WATCH_OPENCL_HEADERS");\n if (hw_headers && (device_param->opencl_device_type & CL_DEVICE_TYPE_GPU))\n { build_options_len += snprintf (build_options_buf + build_options_len, build_options_sz - build_options_len, "-I \\"%s\\" ", hw_headers); }\n'
        if text.count(needle) != 1:
            raise ValueError("Hashcat GPU header hook changed upstream; review before rebuilding")
        backend.write_text(text.replace(needle, needle + addition))
        command(["make", "-sj4"], cwd=source, env=env)
        command([source / "hashcat", "--version"], env=env)
    replace_tree(source, compute / name)
    return {"source_sha256": source_hash}


def install_release(name, release, temporary):
    repo, pattern = RELEASES[name]
    if name == "fingerprintx":
        env = dict(os.environ, GOBIN=str(temporary))
        command(["go", "install", "github.com/praetorian-inc/fingerprintx/cmd/fingerprintx@latest"], env=env)
        (temporary / name).replace(ROOT / "bin" / name)
        return {"sha256": sha(ROOT / "bin" / name)}
    if name == "hashcat":
        return build(name, repo, release["tag_name"], temporary)
    matches = [asset for asset in release["assets"] if re.search(pattern, asset["name"])]
    if len(matches) != 1:
        raise ValueError("Upstream asset layout changed: " + name)
    asset = matches[0]
    expected = asset.get("digest", "")
    if not expected or not expected.startswith("sha256:"):
        raise ValueError("Upstream release has no SHA-256 digest: " + asset["name"])
    archive = temporary / asset["name"]
    archive.write_bytes(fetch(asset["browser_download_url"]))
    if "sha256:" + sha(archive) != expected:
        raise ValueError("Release checksum mismatch: " + name)
    if name == "zap":
        with tarfile.open(archive) as bundle:
            bundle.extractall(temporary / "unpacked", filter="data")
        folder = next((temporary / "unpacked").iterdir())
        replace_tree(folder, ROOT / "zap")
    else:
        binary = temporary / name
        if archive.suffix == ".zip":
            with zipfile.ZipFile(archive) as bundle:
                member = next(m for m in bundle.infolist() if Path(m.filename).name == name)
                binary.write_bytes(bundle.read(member))
        else:
            with tarfile.open(archive) as bundle:
                member = next(m for m in bundle.getmembers() if m.isfile() and Path(m.name).name == name)
                with bundle.extractfile(member) as content, binary.open("wb") as output:
                    shutil.copyfileobj(content, output)
        binary.chmod(0o755)
        binary.replace(ROOT / "bin" / name)
    return {"url": asset["browser_download_url"], "archive_sha256": expected[7:]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["check", "update", "launchers"])
    parser.add_argument("--only", nargs="+", choices=[*RELEASES, "john", "base64dump", "wpscan"])
    parser.add_argument("--events", action="store_true")
    args = parser.parse_args()

    def event(name, status, **fields):
        if args.events:
            print("TOOL_EVENT " + json.dumps({"name": name, "status": status, **fields}), flush=True)

    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "bin").mkdir(exist_ok=True)
    with (ROOT / ".update.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if args.command == "launchers":
            launchers()
            return
        state = json.loads(STATE.read_text()) if STATE.exists() else {}
        errors = []
        for name in args.only or [*RELEASES, "john", "base64dump", "wpscan"]:
            try:
                current = state.get(name, {}).get("revision") or ""
                event(name, "checking", installed=current)
                release = api(RELEASES[name][0] + "/releases/latest") if name in RELEASES else None
                revision = release["tag_name"] if release else None
                if name in ("john", "base64dump"):
                    repo, branch = (
                        ("openwall/john", "bleeding-jumbo")
                        if name == "john"
                        else ("DidierStevens/DidierStevensSuite", "master")
                    )
                    revision = api(repo + "/commits/" + branch)["sha"]
                elif name == "wpscan":
                    revision = json.loads(fetch("https://rubygems.org/api/v1/versions/wpscan/latest.json"))["version"]
                current = state.get(name, {}).get("revision")
                print(f"{name}: installed={current or 'missing'} latest={revision}", flush=True)
                if current == revision or args.command == "check":
                    event(name, "current", installed=current, latest=revision)
                    continue
                event(name, "updating", installed=current, latest=revision)
                with tempfile.TemporaryDirectory(prefix=".update-", dir=ROOT) as scratch:
                    temporary = Path(scratch)
                    if release:
                        receipt = install_release(name, release, temporary)
                    elif name == "john":
                        receipt = build(name, repo, revision, temporary)
                    elif name == "base64dump":
                        target = temporary / "base64dump.py"
                        target.write_bytes(fetch(f"https://raw.githubusercontent.com/{repo}/{revision}/base64dump.py"))
                        compile(target.read_bytes(), str(target), "exec")
                        target.chmod(0o755)
                        receipt = {"sha256": sha(target)}
                        target.replace(ROOT / "bin/base64dump.py")
                    else:
                        env = dict(os.environ, GEM_HOME=str(ROOT / "gems"), GEM_PATH=str(ROOT / "gems"))
                        command(["gem", "install", "wpscan", "--no-document", "--install-dir", ROOT / "gems"], env=env)
                        command(["gem", "cleanup"], env=env)
                        receipt = {"source": "https://rubygems.org/gems/wpscan"}
                    state[name] = {
                        "revision": revision,
                        **receipt,
                        "installed_at": datetime.now(timezone.utc).isoformat(),
                    }
                    write_state(state)
                    launchers()
                    event(name, "updated", installed=revision, latest=revision)
            except Exception as error:
                errors.append(name)
                event(name, "failed", error=str(error)[:1000])
                print(f"{name}: FAILED: {error}", flush=True)
        state["last_check"] = datetime.now(timezone.utc).isoformat()
        write_state(state)
        if errors:
            raise SystemExit("Failed tools: " + ", ".join(errors))


if __name__ == "__main__":
    main()
