/** Only migrated components are type checked in this pilot; legacy views keep their existing tests. */
declare module '*project_view.js' {
  export function renderProject(project: unknown): void;
}
declare module '*dom.js' {
  export function setActionStatus(message: string): void;
  export function setWorkspaceStatus(message: string, isError?: boolean): void;
}
