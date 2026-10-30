import type { Job, Project } from './api/client';

type Listener = () => void;
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    getSnapshot: () => value,
    subscribe(listener: Listener) {listeners.add(listener); return () => {listeners.delete(listener);};},
    set(next: T) {
      if (Object.is(value, next)) return;
      value = next;
      for (const listener of listeners) listener();
    },
  };
}

export const projectStore = createStore<Project>({name: '', is_temporary: true});
export const jobsStore = createStore<Job[]>([]);
export const renameStore = createStore({token: 0, location: 'sidebar' as 'sidebar' | 'title'});

export function updateProject(value: unknown): void {
  if (!value || typeof value !== 'object' || !('name' in value) || typeof value.name !== 'string') {
    throw new Error('Invalid workspace response: name must be a string.');
  }
  projectStore.set(value as Project);
}

export function updateJobs(value: unknown): void {
  if (!Array.isArray(value) || value.some(job => !job || !Number.isInteger(job.id) || typeof job.type !== 'string'
      || !['queued', 'running', 'completed', 'failed', 'cancelled'].includes(job.status))) {
    throw new Error('Invalid job response.');
  }
  jobsStore.set(value as Job[]);
}

export function beginRename(location: 'sidebar' | 'title'): void {
  renameStore.set({token: renameStore.getSnapshot().token + 1, location});
}

export function workspaceLabel(project: Project): string {
  return project.display_name || (project.is_temporary ? 'Untitled workspace' : project.name.split(/[\\/]/).pop()?.replace(/\.legion$/, '') || 'Workspace');
}
