import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {ActivityController} from './controller';
import {approvals, decisions, panels, pendingActions, processes, rationale, scans} from './state';
import {ProcessesTable, ProcessToolbar} from './ProcessesTable';
import {ApprovalsTable} from './ApprovalsTable';
import {DecisionsTable, RationaleFeed, ScansTable} from './HistoryTables';
import {ProcessOutputPanel, ProviderLogsPanel} from './OutputPanels';
import {projectStore} from '../store';
import {PanelCount} from './PanelCount';

let controller: ActivityController;
const status = vi.fn(), refreshSnapshot = vi.fn(async () => {}), setOutputOpen = vi.fn();
const response = (data: unknown, code = 200) => new Response(JSON.stringify(data), {status: code, headers: {'Content-Type': 'application/json'}});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {resolve = done;});
  return {promise, resolve};
}
function table(component: React.ReactNode) {
  const node = document.createElement('table'), body = document.createElement('tbody');
  node.append(body); document.body.append(node); return render(component, {container: body});
}
beforeEach(() => {
  projectStore.set({name: 'fixture.legion'});
  Object.values(panels).forEach(panel => panel.reset()); pendingActions.set(new Set());
  status.mockClear(); refreshSnapshot.mockClear(); setOutputOpen.mockClear();
  controller = new ActivityController({status, refreshSnapshot, setOutputOpen, applyOverview: vi.fn()});
});
afterEach(() => {cleanup(); controller.dispose(); document.body.replaceChildren(); vi.unstubAllGlobals();});

it('renders process progress and performs one action while row buttons are pending', async () => {
  processes.update([{id: 8, name: 'Fixture process', hostIp: '198.51.100.25', port: '443', protocol: 'tcp', status: 'Running', percent: '25', estimatedRemaining: 65}]);
  const pending = deferred<Response>();
  const fetch = vi.fn((request: Request) => request.method === 'POST' ? pending.promise : Promise.resolve(response({processes: [{id: 8, name: 'Fixture process', status: 'Killed'}]})));
  vi.stubGlobal('fetch', fetch); table(<ProcessesTable controller={controller}/>);
  expect(screen.getByText('198.51.100.25:443/tcp')).toBeTruthy();
  expect(screen.getByText('25.0%')).toBeTruthy(); expect(screen.getByText('1m 05s')).toBeTruthy();
  const button = screen.getByRole('button', {name: 'Kill'});
  fireEvent.click(button); fireEvent.click(button);
  expect((screen.getByRole('button', {name: 'Retry'}) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => {pending.resolve(response({status: 'ok', process_id: 8, killed: true}));});
  await waitFor(() => expect(screen.getByText('Killed')).toBeTruthy());
  expect(fetch.mock.calls.filter(([request]) => request.method === 'POST')).toHaveLength(1);
  expect(new URL(fetch.mock.calls[0][0].url).pathname).toBe('/api/processes/8/kill');
});

it('retains process rows and offers retry after a failed action', async () => {
  processes.update([{id: 8, name: 'Fixture', status: 'Finished'}]);
  vi.stubGlobal('fetch', vi.fn(async () => response({error: 'Retry unavailable'}, 409)));
  table(<ProcessesTable controller={controller}/>);
  await userEvent.setup().click(screen.getByRole('button', {name: 'Retry'}));
  expect(screen.getByRole('alert').textContent).toContain('Retry unavailable');
  expect(screen.getByText('Fixture')).toBeTruthy(); expect(pendingActions.getSnapshot().size).toBe(0);
});

it('passes the distinct clear modes without changing running-process semantics', async () => {
  const modes: unknown[] = [];
  vi.stubGlobal('fetch', vi.fn(async (request: Request) => {
    if (request.method === 'POST') {modes.push(await request.json()); return response({status: 'ok', cleared: true, reset_all: modes.length > 1});}
    return response({processes: []});
  }));
  render(<ProcessToolbar controller={controller}/>); const user = userEvent.setup();
  await user.click(screen.getByRole('button', {name: 'Hide Finished/Issues'}));
  await user.click(screen.getByRole('button', {name: 'Hide All Non-Running'}));
  expect(modes).toEqual([{reset_all: false}, {reset_all: true}]);
});

it('keeps approval details and submits allow-family once with explicit run semantics', async () => {
  approvals.update([{id: 77, label: 'Fixture action', status: 'pending', risk_summary: 'Fixture risk', safer_alternative: 'Read evidence', rationale: 'Fixture rationale'}]);
  const pending = deferred<Response>(); let body: unknown;
  const fetch = vi.fn(async (request: Request) => {
    if (request.method === 'POST') {body = await request.json(); return pending.promise;}
    return response({approvals: []});
  });
  vi.stubGlobal('fetch', fetch); table(<ApprovalsTable controller={controller}/>);
  expect(screen.getByText('why risky: Fixture risk')).toBeTruthy(); expect(screen.getByText('safer alternative: Read evidence')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {name: 'Allow Family'}));
  fireEvent.click(screen.getByRole('button', {name: 'Approve+Run'}));
  await act(async () => {pending.resolve(response({status: 'ok', approval: {id: 77, status: 'approved'}, job: null}));});
  await waitFor(() => expect(screen.getByText('No entries yet.')).toBeTruthy());
  expect(body).toEqual({approve_family: true, run_now: true, family_action: 'allowed'});
  expect(fetch.mock.calls.filter(([request]) => request.method === 'POST')).toHaveLength(1);
});

it('suppresses a family through rejection and displays failures without dropping the approval', async () => {
  approvals.update([{id: 77, label: 'Fixture action', status: 'pending'}]); let body: unknown, path = '';
  vi.stubGlobal('fetch', vi.fn(async (request: Request) => {
    body = await request.json(); path = new URL(request.url).pathname;
    return response({error: 'Fixture rejection failed'}, 409);
  }));
  table(<ApprovalsTable controller={controller}/>);
  await userEvent.setup().click(screen.getByRole('button', {name: 'Suppress Family'}));
  expect(path).toBe('/api/scheduler/approvals/77/reject');
  expect(body).toEqual({reason: 'rejected in web workspace', family_action: 'suppressed'});
  expect(screen.getByRole('alert').textContent).toContain('Fixture rejection failed');
  expect(screen.getByText('tool: Fixture action')).toBeTruthy();
});

it('renders history and rationale as text, including false decisions', () => {
  decisions.update([{id: 1, host_ip: '198.51.100.25', port: '443', protocol: 'tcp', approved: false, executed: 'False', reason: '<img src=x onerror=alert(1)>'}]);
  scans.update([{id: 2, submission_kind: 'fixture-import', status: 'completed', result_summary: 'Fixture imported'}]);
  rationale.update([{headline: 'Fixture reasoning', tags: ['Observed'], details: ['Evidence checked'], summary: 'No action requested'}]);
  table(<DecisionsTable/>); table(<ScansTable/>); render(<RationaleFeed/>);
  expect(screen.getByText('false')).toBeTruthy(); expect(screen.getByText('Fixture imported')).toBeTruthy();
  expect(screen.getByText('Evidence checked')).toBeTruthy(); expect(document.querySelector('img')).toBeNull();
});

it('renders zero and updates the shared counters after the last row disappears', () => {
  const count = document.createElement('span'); count.id = 'approval-count'; document.body.append(count);
  render(<PanelCount name="approvals"/>); expect(count.textContent).toBe('0');
  act(() => approvals.update([{id: 77}])); expect(count.textContent).toBe('1');
  act(() => approvals.update([])); expect(count.textContent).toBe('0');
});

it('ignores output arriving after the viewer closes', async () => {
  const pending = deferred<Response>(); vi.stubGlobal('fetch', vi.fn(() => pending.promise));
  const opening = controller.output.open(1); controller.output.close();
  pending.resolve(response({id: 1, output_chunk: 'Closed output', output_length: 13, next_offset: 13, completed: true}));
  await opening;
  expect(controller.output.store.getSnapshot().text).toBe(''); expect(controller.output.store.getSnapshot().id).toBe(0);
});

it('shows output failures and allows a manual refresh', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(response({error: 'Output unavailable'}, 500)).mockResolvedValueOnce(response({
    id: 1, command: 'fixture', output_chunk: 'Recovered output', output_length: 16, offset: 0, next_offset: 16, completed: true,
  }));
  vi.stubGlobal('fetch', fetch); await controller.output.open(1);
  render(<ProcessOutputPanel controller={controller}/>);
  expect(screen.getByRole('alert').textContent).toContain('Output unavailable');
  await userEvent.setup().click(screen.getByRole('button', {name: 'Refresh'}));
  expect(screen.queryByRole('alert')).toBeNull(); expect(screen.getByText('Recovered output')).toBeTruthy();
});

it('prevents stale list or log responses from repopulating a switched workspace', async () => {
  const list = deferred<Response>(), logs = deferred<Response>();
  vi.stubGlobal('fetch', vi.fn((request: Request) => request.url.includes('provider/logs') ? logs.promise : list.promise));
  const load = controller.actions.loadProcesses(), log = controller.actions.loadProviderLogs();
  projectStore.set({name: 'other.legion'});
  list.resolve(response({processes: [{id: 1, name: 'Old workspace'}]})); logs.resolve(response({logs: [], text: 'Old secret'}));
  await Promise.all([load, log]);
  expect(processes.getSnapshot().items).toEqual([]); expect(controller.logs.getSnapshot().text).toBe('');
});

it('does not let an older list request overwrite a live snapshot', async () => {
  const pending = deferred<Response>(); vi.stubGlobal('fetch', vi.fn(() => pending.promise));
  const load = controller.actions.loadProcesses();
  processes.update([{id: 1, name: 'Live snapshot'}]);
  pending.resolve(response({processes: [{id: 1, name: 'Older request'}]})); await load;
  expect(processes.getSnapshot().items[0].name).toBe('Live snapshot');
});

it('shows provider metadata, preserves safe ANSI text, and supports copy and download', async () => {
  const raw = '\u001b[31m<img src=x onerror=alert(1)>\u001b[0m';
  vi.stubGlobal('fetch', vi.fn(async () => response({logs: [{prompt_metadata: {structured_output_used: true, structured_output_fallback: true}}], text: raw})));
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fixture'); const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const user = userEvent.setup(); const copy = vi.spyOn(navigator.clipboard, 'writeText');
  render(<ProviderLogsPanel controller={controller} close={vi.fn()}/>);
  await user.click(screen.getByRole('button', {name: 'Refresh'}));
  expect(document.getElementById('provider-logs-meta')?.textContent).toContain('Entries 1 | structured 1 | fallback 1');
  expect(document.querySelector('#provider-logs-text .ansi-fg-red')).toBeTruthy(); expect(document.querySelector('img')).toBeNull();
  await user.click(screen.getByRole('button', {name: 'Copy to Clipboard'})); expect(copy).toHaveBeenCalledWith(raw);
  await user.click(screen.getByRole('button', {name: 'Download .txt'})); expect(download).toHaveBeenCalledOnce(); expect(revoke).toHaveBeenCalledWith('blob:fixture');
});

it('shows log errors while retaining the last successful output', async () => {
  controller.logs.set({text: 'Last successful logs', logs: [], error: '', loading: false});
  vi.stubGlobal('fetch', vi.fn(async () => response({error: 'Provider offline'}, 500)));
  render(<ProviderLogsPanel controller={controller} close={vi.fn()}/>);
  await userEvent.setup().click(screen.getByRole('button', {name: 'Refresh'}));
  expect(screen.getByRole('alert').textContent).toContain('Provider offline'); expect(screen.getByText('Last successful logs')).toBeTruthy();
});

it('drains a completed process in chunks and ignores closed or superseded output requests', async () => {
  const late = deferred<Response>();
  vi.stubGlobal('fetch', vi.fn(async (request: Request) => {
    const url = new URL(request.url);
    if (url.pathname.includes('/1/')) return late.promise;
    const offset = Number(url.searchParams.get('offset'));
    return response({id: 2, status: 'Finished', command: 'fixture command', output_chunk: offset ? 'second' : 'first',
      output_length: 11, offset, next_offset: offset ? 11 : 5, completed: true, progress: {summary: 'Fixture complete'}});
  }));
  const old = controller.output.open(1);
  await controller.output.open(2); expect(controller.output.store.getSnapshot().complete).toBe(false);
  await controller.output.refresh(); expect(controller.output.store.getSnapshot().text).toBe('firstsecond');
  expect(controller.output.store.getSnapshot().complete).toBe(true);
  late.resolve(response({id: 1, output_chunk: 'late', output_length: 4, next_offset: 4, completed: true})); await old;
  expect(controller.output.store.getSnapshot().id).toBe(2);
  render(<ProcessOutputPanel controller={controller}/>); expect(screen.getByText('Fixture complete')).toBeTruthy();
  await userEvent.setup().click(screen.getByRole('button', {name: 'Close dialog'}));
  expect(controller.output.store.getSnapshot().id).toBe(0); expect(setOutputOpen).toHaveBeenLastCalledWith(false);
});
