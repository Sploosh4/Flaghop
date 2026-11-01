import unittest
import threading
import json
import os
import tempfile
from unittest import mock
from types import SimpleNamespace

from tests.timezone import local_timezone


class WebRuntimeSchedulerFeedbackTest(unittest.TestCase):
    def test_apply_engagement_scan_profile_uses_quick_recon_ports(self):
        from app.web.runtime import WebRuntime

        options = WebRuntime._apply_engagement_scan_profile(
            {
                "top_ports": 1000,
                "explicit_ports": "",
                "service_detection": True,
            },
            engagement_policy={"preset": "internal_quick_recon"},
        )

        self.assertEqual(0, int(options["top_ports"]))
        self.assertEqual(WebRuntime.INTERNAL_QUICK_RECON_TCP_PORTS, options["explicit_ports"])

    def test_analyze_passive_capture_infers_candidate_networks_and_protocols(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        runtime.list_capture_interfaces = lambda: [
            {
                "name": "eth0",
                "label": "eth0 (192.168.3.10)",
                "ipv4_addresses": ["192.168.3.10"],
                "ipv4_networks": ["192.168.3.0/24"],
            }
        ]

        with tempfile.TemporaryDirectory() as temp_dir:
            capture_path = os.path.join(temp_dir, "capture.pcapng")
            analysis_path = os.path.join(temp_dir, "capture.analysis.json")
            with open(capture_path, "wb") as handle:
                handle.write(b"pcap")

            tshark_output = (
                "eth:ethertype:ip:udp:mdns\t192.168.3.25\t224.0.0.251\t\t\t5353\t5353\tprinter.local\n"
                "eth:ethertype:arp\t\t\t192.168.3.44\t192.168.3.1\t\t\t\n"
            )
            with mock.patch(
                "app.web.runtime.subprocess.run",
                return_value=SimpleNamespace(returncode=0, stdout=tshark_output, stderr=""),
            ):
                summary = runtime._analyze_passive_capture(
                    interface_name="eth0",
                    capture_path=capture_path,
                    analysis_path=analysis_path,
                )

        self.assertIn("192.168.3.0/24", summary["candidate_networks"])
        self.assertIn("192.168.3.25", summary["observed_private_hosts"])
        self.assertIn("192.168.3.44", summary["observed_private_hosts"])
        signal_names = {item["name"] for item in list(summary.get("signals", []) or [])}
        self.assertIn("bonjour", signal_names)
        self.assertIn("mdns", signal_names)
        self.assertIn("arp", signal_names)

    def test_workspace_hosts_and_services_support_device_category_filtering(self):
        from app.ProjectManager import ProjectManager
        from app.logging.legionLog import getAppLogger, getDbLogger
        from app.scheduler.state import upsert_target_state
        from app.web.runtime import WebRuntime
        from app.shell.DefaultShell import DefaultShell
        from db.RepositoryFactory import RepositoryFactory
        from db.entities.host import hostObj
        from db.entities.service import serviceObj
        from db.entities.port import portObj

        repository_factory = RepositoryFactory(getDbLogger())
        project_manager = ProjectManager(DefaultShell(), repository_factory, getAppLogger())
        project = project_manager.createNewProject(projectType="legion", isTemp=True)

        try:
            session = project.database.session()
            windows_host = hostObj(ip="10.0.0.10", ipv4="10.0.0.10", hostname="filesrv", osMatch="Windows Server")
            linux_host = hostObj(ip="10.0.0.20", ipv4="10.0.0.20", hostname="db01", osMatch="Linux")
            session.add(windows_host)
            session.add(linux_host)
            session.commit()

            smb_service = serviceObj(name="microsoft-ds", host=windows_host.id, product="Microsoft Directory Services")
            session.add(smb_service)
            session.commit()
            session.add(portObj("445", "tcp", "open", windows_host.id, smb_service.id))

            ssh_service = serviceObj(name="ssh", host=linux_host.id, product="OpenSSH")
            session.add(ssh_service)
            session.commit()
            session.add(portObj("22", "tcp", "open", linux_host.id, ssh_service.id))
            session.commit()
            windows_host_id = int(windows_host.id)
            linux_host_id = int(linux_host.id)
            session.close()

            upsert_target_state(
                project.database,
                windows_host_id,
                {
                    "host_ip": "10.0.0.10",
                    "os_match": "Windows Server",
                    "service_inventory": [
                        {
                            "port": "445",
                            "protocol": "tcp",
                            "state": "open",
                            "service": "microsoft-ds",
                            "service_product": "Microsoft Directory Services",
                        }
                    ],
                    "technologies": [
                        {"name": "windows", "cpe": "cpe:/o:microsoft:windows", "evidence": "service detection"}
                    ],
                },
            )
            upsert_target_state(
                project.database,
                linux_host_id,
                {
                    "host_ip": "10.0.0.20",
                    "os_match": "Linux",
                    "service_inventory": [
                        {
                            "port": "22",
                            "protocol": "tcp",
                            "state": "open",
                            "service": "ssh",
                            "service_product": "OpenSSH",
                        }
                    ],
                    "technologies": [
                        {"name": "linux", "cpe": "cpe:/o:linux:linux_kernel", "evidence": "service detection"}
                    ],
                },
            )

            runtime = WebRuntime.__new__(WebRuntime)
            runtime._lock = threading.RLock()
            runtime.logic = SimpleNamespace(activeProject=project)
            runtime.scheduler_config = SimpleNamespace(get_device_categories=lambda: [])

            host_rows = runtime.get_workspace_hosts(category="Windows")
            self.assertEqual(1, len(host_rows))
            self.assertEqual("10.0.0.10", host_rows[0]["ip"])
            self.assertIn("Windows", host_rows[0]["categories"])

            multi_service_hosts = runtime.get_workspace_hosts(service="microsoft-ds,ssh")
            self.assertEqual({"10.0.0.10", "10.0.0.20"}, {row["ip"] for row in multi_service_hosts})

            smb_hosts = runtime.get_workspace_hosts(service="microsoft-ds")
            self.assertEqual(["10.0.0.10"], [row["ip"] for row in smb_hosts])

            service_rows = runtime.get_workspace_services(category="Windows")
            self.assertEqual(1, len(service_rows))
            self.assertEqual("microsoft-ds", service_rows[0]["service"])
            self.assertEqual(["445"], service_rows[0]["ports"])
            self.assertIn("Windows", service_rows[0]["categories"])
        finally:
            project_manager.closeProject(project)

    def test_find_active_job_filters_by_type_status_and_host(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        runtime.jobs = SimpleNamespace(
            list_jobs=lambda limit=200: [
                {"id": 12, "type": "scheduler-dig-deeper", "status": "completed", "payload": {"host_id": 11}},
                {"id": 11, "type": "scheduler-dig-deeper", "status": "queued", "payload": {"host_id": 9}},
                {"id": 10, "type": "scheduler-dig-deeper", "status": "running", "payload": {"host_id": 11}},
            ]
        )

        selected = runtime._find_active_job(job_type="scheduler-dig-deeper", host_id=11)
        self.assertIsNotNone(selected)
        self.assertEqual(10, selected["id"])

    # The legacy decision timestamp below uses UTC-05, matching the ISO events.

    def test_tool_audit_availability_tracks_installed_and_missing_tools(self):
        from app.web.runtime import WebRuntime

        snapshot = WebRuntime._tool_audit_availability(
            [
                {"key": "whatweb", "status": "installed"},
                {"key": "nikto", "status": "missing"},
                {"key": "dirsearch", "status": "configured-missing"},
                {"key": "curl", "status": "installed"},
            ]
        )

        self.assertEqual(["curl", "whatweb"], snapshot["available_tool_ids"])
        self.assertEqual(["dirsearch", "nikto"], snapshot["unavailable_tool_ids"])

    def test_context_summary_does_not_treat_wrapper_command_excerpt_as_missing_tool(self):
        from app.web.runtime import WebRuntime

        summary = WebRuntime._build_scheduler_context_summary(
            target={"service": "http", "service_product": "nginx"},
            analysis_mode="standard",
            coverage={},
            signals={},
            attempted_tool_ids=set(),
            recent_processes=[
                {
                    "tool_id": "whatweb-http",
                    "status": "Finished",
                    "command_excerpt": "(command -v whatweb >/dev/null 2>&1 && whatweb http://unifi.local:8080 --color=never) || echo whatweb not found",
                    "output_excerpt": "http://unifi.local:8080 [400 Bad Request] nginx, HTML5",
                }
            ],
            target_recent_processes=[
                {
                    "tool_id": "whatweb-http",
                    "status": "Finished",
                    "command_excerpt": "(command -v whatweb >/dev/null 2>&1 && whatweb http://unifi.local:8080 --color=never) || echo whatweb not found",
                    "output_excerpt": "http://unifi.local:8080 [400 Bad Request] nginx, HTML5",
                }
            ],
        )

        self.assertNotIn("recent_failures", summary)

    def test_scheduler_max_concurrency_clamps_values(self):
        from app.web.runtime import WebRuntime

        self.assertEqual(1, WebRuntime._scheduler_max_concurrency({"max_concurrency": "x"}))
        self.assertEqual(1, WebRuntime._scheduler_max_concurrency({"max_concurrency": 0}))
        self.assertEqual(16, WebRuntime._scheduler_max_concurrency({"max_concurrency": 24}))
        self.assertEqual(6, WebRuntime._scheduler_max_concurrency({"max_concurrency": 6}))

    def test_scheduler_max_host_concurrency_clamps_values(self):
        from app.web.runtime import WebRuntime

        self.assertEqual(1, WebRuntime._scheduler_max_host_concurrency({"max_host_concurrency": "x"}))
        self.assertEqual(1, WebRuntime._scheduler_max_host_concurrency({"max_host_concurrency": 0}))
        self.assertEqual(8, WebRuntime._scheduler_max_host_concurrency({"max_host_concurrency": 24}))
        self.assertEqual(4, WebRuntime._scheduler_max_host_concurrency({"max_host_concurrency": 4}))

    def test_scheduler_max_jobs_clamps_values(self):
        from app.web.runtime import WebRuntime

        self.assertEqual(200, WebRuntime._scheduler_max_jobs({"max_jobs": "x"}))
        self.assertEqual(20, WebRuntime._scheduler_max_jobs({"max_jobs": 0}))
        self.assertEqual(2000, WebRuntime._scheduler_max_jobs({"max_jobs": 99999}))
        self.assertEqual(350, WebRuntime._scheduler_max_jobs({"max_jobs": 350}))

    def test_group_scheduler_targets_by_host_preserves_host_order(self):
        from app.web.runtime import WebRuntime

        targets = [
            SimpleNamespace(host_id=11, host_ip="10.0.0.5", hostname="host-a", port="80"),
            SimpleNamespace(host_id=12, host_ip="10.0.0.6", hostname="host-b", port="22"),
            SimpleNamespace(host_id=11, host_ip="10.0.0.5", hostname="host-a", port="443"),
        ]

        groups = WebRuntime._group_scheduler_targets_by_host(targets)

        self.assertEqual(2, len(groups))
        self.assertEqual(["80", "443"], [item.port for item in groups[0]])
        self.assertEqual(["22"], [item.port for item in groups[1]])

    def test_run_scheduler_targets_can_fan_out_by_host_for_easy_scan(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        barrier = threading.Barrier(2, timeout=1.0)
        parallel_hits = []

        def run_targets(**kwargs):
            try:
                barrier.wait()
                parallel_hits.append(True)
            except threading.BrokenBarrierError:
                parallel_hits.append(False)
            target_count = len(list(kwargs.get("targets", []) or []))
            return {
                "considered": target_count,
                "approval_queued": 0,
                "executed": target_count,
                "skipped": 0,
                "host_scope_count": target_count,
                "dig_deeper": False,
                "reflections": 0,
                "reflection_stops": 0,
            }

        runtime.scheduler_orchestrator = SimpleNamespace(run_targets=run_targets)
        targets = [
            SimpleNamespace(host_id=11, host_ip="10.0.0.5", hostname="host-a", port="80"),
            SimpleNamespace(host_id=12, host_ip="10.0.0.6", hostname="host-b", port="443"),
        ]

        summary = runtime._run_scheduler_targets(
            settings=SimpleNamespace(),
            targets=targets,
            engagement_policy={},
            options=SimpleNamespace(host_concurrency=2, dig_deeper=False),
            should_cancel=None,
            existing_attempts=None,
            build_context=None,
            handle_blocked=None,
            handle_approval=None,
            execute_batch=None,
            on_execution_result=None,
        )

        self.assertEqual([True, True], sorted(parallel_hits))
        self.assertEqual(2, summary["considered"])
        self.assertEqual(2, summary["executed"])

    def test_extract_scheduler_signals_detects_common_markers(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="https",
            scripts=[
                {"script_id": "ssl-cert", "excerpt": "Subject: CN=portal.local; CVE-2025-1111"},
                {"script_id": "smb-security-mode", "excerpt": "message signing enabled but not required"},
            ],
            recent_processes=[
                {"tool_id": "nuclei-web", "status": "Finished", "output_excerpt": "CVE-2024-9999 found"},
                {"tool_id": "feroxbuster", "status": "Crashed", "output_excerpt": "feroxbuster: command not found"},
            ],
        )

        self.assertTrue(signals["web_service"])
        self.assertTrue(signals["tls_detected"])
        self.assertTrue(signals["smb_signing_disabled"])
        self.assertGreaterEqual(int(signals["vuln_hits"]), 2)
        self.assertIn("feroxbuster", signals["missing_tools"])

    def test_extract_scheduler_signals_marks_missing_nse_scripts_unavailable(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="http",
            scripts=[],
            recent_processes=[
                {
                    "tool_id": "http-wordpress-plugins.nse",
                    "status": "Problem",
                    "output_excerpt": (
                        "NSE: failed to initialize the script engine:\n"
                        "/usr/bin/../share/nmap/nse_main.lua:818: "
                        "'http-wordpress-plugins.nse' did not match a category, filename, or directory"
                    ),
                }
            ],
        )

        self.assertIn("http-wordpress-plugins.nse", signals["missing_tools"])

    def test_extract_scheduler_signals_marks_tool_dependency_tracebacks_unavailable(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="https",
            scripts=[],
            recent_processes=[
                {
                    "tool_id": "sslyze",
                    "status": "Problem",
                    "output_excerpt": (
                        "Traceback (most recent call last):\n"
                        '  File "/usr/local/bin/sslyze", line 3, in <module>\n'
                        "    from sslyze.__main__ import main\n"
                        "ModuleNotFoundError: No module named 'cryptography.hazmat.backends.openssl.ocsp'"
                    ),
                },
                {
                    "tool_id": "wafw00f",
                    "status": "Problem",
                    "output_excerpt": (
                        "Traceback (most recent call last):\n"
                        '  File "/usr/bin/wafw00f", line 4, in <module>\n'
                        "    from wafw00f import main\n"
                        "ImportError: cannot import name 'MutableMapping' from 'collections'"
                    ),
                },
            ],
        )

        self.assertIn("sslyze", signals["missing_tools"])
        self.assertIn("wafw00f", signals["missing_tools"])

    def test_scheduler_prompt_excerpt_preserves_high_signal_lines(self):
        from app.web.runtime import WebRuntime

        raw_output = "\n".join(
            [
                "HTTP/1.1 200 OK",
                "Header check started",
            ]
            + [f"filler line {idx} with repeated body text" for idx in range(40)]
            + [
                "Server: Jetty/10.0.13",
                "Allow: GET, POST, OPTIONS, PROPFIND",
                "Interesting path: /api-docs (302)",
                "timeout reached while checking redirect chain",
            ]
        )

        excerpt = WebRuntime._build_scheduler_prompt_excerpt(raw_output, 220)

        self.assertLessEqual(len(excerpt), 220)
        self.assertIn("Server: Jetty/10.0.13", excerpt)
        self.assertIn("PROPFIND", excerpt)
        self.assertIn("/api-docs", excerpt)
        self.assertIn("...[truncated]", excerpt)

    def test_extract_scheduler_signals_prefers_analysis_excerpt(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="http",
            scripts=[],
            recent_processes=[
                {
                    "tool_id": "curl-headers",
                    "status": "Finished",
                    "output_excerpt": "headers checked",
                    "analysis_excerpt": "HTTP/1.1 200 OK\nAllow: GET, POST, OPTIONS, PROPFIND",
                }
            ],
        )

        self.assertTrue(signals["webdav_detected"])
        self.assertIn("webdav", signals["observed_technologies"])

    def test_infer_technologies_prefers_analysis_excerpt_when_prompt_excerpt_is_compact(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._infer_technologies_from_observations(
            service_records=[],
            script_records=[],
            process_records=[
                {
                    "tool_id": "curl-headers",
                    "output_excerpt": "headers checked",
                    "analysis_excerpt": "HTTP/1.1 200 OK\nServer: Jetty(10.0.13)\nAllow: GET, POST, OPTIONS",
                }
            ],
            limit=16,
        )

        names = {str(item.get("name", "")).lower() for item in technologies}
        self.assertIn("jetty", names)

    def test_extract_scheduler_signals_uses_target_metadata_for_vendor_fingerprint(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="https",
            scripts=[{"script_id": "http-title", "excerpt": "UniFi OS"}],
            recent_processes=[],
            target={
                "hostname": "unknown",
                "os": "unknown",
                "service": "https",
                "service_product": "nginx",
                "service_extrainfo": "Ubiquiti UniFi Dream Machine",
                "host_open_services": ["http", "https", "domain"],
            },
        )

        self.assertTrue(signals["ubiquiti_detected"])
        self.assertFalse(signals["vmware_detected"])
        self.assertIn("ubiquiti", signals["observed_technologies"])

    def test_extract_scheduler_signals_detects_cloud_provider_and_storage_markers(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="https",
            scripts=[],
            recent_processes=[
                {
                    "tool_id": "nuclei-cloud",
                    "status": "Finished",
                    "output_excerpt": (
                        "[aws-public-bucket] [http] [medium] https://tenant-assets.s3.amazonaws.com "
                        "Amazon S3 bucket listing exposed x-amz-request-id: 1234"
                    ),
                }
            ],
            target={
                "hostname": "tenant-assets.s3.amazonaws.com",
                "service": "https",
                "host_open_services": ["https"],
            },
        )

        self.assertTrue(signals["cloud_provider_detected"])
        self.assertTrue(signals["aws_detected"])
        self.assertTrue(signals["storage_service_detected"])
        self.assertTrue(signals["aws_storage_detected"])
        self.assertIn("aws", signals["observed_technologies"])
        self.assertIn("cloud_storage", signals["observed_technologies"])

    def test_extract_scheduler_signals_detects_managed_db_markers(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="postgresql",
            scripts=[],
            recent_processes=[
                {
                    "tool_id": "nuclei-cloud",
                    "status": "Finished",
                    "output_excerpt": (
                        "[aws-rds-endpoint] [tcp] [info] db-prod.cluster-abcdefghijkl.us-east-1.rds.amazonaws.com "
                        "Amazon Aurora PostgreSQL endpoint"
                    ),
                },
                {
                    "tool_id": "nuclei-cloud",
                    "status": "Finished",
                    "output_excerpt": (
                        "[azure-cosmos-endpoint] [http] [info] https://tenant.documents.azure.com "
                        "Azure Cosmos DB endpoint"
                    ),
                },
            ],
            target={
                "hostname": "db-prod.cluster-abcdefghijkl.us-east-1.rds.amazonaws.com",
                "service": "postgresql",
                "host_open_services": ["postgresql"],
            },
        )

        self.assertTrue(signals["cloud_provider_detected"])
        self.assertTrue(signals["rds_detected"])
        self.assertTrue(signals["aurora_detected"])
        self.assertTrue(signals["cosmos_detected"])
        self.assertTrue(signals["postgresql_detected"])
        self.assertIn("aurora", signals["observed_technologies"])
        self.assertIn("cosmos", signals["observed_technologies"])

    def test_extract_scheduler_signals_detects_internal_database_services(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="mysql",
            scripts=[],
            recent_processes=[
                {
                    "tool_id": "mysql-info.nse",
                    "status": "Finished",
                    "output_excerpt": "Version: 10.6.18-MariaDB Authentication Plugin Name: mysql_native_password",
                }
            ],
            target={
                "hostname": "db.internal.example",
                "service": "mysql",
                "host_open_services": ["mysql"],
            },
        )

        self.assertTrue(signals["mysql_detected"])
        self.assertFalse(signals["postgresql_detected"])
        self.assertFalse(signals["mssql_detected"])
        self.assertIn("mysql", signals["observed_technologies"])

    def test_extract_scheduler_signals_distinguishes_cloud_detection_from_exposure_candidates(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        detected_only = runtime._extract_scheduler_signals(
            service_name="https",
            scripts=[],
            recent_processes=[
                {
                    "tool_id": "nuclei-cloud",
                    "status": "Finished",
                    "output_excerpt": "[aws-endpoint] [http] [info] https://tenant-assets.s3.amazonaws.com Amazon S3 endpoint",
                }
            ],
            target={"hostname": "tenant-assets.s3.amazonaws.com", "service": "https", "host_open_services": ["https"]},
        )
        exposure = runtime._extract_scheduler_signals(
            service_name="https",
            scripts=[],
            recent_processes=[
                {
                    "tool_id": "nuclei-cloud",
                    "status": "Finished",
                    "output_excerpt": (
                        "[aws-public-bucket] [http] [medium] https://tenant-assets.s3.amazonaws.com "
                        "public bucket listing exposed anonymous access"
                    ),
                }
            ],
            target={"hostname": "tenant-assets.s3.amazonaws.com", "service": "https", "host_open_services": ["https"]},
        )

        self.assertTrue(detected_only["aws_storage_detected"])
        self.assertFalse(detected_only["aws_storage_exposure_candidate"])
        self.assertFalse(detected_only["cloud_exposure_candidate"])

        self.assertTrue(exposure["aws_storage_detected"])
        self.assertTrue(exposure["aws_storage_exposure_candidate"])
        self.assertTrue(exposure["storage_exposure_candidate"])
        self.assertTrue(exposure["cloud_exposure_candidate"])

    def test_extract_scheduler_signals_ignores_script_and_tool_names_without_positive_evidence(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        signals = runtime._extract_scheduler_signals(
            service_name="http",
            scripts=[
                {"script_id": "http-wordpress-enum.nse", "excerpt": ""},
                {"script_id": "http-vmware-path-vuln.nse", "excerpt": "check completed"},
                {"script_id": "http-coldfusion-subzero.nse", "excerpt": ""},
                {"script_id": "http-huawei-hg5xx-vuln.nse", "excerpt": ""},
                {"script_id": "http-iis-webdav-vuln.nse", "excerpt": "no issue reported"},
                {"script_id": "http-vuln-cve2011-3192.nse", "excerpt": "range header check completed with no finding"},
            ],
            recent_processes=[
                {"tool_id": "nuclei-wordpress", "status": "Finished", "output_excerpt": ""},
                {"tool_id": "wafw00f", "status": "Finished", "output_excerpt": ""},
            ],
            target={
                "service": "http",
                "service_product": "nginx",
                "host_open_services": ["http"],
                "host_banners": ["80/tcp:nginx"],
            },
        )

        self.assertFalse(signals["wordpress_detected"])
        self.assertFalse(signals["vmware_detected"])
        self.assertFalse(signals["coldfusion_detected"])
        self.assertFalse(signals["huawei_detected"])
        self.assertFalse(signals["webdav_detected"])
        self.assertFalse(signals["waf_detected"])
        self.assertEqual(0, int(signals["vuln_hits"]))
        self.assertNotIn("wordpress", signals["observed_technologies"])
        self.assertNotIn("vmware", signals["observed_technologies"])
        self.assertNotIn("coldfusion", signals["observed_technologies"])
        self.assertNotIn("huawei", signals["observed_technologies"])
        self.assertNotIn("webdav", signals["observed_technologies"])

    def test_build_scheduler_coverage_summary_flags_missing_internal_safe_enum(self):
        from app.web.runtime import WebRuntime

        coverage = WebRuntime._build_scheduler_coverage_summary(
            service_name="smb",
            signals={"web_service": False, "rdp_service": False, "vnc_service": False},
            observed_tool_ids={"banner", "smb-security-mode"},
            host_cves=[],
            inferred_technologies=[],
            analysis_mode="standard",
        )

        self.assertIn("missing_internal_safe_enum", coverage["missing"])
        self.assertIn("enum4linux-ng", coverage["recommended_tool_ids"])
        self.assertIn("smbmap", coverage["recommended_tool_ids"])
        self.assertIn("rpcclient-enum", coverage["recommended_tool_ids"])

    def test_infer_technologies_from_service_product_adds_jetty_cpe(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._infer_technologies_from_observations(
            service_records=[
                {
                    "port": "8082",
                    "protocol": "tcp",
                    "service_name": "http",
                    "service_product": "Jetty",
                    "service_version": "10.0.13",
                    "service_extrainfo": "Traccar",
                    "banner": "Traccar",
                }
            ],
            script_records=[],
            process_records=[],
            limit=32,
        )
        names = {str(item.get("name", "")).lower() for item in technologies}
        cpes = {str(item.get("cpe", "")).lower() for item in technologies}
        self.assertIn("jetty", names)
        self.assertIn("cpe:/a:eclipse:jetty:10.0.13", cpes)
        self.assertIn("traccar", names)

    def test_infer_technologies_extracts_cpe_tokens_from_output(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._infer_technologies_from_observations(
            service_records=[],
            script_records=[
                {
                    "script_id": "nmap-vuln.nse",
                    "excerpt": "Service Info: CPE: cpe:/a:eclipse:jetty:10.0.13",
                }
            ],
            process_records=[],
            limit=32,
        )
        cpes = {str(item.get("cpe", "")).lower() for item in technologies}
        self.assertIn("cpe:/a:eclipse:jetty:10.0.13", cpes)

    def test_infer_technologies_prefers_stronger_signal_and_filters_weak_noise(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._infer_technologies_from_observations(
            service_records=[
                {
                    "port": "22",
                    "protocol": "tcp",
                    "service_name": "ssh",
                    "service_product": "OpenSSH",
                    "service_version": "8.4p1 Debian 5+deb11u3",
                    "service_extrainfo": "protocol 2.0",
                    "banner": "SSH-2.0-OpenSSH_8.4p1 Debian-5+deb11u3",
                },
                {
                    "port": "5002",
                    "protocol": "tcp",
                    "service_name": "rfe",
                    "service_product": "",
                    "service_version": "",
                    "service_extrainfo": "",
                    "banner": "",
                },
            ],
            script_records=[
                {
                    "script_id": "nmap-vuln.nse",
                    "excerpt": ("Starting Nmap 7.80 ( https://nmap.org ) " "OpenSSH_8.4p1 Debian 5+deb11u3"),
                }
            ],
            process_records=[
                {
                    "tool_id": "banner",
                    "output_excerpt": "SSH banner: SSH-2.0-OpenSSH_8.4p1 Debian-5+deb11u3",
                },
                {
                    "tool_id": "banner",
                    "output_excerpt": "fingerprint token OpenSSH 192.168.3.135",
                },
            ],
            limit=80,
        )

        names = {str(item.get("name", "")).lower() for item in technologies}
        self.assertIn("openssh", names)
        self.assertNotIn("rfe", names)

        openssh_rows = [item for item in technologies if str(item.get("name", "")).strip().lower() == "openssh"]
        self.assertEqual(1, len(openssh_rows))
        self.assertNotEqual("192.168.3.135", str(openssh_rows[0].get("version", "")))

    def test_infer_technologies_detects_pihole_from_http_title_and_comment(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._infer_technologies_from_observations(
            service_records=[],
            script_records=[
                {
                    "script_id": "http-title",
                    "excerpt": (
                        "<title>Pi-hole Cray4.hyrule.local</title> "
                        "Pi-hole: A black hole for Internet advertisements "
                        "(c) 2017 Pi-hole, LLC"
                    ),
                }
            ],
            process_records=[],
            limit=32,
        )

        pihole_rows = [item for item in technologies if str(item.get("name", "")).strip().lower() == "pi-hole"]
        self.assertEqual(1, len(pihole_rows))
        self.assertEqual("", str(pihole_rows[0].get("version", "")).strip())

    def test_infer_technologies_strips_nmap_and_ansi_version_noise(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._infer_technologies_from_observations(
            service_records=[],
            script_records=[
                {
                    "script_id": "http-vuln-cve2011-3192.nse",
                    "excerpt": (
                        "Starting Nmap 7.80 ( https://nmap.org ) at 2026-03-17 07:15 CDT\n"
                        "| http-vuln-cve2011-3192: Apache HTTP Server Range header DoS check\n"
                        "|_  Apache HTTP Server appears present\n"
                    ),
                }
            ],
            process_records=[
                {
                    "tool_id": "nuclei-web",
                    "output_excerpt": "\u001b[0m nginx login panel detected",
                }
            ],
            limit=64,
        )

        bad_versions = {
            str(item.get("version", "")).strip() for item in technologies if str(item.get("version", "")).strip()
        }
        names = {str(item.get("name", "")).strip().lower() for item in technologies}
        self.assertIn("apache http server", names)
        self.assertIn("nginx", names)
        self.assertNotIn("7.80", bad_versions)
        self.assertNotIn("0m", bad_versions)

    def test_infer_technologies_drops_invalid_php_major_versions_from_weak_fingerprints(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._infer_technologies_from_observations(
            service_records=[],
            script_records=[],
            process_records=[
                {
                    "tool_id": "http-useragent-tester.nse",
                    "output_excerpt": "Possible stack fingerprint: PHP 2.5 on upstream service",
                }
            ],
            limit=64,
        )

        php_versions = {
            str(item.get("version", "")).strip()
            for item in technologies
            if str(item.get("name", "")).strip().lower() == "php"
        }
        self.assertNotIn("2.5", php_versions)

    def test_normalize_ai_technologies_strips_nmap_release_leakage_from_versions_and_cpes(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._normalize_ai_technologies(
            [
                {
                    "name": "nginx",
                    "version": "7.80",
                    "cpe": "cpe:/a:nginx:nginx:7.80",
                    "evidence": "http-headers.nse output fingerprint",
                },
                {
                    "name": "Apache HTTP Server",
                    "version": "7.80",
                    "cpe": "cpe:/a:apache:http_server:7.80",
                    "evidence": "http-vuln-cve2011-3192.nse output fingerprint",
                },
            ]
        )

        by_name = {str(item.get("name", "")).strip().lower(): item for item in technologies}
        self.assertEqual("", str(by_name["nginx"].get("version", "")).strip())
        self.assertEqual("cpe:/a:nginx:nginx", str(by_name["nginx"].get("cpe", "")).strip())
        self.assertEqual("", str(by_name["apache http server"].get("version", "")).strip())
        self.assertEqual("cpe:/a:apache:http_server", str(by_name["apache http server"].get("cpe", "")).strip())

    def test_normalize_ai_technologies_drops_placeholder_names_and_truncated_evidence(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        technologies = runtime._normalize_ai_technologies(
            [
                {
                    "name": "True",
                    "version": "",
                    "cpe": "",
                    "evidence": "httpx fingerprint cdn True",
                },
                {
                    "name": "Cloudflare",
                    "version": "",
                    "cpe": "",
                    "evidence": "whatweb-http fingerprint ...[truncated]",
                },
            ]
        )

        by_name = {str(item.get("name", "")).strip().lower(): item for item in technologies}
        self.assertNotIn("true", by_name)
        self.assertIn("cloudflare", by_name)
        self.assertIn("whatweb-http fingerprint", str(by_name["cloudflare"].get("evidence", "")).strip())

    def test_normalize_ai_findings_drops_truncation_placeholder_titles(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        findings = runtime._normalize_ai_findings(
            [
                {
                    "title": "truncated",
                    "severity": "info",
                    "cvss": 0.0,
                    "cve": "",
                    "evidence": "...[truncated]",
                },
                {
                    "title": "Directory listing observed",
                    "severity": "low",
                    "cvss": 0.0,
                    "cve": "",
                    "evidence": "...[truncated]",
                },
            ]
        )

        self.assertEqual(1, len(findings))
        self.assertEqual("Directory listing observed", findings[0]["title"])
        self.assertEqual("Directory listing observed", findings[0]["evidence"])

    def test_infer_findings_uses_line_level_cve_evidence_for_nmap_output(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        findings = runtime._infer_findings_from_observations(
            host_cves_raw=[],
            script_records=[],
            process_records=[
                {
                    "tool_id": "nmap-vuln.nse",
                    "output_excerpt": (
                        "Starting Nmap 7.80 ( https://nmap.org ) at 2026-03-20 15:44 CDT\n"
                        "NSE: Loaded 149 scripts for scanning.\n"
                        "| http-vuln-cve2011-3192:\n"
                        "|   IDs: CVE:CVE-2011-3192\n"
                        "|_  Apache HTTP Server byterange filter DoS\n"
                        "Nmap done: 1 IP address (1 host up) scanned in 4.72 seconds\n"
                    ),
                }
            ],
            limit=32,
        )

        finding = next(item for item in findings if str(item.get("cve", "")).strip().upper() == "CVE-2011-3192")
        self.assertIn("IDs: CVE:CVE-2011-3192", str(finding.get("evidence", "")))
        self.assertNotIn("Starting Nmap", str(finding.get("evidence", "")))

    def test_infer_urls_ignores_nmap_boilerplate_urls(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        urls = runtime._infer_urls_from_observations(
            script_records=[
                {
                    "script_id": "nmap-vuln.nse",
                    "excerpt": (
                        "Starting Nmap 7.80 ( https://nmap.org ) at 2026-03-17 07:15 CDT\n"
                        "| http-title: example portal\n"
                        "Service detection performed. Please report any incorrect results at "
                        "https://nmap.org/submit/ .\n"
                    ),
                }
            ],
            process_records=[],
            limit=16,
        )

        extracted_urls = {str(item.get("url", "")).strip() for item in urls}
        self.assertNotIn("https://nmap.org", extracted_urls)
        self.assertNotIn("https://nmap.org/submit/", extracted_urls)

    def test_strip_nmap_preamble_removes_header_and_footer_reference_lines(self):
        from app.web.runtime import WebRuntime

        cleaned = WebRuntime._strip_nmap_preamble(
            "Starting Nmap 7.80 ( https://nmap.org ) at 2026-03-17 07:15 CDT\n"
            "| http-title: portal.example\n"
            "Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .\n"
            "Nmap done: 1 IP address (1 host up) scanned in 4.72 seconds\n"
        )

        self.assertEqual("| http-title: portal.example", cleaned)

    def test_normalize_ai_manual_tests_dedupes_by_command(self):
        from app.web.runtime import WebRuntime

        runtime = WebRuntime.__new__(WebRuntime)
        manual_tests = runtime._normalize_ai_manual_tests(
            [
                {
                    "why": "Confirm headers",
                    "command": "curl -k -I https://10.0.0.5",
                    "scope_note": "safe",
                },
                {
                    "why": "Validate front door",
                    "command": "curl -k -I https://10.0.0.5",
                    "scope_note": "same command",
                },
            ]
        )

        self.assertEqual(1, len(manual_tests))
        self.assertEqual("curl -k -I https://10.0.0.5", manual_tests[0]["command"])


if __name__ == "__main__":
    unittest.main()
