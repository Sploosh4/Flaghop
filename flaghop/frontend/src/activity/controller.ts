import * as api from '../api/activity';
import {projectStore} from '../store';
import {approvals, decisions, panels, pendingActions, processes, scans} from './state';
import {OutputSession} from './output';
import type {ActivityActions} from '../../../app/web/static/js/workspace/activity_bridge.js';

interface Shell {
  applyOverview(value: Awaited<ReturnType<typeof api.getOverview>>): void;
  refreshSnapshot(): Promise<void>;
  setOutputOpen(open: boolean): void;
  status(message: string, error?: boolean): void;
}

export class ActivityController {
  readonly output: OutputSession;
  readonly actions: ActivityActions;
  private epoch = 0;
  private overviewRequest = 0;
  private pending = new Map<string, symbol>();
  private unsubscribe: () => void;

  constructor(private shell: Shell) {
    this.output = new OutputSession(shell.setOutputOpen);
    let path = projectStore.getSnapshot().name;
    this.unsubscribe = projectStore.subscribe(() => {
      const next = projectStore.getSnapshot().name;
      if (path === next) return;
      path = next; this.epoch++; this.overviewRequest++;
      Object.values(panels).forEach(panel => panel.reset());
      this.pending.clear(); pendingActions.set(new Set()); this.output.close();
    });
    this.actions = {
      loadOverview: () => this.loadOverview(),
      loadProcesses: () => processes.load(api.listProcesses),
      loadApprovals: () => approvals.load(api.listApprovals),
      loadDecisions: () => decisions.load(api.listDecisions),
      loadScans: () => scans.load(api.listScans),
      approve: (id, family = '') => this.approvalAction(id, false, family),
      reject: (id, family = '') => this.approvalAction(id, true, family),
      openOutput: id => this.output.open(id),
      closeOutput: async () => this.output.close(),
    };
  }

  dispose() {this.unsubscribe(); this.epoch++; this.overviewRequest++; this.output.close();}

  private async loadOverview() {
    const request = ++this.overviewRequest;
    try {
      const data = await api.getOverview();
      if (request === this.overviewRequest) this.shell.applyOverview(data);
    } catch (error) {
      if (request === this.overviewRequest) panels.rationale.error(`Failed to load workspace overview: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async mutate(key: string, panel: typeof approvals | typeof processes, action: () => Promise<string>, refresh: () => Promise<void>) {
    if (this.pending.has(key)) return;
    const token = Symbol(key), epoch = this.epoch;
    this.pending.set(key, token); pendingActions.set(new Set(this.pending.keys())); panel.error('');
    try {
      const message = await action();
      if (epoch !== this.epoch) return;
      this.shell.status(message);
      await Promise.all([refresh(), this.shell.refreshSnapshot()]);
    } catch (error) {
      if (epoch !== this.epoch) return;
      const message = `Action failed: ${error instanceof Error ? error.message : error}`;
      panel.error(message); this.shell.status(message, true);
    } finally {
      if (this.pending.get(key) === token) {
        this.pending.delete(key); pendingActions.set(new Set(this.pending.keys()));
      }
    }
  }

  async approvalAction(id: number, reject: boolean, family: '' | 'allowed' | 'suppressed' = '') {
    await this.mutate(`approval:${id}`, approvals, async () => {
      if (reject) await api.rejectApproval(id, family === 'suppressed' ? family : '');
      else await api.approveApproval(id, family === 'allowed' ? family : '');
      return `Approval ${id} ${reject ? 'rejected' : 'accepted'}${family ? ` and family ${family}` : ''}`;
    }, this.actions.loadApprovals);
  }

  async processAction(action: 'kill' | 'retry' | 'close', id: number) {
    await this.mutate(`process:${id}`, processes, async () => {
      await api.actOnProcess(action, id);
      return `Process ${id}: ${action === 'close' ? 'hidden' : action === 'retry' ? 'retry queued' : 'kill requested'}`;
    }, async () => {
      await this.actions.loadProcesses();
      if (this.output.store.getSnapshot().id === id) await this.output.refresh();
    });
  }

  async clearProcesses(resetAll: boolean) {
    await this.mutate('process:clear', processes, async () => {
      await api.clearProcesses(resetAll);
      return resetAll ? 'Hidden all non-running processes' : 'Hidden finished/issues processes';
    }, this.actions.loadProcesses);
  }
}
