import {createPortal} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {connectReactActivity} from '../../../app/web/static/js/workspace/activity_bridge.js';
import {applyWorkspaceOverview} from '../../../app/web/static/js/workspace/activity.js';
import {pollSnapshot} from '../../../app/web/static/js/workspace/live_updates.js';
import {setProcessOutputModalOpen} from '../../../app/web/static/js/workspace/process_output.js';
import {closeProviderLogsModalAction} from '../../../app/web/static/js/workspace/dialogs.js';
import {setWorkspaceStatus} from '../../../app/web/static/js/workspace/dom.js';
import {ActivityController} from './controller';
import {panels, updateActivity} from './state';
import {ProcessesTable, ProcessToolbar} from './ProcessesTable';
import {ApprovalsTable} from './ApprovalsTable';
import {DecisionsTable, RationaleFeed, ScansTable} from './HistoryTables';
import {ProcessOutputPanel, ProviderLogsPanel} from './OutputPanels';
import {PanelCount} from './PanelCount';

export function mountActivity() {
  const controller = new ActivityController({applyOverview: applyWorkspaceOverview, refreshSnapshot: pollSnapshot,
    setOutputOpen: setProcessOutputModalOpen, status: setWorkspaceStatus});
  const target = (selector: string) => {
    const node = document.querySelector<HTMLElement>(selector);
    if (!node) throw new Error(`Activity mount point missing: ${selector}`);
    node.replaceChildren(); node.dataset.framework = 'react'; return node;
  };
  const mounts = [
    {node: target('#processes-body'), content: <ProcessesTable controller={controller}/>},
    {node: target('.ribbon-process-actions'), content: <ProcessToolbar controller={controller}/>},
    {node: target('#approvals-body'), content: <ApprovalsTable controller={controller}/>},
    {node: target('#decisions-body'), content: <DecisionsTable/>},
    {node: target('#scan-history-body'), content: <ScansTable/>},
    {node: target('#decision-rationale-body'), content: <RationaleFeed/>},
    {node: target('#process-output-modal > .legion-modal'), content: <ProcessOutputPanel controller={controller}/>},
    {node: target('#provider-logs-modal > .legion-modal'), content: <ProviderLogsPanel controller={controller} close={closeProviderLogsModalAction}/>},
  ];
  ['process-count', 'approval-count', 'decision-count', 'scan-history-count', 'decision-rationale-count'].forEach(id => document.getElementById(id)?.replaceChildren());
  const rootNode = document.createElement('div'); rootNode.id = 'activity-react-root'; document.body.appendChild(rootNode);
  const disconnect = connectReactActivity({update: updateActivity, actions: controller.actions});
  const root = createRoot(rootNode);
  root.render(<>{(Object.keys(panels) as (keyof typeof panels)[]).map(name => <PanelCount key={name} name={name}/>)}
    {mounts.map(({node, content}, index) => createPortal(content, node, String(index)))}</>);
  const dispose = () => {disconnect(); controller.dispose(); root.unmount();};
  window.addEventListener('pagehide', dispose, {once: true});
}
