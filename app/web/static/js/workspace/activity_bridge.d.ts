export type ActivityPanel = 'processes' | 'approvals' | 'decisions' | 'scans' | 'rationale';
export interface ActivityActions {
  loadOverview(): Promise<void>;
  loadProcesses(): Promise<void>;
  loadApprovals(): Promise<void>;
  loadDecisions(): Promise<void>;
  loadScans(): Promise<void>;
  approve(id: number, family?: '' | 'allowed'): Promise<void>;
  reject(id: number, family?: '' | 'suppressed'): Promise<void>;
  openOutput(id: number): Promise<void>;
  closeOutput(): Promise<void>;
}
export function connectReactActivity(bindings: {update(name: ActivityPanel, value: unknown): void; actions: ActivityActions}): () => void;
export function publishActivity(name: ActivityPanel, value: unknown): void;
export function requestActivity<K extends keyof ActivityActions>(action: K, ...args: Parameters<ActivityActions[K]>): Promise<void>;
