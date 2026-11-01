import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location(
    "shared_tools", Path(__file__).resolve().parents[1] / "scripts/security-tools.py"
)
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class SharedToolInstallerTests(unittest.TestCase):
    def test_update_attempts_later_tools_after_a_failure(self):
        attempted = []

        def install(name, release, temporary):
            attempted.append(name)
            if name == "httpx":
                raise OSError("fixture failure")
            return {}

        with tempfile.TemporaryDirectory() as scratch:
            root = Path(scratch)
            with (
                patch.object(installer, "ROOT", root),
                patch.object(installer, "STATE", root / "installed.json"),
                patch.object(installer, "api", return_value={"tag_name": "latest"}),
                patch.object(installer, "install_release", side_effect=install),
                patch.object(installer, "launchers"),
                patch("sys.argv", ["security-tools", "update", "--only", "nuclei", "httpx", "katana"]),
            ):
                with self.assertRaisesRegex(SystemExit, "httpx"):
                    installer.main()
            self.assertEqual(attempted, ["nuclei", "httpx", "katana"])
            self.assertEqual(
                installer.json.loads((root / "installed.json").read_text())["katana"]["revision"], "latest"
            )

    def test_bad_release_digest_preserves_installed_binary(self):
        with tempfile.TemporaryDirectory() as scratch:
            root = Path(scratch)
            (root / "bin").mkdir()
            current = root / "bin/nuclei"
            current.write_bytes(b"working installation")
            release = {
                "assets": [
                    {
                        "name": "nuclei_new_linux_amd64.zip",
                        "digest": "sha256:" + "0" * 64,
                        "browser_download_url": "https://example.invalid/archive",
                    }
                ]
            }
            with (
                patch.object(installer, "ROOT", root),
                patch.object(installer, "fetch", return_value=b"wrong download"),
            ):
                with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                    installer.install_release("nuclei", release, root)
            self.assertEqual(current.read_bytes(), b"working installation")

    def test_missing_upstream_digest_does_not_install(self):
        release = {
            "assets": [
                {
                    "name": "nuclei_new_linux_amd64.zip",
                    "browser_download_url": "https://example.invalid/archive",
                }
            ]
        }
        with tempfile.TemporaryDirectory() as scratch:
            with self.assertRaisesRegex(ValueError, "no SHA-256 digest"):
                installer.install_release("nuclei", release, Path(scratch))

    def test_release_member_cannot_write_archive_paths(self):
        data = io.BytesIO()
        with zipfile.ZipFile(data, "w") as bundle:
            bundle.writestr("../../nuclei", b"new binary")
            bundle.writestr("../../unexpected", b"unrelated")
        archive = data.getvalue()
        import hashlib

        release = {
            "assets": [
                {
                    "name": "nuclei_new_linux_amd64.zip",
                    "digest": "sha256:" + hashlib.sha256(archive).hexdigest(),
                    "browser_download_url": "https://example.invalid/archive",
                }
            ]
        }
        with tempfile.TemporaryDirectory() as scratch:
            root = Path(scratch)
            (root / "bin").mkdir()
            temporary = root / "download"
            temporary.mkdir()
            with patch.object(installer, "ROOT", root), patch.object(installer, "fetch", return_value=archive):
                installer.install_release("nuclei", release, temporary)
            self.assertEqual((root / "bin/nuclei").read_bytes(), b"new binary")
            self.assertEqual({p.name for p in root.iterdir()}, {"bin", "download"})

    def test_unmanaged_command_is_preserved(self):
        with tempfile.TemporaryDirectory() as scratch:
            root = Path(scratch)
            current = root / "john"
            current.write_text("another installation")
            with patch.object(installer, "BIN", root):
                with self.assertRaisesRegex(ValueError, "unmanaged command"):
                    installer.symlink("john", root / "replacement")
            self.assertEqual(current.read_text(), "another installation")
