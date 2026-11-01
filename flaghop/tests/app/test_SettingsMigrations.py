import json
import os
import subprocess
import tempfile
import unittest
from unittest.mock import patch

LEGACY_STRUCTURED_SETTINGS_CONFIG = """[BruteSettings]
passlist=/tmp/legacy-passwords.txt
userlist=/tmp/legacy-users.txt

[GeneralSettings]
hydra_path=/opt/legacy/hydra
"""


class SettingsMigrationTest(unittest.TestCase):

    def test_scheduler_target_input_error_requires_port_for_banner_and_port_placeholder_tools(self):
        from app.settings import AppSettings

        self.assertEqual(
            "skipped: banner requires target port",
            AppSettings._scheduler_target_input_error("banner", "nc [IP] [PORT]", port=""),
        )
        self.assertEqual(
            "skipped: nmap requires target port",
            AppSettings._scheduler_target_input_error("nmap", "nmap -Pn -p [PORT] [IP]", port=""),
        )
        self.assertEqual(
            "",
            AppSettings._scheduler_target_input_error("subfinder", "subfinder -d [IP] -o [OUTPUT].jsonl", port=""),
        )

    def test_nmap_hostname_target_support_removes_skip_dns_for_hostnames(self):
        from app.settings import AppSettings

        normalized = AppSettings._ensure_nmap_hostname_target_support(
            "nmap -Pn -n -sV portal.example -p 443 --stats-every 15s",
            "portal.example",
        )

        self.assertIn("portal.example", normalized)
        self.assertNotIn(" -n ", normalized)

    def test_nmap_output_normalization_adds_output_to_grouped_commands_only(self):
        from app.settings import AppSettings

        grouped = (
            "(nmap -Pn -n -sV -p [PORT] --script=vuln,vulners [IP] || " "nmap -Pn -n -sV -p [PORT] --script=vuln [IP])"
        )
        normalized = AppSettings._ensure_nmap_output_argument(grouped, "[OUTPUT]")

        self.assertEqual(normalized.count("-oA [OUTPUT]"), 2)
        self.assertNotIn(") -oA [OUTPUT]", normalized)

        wrapped = "(command -v nmap >/dev/null 2>&1 && nmap -Pn [IP]) || echo nmap not found"
        wrapped_normalized = AppSettings._ensure_nmap_output_argument(wrapped, "[OUTPUT]")

        self.assertIn("command -v nmap >/dev/null 2>&1", wrapped_normalized)
        self.assertIn("&& nmap -Pn [IP] -oA [OUTPUT])", wrapped_normalized)
        self.assertNotIn("command -v nmap >/dev/null 2>&1 -oA [OUTPUT]", wrapped_normalized)

    def test_nmap_stats_normalization_adds_stats_every_once(self):
        from app.settings import AppSettings

        command = "nmap -Pn -sV [IP] -p [PORT]"
        normalized = AppSettings._ensure_nmap_stats_every(command)
        self.assertIn("--stats-every 15s", normalized)
        self.assertIn("-vv", normalized)
        self.assertEqual(1, normalized.count("--stats-every"))

    def test_nmap_stats_normalization_adds_verbose_when_stats_already_present(self):
        from app.settings import AppSettings

        command = "nmap -Pn -sV [IP] -p [PORT] --stats-every 15s"
        normalized = AppSettings._ensure_nmap_stats_every(command)
        self.assertIn("--stats-every 15s", normalized)
        self.assertIn("-vv", normalized)
        self.assertEqual(1, normalized.count("--stats-every"))
        self.assertEqual(1, normalized.count("-vv"))

    def test_structured_settings_migrate_legacy_aliases_into_modern_groups(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = os.path.join(tmpdir, ".local", "share", "legion")
            os.makedirs(config_dir, exist_ok=True)
            config_path = os.path.join(config_dir, "legion.conf")
            with open(config_path, "w", encoding="utf-8") as handle:
                handle.write(LEGACY_STRUCTURED_SETTINGS_CONFIG)

            with patch.dict(os.environ, {"LEGION_HOME": config_dir}, clear=False):
                with patch("app.settings.log") as mocked_log:
                    from app.settings import AppSettings, Settings

                    app_settings = AppSettings()
                    settings = Settings(app_settings)

                brute_settings = app_settings.getBruteSettings()
                tool_settings = app_settings.getToolSettings()
                general_settings = app_settings.getGeneralSettings()

                self.assertEqual("/tmp/legacy-users.txt", brute_settings["username-wordlist-path"])
                self.assertEqual("/tmp/legacy-passwords.txt", brute_settings["password-wordlist-path"])
                self.assertEqual("/opt/legacy/hydra", tool_settings["hydra-path"])
                self.assertNotIn("hydra_path", general_settings)
                self.assertEqual("/tmp/legacy-users.txt", settings.brute_username_wordlist_path)
                self.assertEqual("/tmp/legacy-passwords.txt", settings.brute_password_wordlist_path)
                self.assertEqual("/opt/legacy/hydra", settings.tools_path_hydra)
                mocked_log.error.assert_not_called()


if __name__ == "__main__":
    unittest.main()
