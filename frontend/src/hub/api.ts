import {client, failure} from '../api/client';
import type {components} from '../api/schema';

export type HubProject = components['schemas']['HubProject'];
export type Connector = NonNullable<HubProject['connector']>;
export type HubSettings = components['schemas']['HubSettings'];
export type HubFile = components['schemas']['HubFile'];
export type Snapshot = components['schemas']['ActivitySnapshot'];
export type BackgroundStatus = components['schemas']['BackgroundStatus'];
export type ReaderAlert = components['schemas']['ReaderAlert'];
export type ReaderResult = components['schemas']['ReaderResult'];
export type NetworkContext = components['schemas']['NetworkContext'];
export type NetworkPreferences = components['schemas']['NetworkPreferences'];
export async function projectNetwork(id: string) {
  return result(await client.GET('/api/hub/projects/{identifier}/network', {params: {path: {identifier: id}}}));
}
export async function saveProjectNetwork(id: string, revision: number, settings: NetworkPreferences) {
  return result(await client.PUT('/api/hub/projects/{identifier}/network', {params: {path: {identifier: id}}, body: {expected_revision: revision, settings}}));
}
export async function checkProjectNetwork(id: string, target: string, port?: number) {
  return result(await client.POST('/api/hub/projects/{identifier}/network/check', {params: {path: {identifier: id}}, body: {target, port}}));
}

function result<T>({data, error, response}: {data?: T; error?: unknown; response: Response}): T {
  if (!data) throw failure(error, response.status);
  return data;
}
export async function projects() {return result(await client.GET('/api/hub/projects')).projects;}
export async function settings() {return result(await client.GET('/api/hub/settings'));}
export async function setSaveFolder(path: string) {return result(await client.POST('/api/hub/settings/save-folder', {body: {path}}));}
export async function createProject(name: string) {return result(await client.POST('/api/hub/projects', {body: {name}}));}
export async function openProject(id: string) {
  return result(await client.POST('/api/hub/projects/{identifier}/open', {params: {path: {identifier: id}}}));
}
export async function files(id: string) {
  return result(await client.GET('/api/hub/projects/{identifier}/files', {params: {path: {identifier: id}}}));
}
export async function setProjectVpn(id: string, selection: 'inherit' | 'none') {
  return result(await client.POST('/api/hub/projects/{identifier}/vpn', {params: {path: {identifier: id}}, body: {selection}}));
}
export async function setProjectConnector(id: string, selection: Connector) {
  return result(await client.POST('/api/hub/projects/{identifier}/connector', {params: {path: {identifier: id}}, body: {selection}}));
}
export async function installConnector(connector: 'openvpn' | 'wireguard') {
  return result(await client.POST('/api/hub/connectors/install', {body: {connector}}));
}
export async function connectorInstallJob(id: number) {
  return result(await client.GET('/api/jobs/{job_id}', {params: {path: {job_id: id}}}));
}
export function fileUrl(id: string, path: string) {
  return `/api/hub/projects/${encodeURIComponent(id)}/file?${new URLSearchParams({path})}`;
}
export async function renameProject(id: string, name: string) {
  return result(await client.POST('/api/hub/projects/{identifier}/rename', {params: {path: {identifier: id}}, body: {name}}));
}
export async function saveProject(id: string) {
  return result(await client.POST('/api/hub/projects/{identifier}/save', {params: {path: {identifier: id}}}));
}
export async function saveProjectAs(id: string, name: string) {
  return result(await client.POST('/api/hub/projects/{identifier}/save-as', {params: {path: {identifier: id}}, body: {name}}));
}
export async function openPath(path: string) {return result(await client.POST('/api/hub/open-path', {body: {path}}));}
export async function restoreZip(file: File) {
  const response = await fetch('/api/hub/restore-zip', {method: 'POST', headers: {'Content-Type': 'application/zip'}, body: file});
  const data = await response.json();
  if (!response.ok) throw failure(data, response.status);
  return data as Awaited<ReturnType<typeof openProject>>;
}
export function bundleUrl(id: string) {return `/api/hub/projects/${encodeURIComponent(id)}/bundle`;}
export async function snapshot() {return result(await client.GET('/api/snapshot'));}
export async function background(id: string) {return result(await client.GET('/api/hub/projects/{identifier}/background', {params: {path: {identifier: id}}}));}
export async function controlBackground(id: string, running: boolean) {return result(await client.POST('/api/hub/projects/{identifier}/background/control', {params: {path: {identifier: id}}, body: {running}}));}
export async function dismissAlert(id: string, alertId: string) {return result(await client.POST('/api/hub/projects/{identifier}/background/alerts/{alert_id}/dismiss', {params: {path: {identifier: id, alert_id: alertId}}}));}
export async function readerResult(id: string, alertId: string) {return result(await client.GET('/api/hub/projects/{identifier}/background/results/{alert_id}', {params: {path: {identifier: id, alert_id: alertId}}}));}
export function filesystemUrl(id: string, alertId?: string) {return `/api/hub/projects/${encodeURIComponent(id)}/filesystem${alertId ? `?${new URLSearchParams({result: alertId})}` : ''}`;}
export function editorUrl(id: string, alertId: string) {return `/api/hub/projects/${encodeURIComponent(id)}/editor?${new URLSearchParams({result: alertId})}`;}
