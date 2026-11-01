import type {components} from './schema';
import {client, failure} from './client';

export type Process = components['schemas']['Process'];
export type ProcessOutput = components['schemas']['ProcessOutput'];
export type Approval = components['schemas']['Approval'];
export type Decision = components['schemas']['Decision'];
export type Scan = components['schemas']['Scan'];
export type Rationale = components['schemas']['Rationale'];

// Each request is checked against the generated paths, including bodies and queries.
function result<T>({data, error, response}: {data?: T; error?: unknown; response: Response}): T {
  if (!data) throw failure(error, response.status);
  return data;
}

export async function getOverview() {
  return result(await client.GET('/api/workspace/overview'));
}
export async function listProcesses() {
  return result(await client.GET('/api/processes', {params: {query: {limit: 100}}})).processes;
}
export async function listDecisions() {
  return result(await client.GET('/api/scheduler/decisions', {params: {query: {limit: 80}}})).decisions;
}
export async function listScans() {
  return result(await client.GET('/api/scans/history', {params: {query: {limit: 100}}})).scans;
}
export async function listApprovals() {
  return result(await client.GET('/api/scheduler/approvals', {params: {query: {limit: 200, status: 'pending'}}})).approvals;
}
export async function getProcessOutput(processId: number, offset: number) {
  return result(await client.GET('/api/processes/{process_id}/output', {params: {
    path: {process_id: processId}, query: {offset, max_chars: 24000},
  }}));
}
export async function actOnProcess(action: 'kill' | 'retry' | 'close', processId: number) {
  const params = {path: {process_id: processId}};
  if (action === 'kill') return result(await client.POST('/api/processes/{process_id}/kill', {params}));
  if (action === 'close') return result(await client.POST('/api/processes/{process_id}/close', {params}));
  return result(await client.POST('/api/processes/{process_id}/retry', {params, body: {}}));
}
export async function clearProcesses(resetAll: boolean) {
  return result(await client.POST('/api/processes/clear', {body: {reset_all: resetAll}}));
}
export async function approveApproval(approvalId: number, familyAction: '' | 'allowed' = '') {
  return result(await client.POST('/api/scheduler/approvals/{approval_id}/approve', {
    params: {path: {approval_id: approvalId}},
    body: {approve_family: familyAction === 'allowed', run_now: true, family_action: familyAction},
  }));
}
export async function rejectApproval(approvalId: number, familyAction: '' | 'suppressed' = '') {
  return result(await client.POST('/api/scheduler/approvals/{approval_id}/reject', {
    params: {path: {approval_id: approvalId}},
    body: {reason: 'rejected in web workspace', family_action: familyAction},
  }));
}
