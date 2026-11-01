import {useSyncExternalStore} from 'react';
import type {ActivityController} from './controller';
import {AnsiOutput, IconButton} from './shared';
import {copyTextToClipboard} from '../../../app/web/static/js/workspace/process_output.js';
import {setWorkspaceStatus} from '../../../app/web/static/js/workspace/dom.js';

function download(text: string, filename: string) {
  if (!text) {setWorkspaceStatus('No output to download', true); return;}
  const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  URL.revokeObjectURL(url); setWorkspaceStatus(`${filename} downloaded`);
}

export function ProcessOutputPanel({controller}: {controller: ActivityController}) {
  const state = useSyncExternalStore(controller.output.store.subscribe, controller.output.store.getSnapshot);
  return <>
    <div className="panel-header modal-header"><h2 id="process-output-modal-title">Process Output</h2><p id="process-output-meta">{state.meta}</p>
      <IconButton id="process-output-modal-close" className="modal-close-btn" label="Close dialog" icon="fa-solid fa-xmark" onClick={() => controller.output.close()}/></div>
    <div className="modal-actions modal-toolbar-actions">
      <IconButton id="process-output-refresh-button" label="Refresh" icon="fa-solid fa-rotate-right" disabled={state.loading || !state.id} onClick={() => {void controller.output.refresh();}}/>
      <IconButton id="process-output-copy-button" label="Copy to Clipboard" icon="fa-regular fa-copy" onClick={() => {void copyTextToClipboard(state.text, 'Process output copied to clipboard', 'No process output to copy');}}/>
      <IconButton id="process-output-download-button" label="Download .txt" icon="fa-solid fa-download" onClick={() => download(state.text, `process-${state.id}-output.txt`)}/>
    </div>
    {state.error && <p role="alert">{state.error}</p>}
    {state.history && <p role="note">{state.history}</p>}
    <div className="process-command-block"><div className="process-command-header"><span>Command</span>
      <IconButton id="process-output-command-copy" label="Copy command" icon="fa-regular fa-copy" onClick={() => {void copyTextToClipboard(state.command, 'Command copied to clipboard', 'No command to copy');}}/></div>
      <div id="process-output-command" className="process-command-text">{state.command}</div></div>
    <div className="process-command-block"><div className="process-command-header"><span>Progress</span></div>
      <div id="process-output-progress" className="process-command-text">{state.progress || 'No structured progress reported'}</div></div>
    <div className="process-command-block process-output-block"><div className="process-command-header"><span>Output</span></div>
      <AnsiOutput id="process-output-text" text={state.text}/></div>
  </>;
}
