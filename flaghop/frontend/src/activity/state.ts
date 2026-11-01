import {createStore} from '../store';
import type {Approval, Decision, Process, Rationale, Scan} from '../api/activity';
import type {ActivityPanel} from '../../../app/web/static/js/workspace/activity_bridge.js';

export function createResource<T>(valid: (row: unknown) => boolean) {
  const store = createStore({items: [] as T[], loading: false, error: ''});
  let revision = 0;
  function update(value: unknown) {
    if (!Array.isArray(value) || !value.every(valid)) throw new Error('Invalid activity response.');
    revision++;
    store.set({items: value as T[], loading: false, error: ''});
  }
  return {
    ...store, update,
    reset() {revision++; store.set({items: [], loading: false, error: ''});},
    error(error: string) {store.set({...store.getSnapshot(), loading: false, error});},
    async load(loader: () => Promise<T[]>) {
      const request = ++revision;
      store.set({...store.getSnapshot(), loading: true, error: ''});
      try {
        const rows = await loader();
        if (request === revision) update(rows);
      } catch (error) {
        if (request === revision) store.set({...store.getSnapshot(), loading: false, error: String(error instanceof Error ? error.message : error)});
      }
    },
  };
}

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object';
const identified = (value: unknown) => record(value) && Number.isInteger(value.id);
export const processes = createResource<Process>(identified);
export const approvals = createResource<Approval>(identified);
export const decisions = createResource<Decision>(identified);
export const scans = createResource<Scan>(identified);
export const rationale = createResource<Rationale>(record);
export const panels = {processes, approvals, decisions, scans, rationale};
export const pendingActions = createStore<ReadonlySet<string>>(new Set());

export function updateActivity(name: ActivityPanel, value: unknown) {
  panels[name].update(value);
}
