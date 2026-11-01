#!/usr/bin/env python3
"""Supplemental blocker checks. Missing release evidence is unmeasured, never passing."""
import argparse
import contextlib
from datetime import datetime, timezone
import hashlib
import importlib
import io
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from record_command import sources as command_sources

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
OPTIONS = CORE = STAGED = None
XML = b'<nmaprun><host><status state="up"/><address addr="192.0.2.10" addrtype="ipv4"/><ports><port protocol="tcp" portid="80"><state state="closed"/><service name="http"/></port></ports></host><runstats><finished exit="success"/></runstats></nmaprun>'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def values(obj):
    if isinstance(obj, dict):
        for value in obj.values():
            yield from values(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from values(value)
    else:
        yield obj


class Fixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='cp-v3-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.work = self.root / 'w'
        self.work.mkdir()
        self.out = self.root / 'run'
        self.env = patch.dict(os.environ, {'TMPDIR': str(self.work)})
        self.env.start()
        self.addCleanup(self.env.stop)

    def executable(self, name, body):
        path = self.root / name
        path.write_text('#!' + sys.executable + '\n' + body)
        path.chmod(0o700)
        return path

    def args(self):
        xml = self.root / 'fixture.xml'
        xml.write_bytes(XML)
        args = CORE.argument_parser().parse_args(['192.0.2.10', '--from-nmap', str(xml),
                    '--offline', '--no-metasploit', '--out', str(self.out)])
        args.workspace = 'acceptance-v3'
        return args

    def build(self, callback=None):
        with patch.object(CORE, 'inventory', return_value={}), \
             patch.object(CORE, 'run_staged', side_effect=callback), \
             contextlib.redirect_stdout(io.StringIO()):
            code = CORE.build(self.args())
        return code, json.loads((self.out / 'device-profile.json').read_text())

    def runner(self, tools):
        (self.out / 'raw').mkdir(parents=True)
        return CORE.Runner(self.out, tools)


class B1TemporaryStorage(Fixture):
    def test_version_probe_uses_declared_work_root(self):
        capture = self.root / 'env.json'
        executable = self.executable('browser', 'import json,os,pathlib\n'
            f'pathlib.Path({str(capture)!r}).write_text(json.dumps(dict(os.environ)))\n'
            'print("Google Chrome 123.0.6312.86")\n')
        CORE.tool_identity({'browser': str(executable)})
        env = json.loads(capture.read_text())
        self.assertTrue(Path(env['TMPDIR']).resolve().is_relative_to(self.work.resolve()), env['TMPDIR'])

    def test_browser_process_tmp_is_within_measured_roots(self):
        executable = self.executable('browser-env', 'import json,os\nprint(json.dumps(dict(os.environ)))\n')
        runner = self.runner({'browser': str(executable)})
        result = runner.execute(CORE.task('browser-env', 'browser', [str(executable)], 'owned fixture', 3))
        self.assertEqual(result['status'], 'completed')
        env = json.loads((self.out / result['stdout']).read_text())
        actual = Path(env['TMPDIR']).resolve()
        self.assertTrue(any(actual.is_relative_to(root.resolve()) for root in (self.work, self.out)), str(actual))

    def test_actual_browser_profile_path_is_measured(self):
        raw = self.out / 'raw'
        raw.mkdir(parents=True)
        captures = []
        def execute(*args, **kwargs):
            captures.extend(args[3])
            return {'status': 'tool_missing'}, None
        STAGED.validate_browser('http://127.0.0.1/?q=x', 'q', 80, 0, raw,
                                execute, lambda *a, **kw: None, 'http://127.0.0.1:1', 'candidate')
        paths = [Path(arg.split('=', 1)[1]).resolve() for arg in captures if arg.startswith('--user-data-dir=')]
        self.assertEqual(len(paths), 1)
        self.assertTrue(any(paths[0].is_relative_to(root.resolve()) for root in (self.work, self.out)), str(paths[0]))

    def test_observer_measures_24mib_then_small_final(self):
        # This checks observer sensitivity and the distinction between peak/final.
        run, work, shared, trace = [self.root / p for p in ('control-run', 'control-work', 'shared', 'trace.json')]
        code = ('import os,pathlib,time; p=pathlib.Path(os.environ["TMPDIR"])/"transient"; '
                'p.write_bytes(b"x"*(24*1024*1024)); time.sleep(0.8); p.unlink(); '
                f'r=pathlib.Path({str(run)!r}); r.mkdir(); (r/"tiny").write_text("ok")')
        observer = HERE.parent / 'scanning-acceptance-v2/measure_storage.py'
        proc = subprocess.run([sys.executable, '-B', str(observer), '--run', str(run), '--work', str(work),
              '--shared', str(shared), '--output', str(trace), '--', sys.executable, '-B', '-c', code],
              capture_output=True, text=True, timeout=15)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        report = json.loads(trace.read_text())
        self.assertGreaterEqual(report['peak_logical_bytes'], 24 * 1024 * 1024)
        self.assertEqual(report['run_final_bytes'], 2)
        self.assertEqual(report['work_final_bytes'], 0)


class B2Cleanup(Fixture):
    def test_real_permission_denied_cannot_report_completed(self):
        if os.geteuid() == 0:
            self.skipTest('Unmeasured under root: POSIX permission denial needs an unprivileged run')
        protected = self.out / 'raw/tool-state/blocked'
        def prepare(*unused):
            protected.mkdir(parents=True)
            (protected / 'leftover').write_bytes(b'retained runtime')
            protected.chmod(0o500)
        self.addCleanup(lambda: protected.chmod(0o700) if protected.exists() else None)
        code, profile = self.build(prepare)
        self.assertTrue((protected / 'leftover').exists(), 'Fixture did not produce a real failed deletion')
        self.assertNotEqual(code, 0)
        self.assertEqual(profile['run']['status'], 'partial')
        cleanup = profile.get('cleanup', {})
        self.assertIs(cleanup.get('success'), False, cleanup)
        report = cleanup.get('run', {})
        self.assertTrue(report.get('errors'), cleanup)
        leftovers = report.get('leftovers', [])
        self.assertTrue(any((protected / 'leftover').resolve().is_relative_to(Path(item['path']).resolve())
                            and item['logical_bytes'] == len(b'retained runtime') for item in leftovers), leftovers)

    def test_successful_cleanup_is_explicit_and_preserves_neighbour(self):
        neighbour = self.root / 'unrelated'
        neighbour.mkdir()
        sentinel = neighbour / 'keep'
        sentinel.write_bytes(b'neighbour')
        code, profile = self.build()
        self.assertEqual(code, 0)
        self.assertEqual(sentinel.read_bytes(), b'neighbour')
        cleanup = profile.get('cleanup', {})
        self.assertIs(cleanup.get('success'), True, cleanup)
        self.assertEqual(cleanup['run']['leftovers'], [])
        self.assertEqual(cleanup['run']['errors'], [])
        self.assertEqual(profile['workspace']['cleanup']['leftovers'], [])

    def test_interruption_cleans_owned_runtime(self):
        def interrupt(*unused):
            path = self.out / 'raw/tool-state/interrupt'
            path.mkdir(parents=True)
            (path / 'runtime').write_bytes(b'x' * 1024)
            raise KeyboardInterrupt
        code, profile = self.build(interrupt)
        self.assertEqual(code, 2)
        self.assertEqual(profile['run']['status'], 'partial')
        self.assertTrue(profile['run']['interrupted'])
        self.assertFalse((self.out / 'raw/tool-state').exists())
        self.assertEqual(profile.get('cleanup', {}).get('run', {}).get('leftovers'), [])

    def test_failed_tool_retains_bounded_diagnostic(self):
        executable = self.executable('fail-tool', 'import sys\n'
            'print("diagnostic-canary-8371", file=sys.stderr)\n'
            'print("x"*64000, file=sys.stderr)\nsys.exit(7)\n')
        runner = self.runner({'diagnostic': str(executable)})
        result = runner.execute(CORE.task('failed-tool', 'diagnostic', [str(executable)], 'owned failure', 3))
        self.assertEqual(result['status'], 'failed')
        self.assertEqual(result['exit_code'], 7)
        CORE.cleanup_transient(self.out)
        log = (self.out / result['stderr']).read_bytes()
        self.assertIn(b'diagnostic-canary-8371', log)
        self.assertLessEqual(len(log), CORE.MAX_LOG)

    def test_large_runtime_home_has_bounded_diagnostic_before_removal(self):
        home = self.out / 'raw/zap-fixture-home'
        home.mkdir(parents=True)
        (home / 'zap.log').write_bytes(b'x' * (1024 * 1024) + b'final-runtime-canary-9173')
        STAGED.cleanup_tool_state(self.out, 'zap', 'fixture-failed')
        self.assertFalse(home.exists())
        retained = [p for p in (self.out / 'raw').rglob('*') if p.is_file()]
        self.assertTrue(any(b'final-runtime-canary-9173' in p.read_bytes() for p in retained), retained)
        self.assertLessEqual(sum(p.stat().st_size for p in retained), CORE.MAX_LOG)


class B3DependencyIdentity(Fixture):
    def test_full_browser_version_is_preserved(self):
        self.assertEqual(CORE.extract_version('browser', 'Google Chrome 123.0.6312.86'), '123.0.6312.86')

    def test_underlying_implementation_change_with_unchanged_wrapper(self):
        implementation = self.executable('implementation', 'print("Version: 1.2.3")\n')
        wrapper = self.root / 'wpscan-wrapper'
        wrapper.write_text('#!/bin/sh\nexec ' + shlex.quote(str(implementation)) + ' "$@"\n')
        wrapper.chmod(0o700)
        original_wrapper = sha(wrapper)
        before_hash = sha(implementation)
        before = CORE.snapshot_dependencies({'wpscan': str(wrapper)})
        implementation.write_text('#!' + sys.executable + '\nprint("Version: 1.2.3") # changed code\n')
        after_hash = sha(implementation)
        after = CORE.snapshot_dependencies({'wpscan': str(wrapper)})
        self.assertEqual(sha(wrapper), original_wrapper)
        self.assertIn(before_hash, list(values(before)))
        self.assertIn(after_hash, list(values(after)))
        self.assertNotEqual(before_hash, after_hash)

    def test_selected_database_mutation_is_detected(self):
        cache = self.root / 'cache'
        db = cache / 'wpscan/db'
        db.mkdir(parents=True)
        data = db / 'fixture.json'
        data.write_text('{"fixture": 1}')
        executable = self.executable('wpscan', 'print("Version: 1.2.3")\n')
        with patch.dict(os.environ, {'CTF_PROFILER_WPSCAN_CACHE': str(cache)}):
            before_hash = sha(data)
            before = CORE.snapshot_dependencies({'wpscan': str(executable)})
            data.write_text('{"fixture": 2}')
            after = CORE.snapshot_dependencies({'wpscan': str(executable)})
        self.assertIn(before_hash, list(values(before)))
        self.assertIn(sha(data), list(values(after)))
        self.assertNotEqual(before_hash, sha(data))

    def test_database_changed_during_run_prevents_clean_completion(self):
        cache = self.root / 'cache'
        db = cache / 'wpscan/db'
        db.mkdir(parents=True)
        data = db / 'fixture.json'
        data.write_text('{"fixture": 1}')
        executable = self.executable('wpscan', 'print("Version: 1.2.3")\n')
        def mutate(*unused):
            data.write_text('{"fixture": 2}')
        with patch.dict(os.environ, {'CTF_PROFILER_WPSCAN_CACHE': str(cache)}), \
             patch.object(CORE, 'inventory', return_value={'wpscan': str(executable)}), \
             patch.object(CORE, 'run_staged', side_effect=mutate), contextlib.redirect_stdout(io.StringIO()):
            code = CORE.build(self.args())
        profile = json.loads((self.out / 'device-profile.json').read_text())
        self.assertNotEqual(code, 0)
        self.assertEqual(profile['run']['status'], 'partial')
        self.assertIs(profile.get('dependency_identity', {}).get('unchanged'), False)


def evidence(test):
    if not OPTIONS.evidence:
        test.skipTest('Unmeasured: supply --evidence round3-evidence.json')
    return json.loads(OPTIONS.evidence.read_text())


def check_receipt(test, receipt):
    test.assertEqual(receipt['schema_version'], 1)
    test.assertIsInstance(receipt['argv'], list)
    test.assertTrue(receipt['argv'])
    test.assertTrue(receipt['fixture'])
    test.assertIsInstance(receipt['exit_code'], int)
    test.assertEqual(receipt['exit_code'], receipt['expected_exit_code'])
    test.assertFalse(receipt['timed_out'])
    test.assertFalse(receipt['error'])
    test.assertTrue(receipt['expected_result_observed'])
    test.assertGreaterEqual(receipt['duration_seconds'], 0)
    test.assertTrue(receipt['source_unchanged'])
    current = command_sources(OPTIONS.project)
    test.assertEqual(receipt['source_before'], current)
    test.assertEqual(receipt['source_after'], current)
    for record in receipt['logs'].values():
        path = Path(record['path'])
        test.assertEqual(sha(path), record['sha256'])
        test.assertEqual(path.stat().st_size, record['captured_bytes'])
        test.assertLessEqual(record['captured_bytes'], 256 * 1024)


class B4CommandEvidence(unittest.TestCase):
    def test_documented_commands_have_current_receipts(self):
        data = evidence(self)
        categories = set()
        for path in data['command_receipts']:
            receipt = json.loads(Path(path).read_text())
            check_receipt(self, receipt)
            categories.add(receipt['category'])
        self.assertTrue({'help', 'check-tools', 'offline', 'dry-run', 'saved-xml', 'active-tcp',
            'stage-1-3', 'stage-1-4', 'stage-1-5', 'verify', 'wordpress', 'negative',
            'regression', 'acceptance-v2', 'supplemental'} <= categories, categories)
        self.assertTrue(data['limitations'], 'Document unavailable/excluded commands explicitly')


class ReleaseEvidence(unittest.TestCase):
    def test_three_matching_full_runs_with_storage_and_dependencies(self):
        data = evidence(self)
        runs = data['runs']
        self.assertEqual(len(runs), 3)
        self.assertEqual(len({r['run_root'] for r in runs}), 3)
        identities = []
        for run in runs:
            root = Path(run['run_root']).resolve()
            profile = json.loads((root / 'profile/device-profile.json').read_text())
            storage = json.loads(Path(run['storage']).read_text())
            acceptance = json.loads(Path(run['acceptance']).read_text())
            self.assertEqual(profile['run']['status'], 'completed')
            self.assertIs(profile['cleanup']['success'], True)
            self.assertEqual(profile['cleanup']['run']['leftovers'], [])
            self.assertEqual(profile['workspace']['cleanup']['leftovers'], [])
            self.assertIs(profile['dependency_identity']['unchanged'], True)
            before = profile['dependency_identity']['before']
            self.assertTrue(before)
            self.assertEqual(before, profile['dependency_identity']['after'])
            self.assertTrue(before['zap']['zap']['core_jars'])
            self.assertTrue(before['zap']['zap']['plugins'])
            self.assertTrue(before['wpscan']['wpscan']['gemspecs'])
            self.assertEqual(before['wpscan']['wpscan']['database']['status'], 'present')
            self.assertTrue(before['wpscan']['wpscan']['database']['files'])
            self.assertEqual(Path(storage['run_root']).resolve(), root)
            self.assertEqual(storage['exit_code'], 0)
            self.assertLessEqual(storage['run_final_bytes'], 16 * 1024 * 1024)
            self.assertLessEqual(storage['peak_logical_bytes'], 256 * 1024 * 1024)
            self.assertEqual(storage['work_final_bytes'], 0)
            self.assertLessEqual(storage['shared_final_bytes'], 200 * 1024 * 1024)
            self.assertLessEqual(max(sample['shared_bytes'] for sample in storage['measurements']), 200 * 1024 * 1024)
            self.assertFalse(storage['unaccounted_symlinks'])
            roots = [Path(storage[k]).resolve() for k in ('run_root', 'work_root', 'shared_root')]
            declared = run['writable_roots']
            self.assertTrue(declared)
            for path in declared:
                self.assertTrue(any(Path(path).resolve().is_relative_to(p) for p in roots), path)
            self.assertTrue(any(Path(profile['workspace']['owned_root']).resolve().is_relative_to(p) for p in roots))
            for task in profile['tasks']:
                if task.get('scratch_root'):
                    self.assertTrue(any(Path(task['scratch_root']).resolve().is_relative_to(p) for p in roots))
                for arg in task.get('command', []):
                    if arg.startswith('--user-data-dir='):
                        self.assertTrue(any(Path(arg.split('=', 1)[1]).resolve().is_relative_to(p) for p in roots))
            self.assertLessEqual(len([p for p in root.rglob('*') if p.is_file()]), 250)
            reported_run = Path(acceptance['run'])
            if not reported_run.is_absolute():
                reported_run = OPTIONS.project / reported_run
            self.assertEqual(reported_run.resolve(), root)
            results = acceptance['tests']
            self.assertEqual(len(results), 28)
            self.assertEqual(set(results.values()), {'pass'})
            for name, digest in acceptance['source_sha256'].items():
                self.assertEqual(digest, sha(OPTIONS.project / name))
            for name, digest in acceptance['acceptance_sha256'].items():
                self.assertEqual(digest, sha(HERE.parent / 'scanning-acceptance-v2' / name))
            for name, record in profile['source_identity'].items():
                self.assertEqual(record['sha256'], sha(OPTIONS.project / name))
            self.assertTrue({p.name for p in OPTIONS.project.glob('*.py')} <= set(profile['source_identity']))
            identities.append([profile[k] for k in ('source_identity', 'input_identity', 'configuration', 'tool_versions')])
        self.assertEqual(identities[0], identities[1])
        self.assertEqual(identities[1], identities[2])


class Results(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.outcomes = {}
    def addSuccess(self, test):
        super().addSuccess(test)
        self.outcomes[test.id()] = {'status': 'pass'}
    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.outcomes[test.id()] = {'status': 'fail', 'detail': self._exc_info_to_string(err, test)}
    def addError(self, test, err):
        super().addError(test, err)
        self.outcomes[test.id()] = {'status': 'fail', 'detail': self._exc_info_to_string(err, test)}
    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self.outcomes[test.id()] = {'status': 'unmeasured', 'detail': reason}


def main():
    global OPTIONS, CORE, STAGED
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--evidence', type=Path)
    parser.add_argument('--group', choices=('behaviour', 'release', 'all'), default='all')
    OPTIONS = parser.parse_args()
    OPTIONS.project = OPTIONS.project.resolve()
    if OPTIONS.output.exists():
        parser.error('Use a new output path; historical reports are not overwritten')
    before = {str(p.relative_to(OPTIONS.project)): sha(p) for p in sorted(OPTIONS.project.glob('*.py'))}
    sys.path.insert(0, str(OPTIONS.project))
    CORE = importlib.import_module('ctf_profiler')
    STAGED = importlib.import_module('staged_workflow')
    classes = []
    if OPTIONS.group in ('behaviour', 'all'):
        classes += [B1TemporaryStorage, B2Cleanup, B3DependencyIdentity]
    if OPTIONS.group in ('release', 'all'):
        classes += [B4CommandEvidence, ReleaseEvidence]
    suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(c) for c in classes)
    result = unittest.TextTestRunner(verbosity=2, resultclass=Results).run(suite)
    after = {str(p.relative_to(OPTIONS.project)): sha(p) for p in sorted(OPTIONS.project.glob('*.py'))}
    counts = {s: sum(r['status'] == s for r in result.outcomes.values()) for s in ('pass', 'fail', 'unmeasured')}
    report = {'suite': 'scanning-acceptance-v3', 'measured_at': datetime.now(timezone.utc).isoformat(),
              'project': str(OPTIONS.project), 'group': OPTIONS.group, 'source_before': before,
              'acceptance_sha256': {name: sha(HERE / name) for name in ('acceptance.py', 'record_command.py')},
              'source_after': after, 'source_unchanged': before == after,
              'tests': result.outcomes, 'counts': counts,
              'complete': not counts['fail'] and not counts['unmeasured'] and before == after}
    with OPTIONS.output.open('x') as stream:
        json.dump(report, stream, indent=2)
        stream.write('\n')
    print(json.dumps({'output': str(OPTIONS.output), **counts, 'complete': report['complete']}))
    return 0 if report['complete'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
