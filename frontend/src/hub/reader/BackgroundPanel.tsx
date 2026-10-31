import type {WorkspaceView, WorkspaceController} from './workspace-controller.js';

export function BackgroundControl({view, controller}: {view: WorkspaceView | null; controller: WorkspaceController}) {
  const status = view?.status;
  const label = !status ? 'Loading' : !status.worker.available ? 'Reader unavailable' : status.running ? 'Enabled' : 'Pause requested';
  return <div className="hub-background-control">
    <span role="status" title={status?.pause_semantics}>{label}</span>
    <button id="hub-background-toggle" aria-label={`${status?.running ? 'Pause' : 'Start'} background jobs for ${view?.label || 'workspace'}`} aria-pressed={status?.running || false}
      disabled={!status || view?.busy || Boolean(view?.error) || (!status.running && !status.worker.available)}
      onClick={() => {if (view && status) void controller.setRunning(!status.running, view.id);}}>{view?.busy ? 'Updating…' : status?.running ? 'Pause' : 'Start'}</button>
  </div>;
}

export function BackgroundPanel({view, controller}: {view: WorkspaceView | null; controller: WorkspaceController}) {
  return <aside className="hub-background-panel" aria-label="Workspace working and results">
    {view?.error && <p className="hub-error" role="alert">{view.error}</p>}
    <div className="hub-result-alerts" aria-label="Result alerts">
      {view?.status?.alerts.map(alert => <article key={alert.id} className="hub-result-alert" data-result-id={alert.id}>
        <div className="hub-result-title">{alert.result_path.split('/').pop()}</div>
        <small>{alert.state === 'partial' ? 'Partial result' : alert.label}</small>
        <span className="hub-result-path">{alert.result_path}</span>
        <div className="hub-result-actions"><button disabled={Boolean(view.opening)} onClick={() => {void controller.open(alert.id, view.id);}}>Open</button>
          <button disabled={view.dismissing.includes(alert.id)} onClick={() => {void controller.dismiss(alert.id, view.id);}}>Dismiss</button></div>
      </article>)}
      {view?.status && !view.status.alerts.length && <span className="hub-muted">No new results</span>}
    </div>
    <details id="hub-background-working"><summary>Working{view?.status ? ` · ${view.status.working.length}` : ''}</summary>
      {view?.status?.working.map(job => <div className="hub-background-job" key={`${job.tool}-${job.id}`}><span>{job.tool === 'cipher' ? 'Cipher analysis' : 'Password recovery'}</span><small>{job.state}</small><code>{job.id.slice(0, 12)}</code></div>)}
    </details>
  </aside>;
}
