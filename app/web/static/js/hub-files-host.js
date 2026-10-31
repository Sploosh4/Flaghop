/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Independent project documents; opening a result never mounts the explorer. */
const documentBase = location.pathname.replace(/\/(filesystem|editor)$/, '');
const documentQuery = new URLSearchParams(location.search);
function fileWindow(path) {
    window.open(documentBase + '/editor?' + new URLSearchParams({path}), '_blank', 'noopener');
}
function filesWindow() { window.open(documentBase + '/filesystem', '_blank', 'noopener'); }

function documentText(bytes) {
    try {if (bytes.includes(0)) throw Error('binary'); return {text: new TextDecoder('utf-8', {fatal: true}).decode(bytes), binary: false};}
    catch (_) {return {text: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' '), binary: true};}
}
async function openHubResult(id) {
    await filesSessionReady;
    const response = await fetch(documentBase + '/background/results/' + encodeURIComponent(id), {cache: 'no-store'});
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Result unavailable');
    const value = documentText(Uint8Array.from(atob(result.data_b64), c => c.charCodeAt(0)));
    const artifact = result.artifact, path = 'saved-result://' + documentBase + '/' + id;
    if (editorTabs.has(path)) activateEditor(path);
    else createEditor({path, name: artifact.display_name || artifact.result_path.split('/').pop(), kind: 'file', size: artifact.size}, value.text, value.binary || result.truncated || artifact.state === 'partial');
    const tab = currentEditor();
    tab.sourcePath = artifact.result_path;
    tab.origins = artifact.origins;
    tab.binary = value.binary;
    tab.partial = result.truncated || artifact.state === 'partial';
    refreshDocumentChrome();
    // Read/handled notification state is separate from the artifact and provenance.
    await fetch(documentBase + '/background/alerts/' + encodeURIComponent(id) + '/dismiss', {method: 'POST'});
}
async function openHubPath(path) {
    await filesSessionReady;
    const result = await api('/api/preview?' + new URLSearchParams({path}));
    const value = documentText(Uint8Array.from(atob(result.data_b64), c => c.charCodeAt(0)));
    createEditor({path, name: path.split('/').pop(), kind: 'file', size: result.size}, value.text, value.binary || result.truncated);
    currentEditor().binary = value.binary; currentEditor().partial = result.truncated;
    refreshDocumentChrome();
}

// The explorer opens documents in another tab/window, preserving its own directory.
if (!editorOnly) preview = function(entry) {fileWindow(entry.path); return Promise.resolve();};

const originalRefresh = editorRefresh;
editorRefresh = function(tab) {originalRefresh(tab); refreshDocumentChrome();};
const originalActivate = activateEditor;
activateEditor = function(path) {originalActivate(path); refreshDocumentChrome();};
function refreshDocumentChrome() {
    const tab = currentEditor();
    if (!tab) return;
    document.title = tab.entry.name + ' · Text Editor';
    $('editor-title').textContent = (editorDirty(tab) ? '•  ' : '') + tab.entry.name;
    $('editor-path').textContent = tab.partial ? 'Partial preview' : tab.readOnly ? 'Read-only' : tab.local || editorDirty(tab) ? 'Draft' : session?.project_name || '';
    $('editor-path').title = tab.sourcePath || tab.entry.path;
    $('editor-tabs').hidden = editorTabs.size < 2;
    $('editor-message').hidden = true;
    $('editor-state').textContent = '';
}
const header = document.querySelector('.editor-header'), title = document.querySelector('.editor-title');
const left = document.createElement('div'), right = document.createElement('div');
left.className = 'document-title-left'; right.className = 'document-title-right';
left.append($('editor-files'), $('native-new-document'));
right.append($('native-info'), $('native-menu'));
const minimize = document.createElement('button'), maximize = document.createElement('button');
minimize.className = maximize.className = 'icon-button document-window-control';
minimize.setAttribute('aria-label', 'Minimize editor'); maximize.setAttribute('aria-label', 'Maximize editor');
minimize.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 12h10"/></svg>';
maximize.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 7h10v10H7Z"/></svg>';
minimize.onclick = () => window.legionDesktop?.minimize();
maximize.onclick = () => window.legionDesktop?.toggleMaximize();
const close = $('editor-minimize');
close.classList.add('document-window-control'); close.setAttribute('aria-label', 'Close editor'); close.title = 'Close editor';
// Existing editor actions still address this control even though it is not in the title bar.
document.querySelector('.editor-actions').append($('editor-save'));
right.append(minimize, maximize, close); header.replaceChildren(left, title, right);
$('native-new-document').innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 17V5h10l4 4v10M9 16h8m-4-4v8"/></svg>';
$('editor-files').innerHTML = 'Open <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
$('editor-files').classList.add('document-open-button');
const chooser = document.createElement('input'); chooser.type = 'file'; chooser.multiple = true; chooser.hidden = true;
chooser.onchange = async () => {
    for (const file of chooser.files) {
        const value = documentText(new Uint8Array(await file.slice(0, 65536).arrayBuffer()));
        createEditor({path: 'local-open://' + file.name + '/' + file.lastModified, name: file.name, kind: 'file', size: file.size}, value.text, value.binary || file.size > 65536);
        refreshDocumentChrome();
    }
    chooser.value = '';
};
document.body.append(chooser);
$('editor-files').onclick = $('editor-open').onclick = () => chooser.click();
$('native-files').onclick = () => {nativeMenuClose(); filesWindow();};
let closingDocumentWindow = false;
function closeDocumentWindow() {
    const dirty = [...editorTabs.values()].find(tab => !tab.readOnly && editorDirty(tab));
    if (dirty) {closingDocumentWindow = true; requestCloseEditor(dirty.entry.path); return;}
    if (window.legionDesktop) window.legionDesktop.close(); else window.close();
}
const originalRemove = removeEditor;
removeEditor = function(path) {originalRemove(path); refreshDocumentChrome(); if (closingDocumentWindow) closeDocumentWindow();};
$('draft-cancel').addEventListener('click', () => {closingDocumentWindow = false;});
close.onclick = closeDocumentWindow;
showFiles = function() {if (editorOnly) closeDocumentWindow(); else $('text-editor').hidden = true;};
function nativeWindowAvailable() {
    const desktop = Boolean(window.legionDesktop);
    minimize.hidden = maximize.hidden = !desktop;
    document.documentElement.classList.toggle('document-native-window', desktop);
    document.documentElement.classList.toggle('document-maximized', Boolean(window.legionDesktop?.maximized));
    filesControls.hidden = !desktop;
}
const filesControls = document.createElement('div'); filesControls.className = 'files-window-controls';
for (const [label, shape, action] of [
    ['Minimize Files', 'M7 12h10', () => window.legionDesktop?.minimize()],
    ['Maximize Files', 'M7 7h10v10H7Z', () => window.legionDesktop?.toggleMaximize()],
    ['Close Files', 'm7 7 10 10M17 7 7 17', () => window.legionDesktop?.close()],
]) {
    const button = document.createElement('button'); button.className = 'icon-button document-window-control'; button.setAttribute('aria-label', label);
    button.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + shape + '"/></svg>'; button.onclick = action; filesControls.append(button);
}
document.querySelector('.toolbar').append(filesControls);
for (const titlebar of [document.querySelector('.toolbar'), document.querySelector('.sidebar-head')]) {
    titlebar.addEventListener('pointerdown', event => {if (event.button === 0 && !event.target.closest('button,input,.breadcrumb')) window.legionDesktop?.startMove();});
}
for (const edge of ['top','bottom','left','right','top-left','top-right','bottom-left','bottom-right']) {
    const grip = document.createElement('div'); grip.className = 'document-resize-edge'; grip.dataset.edge = edge;
    grip.onpointerdown = event => {if (event.button === 0) {event.preventDefault(); window.legionDesktop?.resizeEdge(edge);}}; document.body.append(grip);
}
addEventListener('legion-desktop-changed', nativeWindowAvailable); nativeWindowAvailable();
header.addEventListener('pointerdown', event => {if (event.button === 0 && !event.target.closest('button,input')) window.legionDesktop?.startMove();});
header.addEventListener('dblclick', event => {if (!event.target.closest('button,input')) window.legionDesktop?.toggleMaximize();});
addEventListener('beforeunload', event => {
    if ([...editorTabs.values()].some(tab => !tab.readOnly && editorDirty(tab))) {event.preventDefault(); event.returnValue = '';}
});
if (editorOnly) {
    $('text-editor').hidden = false;
    const result = documentQuery.get('result'), path = documentQuery.get('path');
    const pending = result ? openHubResult(result) : path ? openHubPath(path) : filesSessionReady.then(() => newLocalDocument());
    void pending.catch(error => {editorNotice(error.message); $('editor-state').classList.add('document-error');});
}
