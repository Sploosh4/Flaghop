const {test} = require('node:test');
const assert = require('node:assert/strict');
const {WorkspaceController, normalizeStatus} = require('../web/workspace-controller.js');
const {ReaderAdapter} = require('../web/reader-adapter.js');

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => {resolve = a; reject = b;}); return {promise, resolve, reject}; };
const alert = (id = 'result', completed = 1) => ({id, completed, result_path: 'ciphey/artifacts/' + id + '.bin', origins: [{path: '/files/original.txt'}]});
function memory(running = false) {
  return {state: {running, observed_state: running ? 'running' : 'paused', alerts: [], node_states: {queued: 2}}, writes: [],
    async read() { return structuredClone(this.state); },
    async setRunning(value) { this.writes.push(value); this.state.running = value; this.state.observed_state = value ? 'running' : 'paused'; return {running: value}; },
    async dismiss(id) { this.state.alerts = this.state.alerts.filter(a => a.id !== id); },
    async result(a) { return {data_b64: Buffer.from(a.id).toString('base64'), truncated: false}; }};
}
function register(controller, id, adapter) { controller.register({id, label: 'Workspace ' + id, adapter}); }

test('selecting and revisiting a paused workspace never starts it', async () => {
  const c = new WorkspaceController(), a = memory(), b = memory(true);
  register(c, 'a', a); register(c, 'b', b);
  await c.select('a'); await c.select('b'); await c.select('a');
  assert.equal(c.view().status.running, false); assert.deepEqual(a.writes, []); assert.deepEqual(b.writes, []);
});
test('pause A retains its queue while B continues independently; resume A', async () => {
  const c = new WorkspaceController(), a = memory(true), b = memory(true);
  register(c, 'a', a); register(c, 'b', b);
  await c.select('a'); await c.setRunning(false); await c.select('b');
  assert.equal(c.view().status.running, true); assert.equal(c.view('a').status.running, false);
  assert.deepEqual(c.view('a').status.node_states, {queued: 2}); assert.deepEqual(b.writes, []);
  await c.select('a'); await c.setRunning(true); assert.deepEqual(a.writes, [false, true]);
});
test('registered IDs are required and unique; unsupported workers cannot masquerade as integrated', () => {
  const c = new WorkspaceController(); register(c, 'a', memory());
  assert.throws(() => register(c, 'a', memory()), /unique/);
  assert.throws(() => c.register({id: 'bad', adapter: {read() {}}}), /missing/);
});
test('a late status for A cannot repaint selected B', async () => {
  const c = new WorkspaceController(), a = memory(), b = memory(true), late = deferred();
  register(c, 'a', a); register(c, 'b', b); a.read = () => late.promise;
  const pending = c.select('a'); await c.select('b'); const paints = [];
  c.subscribe(v => paints.push(v.id)); late.resolve({running: false, alerts: []}); await pending;
  assert.equal(c.view().id, 'b'); assert.deepEqual(paints, ['b']);
});
test('a pre-Pause response cannot undo the acknowledged paused state', async () => {
  const c = new WorkspaceController(), a = memory(true), old = deferred(); register(c, 'a', a); await c.select('a');
  const regularRead = a.read; a.read = () => old.promise; const stale = c.refresh(); a.read = regularRead;
  await c.setRunning(false); old.resolve({running: true, alerts: []}); await stale;
  assert.equal(c.view().status.running, false);
});
test('older polling responses cannot overwrite a newer status', async () => {
  const c = new WorkspaceController(), a = memory(), first = deferred(); register(c, 'a', a); await c.select('a');
  a.read = () => first.promise; const pending = c.refresh(); a.read = async () => ({running: true, alerts: []});
  await c.refresh(); first.resolve({running: false, alerts: []}); await pending; assert.equal(c.view().status.running, true);
});
test('double clicks do not issue overlapping control writes', async () => {
  const c = new WorkspaceController(), a = memory(true), gate = deferred(); register(c, 'a', a); await c.select('a');
  a.setRunning = async value => { a.writes.push(value); await gate.promise; a.state.running = value; return {running: value}; };
  const first = c.setRunning(false); assert.equal(await c.setRunning(false), false);
  gate.resolve(); await first; assert.deepEqual(a.writes, [false]);
});
test('control completion for A after selecting B only changes A', async () => {
  const c = new WorkspaceController(), a = memory(true), b = memory(true), gate = deferred();
  register(c, 'a', a); register(c, 'b', b); await c.select('a');
  a.setRunning = async value => { await gate.promise; a.state.running = value; return {running: value}; };
  const pending = c.setRunning(false); await c.select('b'); gate.resolve(); await pending;
  assert.equal(c.view().id, 'b'); assert.equal(c.view().status.running, true); assert.equal(c.view('a').status.running, false);
});
test('lost acknowledgement is reconciled, not retried or reported as confirmed', async () => {
  const c = new WorkspaceController(), a = memory(true); register(c, 'a', a); await c.select('a');
  a.setRunning = async value => { a.writes.push(value); a.state.running = value; throw Error('Connection lost'); };
  assert.equal(await c.setRunning(false), false); assert.deepEqual(a.writes, [false]);
  assert.equal(c.view().status.running, false); assert.match(c.view().error, /Connection lost/);
});
test('requested Pause and observed worker completion remain separate', async () => {
  const c = new WorkspaceController(), a = memory(true); register(c, 'a', a); await c.select('a');
  a.read = async () => ({running: false, observed_state: 'pausing', node_states: {running: 1}, alerts: []});
  await c.refresh(); assert.equal(c.view().status.observed_state, 'pausing');
  a.read = async () => ({running: false, alerts: []}); await c.refresh(); assert.equal(c.view().status.observed_state, null);
});
test('invalid status is visible as an error, not a fabricated paused workspace', async () => {
  const c = new WorkspaceController(), a = memory(); register(c, 'a', a); a.read = async () => ({});
  await c.select('a'); assert.equal(c.view().status, null); assert.match(c.view().error, /unavailable/);
});
test('alerts are newest first and deduplicated without mutating transport data', () => {
  const raw = {running: false, alerts: [alert('old', 1), alert('new', 2), alert('old', 1)]};
  const status = normalizeStatus(raw); assert.deepEqual(status.alerts.map(a => a.id), ['new', 'old']); assert.equal(raw.alerts.length, 3);
});
test('dismissal calls only the notification API and survives rereading backend state', async () => {
  const c = new WorkspaceController(), a = memory(); a.state.alerts = [alert()];
  const file = Buffer.from('real result content'); a.result = async () => ({bytes: file});
  register(c, 'a', a); await c.select('a'); await c.dismiss('result'); await c.refresh();
  assert.equal(c.view().status.alerts.length, 0); assert.equal(file.toString(), 'real result content');
  const reopened = new WorkspaceController(); register(reopened, 'a', a); await reopened.select('a'); assert.equal(reopened.view().status.alerts.length, 0);
});
test('failed dismissal keeps the result alert available', async () => {
  const c = new WorkspaceController(), a = memory(); a.state.alerts = [alert()]; a.dismiss = async () => {throw Error('Not saved');};
  register(c, 'a', a); await c.select('a'); assert.equal(await c.dismiss('result'), false);
  assert.equal(c.view().status.alerts.length, 1); assert.match(c.view().error, /Not saved/);
});
test('a result arriving after a workspace switch does not open in the new workspace', async () => {
  const opens = [], c = new WorkspaceController({openResult: data => opens.push(data)}), a = memory(), b = memory(), gate = deferred();
  a.state.alerts = [alert()]; a.result = () => gate.promise; register(c, 'a', a); register(c, 'b', b); await c.select('a');
  const pending = c.open('result'); await c.select('b'); gate.resolve({data_b64: 'YQ=='});
  assert.equal(await pending, false); assert.equal(opens.length, 0);
});
test('switching A to B to A still invalidates an old open-result request', async () => {
  const opens = [], c = new WorkspaceController({openResult: data => opens.push(data)}), a = memory(), b = memory(), gate = deferred();
  a.state.alerts = [alert()]; a.result = () => gate.promise; register(c, 'a', a); register(c, 'b', b); await c.select('a');
  const pending = c.open('result'); await c.select('b'); await c.select('a'); gate.resolve({data_b64: 'YQ=='});
  assert.equal(await pending, false); assert.equal(opens.length, 0);
});
test('opening carries the correct workspace, saved file and provenance to the editor', async () => {
  const opens = [], c = new WorkspaceController({openResult: data => opens.push(data)}), a = memory(); a.state.alerts = [alert()];
  register(c, 'a', a); await c.select('a'); assert.equal(await c.open('result'), true);
  assert.equal(opens[0].workspaceId, 'a'); assert.equal(opens[0].alert.result_path, 'ciphey/artifacts/result.bin');
  assert.equal(opens[0].alert.origins[0].path, '/files/original.txt'); assert.deepEqual(a.writes, []);
});
test('adapter preserves result query and source, and keeps control token out of URL', async () => {
  const calls = [];
  const adapter = new ReaderAdapter({baseURL: 'http://127.0.0.1:1234', source: 'original-demo', fetch: async (url, options) => {
    calls.push({url: String(url), options});
    return {ok: true, json: async () => String(url).includes('/api/session') ? {token: 'unit-test-token'} : {running: false}};
  }});
  await adapter.result(alert('with spaces')); await adapter.setRunning(false);
  assert.equal(new URL(calls[0].url).searchParams.get('path'), 'ciphey/artifacts/with spaces.bin');
  assert.equal(new URL(calls[0].url).searchParams.get('source'), 'original-demo');
  const post = calls.find(c => c.options.method === 'POST'); assert.equal(post.options.headers['X-Reader-Token'], 'unit-test-token');
  assert.equal(post.url.includes('token'), false); assert.deepEqual(JSON.parse(post.options.body), {running: false});
});

test('adapter refreshes a restarted bridge token once without losing the action', async () => {
  let sessions=0; const tokens=[];
  const adapter=new ReaderAdapter({baseURL:'http://127.0.0.1:1234',fetch:async(url,options)=>{
    if(String(url).includes('/api/session'))return {ok:true,json:async()=>({token:'nonce-'+(++sessions)})};
    tokens.push(options.headers['X-Reader-Token']);
    return tokens.length===1 ? {ok:false,status:403,json:async()=>({error:{message:'Origin and reader token required'}})} : {ok:true,json:async()=>({running:false})};
  }});
  assert.deepEqual(await adapter.setRunning(false),{running:false});
  assert.deepEqual(tokens,['nonce-1','nonce-2']);
});

test('adapter does not loop on a repeated nonce rejection', async () => {
  let calls=0;
  const adapter=new ReaderAdapter({baseURL:'http://127.0.0.1:1234',fetch:async(url)=>{
    calls++;
    return String(url).includes('/api/session') ? {ok:true,json:async()=>({token:'nonce'})} : {ok:false,status:403,json:async()=>({error:{message:'Origin and reader token required'}})};
  }});
  await assert.rejects(adapter.setRunning(false),/Origin and reader token/);
  assert.equal(calls,4);
});
