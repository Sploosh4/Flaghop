import {useSyncExternalStore} from 'react';
import {approvals, pendingActions} from './state';
import type {ActivityController} from './controller';
import {TableStatus} from './shared';
import {formatTargetLabel} from '../../../app/web/static/js/workspace/output_format.js';

function Detail({label, value}: {label: string; value: string | null | undefined}) {
  return value?.trim() ? <div>{label}: {value}</div> : null;
}

export function ApprovalsTable({controller}: {controller: ActivityController}) {
  const state = useSyncExternalStore(approvals.subscribe, approvals.getSnapshot);
  const pending = useSyncExternalStore(pendingActions.subscribe, pendingActions.getSnapshot);
  return <><TableStatus {...state} empty={!state.items.length} columns={6}/>{state.items.map(row => <tr key={row.id} data-approval-id={row.id}>
    <td>{row.id}</td><td>{formatTargetLabel(row.host_ip, row.port, row.protocol)}</td>
    <td><Detail label="tool" value={row.label || row.tool_id}/><Detail label="id" value={row.tool_id}/>
      <Detail label="command" value={row.command_template}/><Detail label="status" value={row.status}/></td>
    <td><Detail label="risk tags" value={row.risk_tags || row.danger_categories}/><Detail label="decision" value={row.policy_decision}/>
      <Detail label="why risky" value={row.risk_summary}/><Detail label="policy" value={row.policy_reason}/>
      <Detail label="safer alternative" value={row.safer_alternative}/><Detail label="family policy" value={row.family_policy_state}/></td>
    <td><Detail label="planner rationale" value={row.rationale}/><Detail label="evidence" value={row.evidence_refs}/></td>
    <td className="approval-action-buttons">{(['approve', 'reject', 'allow-family', 'suppress-family'] as const).map(action => <button key={action} type="button"
      data-action={action} data-approval-id={row.id} disabled={pending.has(`approval:${row.id}`)} onClick={() => {
        void controller.approvalAction(row.id, action === 'reject' || action === 'suppress-family', action === 'allow-family' ? 'allowed' : action === 'suppress-family' ? 'suppressed' : '');
      }}>{action === 'approve' ? 'Approve+Run' : action === 'reject' ? 'Reject' : action === 'allow-family' ? 'Allow Family' : 'Suppress Family'}</button>)}</td>
  </tr>)}</>;
}
