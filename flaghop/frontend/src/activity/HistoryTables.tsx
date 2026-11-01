import {useSyncExternalStore} from 'react';
import {decisions, rationale, scans} from './state';
import {TableStatus} from './shared';
import {formatTargetLabel} from '../../../app/web/static/js/workspace/output_format.js';

export function DecisionsTable() {
  const state = useSyncExternalStore(decisions.subscribe, decisions.getSnapshot);
  return <><TableStatus {...state} empty={!state.items.length} columns={8}/>{state.items.map(row => <tr key={row.id}>
    <td>{row.timestamp}</td><td>{formatTargetLabel(row.host_ip, row.port, row.protocol)}</td><td>{row.tool_id || row.label}</td>
    <td>{row.scheduler_mode}</td><td>{String(row.approved ?? '')}</td><td>{String(row.executed ?? '')}</td>
    <td>{row.reason}</td><td>{row.command_family_id}</td>
  </tr>)}</>;
}

export function ScansTable() {
  const state = useSyncExternalStore(scans.subscribe, scans.getSnapshot);
  return <><TableStatus {...state} empty={!state.items.length} columns={8}/>{state.items.map(row => <tr key={row.id}>
    <td>{row.id}</td><td>{row.submission_kind}</td><td>{row.status}</td><td>{row.target_summary}</td>
    <td>{row.scope_summary}</td><td>{row.scan_mode}</td><td>{row.created_at}</td><td>{row.result_summary}</td>
  </tr>)}</>;
}

function timestamp(value: string | null | undefined) {
  if (!value) return '';
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString([], {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) : value;
}

export function RationaleFeed() {
  const state = useSyncExternalStore(rationale.subscribe, rationale.getSnapshot);
  return <>{state.error && <p role="alert">{state.error}</p>}
    {!state.items.length && <p className="meta-note rationale-empty">{state.loading ? 'Loading...' : 'Scheduler rationale will appear here as tools are ranked, suppressed, and executed.'}</p>}
    {state.items.map((row, index) => <article className="rationale-entry" key={`${row.timestamp}:${index}`}>
      <div className="rationale-entry-top"><div className="rationale-entry-heading">
        <p className="rationale-entry-prefix">{formatTargetLabel(row.host_ip || 'Project-wide', row.port, row.protocol)}</p>
        <strong className="rationale-entry-title">{row.headline || row.kind || 'Decision'}</strong>
      </div><span className="rationale-entry-time">{timestamp(row.timestamp)}</span></div>
      {!!row.tags?.length && <div className="rationale-entry-tags">{row.tags.filter(Boolean).map((tag, i) => <span className="chip rationale-chip" key={i}>{tag}</span>)}</div>}
      <p className="rationale-entry-summary">{row.summary || 'Scheduler decision recorded.'}</p>
      {!!row.details?.length && <div className="rationale-entry-details">{row.details.filter(Boolean).map((detail, i) => <div className="rationale-entry-line" key={i}>{detail}</div>)}</div>}
    </article>)}</>;
}
