"""Public CLI and reusable-component boundaries after module extraction."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


PROJECT = Path(__file__).resolve().parents[1]


class RefactorAPI(unittest.TestCase):
    def test_components_import_without_loading_the_cli(self):
        # Library consumers must not need the CLI controller or its orchestration.
        code = ('import execution, discovery, service_plan, service_parsers, identities, '
                'web_parsers, web_assessment, finding_validation; import sys; '
                'assert "ctf_profiler" not in sys.modules; '
                'assert "staged_workflow" not in sys.modules')
        result = subprocess.run([sys.executable, '-B', '-c', code], cwd=PROJECT,
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_cli_from_another_directory_preserves_profile_and_module_identity(self):
        with tempfile.TemporaryDirectory(prefix='profiler-api-') as directory:
            output = Path(directory) / 'run'
            result = subprocess.run([
                sys.executable, '-B', str(PROJECT / 'ctf_profiler.py'), '192.0.2.10',
                '--from-nmap', str(PROJECT / 'tests/fixtures/single-target.xml'),
                '--offline', '--stages', '1-5', '--no-metasploit', '--out', str(output),
            ], cwd=directory, capture_output=True, text=True, timeout=15)
            self.assertEqual(result.returncode, 0, result.stderr)
            profile = json.loads((output / 'device-profile.json').read_text())
            self.assertEqual(profile['target']['ip'], '192.0.2.10')
            self.assertEqual(profile['run']['mode'], 'offline')
            self.assertEqual(profile['run']['status'], 'completed')
            self.assertEqual(profile['validated_vulnerabilities'], [])
            self.assertTrue(profile['cleanup']['success'])
            self.assertFalse((output / 'metasploit-import.rc').exists())
            expected = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                        for p in PROJECT.glob('*.py')}
            actual = {name: item['sha256'] for name, item in profile['source_identity'].items()}
            self.assertEqual(actual, expected, 'Every extracted production module must be fingerprinted')


if __name__ == '__main__':
    unittest.main()
