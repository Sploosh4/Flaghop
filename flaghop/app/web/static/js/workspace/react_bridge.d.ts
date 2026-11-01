export interface ReactWorkspaceBindings {
  updateProject(value: unknown): void;
  updateJobs(value: unknown): void;
  beginRename(location: 'sidebar' | 'title'): void;
}
export function connectReactWorkspace(bindings: ReactWorkspaceBindings): () => void;
export function publishWorkspaceProject(value: unknown): void;
export function publishWorkspaceJobs(value: unknown): void;
export function beginWorkspaceRename(location?: 'sidebar' | 'title'): void;
