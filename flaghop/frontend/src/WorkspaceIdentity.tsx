import {useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {renameProject} from './api/client';
import {projectStore, renameStore, updateProject, workspaceLabel} from './store';
import {renderProject} from '../../app/web/static/js/workspace/project_view.js';
import {setActionStatus} from '../../app/web/static/js/workspace/dom.js';

type Location = 'sidebar' | 'title';
interface Editing {path: string; originalName: string; location: Location}
interface Props {sidebar: HTMLElement; title: HTMLElement; sidebarEditor: HTMLElement; titleEditor: HTMLElement}

export function WorkspaceIdentity({sidebar, title, sidebarEditor, titleEditor}: Props) {
  const project = useSyncExternalStore(projectStore.subscribe, projectStore.getSnapshot);
  const request = useSyncExternalStore(renameStore.subscribe, renameStore.getSnapshot);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const activeEditing = useRef<Editing | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const label = workspaceLabel(project);

  function begin(location: Location) {
    if (pending.current || !project.name) return;
    const next = {path: project.name, originalName: label, location};
    activeEditing.current = next; setEditing(next);
    setDraft(label); setError('');
  }
  function finish(restoreFocus = false) {
    const anchor = editing?.location === 'sidebar' ? sidebar.closest('button') : title.querySelector('button');
    activeEditing.current = null; setEditing(null); setError('');
    if (restoreFocus) requestAnimationFrame(() => (anchor as HTMLElement | null)?.focus());
  }
  useEffect(() => {if (request.token) begin(request.location);}, [request.token]);
  useLayoutEffect(() => {if (editing) {input.current?.focus(); input.current?.select();}}, [editing?.path, editing?.location]);
  useEffect(() => {
    if (editing && editing.path !== project.name) finish();
  }, [project.name]);

  async function save() {
    if (!editing || activeEditing.current !== editing || pending.current) return;
    if (projectStore.getSnapshot().name !== editing.path) {finish(); return;}
    const name = draft.trim();
    if (name === editing.originalName) {finish(); return;}
    if (!name) {setError('Enter a workspace name.'); input.current?.focus(); return;}
    pending.current = true; setSaving(true); setError('');
    try {
      const renamed = await renameProject(name, editing.path);
      if (projectStore.getSnapshot().name === editing.path) {
        updateProject(renamed); renderProject(renamed); setActionStatus('Workspace renamed');
      }
      finish();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Rename failed.');
      requestAnimationFrame(() => input.current?.focus());
    } finally {pending.current = false; setSaving(false);}
  }
  const inSidebar = editing?.location === 'sidebar';
  const editor = <>
    <input id="workspace-rename-input" type="text" maxLength={120} aria-label="Workspace name"
      ref={input} hidden={!editing} disabled={saving} value={draft} aria-invalid={error ? true : undefined}
      className={inSidebar ? 'workspace-rename-sidebar' : undefined}
      onChange={event => setDraft(event.target.value)} onBlur={() => {void save();}}
      onKeyDown={event => {
        if (event.key === 'Enter') {event.preventDefault(); void save();}
        if (event.key === 'Escape' && !pending.current) {event.preventDefault(); finish(true);}
      }}/>
    <span role="alert" className={`workspace-rename-error${inSidebar ? ' workspace-rename-sidebar-error' : ''}`}>{error}</span>
  </>;
  return <>
    {createPortal(<>
      <strong id="sidebar-project-name" title="Double-click to rename workspace" style={{visibility: inSidebar ? 'hidden' : undefined}}
        onDoubleClick={event => {event.preventDefault(); event.stopPropagation(); begin('sidebar');}}>{label}</strong>
      <small id="sidebar-project-kind">{project.is_temporary ? 'Temporary · save to keep your work' : 'Saved project'}</small>
    </>, sidebar)}
    {createPortal(<button id="breadcrumb-project" type="button" title="Rename workspace" aria-label="Rename workspace"
      hidden={editing?.location === 'title'} onClick={() => begin('title')}>{label}</button>, title)}
    {createPortal(editor, inSidebar ? sidebarEditor : titleEditor)}
  </>;
}
