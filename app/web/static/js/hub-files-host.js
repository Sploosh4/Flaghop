/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Bind saved results to the existing tabbed editor. No collection or worker starts. */
async function openHubResult(id) {
    const response = await fetch(location.pathname.replace(/\/filesystem$/, '/background/results/') + encodeURIComponent(id), {cache: 'no-store'});
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Result unavailable');
    const bytes = Uint8Array.from(atob(result.data_b64), c => c.charCodeAt(0));
    let text, binary = false;
    try {if (bytes.includes(0)) throw Error('binary'); text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);}
    catch (_) {binary = true; text = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' ');}
    const artifact = result.artifact;
    const path = 'saved-result://' + location.pathname + '/' + id;
    if (editorTabs.has(path)) activateEditor(path);
    else createEditor({path, name: artifact.result_path.split('/').pop(), kind: 'file', size: artifact.size}, text, binary || result.truncated || artifact.state === 'partial');
    const tab = currentEditor();
    tab.warning = 'Derived file · ' + artifact.result_path + (tab.readOnly ? ' · read-only preview' : ' · edits stay in browser drafts');
    activateEditor(path);
    document.getElementById('editor-path').textContent = artifact.result_path;
    editorNotice('Source: ' + (artifact.origins?.map(origin => origin.path || origin.source_path || origin.source).filter(Boolean).join(' · ') || 'not supplied'));
}
const resultId = new URLSearchParams(location.search).get('result');
if (resultId) void openHubResult(resultId).catch(error => editorNotice(error.message));
addEventListener('message', event => {
    if (event.origin === location.origin && event.source === parent && event.data?.type === 'hub-open-result' && typeof event.data.id === 'string') {
        void openHubResult(event.data.id).catch(error => editorNotice(error.message));
    }
});
