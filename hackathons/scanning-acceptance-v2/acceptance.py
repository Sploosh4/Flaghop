#!/usr/bin/env python3
"""Independent, failing-first acceptance checks for the audited local scanner.

No production file is edited. Subprocess/fixture writes use temporary directories.
Verifier mutations and report writes are intercepted in memory. Live WordPress
and negative-fixture checks contact only owned loopback servers.
"""
import argparse
import contextlib
import copy
import hashlib
import http.server
import importlib
import io
import json
import os
from pathlib import Path
import re
import runpy
import stat
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
OPTIONS = None
CORE = STAGED = None
WEIGHTS = {"H01": 10, "H02": 10, "H03": 20, "H04": 10,
           "H05": 10, "H06": 8, "H07": 6, "H08": 12,
           "H09": 5, "H10": 5, "H11": 2, "H12": 2}


def tree_size(root):
    """Count all regular file bytes, including runtime/cache files, without following links."""
    logical = allocated = files = 0
    links = []
    root = Path(root)
    if not root.exists():
        return {"logical_bytes": 0, "allocated_bytes": 0, "files": 0, "symlinks": []}
    for path in root.rglob("*"):
        try:
            info = path.lstat()
        except FileNotFoundError:
            continue  # A temporary file disappeared between enumeration and stat.
        if stat.S_ISREG(info.st_mode):
            logical += info.st_size
            allocated += info.st_blocks * 512
            files += 1
        elif stat.S_ISLNK(info.st_mode):
            links.append({"path": str(path), "target": str(path.resolve())})
    return {"logical_bytes": logical, "allocated_bytes": allocated,
            "files": files, "symlinks": links}


def chosen_run(test):
    if not OPTIONS.run:
        test.skipTest("Unmeasured: supply --run NEW_RUN_DIRECTORY")
    return OPTIONS.run.resolve()


def read_profile(test):
    return json.loads((chosen_run(test) / "profile/device-profile.json").read_text())


def verify_in_memory(run, profile):
    """Run the real CLI verifier, substituting only its profile read and report write."""
    source = run / "profile/device-profile.json"
    report_path = run / "staged-verification.json"
    original_read = Path.read_text
    captured = {}

    def read(path, *args, **kwargs):
        return json.dumps(profile) if path.resolve() == source else original_read(path, *args, **kwargs)

    def write(path, text, *args, **kwargs):
        if path.resolve() != report_path:
            raise AssertionError("Verifier attempted an unexpected write: " + str(path))
        captured.update(json.loads(text))
        return len(text)

    with patch.object(Path, "read_text", read), patch.object(Path, "write_text", write), \
         patch.object(sys, "argv", ["verify_staged_profile.py", str(run)]), \
         contextlib.redirect_stdout(io.StringIO()):
        try:
            runpy.run_path(str(OPTIONS.project / "lab/verify_staged_profile.py"), run_name="__main__")
        except SystemExit as error:
            code = error.code
        else:
            code = 0
    if not captured or not isinstance(captured.get("passed"), bool):
        raise AssertionError("Verifier did not produce a structured pass/fail report")
    return code, captured


class H01WordPress(unittest.TestCase):
    def test_actual_production_branch_in_two_fresh_output_directories(self):
        tools = CORE.inventory()
        for name in ("http", "whatweb", "wpscan"):
            self.assertTrue(tools.get(name), name + " must be installed for this integration check")
        fixture = OPTIONS.project / "lab/fixtures/wordpress"

        class Handler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(fixture), **kwargs)

            def log_message(self, *_):
                pass

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory(prefix="acceptance-wordpress-") as directory:
                directory = Path(directory)
                xml = directory / "fixture.xml"
                xml.write_text('<nmaprun version="owned-static-fixture"><host>'
                               '<address addr="127.0.0.1" addrtype="ipv4"/><ports>'
                               f'<port protocol="tcp" portid="{server.server_port}">'
                               '<state state="open"/><service name="http"/></port>'
                               '</ports></host><runstats><finished exit="success"/></runstats></nmaprun>')
                for number in range(2):
                    with self.subTest(fresh_run=number):
                        output = directory / f"run-{number}"
                        argv = ["127.0.0.1", "--from-nmap", str(xml), "--out", str(output),
                                "--stages", "1-4", "--no-metasploit", "--tool-timeout", "15",
                                "--assessment-timeout", "30"]
                        for tool in tools:
                            if tool not in ("nmap", "http", "whatweb", "wpscan"):
                                argv += ["--skip", tool]
                        # This check isolates adapter behaviour, not version reporting.
                        # The actual WPScan selection, Runner, environment, proxy and parser run.
                        with patch.object(CORE, "tool_identity", return_value={}), \
                             contextlib.redirect_stdout(io.StringIO()):
                            CORE.main(argv)
                        profile = json.loads((output / "device-profile.json").read_text())
                        tasks = [t for t in profile["tasks"] if t["tool"] == "wpscan"]
                        self.assertEqual(len(tasks), 1, "WordPress branch must be selected once")
                        task = tasks[0]
                        self.assertEqual(task["status"], "completed", str(task))
                        self.assertEqual(task.get("parse_status"), "completed")
                        artifact = task.get("result_artifact")
                        self.assertTrue(artifact, "Keep the structured adapter result")
                        data = json.loads((output / artifact).read_text())
                        self.assertFalse(data.get("scan_aborted"), str(data))
                        self.assertEqual((data.get("version") or {}).get("number"), "6.4.3")
                        self.assertEqual((data.get("main_theme") or {}).get("slug"), "fixture")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


class H02Deadlines(unittest.TestCase):
    def check_deadline(self, close_code):
        with tempfile.TemporaryDirectory(prefix="acceptance-deadline-") as directory:
            output = Path(directory)
            (output / "raw").mkdir()
            runner = CORE.Runner(output, {})
            child = "import os,time; " + close_code + "; time.sleep(0.8)"
            spec = CORE.task("deadline", "acceptance-python", [sys.executable, "-B", "-c", child],
                             "Owned, bounded process fixture", 0.1)
            started = time.monotonic()
            result = runner.execute(spec)
            elapsed = time.monotonic() - started
            self.assertEqual(result["status"], "timed_out", str(result))
            self.assertLessEqual(elapsed, 0.45, f"0.1-second deadline took {elapsed:.3f}s")

    def test_both_pipes_closed(self):
        self.check_deadline("os.close(1); os.close(2)")

    def test_one_pipe_closed(self):
        self.check_deadline("os.close(1)")

    def test_quiet_open_pipes(self):
        self.check_deadline("pass")


class H03Verifier(unittest.TestCase):
    def test_positive_control(self):
        code, report = verify_in_memory(chosen_run(self), read_profile(self))
        self.assertEqual(code, 0)
        self.assertTrue(report["passed"])

    def reject(self, mutation):
        profile = read_profile(self)
        mutation(profile)
        code, report = verify_in_memory(chosen_run(self), profile)
        self.assertNotEqual(code, 0, "Mutated invalid input was accepted")
        self.assertFalse(report["passed"])

    def test_closed_observation_missing(self):
        self.reject(lambda p: p["nmap"].__setitem__("services", [s for s in p["nmap"]["services"] if s["port"] != 18444]))

    def test_closed_observation_filtered(self):
        def mutate(p):
            for service in p["nmap"]["services"]:
                if service["port"] == 18444:
                    service["state"] = "filtered"
        self.reject(mutate)

    def test_https_proofs_missing(self):
        self.reject(lambda p: p.__setitem__("validated_vulnerabilities", [f for f in p["validated_vulnerabilities"] if f["url"].startswith("http:")]))

    def test_failed_excluded_execution(self):
        def mutate(p):
            p["tasks"].append({"id": "acceptance-excluded", "tool": "metasploit_check", "stage": 5,
                               "status": "failed", "exit_code": 1, "started_at": p["run"]["started_at"],
                               "command": ["msfconsole"], "port": 18080})
        self.reject(mutate)  # Data mutation only: Metasploit is never invoked.

    def test_failed_task_with_completed_stage(self):
        def mutate(p):
            t = next(t for t in p["tasks"] if t["tool"] == "nuclei" and t["status"] == "completed")
            t.update(status="failed", exit_code=1)
        self.reject(mutate)

    def test_meaningless_source_lineage(self):
        def mutate(p):
            for finding in p["validated_vulnerabilities"]:
                finding["source_task"] = "discovery"
                finding.pop("candidate_source_task", None)
        self.reject(mutate)

    def test_candidate_label_in_reproduced_findings(self):
        self.reject(lambda p: p["validated_vulnerabilities"][0].__setitem__("status", "candidate"))

    def test_missing_proof_file(self):
        self.reject(lambda p: p["validated_vulnerabilities"][0].__setitem__("evidence", ["raw/acceptance-does-not-exist"]))


def run_existing_negative(browser_missing=False):
    sys.path.insert(0, str(OPTIONS.project / "tests"))
    module = importlib.import_module("test_negative_fixtures")
    case = module.NegativeFixtureTests("test_corrected_fixtures_reproduce_zero_findings")
    original = CORE.Runner.execute
    calls = []

    def observe(runner, spec):
        if browser_missing and spec["tool"] == "browser":
            result = {**spec, "status": "tool_missing", "reason": "Acceptance missing-browser fixture"}
        else:
            result = original(runner, spec)
        calls.append(copy.deepcopy(result))
        return result

    stream = io.StringIO()
    try:
        with patch.object(CORE.Runner, "execute", observe), \
             patch.dict(os.environ, {"NEGATIVE_FIXTURE_REPORT": ""}), \
             contextlib.redirect_stdout(stream), contextlib.redirect_stderr(stream):
            started = time.monotonic()
            result = unittest.TestResult()
            case.run(result)
            elapsed = time.monotonic() - started
        alive = bool(getattr(case, "thread", None) and case.thread.is_alive())
        return result, calls, alive, elapsed
    finally:
        # Clean up the old test's leaked server after observing its own cleanup.
        if getattr(case, "thread", None) and case.thread.is_alive():
            case.server.shutdown()
            case.server.server_close()
            case.thread.join(timeout=2)


class H04NegativeCoverage(unittest.TestCase):
    def test_real_negative_validators_complete(self):
        result, calls, _, _ = run_existing_negative()
        self.assertTrue(result.wasSuccessful(), str(result.errors + result.failures))
        for prefix in ("verify-git-", "verify-sql-", "browser-xss-"):
            observed = [t for t in calls if t["id"].startswith(prefix)]
            self.assertTrue(observed, "No validator tasks: " + prefix)
            self.assertTrue(all(t["status"] == "completed" for t in observed), str(observed))
        urls = [part for t in calls if t["id"].startswith("verify-git-") for part in t.get("command", [])]
        self.assertFalse(any(re.search(r":\d+\.git/", part) for part in urls), str(urls))

    def test_missing_browser_is_not_a_negative_pass(self):
        result, calls, _, _ = run_existing_negative(browser_missing=True)
        self.assertTrue(any(t["tool"] == "browser" for t in calls), "Missing-browser branch was not exercised")
        self.assertTrue(not result.wasSuccessful() or bool(result.skipped),
                        "A missing browser was reported as a successfully tested negative")


class H05Schemas(unittest.TestCase):
    def test_installed_dalfox_positive_control(self):
        profile = read_profile(self)
        finding = next(f for f in profile["validated_vulnerabilities"] if f["type"] == "reflected_xss")
        name = next(n for n in finding["evidence"] if n.endswith(".json"))
        self.parse(json.loads((chosen_run(self) / "profile" / name).read_text()), valid=True)

    def parse(self, data, valid=False, exit_code=1):
        with tempfile.TemporaryDirectory(prefix="acceptance-schema-") as directory:
            artifact = Path(directory) / "report.json"
            artifact.write_text(json.dumps(data))
            result = {"status": "completed", "exit_code": exit_code}
            STAGED.parse_result_artifact(result, "dalfox", artifact, Path(directory), "json")
            rejected = result.get("parse_status") == "failed" or result["status"] == "failed"
            self.assertEqual(rejected, not valid, str(result))

    def test_invalid_contract_matrix(self):
        cases = [
            {"meta": {"incomplete": False, "findings_count": {"bad": 1}}, "findings": []},
            {"meta": {"incomplete": False, "findings_count": 1}, "findings": []},
            {"meta": {"incomplete": False, "findings_count": 0}, "findings": "invalid"},
            {"meta": {"incomplete": "false", "findings_count": 0}, "findings": []},
            {"meta": {"incomplete": False, "findings_count": -1}, "findings": []},
            {"meta": None, "findings": []},
            {"meta": {"incomplete": True, "findings_count": 0}, "findings": []},
        ]
        for number, data in enumerate(cases):
            with self.subTest(case=number):
                self.parse(data, exit_code=1 if number == 1 else 0)


class H06Statuses(unittest.TestCase):
    def test_missing_tools_cannot_leave_completed_run_with_partial_stages(self):
        with tempfile.TemporaryDirectory(prefix="acceptance-status-") as directory:
            output = Path(directory) / "output"
            argv = ["192.0.2.10", "--from-nmap", str(OPTIONS.project / "tests/fixtures/single-target.xml"),
                    "--out", str(output), "--stages", "1-3", "--no-metasploit"]
            with patch.object(CORE, "inventory", return_value={k: None for k in CORE.TOOLS}), \
                 contextlib.redirect_stdout(io.StringIO()):
                code = CORE.main(argv)
            profile = json.loads((output / "device-profile.json").read_text())
            partial = any(stage["status"] == "partial" for stage in profile["stages"])
            self.assertFalse(partial and profile["run"]["status"] == "completed")
            if partial:
                self.assertEqual(code, 2)


class H07APIFindings(unittest.TestCase):
    def test_api_only_alert_survives_real_orchestration(self):
        with tempfile.TemporaryDirectory(prefix="acceptance-api-") as directory:
            output = Path(directory)
            raw = output / "raw"
            raw.mkdir()
            (raw / "body").write_text('<a href="/openapi.json">API</a>')
            base = "http://127.0.0.2:18080/"
            args = CORE.argument_parser().parse_args(["127.0.0.2", "--out", str(output), "--stages", "1-4", "--no-metasploit"])
            profile = {"nmap": {"services": [{"port": 18080, "protocol": "tcp", "state": "open", "fingerprint": {"name": "http"}}]},
                       "tasks": [], "policy": {}, "validated_vulnerabilities": [],
                       "observations": [{"tool": "http", "port": 18080, "task_id": "http-18080", "url": base,
                                         "execution_status": "completed", "body_source": "raw/body"}]}

            class AdapterFixture:
                tools = {}

                def execute(self, spec):
                    result = {**spec, "status": "completed", "exit_code": 0,
                              "stdout": "raw/" + spec["id"] + ".stdout"}
                    (output / result["stdout"]).write_text("")
                    if spec["id"] == "api-definition-18080":
                        (output / result["stdout"]).write_text(json.dumps({"openapi": "3.0.3", "paths": {"/items": {"get": {}}}}))
                        (raw / "api-definition-18080.headers").write_text("HTTP/1.1 200 OK\r\n\r\n")
                    if spec.get("result_artifact"):
                        data = []
                        if spec["tool"] == "ffuf":
                            data = {"results": []}
                        if spec["tool"] == "zap":
                            api = spec["id"].startswith("zap-api-")
                            data = {"site": [{"alerts": [{"name": "acceptance-api-only" if api else "acceptance-web-only",
                                     "pluginid": "acceptance", "instances": [{"uri": base + "items"}]}]}]}
                        (output / spec["result_artifact"]).write_text(json.dumps(data))
                    return result

            with contextlib.redirect_stdout(io.StringIO()):
                STAGED.run(args, profile, AdapterFixture(), CORE.task, CORE.normalise_result)
            findings = profile["assessment_findings"]
            self.assertTrue(any(f.get("title") == "acceptance-api-only" and f.get("source") == "zap-api-18080" for f in findings), str(findings))
            self.assertTrue(any(f.get("title") == "acceptance-web-only" for f in findings))
            self.assertTrue(all(f["status"] == "candidate" for f in findings))


class H08Storage(unittest.TestCase):
    def test_retained_whole_run_budget(self):
        measured = tree_size(chosen_run(self))
        self.assertLessEqual(measured["logical_bytes"], 16 * 1024 * 1024, str(measured))
        self.assertLessEqual(measured["allocated_bytes"], 16 * 1024 * 1024, str(measured))
        self.assertLessEqual(measured["files"], 250)
        self.assertFalse(measured["symlinks"], "Retained evidence must be self-contained; runtime links belong in scratch")

    def test_sampled_peak_and_shared_budget(self):
        if not OPTIONS.trace:
            self.skipTest("Unmeasured: supply --trace from measure_storage.py")
        trace = json.loads(OPTIONS.trace.read_text())
        self.assertEqual(Path(trace["run_root"]).resolve(), chosen_run(self))
        self.assertEqual(trace["exit_code"], 0)
        self.assertGreaterEqual(trace["samples"], 2)
        self.assertLessEqual(trace["max_sample_interval_seconds"], 1.0)
        self.assertLessEqual(trace["peak_logical_bytes"], 256 * 1024 * 1024)
        self.assertLessEqual(trace["peak_allocated_bytes"], 256 * 1024 * 1024)
        self.assertLessEqual(trace["shared_final_bytes"], 200 * 1024 * 1024)
        self.assertEqual(trace["work_final_bytes"], 0, "Scratch must be cleaned before process completion")
        self.assertFalse(trace["unaccounted_symlinks"])

    def test_small_run_keeps_required_proofs(self):
        run = chosen_run(self)
        profile = read_profile(self)
        self.assertEqual(profile["run"]["status"], "completed")
        expected = {(kind, scheme) for kind in ("sql_injection", "reflected_xss", "exposed_git_config") for scheme in ("http", "https")}
        actual = {(f["type"], f["url"].split(":", 1)[0]) for f in profile["validated_vulnerabilities"] if f["status"] == "reproduced"}
        self.assertTrue(expected.issubset(actual), str(actual))
        records = {a["path"]: a for a in profile["artifacts"]}
        for finding in profile["validated_vulnerabilities"]:
            self.assertTrue(finding["evidence"])
            for name in finding["evidence"]:
                path = (run / "profile" / name).resolve()
                self.assertTrue(path.is_relative_to(run / "profile"))
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), records[name]["sha256"])
        code, report = verify_in_memory(run, profile)
        self.assertEqual(code, 0)
        self.assertTrue(report["passed"])


class H09Initialisation(unittest.TestCase):
    def test_interrupt_during_metadata_preserves_partial_profile(self):
        with tempfile.TemporaryDirectory(prefix="acceptance-interruption-") as directory:
            output = Path(directory) / "output"
            args = CORE.argument_parser().parse_args(["192.0.2.10", "--out", str(output), "--no-metasploit",
                      "--from-nmap", str(OPTIONS.project / "tests/fixtures/single-target.xml")])
            with patch.object(CORE, "tool_identity", side_effect=KeyboardInterrupt), \
                 contextlib.redirect_stdout(io.StringIO()):
                try:
                    code = CORE.build(args)
                except KeyboardInterrupt:
                    self.fail("Metadata interruption escaped instead of preserving a partial profile")
            self.assertEqual(code, 2)
            profile = json.loads((output / "device-profile.json").read_text())
            self.assertEqual(profile["run"]["status"], "partial")
            self.assertTrue(profile["run"].get("interrupted"))


class H10Metadata(unittest.TestCase):
    def test_effective_configuration_complete(self):
        configuration = read_profile(self)["configuration"]
        required = {"stages", "skip", "udp_ports", "assessment_timeout", "validation_timeout", "max_web_origins",
                    "max_endpoints", "max_validation_urls", "verify_tls", "effective_privileged_discovery"}
        self.assertTrue(required.issubset(configuration), str(sorted(required - configuration.keys())))

    def test_real_versions_for_twelve_known_tools(self):
        versions = read_profile(self)["tool_versions"]
        required = ("nmap", "http", "whatweb", "tls", "httpx", "katana", "ffuf", "nuclei", "wpscan", "sqlmap", "dalfox", "browser")
        for name in required:
            with self.subTest(tool=name):
                self.assertRegex(versions[name].get("version") or "", r"\b\d+\.\d+", "Record a version, not ASCII art or wrapper identity")

    def test_template_and_wordlist_content_identified(self):
        identities = read_profile(self).get("input_identity", {})
        expected = [*OPTIONS.project.glob("templates/assessment/*"), OPTIONS.project / "wordlists/web-small.txt"]
        for path in expected:
            if path.is_file():
                name = str(path.relative_to(OPTIONS.project))
                self.assertIn(name, identities)
                self.assertEqual(identities[name]["sha256"], hashlib.sha256(path.read_bytes()).hexdigest())


class H11Documentation(unittest.TestCase):
    def test_no_current_runner_import_claim(self):
        for filename in ("README.md", "CLASSIFICATION.md"):
            text = " ".join((OPTIONS.project / filename).read_text().split())
            self.assertNotRegex(text, r"performs discovery, all follow-ups, validation, and verified Metasploit import")


class H12Cleanup(unittest.TestCase):
    def test_negative_fixture_stops_its_server(self):
        _, _, alive, elapsed = run_existing_negative(browser_missing=True)
        self.assertFalse(alive, "Negative fixture leaves a serve_forever daemon running")
        self.assertLess(elapsed, 2.0, "Cleanup should stop the server, not wait out a three-second join")


CLASSES = {
    "quick": [H02Deadlines, H05Schemas, H06Statuses, H07APIFindings, H09Initialisation, H11Documentation],
    "verifier": [H03Verifier], "wordpress": [H01WordPress],
    "negative": [H04NegativeCoverage, H12Cleanup],
    "storage": [H08Storage], "metadata": [H10Metadata],
}


class Result(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.records = {}

    def addSuccess(self, test):
        super().addSuccess(test)
        self.records.setdefault(test.id(), "pass")

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.records[test.id()] = "fail"

    def addError(self, test, err):
        super().addError(test, err)
        self.records[test.id()] = "error"

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self.records[test.id()] = "unmeasured"

    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        if err:
            self.records[test.id()] = "fail"


def main():
    global OPTIONS, CORE, STAGED
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, default=HERE.parent / "ctf-profiler")
    parser.add_argument("--group", choices=[*CLASSES, "all"], default="quick")
    parser.add_argument("--run", type=Path, help="Saved run root containing profile/device-profile.json")
    parser.add_argument("--trace", type=Path, help="Storage observer JSON for this same run")
    parser.add_argument("--output", type=Path, help="Write a NEW JSON acceptance report")
    OPTIONS = parser.parse_args()
    OPTIONS.project = OPTIONS.project.resolve()
    sys.path.insert(0, str(OPTIONS.project))
    CORE = importlib.import_module("ctf_profiler")
    STAGED = importlib.import_module("staged_workflow")
    classes = [c for values in CLASSES.values() for c in values] if OPTIONS.group == "all" else CLASSES[OPTIONS.group]
    suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(c) for c in classes)
    expected_counts = {c.__name__[:3]: len(unittest.defaultTestLoader.getTestCaseNames(c)) for values in CLASSES.values() for c in values}
    result = unittest.TextTestRunner(verbosity=2, resultclass=Result).run(suite)
    areas = {}
    for hill, weight in WEIGHTS.items():
        states = [state for test, state in result.records.items() if test.split(".")[-2].startswith(hill)]
        passed = states.count("pass")
        total = expected_counts[hill]
        areas[hill] = {"passed": passed, "checks": total, "weight": weight,
                       "points": round(weight * passed / total, 4), "complete": passed == total}
    report = {"suite": "scanning-acceptance-v2", "group": OPTIONS.group,
              "project": str(OPTIONS.project), "run": str(OPTIONS.run) if OPTIONS.run else None,
              "tests": result.records, "areas": areas,
              "total_points": round(sum(a["points"] for a in areas.values()), 4),
              "maximum": 100, "unmeasured_areas_earn_zero": True,
              "acceptance_sha256": {name: hashlib.sha256((HERE / name).read_bytes()).hexdigest()
                                    for name in ("acceptance.py", "measure_storage.py", "baseline.json")},
              "source_sha256": {name: hashlib.sha256((OPTIONS.project / name).read_bytes()).hexdigest()
                                for name in ("ctf_profiler.py", "staged_workflow.py", "lab/verify_staged_profile.py")},
              "note": "A score is for this invocation only; do not add scores from different source revisions. Release also requires the live/fixed-coverage gates in NEXT-STEPS."}
    print(json.dumps({"total_points": report["total_points"], "areas": areas}, indent=2))
    if OPTIONS.output:
        with OPTIONS.output.open("x") as stream:
            json.dump(report, stream, indent=2)
            stream.write("\n")
    return 0 if result.wasSuccessful() and not result.skipped else 1


if __name__ == "__main__":
    raise SystemExit(main())
