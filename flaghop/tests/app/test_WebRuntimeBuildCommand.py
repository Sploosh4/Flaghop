import collections
import collections.abc
import unittest
from types import SimpleNamespace
from unittest.mock import patch

for legacy_name in ("Mapping", "MutableMapping", "Sequence", "Callable"):
    if not hasattr(collections, legacy_name):
        setattr(collections, legacy_name, getattr(collections.abc, legacy_name))


class WebRuntimeNucleiBuildCommandTest(unittest.TestCase):

    @patch("app.command_targets.socket.getaddrinfo")
    def test_build_command_prefers_resolvable_hostname_for_command_target(self, mock_getaddrinfo):
        from app.command_targets import resolve_hostname_addresses
        from app.web.runtime import WebRuntime

        resolve_hostname_addresses.cache_clear()
        mock_getaddrinfo.return_value = [
            ("family", "socktype", "proto", "", ("150.171.27.10", 0)),
        ]

        runtime = WebRuntime.__new__(WebRuntime)
        runtime._require_active_project = lambda: SimpleNamespace(
            properties=SimpleNamespace(runningFolder="/tmp/legion-test-running"),
            repositoryContainer=SimpleNamespace(
                hostRepository=SimpleNamespace(getHostByIP=lambda _ip: SimpleNamespace(hostname="bing.com"))
            ),
        )

        command, _outputfile = runtime._build_command(
            "feroxbuster -u https://[IP]:[PORT] -o [OUTPUT].txt",
            "150.171.27.10",
            "443",
            "tcp",
            "web-content-discovery",
            "https",
        )

        self.assertIn("https://bing.com:443", command)
        self.assertNotIn("https://150.171.27.10:443", command)

    def test_build_command_keeps_hostname_target_for_nmap_and_removes_skip_dns(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        runtime._require_active_project = lambda: SimpleNamespace(
            properties=SimpleNamespace(runningFolder="/tmp/legion-test-running"),
            repositoryContainer=SimpleNamespace(
                hostRepository=SimpleNamespace(getHostByIP=lambda _ip: SimpleNamespace(hostname="portal.example"))
            ),
        )

        command, _outputfile = runtime._build_command(
            "nmap -Pn -n -sV [IP] -p [PORT]",
            "203.0.113.55",
            "443",
            "tcp",
            "nmap-fast-tcp",
            "https",
        )

        self.assertIn("nmap -Pn -sV portal.example -p 443", command)
        self.assertNotIn("nmap -Pn -sV 203.0.113.55 -p 443", command)
        self.assertNotIn(" -n ", command)

    def test_build_command_inserts_nmap_output_inside_fallback_group(self):
        from app.settings import AppSettings
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        runtime._require_active_project = lambda: SimpleNamespace(
            properties=SimpleNamespace(runningFolder="/tmp/legion-test-running")
        )

        template = (
            "(nmap -Pn -n -sV -p [PORT] --script=vuln,vulners --stats-every 15s [IP] || "
            "nmap -Pn -n -sV -p [PORT] --script=vuln --stats-every 15s [IP])"
        )

        command, outputfile = runtime._build_command(
            template,
            "192.168.3.1",
            "443",
            "tcp",
            "nmap-vuln.nse",
            "https",
        )

        self.assertEqual(command.count(f"-oA {outputfile}"), 2)
        self.assertNotIn(f") -oA {outputfile}", command)
        self.assertEqual(
            command,
            AppSettings._ensure_nmap_output_argument(
                AppSettings._ensure_nmap_stats_every(template.replace("[IP]", "192.168.3.1").replace("[PORT]", "443")),
                outputfile,
            ),
        )

    def test_build_command_adds_stats_every_to_generic_nmap_actions(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        runtime._require_active_project = lambda: SimpleNamespace(
            properties=SimpleNamespace(runningFolder="/tmp/legion-test-running")
        )

        command, _outputfile = runtime._build_command(
            "nmap -Pn -sV [IP] -p [PORT]",
            "192.168.3.1",
            "22",
            "tcp",
            "nmap-fast-tcp",
            "",
        )

        self.assertIn("--stats-every 15s", command)
        self.assertIn("-vv", command)
        self.assertEqual(1, command.count("--stats-every"))


if __name__ == "__main__":
    unittest.main()
