import createClient from 'openapi-fetch';
import type { paths, components } from './schema';

export type Project = components['schemas']['Project'];
export type Job = components['schemas']['Job'];
export const client = createClient<paths>({baseUrl: window.location.origin, fetch: request => globalThis.fetch(request)});

export function failure(error: unknown, status: number): Error {
  const message = error && typeof error === 'object' && 'error' in error ? String(error.error) : `Request failed (${status})`;
  return new Error(message);
}

export async function renameProject(name: string, expectedPath: string): Promise<Project> {
  const {data, error, response} = await client.POST('/api/project/rename', {body: {name, expected_path: expectedPath}});
  if (!data) throw failure(error, response.status);
  return data.project;
}

export async function listJobs(): Promise<Job[]> {
  const {data, error, response} = await client.GET('/api/jobs', {params: {query: {limit: 100}}});
  if (!data) throw failure(error, response.status);
  return data.jobs;
}

export async function stopJob(jobId: number): Promise<Job> {
  const {data, error, response} = await client.POST('/api/jobs/{job_id}/stop', {params: {path: {job_id: jobId}}});
  if (!data) throw failure(error, response.status);
  return data.job;
}
