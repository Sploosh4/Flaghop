import {useEffect, useState} from 'react';
import * as api from './api';

const tokens = (text: string) => text.split(/[\s,]+/).filter(Boolean);
const message = (error: unknown) => error instanceof Error ? error.message : String(error);
type Draft = {name: string; source: string; targets: string; exclusions: string; ports: string;
  mode: 'local' | 'openvpn' | 'wireguard'; iface: string; profile: string; services: string};
function draft(context: api.NetworkContext): Draft {
  const prefs = context.settings;
  return {name: prefs.name || '', source: prefs.scope_source || '', targets: (prefs.allowed_targets || []).join('\n'),
    exclusions: (prefs.exclusions || []).join('\n'), ports: (prefs.allowed_ports || []).join(', '),
    mode: prefs.mode || 'local', iface: prefs.interface || '', profile: prefs.profile_id || '',
    services: (prefs.required_services || []).map(service => `${service.target}:${service.port}`).join('\n')};
}

export function NetworkSettings({projectId}: {projectId: string}) {
  const [context, setContext] = useState<api.NetworkContext | null>(null);
  const [form, setForm] = useState<Draft | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [status, setStatus] = useState('');
  const [target, setTarget] = useState(''), [port, setPort] = useState('');
  useEffect(() => {
    let active = true;
    api.projectNetwork(projectId).then(value => {if (active) {setContext(value); setForm(draft(value));}})
      .catch(err => {if (active) setError(message(err));});
    return () => {active = false;};
  }, [projectId]);
  function field(key: keyof Draft, value: string) {setForm(current => current ? {...current, [key]: value} : current);}
  async function save() {
    if (!context || !form) return;
    setBusy(true); setError(''); setStatus('');
    try {
      const services = tokens(form.services).map(value => {
        const colon = value.lastIndexOf(':');
        if (colon <= 0) throw new Error('Required services use hostname:port or IP:port.');
        return {target: value.slice(0, colon), port: Number(value.slice(colon + 1))};
      });
      const saved = await api.saveProjectNetwork(projectId, context.revision, {name: form.name, scope_source: form.source,
        allowed_targets: tokens(form.targets), exclusions: tokens(form.exclusions), allowed_ports: tokens(form.ports).map(Number),
        mode: form.mode, interface: form.iface, profile_id: form.profile, execution_environment: 'local', required_services: services});
      setContext(saved); setForm(draft(saved)); setStatus('Network settings saved. Automatic jobs recheck this configuration before running.');
    } catch (err) {setError(message(err));} finally {setBusy(false);}
  }
  async function reload() {
    setBusy(true); setError('');
    try {const value = await api.projectNetwork(projectId); setContext(value); setForm(draft(value)); setStatus('Settings reloaded.');}
    catch (err) {setError(message(err));} finally {setBusy(false);}
  }
  async function check() {
    setBusy(true); setError(''); setStatus('Checking saved scope and route…');
    try {
      const report = await api.checkProjectNetwork(projectId, target, port ? Number(port) : undefined);
      setContext(current => current ? {...current, recent_checks: [...(current.recent_checks || []), report].slice(-20)} : current);
      setStatus(report.reason);
    } catch (err) {setError(message(err)); setStatus('');} finally {setBusy(false);}
  }
  return <details className="hub-network-settings" open>
    <summary>Network settings</summary>
    <p className="hub-muted">All automatic network tools use this project's saved scope and connection. Offline file work can continue without it.</p>
    {context && form && <>
      <p className="hub-muted">{context.configured ? 'Settings complete' : 'Settings incomplete'} · Revision {context.revision} · Execution: this computer</p>
      <form onSubmit={event => {event.preventDefault(); void save();}}>
        <fieldset disabled={busy}>
          <label>Network name<input value={form.name} maxLength={120} onChange={event => field('name', event.target.value)}/></label>
          <label>Scope source<input value={form.source} maxLength={1000} placeholder="Organiser's instructions or your explicit lab scope" onChange={event => field('source', event.target.value)}/></label>
          <label>Allowed targets<textarea value={form.targets} placeholder="IPs, CIDRs or exact hostnames; one per line" onChange={event => field('targets', event.target.value)}/></label>
          <label>Exclusions<textarea value={form.exclusions} onChange={event => field('exclusions', event.target.value)}/></label>
          <label>Allowed ports<input value={form.ports} placeholder="Optional comma-separated ports; blank allows any port in scope" onChange={event => field('ports', event.target.value)}/></label>
          <label>Connection mode<select value={form.mode} onChange={event => field('mode', event.target.value)}><option value="local">Local / direct network</option><option value="openvpn">OpenVPN</option><option value="wireguard">WireGuard</option></select></label>
          <label>Expected interface<input value={form.iface} maxLength={15} placeholder="For example tun0, wg0 or enp1s0" onChange={event => field('iface', event.target.value)}/></label>
          <label>Profile identity<input value={form.profile} placeholder="NetworkManager UUID, WireGuard peer public key or OpenVPN config path" onChange={event => field('profile', event.target.value)}/></label>
          <p className="hub-muted">For a direct OpenVPN client, use an explicit tunnel device in its configuration. Local mode can leave profile identity blank.</p>
          <p className="hub-muted">WireGuard requires a nonzero transport fwmark for enforced execution. The app reads this setting and keeps your tunnel configuration unchanged.</p>
          <p className="hub-muted">Guarded OpenVPN currently requires a userspace tunnel (disable-dco). DCO and raw-socket tools need a separate adapter and are held.</p>
          <label>Required TCP services<textarea value={form.services} placeholder="Optional hostname:port or IP:port, one per line" onChange={event => field('services', event.target.value)}/></label>
          <div className="hub-network-actions"><button type="submit">Save network settings</button><button type="button" onClick={() => {void reload();}}>Reload saved settings</button></div>
        </fieldset>
      </form>
      <p className="hub-muted">{context.enforcement_reason} Commands run without elevated capabilities; tools that require raw sockets or passive capture are held or fail explicitly.</p>
      <form className="hub-network-check" onSubmit={event => {event.preventDefault(); void check();}}>
        <label>Check target<input value={target} onChange={event => setTarget(event.target.value)} required maxLength={253}/></label>
        <label>TCP port<input value={port} type="number" min={1} max={65535} onChange={event => setPort(event.target.value)}/></label>
        <button disabled={busy || !target}>Check saved network</button>
      </form>
      <p className="hub-muted">Checks use saved settings. Results describe the check time; jobs recheck before running.</p>
      {!!context.recent_checks?.length && <details><summary>Recent network checks</summary>
        {[...context.recent_checks].reverse().map((report, index) => <div className="hub-network-report" key={`${report.checked_at}-${index}`}>
          <strong>{report.status}{report.revision !== context.revision ? ' · previous configuration' : ''}</strong>
          <span>{report.target} · {new Date(report.checked_at).toLocaleString()}</span><p>{report.reason}</p>
          {report.routes?.map((route, row) => <div key={row}>Route: {String(route.destination)} → {String(route.interface)} · source {String(route.source)} · gateway {String(route.gateway || 'direct')}</div>)}
          {report.services?.map((service, row) => <div key={row}>TCP {String(service.address)}:{String(service.port)} · {String(service.outcome)}</div>)}
        </div>)}
      </details>}
    </>}
    {status && <p role="status" className="hub-muted">{status}</p>}
    {error && <p role="alert" className="hub-error">{error}</p>}
  </details>;
}
