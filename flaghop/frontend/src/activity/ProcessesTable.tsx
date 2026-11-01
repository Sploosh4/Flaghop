import {useSyncExternalStore} from 'react';
import type {ActivityController} from './controller';
import {pendingActions, processes} from './state';
import {IconButton, TableStatus} from './shared';
import {formatEtaSeconds, formatTargetLabel, getProcessStatusClass, isProcessRunning} from '../../../app/web/static/js/workspace/output_format.js';

export function ProcessesTable({controller}: {controller: ActivityController}) {
  const state = useSyncExternalStore(processes.subscribe, processes.getSnapshot);
  const pending = useSyncExternalStore(pendingActions.subscribe, pendingActions.getSnapshot);
  return <><TableStatus {...state} empty={!state.items.length} columns={7}/>{state.items.map(row => {
    const active = isProcessRunning(row.status), disabled = pending.has(`process:${row.id}`) || pending.has('process:clear');
    const target = formatTargetLabel(row.hostIp, row.port, row.protocol);
    const number = Number(String(row.percent ?? '').replace('%', '').trim());
    const percent = row.percent == null || row.percent === '' ? '' : Number.isFinite(number) ? `${number.toFixed(1)}%` : row.percent;
    return <tr key={row.id} data-process-id={row.id}>
      <td>{row.id}</td><td className="process-name-cell" title={row.name || ''}><span className="cell-truncate">{row.name}</span></td>
      <td className="process-target-cell" title={target}><span className="cell-truncate">{target}</span></td>
      <td className="process-status-cell"><span className={`process-status ${getProcessStatusClass(row.status)}`}>
        {active && <span className="process-spinner" aria-hidden="true"/>}<span>{row.status}</span></span></td>
      <td className="process-percent-cell">{percent}</td><td className="process-eta-cell">{formatEtaSeconds(row.estimatedRemaining)}</td>
      <td className="process-actions">
        <button type="button" className="icon-btn" aria-label="Output" title="Output" data-process-action="output" data-process-id={row.id}
          onClick={() => {void controller.actions.openOutput(row.id);}}><i className="fa-solid fa-terminal" aria-hidden="true"/></button>
        {(['retry', ...(active ? ['kill'] as const : []), 'close'] as const).map(action => <button key={action} type="button"
          className={`icon-btn${action === 'kill' ? ' icon-btn-danger' : ''}`} data-process-action={action} data-process-id={row.id}
          title={action === 'close' ? 'Hide' : action === 'kill' ? 'Kill' : 'Retry'} aria-label={action === 'close' ? 'Hide' : action === 'kill' ? 'Kill' : 'Retry'} disabled={disabled}
          onClick={() => {void controller.processAction(action, row.id);}}><i className={`fa-solid ${action === 'close' ? 'fa-eye-slash' : action === 'kill' ? 'fa-stop' : 'fa-rotate-right'}`} aria-hidden="true"/></button>)}
      </td>
    </tr>;
  })}</>;
}

export function ProcessToolbar({controller}: {controller: ActivityController}) {
  const pending = useSyncExternalStore(pendingActions.subscribe, pendingActions.getSnapshot);
  const disabled = [...pending].some(key => key.startsWith('process:'));
  return <><IconButton id="process-clear-finished-button" label="Hide Finished/Issues" icon="fa-solid fa-broom" disabled={disabled}
    onClick={() => {void controller.clearProcesses(false);}}/>
    <IconButton id="process-clear-all-button" label="Hide All Non-Running" icon="fa-solid fa-eye-slash" disabled={disabled}
      onClick={() => {void controller.clearProcesses(true);}}/></>;
}
