import type {DeepScanRun, HubProject} from '../api';
import {documentUrl} from '../api';
import type {HardwareNode} from '../hardware/model';
import type {DeepScanController} from './useDeepScans';

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.map(record) : [];
const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';

export function ScanAction({node, scans}: {node: HardwareNode; scans: DeepScanController}) {
  const active = scans.runs.find(run => run.host_id === node.hostId && ['queued', 'running'].includes(run.status));
  return <div className="hub-deep-scan-action"><span>{node.label || node.hostname || node.ip}</span><button disabled={Boolean(scans.busy) || Boolean(active)} onClick={() => {void scans.start(node);}} aria-label={`Deep scan ${node.ip}`}>{active?.status === 'running' ? 'Running' : active ? 'Queued' : scans.busy === node.hostId ? '…' : 'Run'}</button></div>;
}

export function ScanCard({run, project, scans}: {run: DeepScanRun; project: HubProject; scans: DeepScanController}) {
  const active = ['queued', 'running'].includes(run.status), summary = record(run.summary), classification = record(summary.classification);
  const roles = [record(classification.primary), ...rows(classification.alternatives)].filter(role => role.device_type);
  const root = `${project.folder}/${String(run.directory)}`, profile = run.profile_path;
  return <article className={`hub-scan-card${active ? ' hub-scan-active' : ''}`} data-scan-id={run.id}>
    <div className="hub-scan-heading"><span>{run.target_ip}</span><small>{run.status}</small>
      {active ? <button onClick={() => {void scans.cancel(run);}}>Stop</button> : Boolean(profile || run.log_path) && <a href={documentUrl(project.id, `${project.folder}/${profile || String(run.log_path)}`)} target="_blank" rel="noopener">Open</a>}
    </div>
    {run.reason && <p className="hub-error">{run.reason}</p>}
    {!active && <details><summary>Results</summary>
      {roles.length > 0 && <div className="hub-scan-observations"><span>Role hypotheses</span>{roles.map((role, i) => <small key={i} title={text(role.explanation)}>{text(role.device_type)} · {text(role.score)} · {text(role.confidence)}</small>)}</div>}
      {rows(summary.services).map((service, i) => <small className="hub-scan-observation" key={i}>{text(service.port)}/{text(service.protocol)} · {text(service.state)} · {text(record(service.fingerprint).product) || text(record(service.fingerprint).name)}</small>)}
      {(['candidates', 'reproduced'] as const).map(kind => rows(summary[kind]).map((finding, i) => <small className="hub-scan-observation" key={`${kind}-${i}`}>{kind === 'candidates' ? 'Candidate' : 'Reproduced'} · {text(finding.title) || text(finding.type) || text(finding.template_id) || text(finding.explanation)}</small>))}
      {rows(summary.problems).map((task, i) => <small className="hub-error hub-scan-observation" key={i}>{text(task.tool)} · {text(task.status)} · {text(task.reason) || text(task.parse_error)}</small>)}
      {rows(summary.artifacts).map((artifact, i) => <a className="hub-scan-evidence" key={i} href={documentUrl(project.id, `${root}/profile/${text(artifact.path)}`)} target="_blank" rel="noopener">{text(artifact.path).replace(/^raw\//, '')}</a>)}
    </details>}
  </article>;
}
