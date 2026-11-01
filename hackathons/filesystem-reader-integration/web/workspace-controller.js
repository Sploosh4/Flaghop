/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Transport-independent workspace background-job control. No global worker stops. */
(function (root) {
  'use strict';
  const copy = value => structuredClone(value);
  const message = error => error instanceof Error ? error.message : String(error);

  function normalizeStatus(raw) {
    if (!raw || typeof raw.running !== 'boolean') throw Error('Workspace control state is unavailable');
    const alerts = new Map();
    for (const alert of raw.alerts || []) {
      if (typeof alert.id !== 'string' || !alert.id || typeof alert.result_path !== 'string') continue;
      alerts.set(alert.id, copy(alert));
    }
    const observed = ['running', 'pausing', 'paused'].includes(raw.observed_state) ? raw.observed_state : null;
    return {...copy(raw), observed_state: observed,
      alerts: [...alerts.values()].sort((a, b) => (Number(b.completed) || 0) - (Number(a.completed) || 0) || a.id.localeCompare(b.id))};
  }

  class WorkspaceController {
    constructor({openResult = () => {}} = {}) {
      this.workspaces = new Map();
      this.selected = null;
      this.selectionRevision = 0;
      this.listeners = new Set();
      this.openResultCallback = openResult;
    }
    register({id, label, adapter}) {
      if (typeof id !== 'string' || !id || this.workspaces.has(id)) throw Error('A unique workspace ID is required');
      for (const name of ['read', 'setRunning', 'dismiss', 'result']) {
        if (typeof adapter?.[name] !== 'function') throw Error('Workspace adapter is missing ' + name);
      }
      this.workspaces.set(id, {id, label: label || id, adapter, status: null, error: '', busy: false,
        dismissing: new Set(), dismissed: new Set(), opening: null, revision: 0, readSequence: 0, appliedSequence: 0});
      return id;
    }
    workspace(id = this.selected) {
      const value = this.workspaces.get(id);
      if (!value) throw Error('Unknown workspace');
      return value;
    }
    select(id) {
      this.workspace(id);
      if (id !== this.selected) this.selectionRevision++;
      this.selected = id;
      this.emit();
      // Selecting/browsing a workspace never starts its workers.
      return this.refresh(id);
    }
    view(id = this.selected) {
      if (id === null) return null;
      const w = this.workspace(id), status = w.status ? copy(w.status) : null;
      if (status) status.alerts = status.alerts.filter(a => !w.dismissed.has(a.id));
      return {id: w.id, label: w.label, status, error: w.error, busy: w.busy,
        dismissing: [...w.dismissing], opening: w.opening};
    }
    subscribe(listener) {
      this.listeners.add(listener);
      listener(this.view());
      return () => this.listeners.delete(listener);
    }
    emit() { for (const listener of this.listeners) listener(this.view()); }
    async refresh(id = this.selected) {
      const w = this.workspace(id), revision = w.revision, sequence = ++w.readSequence;
      try {
        const status = normalizeStatus(await w.adapter.read());
        // Ignore pre-mutation or out-of-order reads. Keep per-workspace state isolated.
        if (w.revision !== revision || sequence < w.appliedSequence || w.busy) return false;
        w.appliedSequence = sequence;
        w.status = status;
        w.error = '';
        if (id === this.selected) this.emit();
        return true;
      } catch (error) {
        if (w.revision === revision && sequence >= w.appliedSequence && !w.busy) {
          w.appliedSequence = sequence; w.error = message(error);
          if (id === this.selected) this.emit();
        }
        return false;
      }
    }
    async setRunning(running, id = this.selected) {
      const w = this.workspace(id);
      if (typeof running !== 'boolean') throw Error('running must be boolean');
      if (w.busy) return false;
      w.busy = true; w.error = ''; w.revision++;
      if (id === this.selected) this.emit();
      try {
        const acknowledgement = await w.adapter.setRunning(running);
        if (acknowledgement?.running !== running) throw Error('Workspace did not acknowledge the requested state');
        // This is durable desired state, not proof every worker has already stopped.
        if (w.status) { w.status.running = running; w.status.observed_state = null; }
        return true;
      } catch (error) {
        w.error = message(error);
        return false;
      } finally {
        w.busy = false; w.revision++;
        if (id === this.selected) this.emit();
        // Reconcile even after a lost acknowledgement: never automatically retry a mutation.
        const priorError = w.error;
        await this.refresh(id);
        if (priorError && !w.error) { w.error = priorError; if (id === this.selected) this.emit(); }
      }
    }
    async dismiss(alertId, id = this.selected) {
      const w = this.workspace(id);
      if (w.dismissing.has(alertId)) return false;
      if (!w.status?.alerts.some(a => a.id === alertId)) throw Error('Unknown result alert');
      w.dismissing.add(alertId); w.error = ''; w.revision++;
      if (id === this.selected) this.emit();
      try {
        await w.adapter.dismiss(alertId);
        w.dismissed.add(alertId);
        return true;
      } catch (error) { w.error = message(error); return false; }
      finally {
        w.dismissing.delete(alertId); w.revision++;
        if (id === this.selected) this.emit();
      }
    }
    async open(alertId, id = this.selected) {
      const w = this.workspace(id), selectionRevision = this.selectionRevision;
      const alert = w.status?.alerts.find(a => a.id === alertId);
      if (!alert || w.dismissed.has(alertId)) throw Error('Unknown result alert');
      if (w.opening) return false;
      w.opening = alertId; w.error = '';
      if (id === this.selected) this.emit();
      try {
        const result = await w.adapter.result(copy(alert));
        if (this.selected !== id || selectionRevision !== this.selectionRevision) return false;
        await this.openResultCallback({workspaceId: id, workspaceLabel: w.label, alert: copy(alert), result});
        return true;
      } catch (error) { w.error = message(error); return false; }
      finally { w.opening = null; if (id === this.selected) this.emit(); }
    }
  }

  const api = {WorkspaceController, normalizeStatus};
  root.FlagMapWorkspace = {...root.FlagMapWorkspace, ...api};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
