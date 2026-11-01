"""Record fresh compatibility evidence without replacing earlier reports."""
import json
from pathlib import Path
import subprocess
import sys
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parents[1]
ROOT = PROJECT.parent
RECORDER = ROOT / 'scanning-acceptance-v3/record_command.py'
PYTHON = sys.executable


def read(path):
    return json.loads(path.read_text())


def save(name, value):
    (HERE / name).write_text(json.dumps(value, indent=2) + '\n')


def record(name, category, fixture, argv):
    receipt = HERE / name
    subprocess.run([PYTHON, '-B', str(RECORDER), '--project', str(PROJECT),
                    '--output', str(receipt), '--category', category,
                    '--fixture', fixture, '--', *argv], cwd=PROJECT, check=True)
    result = read(receipt)
    assert result['exit_code'] == 0 and result['source_unchanged']
    return result


def main():
    for name in ['command-regression-312.json', 'command-regression-system.json',
                 'command-behaviour-312.json']:
        receipt = read(HERE / name)
        assert receipt['exit_code'] == 0 and receipt['source_unchanged'], name
    assert read(HERE / 'behaviour-312.json')['counts'] == {'pass': 13, 'fail': 0, 'unmeasured': 0}
    state_path = HERE / 'run-series.json'
    state = read(state_path) if state_path.exists() else {
        'started_at': datetime.now(timezone.utc).isoformat(), 'runs': [], 'complete': False}
    save('run-series.json', state)
    for number in range(1, 4):
        n = f'{number:03d}'
        run = HERE / f'run-{n}'
        observer = [PYTHON, '-B', str(ROOT / 'scanning-acceptance-v2/measure_storage.py'),
                    '--run', str(run), '--work', f'/tmp/cp-c12-w{number}',
                    '--shared', f'/tmp/cp-c12-s{number}', '--output', str(HERE / f'storage-{n}.json'),
                    PYTHON, '-B', str(PROJECT / 'ctf_profiler.py'), '127.0.0.2',
                    '--ports', '53,445,12222,18080,18443,18444', '--os-detection', 'off',
                    '--dns-server', '127.0.0.2', '--tool-timeout', '45', '--tls-timeout', '240',
                    '--stages', '1-5', '--no-metasploit', '--skip', 'metasploit_check',
                    '--assessment-timeout', '180', '--validation-timeout', '180',
                    '--out', str(run / 'profile')]
        entry = next((r for r in state['runs'] if r['run'] == str(run)), None)
        if entry is None:
            entry = {'run': str(run), 'started_at': datetime.now(timezone.utc).isoformat(), 'status': 'running'}
            state['runs'].append(entry)
        save('run-series.json', state)
        scan_receipt = HERE / f'command-run-{n}.json'
        if scan_receipt.exists():
            existing = read(scan_receipt)
            assert existing['exit_code'] == 0 and existing['source_unchanged']
            assert existing['source_after'] == read(HERE / 'command-regression-312.json')['source_after']
        else:
            record(scan_receipt.name, 'active-tcp',
                   'Owned loopback five-stage Python 3.12 scan through real Chrome gate and storage observer',
                   [PYTHON, '-B', str(ROOT / 'scanning-acceptance-v3/browser_preflight.py'),
                    '--project', str(PROJECT), '--output', str(HERE / f'browser-{n}.json'), '--then', *observer])
        acceptance_receipt = HERE / f'command-acceptance-{n}.json'
        if not acceptance_receipt.exists():
            record(acceptance_receipt.name, 'acceptance-v2',
                   'All protected v2 checks against current Python 3.12 full run',
                   [PYTHON, '-B', str(ROOT / 'scanning-acceptance-v2/acceptance.py'),
                    '--project', str(PROJECT), '--group', 'all', '--run', str(run),
                    '--trace', str(HERE / f'storage-{n}.json'), '--output', str(HERE / f'acceptance-{n}.json')])
        checked = read(acceptance_receipt)
        assert checked['exit_code'] == 0 and checked['source_unchanged']
        acceptance = read(HERE / f'acceptance-{n}.json')
        assert len(acceptance['tests']) == 28 and set(acceptance['tests'].values()) == {'pass'}
        entry.update(status='passed', finished_at=checked['finished_at'])
        save('run-series.json', state)
        print(f'Python 3.12 run {n}: browser 4/4, full scan exit0, acceptance 28/28', flush=True)
    state['complete'] = True
    save('run-series.json', state)

    old = PROJECT / 'validation/refactor-20261031'
    matrix = read(old / 'command-matrix.json')
    reusable = {'active-tcp': 'command-run-001.json', 'acceptance-v2': 'command-acceptance-001.json',
                'regression': 'command-regression-312.json', 'supplemental': 'command-behaviour-312.json'}
    for row in matrix['rows']:
        category = row['category']
        if category in reusable:
            path = HERE / reusable[category]
            receipt = read(path)
        else:
            argv = [part.replace(str(old), str(HERE)).replace(
                'validation/refactor-20261031', 'validation/compat-python312-20261031')
                for part in row['argv']]
            assert not any('refactor-20261031' in part for part in argv), argv
            argv[0] = PYTHON
            path = HERE / f'command-{category}.json'
            receipt = record(path.name, category, row['fixture'], argv)
        row.update(receipt=str(path), argv=receipt['argv'], expected_exit_code=0, actual_exit_code=receipt['exit_code'])
    save('command-matrix.json', matrix)
    evidence = {'command_receipts': [row['receipt'] for row in matrix['rows']],
                'limitations': matrix['unexecuted'] + [
                    'Existing Chrome ELF and WPScan implementation fingerprint gaps remain open.',
                    'Declared-root sampled storage, not a system-wide filesystem write audit.'],
                'runs': [{'run_root': str(HERE / f'run-{i:03d}'),
                          'storage': str(HERE / f'storage-{i:03d}.json'),
                          'acceptance': str(HERE / f'acceptance-{i:03d}.json'),
                          'writable_roots': [str(HERE / f'run-{i:03d}'), f'/tmp/cp-c12-w{i}', f'/tmp/cp-c12-s{i}']}
                         for i in range(1, 4)]}
    save('evidence.json', evidence)
    record('command-v3-all.json', 'supplemental-release', 'Full protected v3 checks on fresh Python 3.12 evidence',
           [PYTHON, '-B', str(ROOT / 'scanning-acceptance-v3/acceptance.py'), '--project', str(PROJECT),
            '--evidence', str(HERE / 'evidence.json'), '--output', str(HERE / 'acceptance-v3-all.json')])
    assert read(HERE / 'acceptance-v3-all.json')['counts'] == {'pass': 15, 'fail': 0, 'unmeasured': 0}
    print('All Python 3.12 compatibility validation complete', flush=True)


if __name__ == '__main__':
    main()
