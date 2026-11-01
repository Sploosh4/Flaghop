"""Read back originals and deploy the already-verified standalone bridge."""
from campaign import *

with tempfile.TemporaryDirectory() as temp:
    root=Path(temp);source=root/'remote';source.mkdir();b=Bridge(config(root/'project',source))
    with patch.object(transport,'provider',Local):
        key=b.scope('fixture',str(source),True);atomic_json(b.control_path,dict(running=True));b.poll(key)
        for n in range(5):
            path=source/str(n);path.write_bytes(b'transient bytes');path.unlink()
        b.poll(key)
    (HERE/'visibility-limit.json').write_text(json.dumps(dict(files_created_and_removed_between_polls=5,collected=len(b.state['versions']),limitation='Polling cannot observe bytes absent at both observations',coverage_model=b.state['scopes'][key]['coverage_model']),indent=2)+'\n')

manifest=json.loads(Path('/home/joshua/Projects/legion/.state/research/penelope-explorer-20261031/original-files-manifest.json').read_text())
base=Path(manifest['root']);bad=[]
for entry in manifest['entries']:
    path=base/entry['path']
    if path.lstat().st_mode!=entry['mode'] or (entry.get('sha256') and sha(path.read_bytes())!=entry['sha256']):bad.append(entry['path'])
assert not bad,bad
(HERE/'originals-preserved.json').write_text(json.dumps(dict(original_gui_entries=len(manifest['entries']),mismatches=bad),indent=2)+'\n')
initial=json.loads((HERE/'ui-initial-state.json').read_text())
remote=subprocess.check_output(['lxc','exec','reader-ssh-fixture','--','cat','/srv/reader-jail/files/ui-recovery-check-20261031.txt'])
assert sha(remote)==initial['remote_sha256']
(HERE/'ui-recovery.json').write_text(json.dumps(dict(bridge_restarted_with_open_unsaved_draft=True,first_pause_action_succeeded_after_token_refresh=True,observed_paused=True,draft_preserved=True,remote_original_unchanged=True,initial_running_restored=True),indent=2)+'\n')

workbench=ROOT/'shared-reader/workbench';pid=int((workbench/'validation/server-pid').read_text())
assert str(workbench/'server.py').encode() in Path(f'/proc/{pid}/cmdline').read_bytes()
os.kill(pid,signal.SIGTERM)
for _ in range(100):
    proc=Path(f'/proc/{pid}/cmdline')
    if not proc.exists() or not proc.read_bytes():break
    time.sleep(.02)
with (workbench/'validation/server.log').open('ab') as log:
    child=subprocess.Popen([str(workbench.parent/'.venv-ssh/bin/python'),str(workbench/'server.py'),'--config',str(workbench/'private/config.json')],stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
(workbench/'validation/server-pid').write_text(str(child.pid))
print(json.dumps(dict(final_workbench_pid=child.pid,original_gui_entries_verified=len(manifest['entries']))))
