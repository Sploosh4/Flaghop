import {createRoot} from 'react-dom/client';
import {connectReactWorkspace} from '../../app/web/static/js/workspace/react_bridge.js';
import {beginRename, updateJobs, updateProject} from './store';
import {WorkspaceIdentity} from './WorkspaceIdentity';
import {JobsTable} from './JobsTable';
import {mountActivity} from './activity/mount';
import '../../app/web/static/js/legion.js';
import '../../app/web/static/js/workspace.js';

window.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('workspace-identity-sidebar');
  const title = document.getElementById('workspace-identity-title');
  const sidebarEditor = document.querySelector<HTMLElement>('.workspace-project-shell');
  const titleEditor = document.querySelector<HTMLElement>('.workspace-breadcrumb');
  const identityRoot = document.getElementById('workspace-react-root');
  const jobsRoot = document.getElementById('jobs-body');
  if (!sidebar || !title || !sidebarEditor || !titleEditor || !identityRoot || !jobsRoot) {
    throw new Error('Workspace component mount points are missing.');
  }
  // Clear only these server-rendered placeholders. React exclusively owns their descendants.
  sidebar.replaceChildren(); title.replaceChildren(); jobsRoot.replaceChildren();
  connectReactWorkspace({updateJobs, updateProject, beginRename});
  mountActivity();
  createRoot(identityRoot).render(<WorkspaceIdentity sidebar={sidebar} title={title} sidebarEditor={sidebarEditor} titleEditor={titleEditor}/>);
  createRoot(jobsRoot).render(<JobsTable/>);
  identityRoot.dataset.framework = 'react'; jobsRoot.dataset.framework = 'react';
});
