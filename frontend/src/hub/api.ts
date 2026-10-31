import {client, failure} from '../api/client';
import type {components} from '../api/schema';

export type HubProject = components['schemas']['HubProject'];
export type HubSettings = components['schemas']['HubSettings'];
export type HubFile = components['schemas']['HubFile'];
export type Snapshot = components['schemas']['ActivitySnapshot'];

function result<T>({data, error, response}: {data?: T; error?: unknown; response: Response}): T {
  if (!data) throw failure(error, response.status);
  return data;
}
export async function projects() {return result(await client.GET('/api/hub/projects')).projects;}
export async function settings() {return result(await client.GET('/api/hub/settings'));}
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
