"""Workspace isolation and provenance contract regressions."""
import json
import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
from shared_reader.watch import Environment, workspace_paused
from shared_reader.project import Project


class ControlTests(unittest.TestCase):
    def test_origin_requires_matching_content_hash_and_tolerates_bad_registry(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'inbox').mkdir()
            data=b'original source bytes'
            source=root/'inbox/source.txt'
            source.write_bytes(data)
            registry=root/'reader-origins.json'
            registry.write_text('[]')
            project=Project(root)
            try:
                project.ingest(source)
                project.export()
                sources=json.loads((root/'reader-report.json').read_text())['sources']
                self.assertNotIn('origin',sources[0])
                origin=dict(sha256=hashlib.sha256(data).hexdigest(),source_uri='sftp://fixture/files/source.txt')
                registry.write_text(json.dumps({'inbox/source.txt':origin}))
                project.export()
                self.assertEqual(json.loads((root/'reader-report.json').read_text())['sources'][0]['origin'],origin)
                registry.write_text(json.dumps({'inbox/source.txt':dict(origin,sha256='wrong')}))
                project.export()
                self.assertNotIn('origin',json.loads((root/'reader-report.json').read_text())['sources'][0])
            finally:
                project.close()

    def test_absent_control_retains_existing_behaviour(self):
        with tempfile.TemporaryDirectory() as folder:
            self.assertFalse(workspace_paused(folder))
            path = Path(folder) / 'reader-control.json'
            path.write_text('{broken')
            self.assertTrue(workspace_paused(folder))
            path.write_text(json.dumps(dict(running=False)))
            self.assertTrue(workspace_paused(folder))
            path.write_text(json.dumps(dict(running=True)))
            self.assertFalse(workspace_paused(folder))

    def test_pause_one_workspace_does_not_pause_others(self):
        with tempfile.TemporaryDirectory() as folder:
            environment = Environment(folder)
            first, second = Mock(), Mock()
            first.path, second.path = Path(folder)/'one', Path(folder)/'two'
            first.path.mkdir(); second.path.mkdir()
            (first.path/'reader-control.json').write_text('{"running":false}')
            environment.projects = dict(one=first, two=second)
            with patch.object(environment, 'retire_missing'):
                environment.step()
            first.step.assert_not_called()
            second.step.assert_called_once()


if __name__ == '__main__':
    unittest.main()
