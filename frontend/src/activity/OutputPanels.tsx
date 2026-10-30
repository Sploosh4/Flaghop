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
    <div className="process-command-block"><div className="process-command-header"><span>Command</span>
      <IconButton id="process-output-command-copy" label="Copy command" icon="fa-regular fa-copy" onClick={() => {void copyTextToClipboard(state.command, 'Command copied to clipboard', 'No command to copy');}}/></div>
      <div id="process-output-command" className="process-command-text">{state.command}</div></div>
    <div className="process-command-block"><div className="process-command-header"><span>Progress</span></div>
      <div id="process-output-progress" className="process-command-text">{state.progress || 'No structured progress reported'}</div></div>
    <div className="process-command-block process-output-block"><div className="process-command-header"><span>Output</span></div>
      <AnsiOutput id="process-output-text" text={state.text}/></div>
  </>;
}

export function ProviderLogsPanel({controller, close}: {controller: ActivityController; close(): void}) {
  const state = useSyncExternalStore(controller.logs.subscribe, controller.logs.getSnapshot);
  const structured = state.logs.filter(row => row.prompt_metadata?.structured_output_used).length;
  const fallback = state.logs.filter(row => row.prompt_metadata?.structured_output_fallback).length;
  return <>
    <div className="panel-header modal-header"><h2 id="provider-logs-modal-title">Provider Logs</h2>
      <p id="provider-logs-meta">{state.loading ? 'Loading logs...' : `Entries ${state.logs.length} | structured ${structured} | fallback ${fallback} | bytes ${state.text.length}`}</p>
      <IconButton id="provider-logs-modal-close" className="modal-close-btn" label="Close dialog" icon="fa-solid fa-xmark" onClick={close}/></div>
    <div className="modal-actions">
      <button id="provider-logs-refresh-button" type="button" disabled={state.loading} onClick={() => {void controller.actions.loadProviderLogs();}}>Refresh</button>
      <button id="provider-logs-copy-button" type="button" onClick={() => {void copyTextToClipboard(state.text, 'Provider logs copied to clipboard', 'No provider logs to copy');}}>Copy to Clipboard</button>
      <button id="provider-logs-download-button" type="button" onClick={() => download(state.text, `provider-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`)}>Download .txt</button>
    </div>
    {state.error && <p role="alert">{state.error}</p>}
    <label>Log Output<AnsiOutput id="provider-logs-text" text={state.text}/></label>
  </>;
}
