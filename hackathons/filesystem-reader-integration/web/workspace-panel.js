/* SPDX-License-Identifier: GPL-3.0-or-later */
(function (root) {
  'use strict';
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function counts(states = {}) {
    let active = 0, queued = 0;
    for (const [key, count] of Object.entries(states)) {
      if (key === 'running' || key.startsWith('running_')) active += Number(count) || 0;
      if (key === 'queued' || key.startsWith('queued_')) queued += Number(count) || 0;
    }
    return {active, queued};
  }
  class WorkspacePanel {
    constructor(controller, {sources = [], source, onSource, onIncludeFolder, getFolder, canCollect = false} = {}) {
      this.controller = controller; this.alertSignature = ''; this.workingSignature = '';
      const style = element('style');
      style.textContent = `body{padding-top:64px}.editor-window{top:64px}.reader-bar{position:absolute;z-index:15;top:10px;left:24px;right:24px;display:flex;align-items:center;gap:10px;height:42px}.reader-bar select,.reader-bar button{background:#383837;color:#eee;border:1px solid #626260;border-radius:9px;padding:8px 12px;font:inherit}.reader-bar select{max-width:260px;min-width:0}.reader-bar strong{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:220px}.reader-bar .spacer{flex:1}.reader-state{font-size:12px;color:#bcbcb5}.reader-panel{position:fixed;right:14px;top:64px;bottom:14px;width:min(360px,calc(100vw - 28px));background:#29292c;border:1px solid #555;border-radius:14px;padding:16px;z-index:20;overflow:auto;box-shadow:0 10px 35px #0008}.reader-panel h2{font-size:16px;margin:4px 0 14px}.reader-panel h3{font-size:14px;margin:0 0 5px}.reader-panel p,.reader-panel a,.reader-panel label{font-size:12px;line-height:1.55;color:#c8c8c2}.reader-alert{padding:12px 0;border-bottom:1px solid #454545}.reader-alert button,.reader-panel button{padding:6px 9px;background:#404042;color:#eee;border:1px solid #666;border-radius:7px;margin:4px 5px 4px 0}.reader-alert .open-result{display:block;text-align:left;width:100%;overflow-wrap:anywhere;padding:10px}.reader-alert small{font-size:11px;color:#aaa}.reader-alert p{margin:5px 0;overflow-wrap:anywhere}.reader-panel details{border-top:1px solid #494949;padding-top:13px;margin-top:17px}.reader-panel summary{font-size:14px;cursor:pointer}.reader-error{color:#ffc8ad!important}.reader-scope{overflow-wrap:anywhere}.reader-panel .reader-note{font-size:11px;color:#aaa}.reader-panel-header{display:flex;align-items:center;justify-content:space-between}.reader-panel-header button{margin-top:0}.reader-work-group{padding:10px 0;border-bottom:1px solid #444}.reader-working-line{display:flex;justify-content:space-between;gap:8px;font-size:12px}.reader-workspace-picker[hidden]{display:none}.reader-bar button:disabled{opacity:.5;cursor:wait}@media(max-width:700px){.reader-bar{left:12px;right:12px;gap:6px}.reader-bar strong{max-width:100px;font-size:13px}.reader-bar select{max-width:150px;font-size:12px}.reader-bar button{padding:8px;font-size:12px}.reader-state{display:none}}`;
      style.textContent += `.reader-panel{display:flex;flex-direction:column;overflow:hidden}.reader-panel-header{flex:none}#reader-alerts{flex:1;min-height:80px;overflow:auto;padding-right:5px}#reader-working-group{flex:none;max-height:42%;overflow:auto;margin-top:10px}.reader-panel>details:not(#reader-working-group){flex:none;margin-top:10px;padding-top:10px}.reader-panel>p{flex:none;margin:8px 0 0}.reader-alert .open-result{display:inline-block;width:auto;padding:6px 10px}.reader-result-name{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;margin:4px 0}.reader-origin{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.reader-panel #reader-message:empty{display:none}@media(min-width:760px){body.reader-panel-open .editor-window{right:388px}body.reader-panel-open>.window{margin-right:374px}}`;
      document.head.append(style);
      this.bar = element('div', undefined, 'reader-bar');
      this.title = element('strong', 'Workspace'); this.title.id = 'reader-workspace-title';
      this.workspaceSelect = element('select', undefined, 'reader-workspace-picker');
      this.workspaceSelect.setAttribute('aria-label', 'Workspace'); this.workspaceSelect.hidden = true;
      this.workspaceSelect.onchange = () => controller.select(this.workspaceSelect.value);
      this.sourceSelect = element('select'); this.sourceSelect.id = 'reader-source';
      this.sourceSelect.setAttribute('aria-label', 'Filesystem source');
      for (const item of sources) {
        const option = element('option', item.label); option.value = item.id; option.selected = item.id === source; this.sourceSelect.append(option);
      }
      this.sourceSelect.hidden = !sources.length;
      this.sourceSelect.onchange = () => onSource?.(this.sourceSelect.value);
      this.state = element('span', 'Loading', 'reader-state'); this.state.id = 'reader-workspace-state';
      this.state.setAttribute('role', 'status');
      this.toggle = element('button', 'Start'); this.toggle.id = 'reader-toggle'; this.toggle.disabled = true;
      this.toggle.onclick = () => {
        const view = controller.view(); if (view?.status) void controller.setRunning(!view.status.running);
      };
      this.panelToggle = element('button', 'Working & alerts'); this.panelToggle.id = 'reader-panel-toggle';
      this.panelToggle.setAttribute('aria-controls', 'reader-panel'); this.panelToggle.setAttribute('aria-expanded', 'false');
      this.panelToggle.onclick = () => this.show(this.panel.hidden);
      this.bar.append(this.title, this.workspaceSelect, this.sourceSelect, element('span', '', 'spacer'), this.state, this.toggle, this.panelToggle);
      this.panel = element('aside', undefined, 'reader-panel'); this.panel.id = 'reader-panel'; this.panel.hidden = true;
      this.panel.setAttribute('aria-label', 'Workspace working and alerts');
      const head = element('div', undefined, 'reader-panel-header'), close = element('button', '×');
      close.setAttribute('aria-label', 'Close working and alerts'); close.onclick = () => this.show(false);
      head.append(element('h2', 'Alerts'), close);
      this.alerts = element('div'); this.alerts.id = 'reader-alerts';
      const workingDetails = element('details'); workingDetails.id = 'reader-working-group';
      this.workingSummary = element('summary', 'Working'); this.working = element('div'); this.working.id = 'reader-working';
      workingDetails.append(this.workingSummary, this.working);
      this.message = element('p', '', 'reader-error'); this.message.id = 'reader-message'; this.message.setAttribute('role', 'status');
      this.panel.append(head, this.alerts, workingDetails, this.message);
      if (getFolder && onIncludeFolder) {
        const collection = element('details'), summary = element('summary', 'Collection folders');
        this.include = element('button', 'Include current folder'); this.include.id = 'reader-watch-folder'; this.include.disabled = !canCollect;
        const label = element('label'), recursive = element('input'); recursive.type = 'checkbox'; recursive.id = 'reader-recursive'; recursive.checked = true;
        label.append(recursive, document.createTextNode(' Include subfolders'));
        this.include.onclick = async () => {
          this.include.disabled = true;
          try { await onIncludeFolder(getFolder(), recursive.checked); await controller.refresh(); }
          catch (error) { this.message.textContent = error.message; }
          finally { this.include.disabled = !canCollect; }
        };
        collection.append(summary, this.include, label, element('p', 'Including a folder does not start a paused workspace.', 'reader-note'));
        this.panel.append(collection);
      }
      const links = element('p'), report = element('a', 'Evidence report');
      report.href = '/reports/reader-report.html'; report.target = '_blank'; report.rel = 'noopener';
      const outputs = element('a', 'Browse saved files'); outputs.href = '/?source=outputs';
      links.append(report, document.createTextNode(' · '), outputs);
      this.outputFolder = element('p', '', 'reader-note');
      this.panel.append(links, this.outputFolder, element('p', 'Start/Pause applies to this whole workspace. Queues and saved results are retained. Interactive browsing stays available. Edits stay in browser drafts.', 'reader-note'));
      document.body.append(this.bar, this.panel);
      this.unsubscribe = controller.subscribe(view => this.render(view));
    }
    show(open) { this.panel.hidden = !open; this.panelToggle.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('reader-panel-open', open); }
    render(view) {
      if (!view) return;
      this.title.textContent = view.label; this.title.title = view.label;
      const choices = [...this.controller.workspaces.values()];
      const key = JSON.stringify(choices.map(w => [w.id, w.label]));
      if (key !== this.workspaceChoices) {
        this.workspaceChoices = key; this.workspaceSelect.replaceChildren();
        for (const w of choices) { const o = element('option', w.label); o.value = w.id; this.workspaceSelect.append(o); }
      }
      this.workspaceSelect.value = view.id; this.workspaceSelect.hidden = choices.length < 2;
      const s = view.status;
      this.toggle.disabled = !s || view.busy || Boolean(view.error);
      this.toggle.textContent = view.busy ? 'Updating…' : s?.running ? 'Pause' : 'Start';
      this.toggle.setAttribute('aria-label', (s?.running ? 'Pause' : 'Start') + ' background jobs for ' + view.label);
      this.toggle.setAttribute('aria-pressed', String(Boolean(s?.running)));
      this.state.textContent = view.error ? 'Status unavailable' : !s ? 'Loading' : view.busy ? 'Updating' :
        s.running ? 'Running' : s.observed_state === 'paused' ? 'Paused' : s.observed_state === 'pausing' ? 'Pausing' : 'Pause requested';
      this.state.title = s?.pause_semantics || '';
      this.message.textContent = view.error;
      if (!s) return;
      this.panelToggle.textContent = 'Working & alerts (' + s.alerts.length + ')';
      this.outputFolder.textContent = s.project ? 'Project folder: ' + s.project : '';
      const alertsKey = JSON.stringify([view.id, s.alerts, view.dismissing, view.opening]);
      if (alertsKey !== this.alertSignature) {
        this.alertSignature = alertsKey; this.alerts.replaceChildren();
        if (!s.alerts.length) this.alerts.append(element('p', 'No new results. Dismissed files remain in the project.'));
        for (const alert of s.alerts) {
          const card = element('article', undefined, 'reader-alert'); card.dataset.alertId = alert.id;
          const open = element('button', 'Open result', 'open-result');
          open.disabled = Boolean(view.opening); open.title = alert.result_path;
          open.setAttribute('aria-label', 'Open result ' + alert.result_path);
          open.onclick = () => this.controller.open(alert.id, view.id);
          const description = element('p', alert.state === 'partial' ? 'Partial result · review required' : alert.label || 'Result · review required');
          const filename = element('small', alert.result_path.split('/').pop(), 'reader-result-name'); filename.title = alert.result_path;
          const origin = element('p', alert.origins?.map(o => o.path).filter(Boolean).join(' · ') || 'Origin unavailable', 'reader-origin'); origin.title = origin.textContent;
          const time = Number(alert.completed) ? new Date(Number(alert.completed) * 1000).toLocaleString() : '';
          const metadata = element('small', [typeof alert.size === 'number' ? alert.size.toLocaleString() + ' bytes' : '', time].filter(Boolean).join(' · '));
          const dismiss = element('button', view.dismissing.includes(alert.id) ? 'Dismissing…' : 'Dismiss');
          dismiss.disabled = view.dismissing.includes(alert.id); dismiss.setAttribute('aria-label', 'Dismiss result alert ' + alert.id);
          dismiss.onclick = () => this.controller.dismiss(alert.id, view.id);
          card.append(description, filename, origin, metadata, element('br'), open, dismiss); this.alerts.append(card);
        }
      }
      const workingKey = JSON.stringify([view.id, s.running, s.node_states, s.hash_states, s.scopes, s.collection_active, s.jobs,s.collection_error,s.worker_error,s.suppressed_hypothesis_alerts]);
      if (workingKey !== this.workingSignature) {
        this.workingSignature = workingKey; this.working.replaceChildren();
        const analysis = counts(s.node_states), cracking = counts(s.hash_states);
        const active = analysis.active + cracking.active + (s.collection_active ? 1 : 0);
        this.workingSummary.textContent = 'Working' + (active ? ' · ' + active + ' active' : '');
        for(const error of [s.collection_error?.error,s.worker_error].filter(Boolean)) this.working.append(element('p',String(error),'reader-error'));
        if(s.suppressed_hypothesis_alerts) this.working.append(element('p',s.suppressed_hypothesis_alerts+' unverified cipher hypotheses retained. Review them in the evidence report or saved artifacts.'));
        for (const [label, group] of [['File analysis', analysis], ['Password cracking', cracking]]) {
          const row = element('div', undefined, 'reader-work-group');
          row.append(element('h3', label), element('p', group.active + ' active · ' + group.queued + ' queued' + (!s.running ? ' · pause requested' : '')));
          this.working.append(row);
        }
        for (const job of s.jobs || []) this.working.append(element('p', String(job.label || job.type || 'Background job') + ' · ' + String(job.state || 'unknown')));
        for (const scope of Object.values(s.scopes || {})) {
          const row = element('div', undefined, 'reader-work-group');
          row.append(element('h3', 'File collection'), element('p', scope.path, 'reader-scope'),
            element('p', [scope.connection_state || 'Not checked', scope.coverage].filter(Boolean).join(' · ')));
          for (const error of scope.errors || []) row.append(element('p', [error.path, error.error || error.coverage].filter(Boolean).join(' · '), 'reader-error reader-scope'));
          this.working.append(row);
        }
      }
    }
    destroy() { this.unsubscribe(); this.bar.remove(); this.panel.remove(); document.body.classList.remove('reader-panel-open'); }
  }
  root.FlagMapWorkspace = {...root.FlagMapWorkspace, WorkspacePanel};
})(globalThis);
