import type {WorkspaceView, WorkspaceController} from './workspace-controller.js';
import type {ReactNode} from 'react';
import {useState} from 'react';
import {editorUrl} from '../api';
import type {ReaderAlert} from '../api';
import {readPreference, writePreference} from '../preferences';

export function BackgroundControl({view, controller}: {view: WorkspaceView | null; controller: WorkspaceController}) {
  const status = view?.status, action = status?.running ? 'Stop' : 'Start';
  return <div className="hub-background-control">
    <button id="hub-background-toggle" data-action={action.toLowerCase()} aria-label={`${action} background jobs for ${view?.label || 'workspace'}`} aria-pressed={status?.running || false} aria-busy={view?.busy || false}
      title={!status?.worker.available ? 'Reader unavailable' : status.pause_semantics}
      disabled={!status || view?.busy || Boolean(view?.error) || (!status.running && !status.worker.available)}
      onClick={() => {if (view && status) void controller.setRunning(!status.running, view.id);}}>{action}</button>
  </div>;
}

function Group({id, label, count, expanded = false, children}: {id: string; label: string; count: number; expanded?: boolean; children: ReactNode}) {
  const [open, setOpen] = useState(() => readPreference<boolean>(`reader-group:${id}`, expanded));
  return <details id={id} className="hub-reader-group" open={open} onToggle={event => {
    const next = event.currentTarget.open; if (next !== open) {setOpen(next); writePreference(`reader-group:${id}`, next);}
  }}><summary>{label}<span>{count}</span></summary>{children}</details>;
}

function Result({alert, view, controller, history = false}: {alert: ReaderAlert; view: WorkspaceView; controller: WorkspaceController; history?: boolean}) {
  const kind = alert.id.startsWith('hash-') ? 'Hash' : 'Cipher';
  return <article className="hub-result-alert" data-result-id={alert.id}>
    <div className="hub-result-copy"><div className="hub-result-title" title={alert.result_path}>{alert.display_name || alert.result_path.split('/').pop()}</div>
      <small>{history ? alert.history_reason || kind : alert.transformations.map(value => value.replace(/^hypothesis:/, '')).join(', ') || kind} · {alert.size < 1024 ? `${alert.size} B` : `${Math.ceil(alert.size / 1024)} KB`}</small></div>
    <div className="hub-result-actions"><a href={editorUrl(view.id, alert.id)} target="_blank" rel="noopener" title="Open in a separate editor">Open</a>
      {!history && <button disabled={view.dismissing.includes(alert.id)} onClick={() => {void controller.dismiss(alert.id, view.id);}} aria-label={`Dismiss ${alert.display_name || alert.result_path.split('/').pop()}`}>×</button>}</div>
  </article>;
}

export function BackgroundPanel({view, controller, header}: {view: WorkspaceView | null; controller: WorkspaceController; header?: ReactNode}) {
  const alerts = view?.status?.alerts || [], history = view?.status?.history || [];
  return <aside className="hub-background-panel" aria-label="Workspace working and results">
    {header}
    {view?.error && <p className="hub-error" role="alert">{view.error}</p>}
    <div className="hub-result-alerts" aria-label="Result alerts">
      <Group key={`${view?.id}-kill-chain`} id="hub-cyber-kill-chain" label="Cyber Kill Chain" count={0}>{null}</Group>
      {(['Hash', 'Cipher'] as const).map(kind => {
        const rows = alerts.filter(alert => (alert.id.startsWith('hash-') ? 'Hash' : 'Cipher') === kind);
        return <Group key={`${view?.id}-${kind}`} id={`hub-reader-${kind.toLowerCase()}`} label={kind} count={rows.length} expanded>
          {view && rows.map(alert => <Result key={alert.id} alert={alert} view={view} controller={controller}/>)}
        </Group>;
      })}
    </div>
    <Group key={`${view?.id}-working`} id="hub-background-working" label="Working" count={view?.status?.working.length || 0} expanded>
      {view?.status?.working.map(job => <div className="hub-background-job" key={`${job.tool}-${job.id}`}><span>{job.tool === 'cipher' ? 'Cipher' : 'Hash'}</span><small>{job.state}</small></div>)}
    </Group>
    <Group key={`${view?.id}-history`} id="hub-background-history" label="History" count={history.length}>
      {view && history.map(alert => <Result key={alert.id} alert={alert} view={view} controller={controller} history/>)}
    </Group>
  </aside>;
}
