import type {BackgroundStatus, ReaderResult, ReaderAlert} from '../api';
export interface WorkspaceView {
  id: string; label: string; status: BackgroundStatus | null; error: string; busy: boolean;
  dismissing: string[]; opening: string | null;
}
export class WorkspaceController {
  constructor(options: {openResult(data: {workspaceId: string; alert: ReaderAlert; result: ReaderResult}): void});
  workspaces: Map<string, {label: string}>;
  register(options: {id: string; label: string; adapter: {read(): Promise<BackgroundStatus>; setRunning(running: boolean): Promise<BackgroundStatus>; dismiss(id: string): Promise<unknown>; result(alert: ReaderAlert): Promise<ReaderResult>}}): void;
  select(id: string | null): Promise<unknown>;
  subscribe(listener: (view: WorkspaceView | null) => void): () => void;
  refresh(id?: string): Promise<unknown>;
  setRunning(running: boolean, id?: string): Promise<unknown>;
  dismiss(alertId: string, id?: string): Promise<unknown>;
  open(alertId: string, id?: string): Promise<unknown>;
}
