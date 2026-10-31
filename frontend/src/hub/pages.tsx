import {useEffect, useState} from 'react';
import * as api from './api';
import type {HubFile, HubProject, HubSettings} from './api';
import {Icon} from './Icon';
import {settingParts} from './parts';
const message = (error: unknown) => error instanceof Error ? error.message : String(error);

export function ProjectOverview({project, onChange}: {project: HubProject; onChange(project: HubProject): void}) {
  const [files, setFiles] = useState<HubFile[]>([]), [error, setError] = useState(''), [truncated, setTruncated] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    void api.files(project.id).then(data => {if (active) {setFiles(data.files); setTruncated(data.truncated);}}).catch(error => {if (active) setError(message(error));});
    return () => {active = false;};
  }, [project.id]);
  async function vpn(selection: 'inherit' | 'none') {
    setSaving(true); setError('');
    try {await api.setProjectVpn(project.id, selection); onChange({...project, vpn: selection});}
    catch (error) {setError(message(error));} finally {setSaving(false);}
  }
  return <section className="hub-overview" aria-label="Project overview">
    <h1>{project.name}</h1><p className="hub-folder">{project.folder}</p>
    <div className="hub-property"><label htmlFor="hub-project-vpn">VPN</label><select id="hub-project-vpn" value={project.vpn} disabled={saving} onChange={event => {void vpn(event.target.value as 'inherit' | 'none');}}><option value="inherit">Use default</option><option value="none">None</option></select><span className="hub-muted">Not configured</span></div>
    {error && <p className="hub-error" role="alert">{error}</p>}
    <div className="hub-files-header"><h2>Files</h2><button className="hub-quiet" aria-label="Refresh files" onClick={() => {void api.files(project.id).then(data => {setFiles(data.files); setTruncated(data.truncated); setError('');}).catch(error => setError(message(error)));}}>↻</button></div>
    <div className="hub-files">{files.map(file => <a key={file.path} href={api.fileUrl(project.id, file.path)} download><Icon kind="file"/><span>{file.path}</span><small>{file.size < 1024 ? `${file.size} B` : `${Math.ceil(file.size / 1024)} KB`}</small></a>)}{!files.length && <span className="hub-muted">—</span>}</div>
    {truncated && <p className="hub-muted">First 500 files</p>}
  </section>;
}

export function Setup({settings, openPart}: {settings: HubSettings | null; openPart(part: string): void}) {
  return <section className="hub-setup-page" aria-label="Computer setup">
    <div className="hub-computer"><Icon kind="computer"/><div><h1>{settings?.computer.name || 'This computer'}</h1><span className="hub-muted">{settings?.computer.system || '—'}</span></div></div>
    <div className="hub-property"><span>VPN</span><span className="hub-vpn-unconfigured">Not configured</span></div>
    <div className="hub-property"><label htmlFor="hub-default-vpn">Default VPN</label><select id="hub-default-vpn" disabled value="none"><option value="none">No default</option></select><button className="hub-quiet" disabled aria-label="Refresh VPNs — not available yet">↻</button></div>
    <div className="hub-settings-links">{Object.entries(settingParts).map(([part, label]) => <button key={part} onClick={() => openPart(part)}>{label}</button>)}</div>
  </section>;
}
