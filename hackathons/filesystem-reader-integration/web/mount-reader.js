/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Host adapter for the existing Files/editor demo and standalone reader API. */
(async function () {
  'use strict';
  const {WorkspaceController, ReaderAdapter, WorkspacePanel} = globalThis.FlagMapWorkspace;
  const source = new URLSearchParams(location.search).get('source') || 'ssh-fixture';
  const adapter = new ReaderAdapter({source});
  try {
    const [sessionInfo, initial] = await Promise.all([adapter.session(), adapter.read()]);
    // The standalone endpoint currently binds exactly one project. Source selection
    // changes its filesystem view, not the workspace or its pause state.
    const workspaceId = initial.project_id || sessionInfo.project_id || 'standalone:' + location.origin;
    const controller = new WorkspaceController({openResult: ({workspaceId, workspaceLabel, alert, result}) => {
      const bytes = Uint8Array.from(atob(result.data_b64), c => c.charCodeAt(0));
      let text, binary = false;
      try { if (bytes.includes(0)) throw Error('binary'); text = new TextDecoder('utf-8', {fatal: true}).decode(bytes); }
      catch (_) { binary = true; text = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' '); }
      const path = 'reader-result://' + encodeURIComponent(workspaceId) + '/' + encodeURIComponent(alert.id);
      if (editorTabs.has(path)) activateEditor(path);
      else createEditor({path, name: alert.result_path.split('/').pop(), kind: 'file', size: alert.size}, text, Boolean(result.truncated) || binary);
      const tab = currentEditor();
      tab.warning = 'Derived file · ' + alert.result_path + (result.truncated ? ' · incomplete preview; editing disabled' : binary ? ' · hex preview; editing disabled' : ' · edits stay in a local draft');
      activateEditor(path);
      document.getElementById('editor-path').textContent = workspaceLabel + ' / ' + alert.result_path;
      document.getElementById('editor-path').title = initial.project + '/' + alert.result_path;
      editorNotice('Result · review required · source: ' + (alert.origins?.[0]?.path || 'not supplied'));
      panel.show(false);
    }});
    controller.register({id: workspaceId, label: initial.project?.split('/').filter(Boolean).pop() || 'Workspace', adapter});
    const panel = new WorkspacePanel(controller, {
      sources: sessionInfo.sources, source,
      onSource: id => { location.href = '/?source=' + encodeURIComponent(id); },
      canCollect: sessionInfo.capabilities.includes('watch'),
      getFolder: () => current, onIncludeFolder: (path, recursive) => adapter.includeFolder(path, recursive)
    });
    await controller.select(workspaceId);
    // Expose the reusable component boundary for the eventual FlagMap host.
    globalThis.flagMapWorkspace = {controller, panel, workspaceId};
    let stopped = false;
    async function poll() {
      if (stopped) return;
      await controller.refresh();
      if (!stopped) setTimeout(poll, 2500);
    }
    setTimeout(poll, 2500);
    addEventListener('pagehide', () => { stopped = true; }, {once: true});
    addEventListener('pageshow', event => { if (event.persisted && stopped) { stopped = false; void poll(); } });
  } catch (error) {
    const failure = document.createElement('p'); failure.className = 'reader-startup-error'; failure.setAttribute('role', 'alert');
    failure.textContent = 'Workspace controls unavailable: ' + error.message;
    failure.style.cssText = 'position:fixed;top:8px;left:20px;right:20px;z-index:30;background:#382a26;color:#ffd3be;padding:10px;border-radius:8px';
    document.body.append(failure);
  }
})();
