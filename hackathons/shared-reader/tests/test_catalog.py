"""Catalog enrollment/health without launching tools or a competing compute owner."""
import json
import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

from shared_reader.catalog import ProjectCatalogs
from shared_reader.watch import Environment
from shared_reader.worker_health import WorkerHealth


class FakeProject:
    def __init__(self, path, **_):
        self.path = Path(path).resolve()
        st = self.path.stat(); self.identity = (st.st_dev, st.st_ino)
        (self.path/'.reader-state').mkdir(exist_ok=True)
        self.closed = False; self.steps = 0
    def close(self): self.closed = True
    def files(self): return iter(())
    def has_work(self): return False
    def step(self): self.steps += 1; return False


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.legacy = self.root/'legacy'; self.legacy.mkdir()
        self.catalog = self.root/'hub.json'
    def workspace(self, relative):
        path = self.root/relative; path.mkdir(parents=True, exist_ok=True); return path
    def write(self, *records):
        self.catalog.write_text(json.dumps({'projects': list(records)}))
    def record(self, path, identifier):
        return dict(id=identifier, folder=str(path), managed=True)
    def environment(self):
        patcher = patch('shared_reader.watch.Project', FakeProject); patcher.start(); self.addCleanup(patcher.stop)
        env = Environment(self.legacy, projects_catalogs=[self.catalog]); self.addCleanup(env.close); return env

    def test_two_custom_roots_with_same_name_remain_distinct(self):
        a, b = self.workspace('first/Same'), self.workspace('second/Same')
        self.write(self.record(a, 'a'), self.record(b, 'b'))
        env = self.environment(); env.inventory()
        self.assertEqual({'catalog:a', 'catalog:b'}, set(env.projects))
        self.assertEqual(a, env.project_for(a/'input/file.txt').path)
        self.assertEqual(b, env.project_for(b/'input/file.txt').path)

    def test_legacy_root_and_catalog_do_not_duplicate_the_same_owner(self):
        a = self.workspace('legacy/Existing'); self.write(self.record(a, 'stable-id'))
        env = self.environment(); env.inventory()
        self.assertEqual(['Existing'], list(env.projects))
        self.assertEqual('stable-id', env.health.targets[a])

    def test_catalog_enrollment_never_initializes_or_changes_controls(self):
        a, b = self.workspace('custom/A'), self.workspace('custom/B')
        control = a/'reader-control.json'; control.write_text('{"running":true,"keep":"original"}')
        before = control.read_bytes(); self.write(self.record(a, 'a'), self.record(b, 'b'))
        env = self.environment(); env.inventory()
        self.assertEqual(before, control.read_bytes()); self.assertFalse((b/'reader-control.json').exists())

    def test_unmanaged_records_and_invalid_folders_are_not_enrolled(self):
        a = self.workspace('custom/A'); self.write(dict(id='ignored', folder=str(a), managed=False), self.record(self.root/'missing', 'missing'))
        catalog = ProjectCatalogs([self.catalog]); self.assertEqual({}, catalog.projects); self.assertTrue(catalog.errors)

    def test_ambiguous_ids_or_folder_ownership_fail_closed(self):
        a, b = self.workspace('A'), self.workspace('B')
        self.write(self.record(a, 'same'), self.record(b, 'same'))
        self.assertFalse(ProjectCatalogs([self.catalog]).projects)
        self.write(self.record(a, 'a'), self.record(a, 'b'))
        self.assertFalse(ProjectCatalogs([self.catalog]).projects)
        self.write(self.record(a, 'a'), self.record(a, 'a'))
        self.assertEqual({a: 'a'}, ProjectCatalogs([self.catalog]).projects)

    def test_symlinked_catalog_or_workspace_components_are_rejected(self):
        a = self.workspace('real/A'); link = self.root/'linked'; link.symlink_to(a.parent, target_is_directory=True)
        self.write(self.record(link/'A', 'a')); self.assertFalse(ProjectCatalogs([self.catalog]).projects)
        alias = self.root/'catalog-link.json'; alias.symlink_to(self.catalog)
        self.assertFalse(ProjectCatalogs([alias]).projects)

    def test_catalog_changes_enroll_and_retire_custom_workspaces(self):
        a, b = self.workspace('custom/A'), self.workspace('custom/B'); self.write(self.record(a, 'a'))
        env = self.environment(); env.inventory(); first = env.project_for(a)
        self.write(self.record(b, 'b')); env.inventory()
        self.assertTrue(first.closed); self.assertEqual({'catalog:b'}, set(env.projects))
        self.assertIsNone(env.project_for(a))

    def test_same_folder_new_identity_releases_old_owner(self):
        a = self.workspace('custom/A'); self.write(self.record(a, 'old'))
        env = self.environment(); env.inventory(); previous = env.project_for(a)
        self.write(self.record(a, 'new')); env.inventory()
        self.assertTrue(previous.closed); self.assertEqual({'catalog:new'}, set(env.projects))
        self.assertEqual('new', env.health.targets[a])

    def test_corrupt_catalog_retires_custom_enrollment_but_not_legacy_root(self):
        a = self.workspace('custom/A'); legacy = self.workspace('legacy/Old'); self.write(self.record(a, 'a'))
        env = self.environment(); env.inventory(); custom = env.project_for(a)
        self.catalog.write_text('{broken'); env.inventory()
        self.assertTrue(custom.closed); self.assertEqual({'Old'}, set(env.projects)); self.assertTrue(env.catalogs.errors)
        self.assertEqual(legacy, env.projects['Old'].path)

    def test_custom_root_events_are_enqueued_but_health_and_reports_are_not(self):
        a = self.workspace('custom/A'); self.write(self.record(a, 'a')); env = self.environment()
        source = a/'inbox/file.txt'; env.enqueue(source); self.assertIn(source, env.pending)
        for path in [a/'.reader-state/worker-status.json', a/'reader-report.json', a/'reader-control.json', a/'ciphey/index.html']:
            env.enqueue(path); self.assertNotIn(path, env.pending)

    def test_pause_isolation_also_applies_to_enrolled_custom_roots(self):
        a, b = self.workspace('custom/A'), self.workspace('custom/B')
        (a/'reader-control.json').write_text('{"running":false}'); self.write(self.record(a, 'a'), self.record(b, 'b'))
        env = self.environment(); env.inventory(); env.step()
        self.assertEqual(0, env.project_for(a).steps); self.assertEqual(1, env.project_for(b).steps)


class HealthTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.folder = self.root/'workspace'; (self.folder/'.reader-state').mkdir(parents=True)
        self.health = WorkerHealth(interval=.03); self.addCleanup(self.health.close)
        self.health.set_targets({self.folder: 'project-id'})
    def status(self, folder=None):
        return json.loads(((folder or self.folder)/'.reader-state/worker-status.json').read_text())
    def test_heartbeat_identifies_ready_owner_and_is_private(self):
        self.health.pulse(); s = self.status()
        self.assertEqual('project-id', s['project_id']); self.assertEqual(['cipher', 'password'], s['engines'])
        self.assertTrue(s['available']); self.assertGreater(s['heartbeat_at'], time.time()-2)
        self.assertEqual('unsupported', s['observed_state'])
        self.assertEqual(0o600, (self.folder/'.reader-state/worker-status.json').stat().st_mode&0o777)
    def test_timer_updates_even_when_foreground_work_is_busy(self):
        self.health.pulse(); before = self.status()['heartbeat_at']; self.health.start()
        deadline = time.monotonic()+2
        while self.status()['heartbeat_at'] <= before and time.monotonic()<deadline:
            time.sleep(.02)
        self.assertGreater(self.status()['heartbeat_at'], before)
    def test_clean_shutdown_invalidates_readiness_without_deleting_results(self):
        result = self.folder/'result.txt'; result.write_text('retained')
        self.health.pulse(); self.health.close(); s = self.status()
        self.assertFalse(s['available']); self.assertEqual(0, s['heartbeat_at']); self.assertEqual('retained', result.read_text())
    def test_bad_target_does_not_block_other_workspaces(self):
        bad = self.root/'bad'; bad.mkdir(); (bad/'.reader-state').symlink_to(self.folder/'.reader-state', target_is_directory=True)
        self.health.set_targets({bad: 'bad', self.folder: 'project-id'}); self.health.pulse()
        self.assertEqual('project-id', self.status()['project_id']); self.assertIn(str(bad), self.health.errors)
    def test_retiring_old_owner_never_overwrites_a_new_owner(self):
        self.health.pulse(); other = WorkerHealth(); self.addCleanup(other.close)
        other.set_targets({self.folder: 'project-id'}); other.pulse(); self.health.close()
        self.assertEqual(other.worker_id, self.status()['worker_id']); self.assertTrue(self.status()['available'])


if __name__ == '__main__':
    unittest.main()
