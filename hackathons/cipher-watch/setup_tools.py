"""Download immutable tool versions and verify their bytes before use."""
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / ".tools"
VERSION = "v0.12.1"
COMMIT = "7d625d0b05c4638b981a2a2cc9a8481d7b73e56d"
ASSETS = {
    "ciphey-linux-x86_64.tar.gz": (
        f"https://github.com/bee-san/Ciphey/releases/download/{VERSION}/ciphey-linux-x86_64.tar.gz",
        "1ccc9766224c63c5703414bea2a60adb80ec9730d5afa2b1ecba81101d4c5659"),
    "base64dump.py": (
        f"https://raw.githubusercontent.com/DidierStevens/DidierStevensSuite/{COMMIT}/base64dump.py",
        "57a6efe8315e17274c9299cc567a2dc6263bc6d580d4cd63ace19d6cf870f34f"),
}


def main():
    TOOLS.mkdir(exist_ok=True)
    manifest = {"ciphey_release": VERSION, "base64dump_commit": COMMIT, "assets": {}}
    for name, (url, expected) in ASSETS.items():
        local = TOOLS / name
        if local.exists() and hashlib.sha256(local.read_bytes()).hexdigest() == expected:
            data = local.read_bytes()
        else:
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read(25_000_001)
        if len(data) > 25_000_000 or hashlib.sha256(data).hexdigest() != expected:
            raise RuntimeError(f"Hash or size verification failed: {name}")
        if name.endswith(".tar.gz"):
            with tarfile.open(fileobj=io.BytesIO(data)) as archive:
                member = archive.getmember("ciphey")
                if not member.isfile() or member.size > 50_000_000:
                    raise RuntimeError("Unexpected Ciphey archive")
                binary = TOOLS / "ciphey"
                binary.write_bytes(archive.extractfile(member).read())
                binary.chmod(0o755)
        else:
            local.write_bytes(data)
        manifest["assets"][name] = {"url": url, "sha256": expected}
    (TOOLS / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("Verified base64dump and Ciphey; run .venv/bin/python -m cipher_watch --help")


if __name__ == "__main__":
    main()
