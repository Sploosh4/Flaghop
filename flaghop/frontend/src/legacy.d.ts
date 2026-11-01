/** Only migrated components are type checked in this pilot; legacy views keep their existing tests. */
declare module '*project_view.js' {
  export function renderProject(project: unknown): void;
}
declare module '*dom.js' {
  export function setActionStatus(message: string): void;
  export function setWorkspaceStatus(message: string, isError?: boolean): void;
}
declare module '*output_format.js' {
  export function ansiTextToHtml(text: string): string;
  export function formatTargetLabel(host?: string | null, port?: string | number | null, protocol?: string | null): string;
  export function formatEtaSeconds(value: string | number | null | undefined): string;
  export function getProcessStatusClass(status: string | null | undefined): string;
  export function isProcessRunning(status: string | null | undefined): boolean;
}
declare module '*process_output.js' {
  export function setProcessOutputModalOpen(open: boolean): void;
  export function copyTextToClipboard(text: string, success: string, empty: string): Promise<void>;
}
declare module '*activity.js' {
  export function applyWorkspaceOverview(value: unknown): void;
}
declare module '*live_updates.js' {
  export function pollSnapshot(): Promise<void>;
}
declare module '*dialogs.js' {
  export function closeProviderLogsModalAction(): void;
}
