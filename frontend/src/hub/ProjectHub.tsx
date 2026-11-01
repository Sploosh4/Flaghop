import {useCallback, useEffect, useRef, useState} from 'react';
import type {CSSProperties, KeyboardEvent, MouseEvent, PointerEvent} from 'react';
import * as api from './api';
import type {HubProject, HubSettings} from './api';
import {Icon} from './Icon';
import {useDesktopWindow} from './desktop';
import {WindowControls} from './WindowControls';
import {ProjectLabel} from './ProjectLabel';
import {ProjectOverview, ProjectSetup, Setup} from './pages';
import {Dialog} from './Dialog';
import {Menu} from './Menu';
import {Palette} from './Palette';
import type {Command} from './Palette';
import {ReusedPanel, actionParts, partTitles, settingParts, viewParts} from './parts';
import {readPreference, useSidebarWidth, useActionPanelWidth, writePreference} from './preferences';
import {useLiveWorkspace} from './live';
import {useBackground} from './reader/useBackground';
import {BackgroundControl, BackgroundPanel} from './reader/BackgroundPanel';
import type {HardwareNode} from './hardware/model';
import {hardwareGraph} from './hardware/model';
import {useDeepScans} from './scanner/useDeepScans';
import {RecoveryNotice} from './RecoveryNotice';

const message = (error: unknown) => error instanceof Error ? error.message : String(error);
type Page = 'home' | 'project' | 'project-setup' | 'setup' | 'part' | 'files';
type Form = 'create' | 'save-as' | 'open' | 'details' | null;
type SetupOrigin = {page: Exclude<Page, 'setup'>; part?: string; host?: number; panelReturn: Page};
type Navigation = {project?: string; page: Page; part?: string; host?: number; setupOrigin?: SetupOrigin};

export function ProjectHub() {
  const desktop = useDesktopWindow();
  const titlebarTarget = (target: EventTarget) => target instanceof Element && !target.closest('button,input,select,a,[role="button"]');
  const titlebarPointer = (event: PointerEvent) => {if (event.button === 0 && titlebarTarget(event.target)) desktop?.startMove();};
  const titlebarDoubleClick = (event: MouseEvent) => {if (titlebarTarget(event.target)) desktop?.toggleMaximize();};
  const [projects, setProjects] = useState<HubProject[]>([]), [settings, setSettings] = useState<HubSettings | null>(null);
  const [selected, setSelected] = useState<HubProject | null>(null), [page, setPage] = useState<Page>('home');
  const background = useBackground(selected, openResult);
  const scans = useDeepScans(selected);
  const [query, setQuery] = useState(''), [dialog, setDialog] = useState<Form>(null), [name, setName] = useState('');
  const [error, setError] = useState(''), [status, setStatus] = useState('Ready'), [busy, setBusy] = useState(false);
  const [palette, setPalette] = useState(false), [ready, setReady] = useState(false), [renameRequest, setRenameRequest] = useState(0);
  const [part, setPart] = useState(''), [host, setHost] = useState<number>();
  const [colorful, setColorful] = useState(document.body.classList.contains('colorful-background'));
  const [menu, setMenu] = useState<{project: HubProject; x: number; y: number} | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readPreference<boolean>('sidebarCollapsed', false) === true);
  const {width, resize} = useSidebarWidth(), live = useLiveWorkspace();
  const actions = useActionPanelWidth();
  const [hardwareSelection, setHardwareSelection] = useState<{projectId: string; node: HardwareNode | null} | null>(null);
  const selectHardware = useCallback((node: HardwareNode | null) => setHardwareSelection(selected ? {projectId: selected.id, node} : null), [selected?.id]);
  useEffect(() => setHardwareSelection(null), [selected?.id, page]);
  const pending = useRef(false), navigation = useRef(0), listRequest = useRef(0), focusSidebar = useRef(false);
  const restoreInput = useRef<HTMLInputElement>(null), returnPage = useRef<Page>('project');
  const setupOrigin = useRef<SetupOrigin | undefined>(undefined);

  async function refreshProjects() {
    const request = ++listRequest.current, rows = await api.projects();
    if (request === listRequest.current) setProjects(rows);
    return rows;
  }
  async function run(operation: () => Promise<Awaited<ReturnType<typeof api.openProject>>>, keepPage = false) {
    if (pending.current) throw new Error('A project operation is already running.');
    const token = ++navigation.current;
    pending.current = true; setBusy(true); setError('');
    try {
      const data = await operation();
      await refreshProjects(); live.refresh();
      if (token === navigation.current) {setSelected(data.project); if (!keepPage) setPage('project'); setStatus('Ready');}
      return data;
    } catch (error) {if (token === navigation.current) setError(message(error)); throw error;}
    finally {pending.current = false; setBusy(false);}
  }
  function ignore(operation: Promise<unknown>) {void operation.catch(() => {});}
  useEffect(() => {
    let active = true;
    void refreshProjects().then(async rows => {
      const saved = readPreference<Navigation | null>('hubNavigation', null);
      if (!active || navigation.current || !saved) return;
      const origin = saved.setupOrigin;
      if (origin && ['home', 'project', 'project-setup', 'part', 'files'].includes(origin.page) && (origin.page !== 'part' || (origin.part && partTitles[origin.part]))) setupOrigin.current = origin;
      const project = rows.find(row => row.id === saved.project);
      if (project) {
        await run(() => api.openProject(project.id));
        if (!active || navigation.current !== 1) return;
        if (saved.page === 'setup') setPage('setup');
        if (saved.page === 'project-setup') setPage('project-setup');
        // Old embedded Files navigation restores Overview; popups require a user click.
        if (saved.page === 'part' && saved.part && partTitles[saved.part]) {setPart(saved.part); setHost(saved.host); setPage('part');}
      } else if (saved.page === 'setup' && !saved.project) setPage('setup');
    }).catch(error => {if (active) setError(message(error));}).finally(() => {if (active) setReady(true);});
    void api.settings().then(setSettings).catch(error => {if (active) setError(message(error));});
    return () => {active = false;};
  }, []);
  useEffect(() => {if (ready) writePreference('hubNavigation', {project: selected?.id, page, part, host, setupOrigin: setupOrigin.current});}, [ready, selected?.id, page, part, host]);
  useEffect(() => {
    writePreference('sidebarCollapsed', sidebarCollapsed);
    if (focusSidebar.current) {focusSidebar.current = false; document.getElementById(sidebarCollapsed ? 'hub-sidebar-reopen' : 'hub-sidebar-toggle')?.focus();}
  }, [sidebarCollapsed]);
  useEffect(() => {
    const key = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {event.preventDefault(); event.stopImmediatePropagation(); setPalette(value => !value);}
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && selected && !dialog && !palette) {event.preventDefault(); event.stopImmediatePropagation(); if (event.shiftKey) form('save-as', `${selected.name} copy`); else ignore(save(selected));}
      if (selected && !dialog && !palette && !menu && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing
        && !(event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"],[role="menu"]'))
        && (page === 'project' || page === 'files' || (page === 'part' && part === 'services'))) {
        const key = event.key.toLowerCase();
        if (['q', 'w', 'e'].includes(key)) {event.preventDefault(); if (key === 'q') overview(); if (key === 'w') openPart('services'); if (key === 'e') openFiles();}
      }
    };
    document.addEventListener('keydown', key, true);
    return () => document.removeEventListener('keydown', key, true);
  }, [selected, dialog, palette, menu, page, part]);

  function home() {navigation.current++; setPage('home'); setSelected(null); setError(''); setMenu(null);}
  function setup() {
    navigation.current++; setError('');
    if (page === 'setup') {
      const previous = setupOrigin.current;
      setPart(previous?.part || ''); setHost(previous?.host);
      returnPage.current = previous?.panelReturn || (selected ? 'project' : 'home');
      setPage((previous?.page === 'project' || previous?.page === 'project-setup') && !selected ? 'home' : previous?.page || (selected ? 'project' : 'home'));
    } else {
      setupOrigin.current = {page, part, host, panelReturn: returnPage.current};
      setPage('setup');
    }
  }
  function overview() {navigation.current++; setPage('project'); setError('');}
  function projectSetup() {navigation.current++; setPage('project-setup'); setError('');}
  function openFiles() {
    if (!selected) return;
    window.open(api.filesystemUrl(selected.id), '_blank', 'noopener');
  }
  function openResult(resultId: string) {if (selected) window.open(api.editorUrl(selected.id, resultId), '_blank', 'noopener');}
  function toggleSidebar(collapsed: boolean) {focusSidebar.current = true; setSidebarCollapsed(collapsed);}
  function form(next: Form, value = '') {setMenu(null); setError(''); setName(value); setDialog(next);}
  function openPart(next: string, hostId?: number) {navigation.current++; if (page !== 'part') returnPage.current = page; setPart(next); setHost(hostId); setPage('part'); setError('');}
  function closePart() {setPage(returnPage.current); live.refresh();}
  function displayChanged(enabled: boolean) {document.body.classList.toggle('colorful-background', enabled); setColorful(enabled);}
  async function ensureProject(project: HubProject) {if (selected?.id !== project.id) await run(() => api.openProject(project.id));}
  async function save(project: HubProject) {await ensureProject(project); await run(() => api.saveProject(project.id), true); setStatus('Saved');}
  async function rename(name: string) {if (selected) await run(() => api.renameProject(selected.id, name), true);}
  function context(event: MouseEvent | KeyboardEvent, project: HubProject) {
    if ('key' in event && event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({project, x: 'clientX' in event ? event.clientX : rect.left, y: 'clientY' in event ? event.clientY : rect.bottom});
  }
  async function submit() {
    if (!name.trim() || busy) return;
    try {
      if (dialog === 'open') await run(() => api.openPath(name.trim()));
      else if (dialog === 'save-as' && selected) await run(() => api.saveProjectAs(selected.id, name.trim()));
      else await run(() => api.createProject(name.trim()));
      setDialog(null);
    } catch { /* Keep the form and actionable error visible. */ }
  }
  async function projectAction(project: HubProject, action: string) {
    try {
      await ensureProject(project);
      if (action === 'rename') {setSidebarCollapsed(false); setRenameRequest(value => value + 1);}
      if (action === 'save') await save(project);
      if (action === 'save-as') form('save-as', `${project.name} copy`);
      if (action === 'details') form('details');
      if (action === 'export') {const link = document.createElement('a'); link.href = api.bundleUrl(project.id); link.download = ''; link.click();}
    } catch (error) {setError(message(error));}
  }
  const visible = projects.filter(project => project.name.toLowerCase().includes(query.toLowerCase()));
  const commands: Command[] = [
    ...projects.map(project => ({id: `project-${project.id}`, label: project.name, detail: 'Project', run: () => ignore(run(() => api.openProject(project.id)))})),
    {id: 'home', label: 'Projects', detail: 'View', run: home}, {id: 'setup', label: 'Setup', detail: 'View', run: setup},
    {id: 'create', label: 'New project', detail: 'Action', run: () => form('create')}, {id: 'open', label: 'Open project', detail: 'Action', run: () => form('open')},
    {id: 'restore', label: 'Restore ZIP', detail: 'Action', run: () => restoreInput.current?.click()},
    ...Object.entries(settingParts).map(([id, label]) => ({id, label, detail: 'Settings', run: () => openPart(id)})),
  ];
  if (selected) {
    commands.push({id: 'overview', label: 'Overview', detail: 'View', run: overview});
    commands.push({id: 'project-setup', label: 'Project setup', detail: 'View', run: projectSetup});
    commands.push({id: 'files', label: 'Files', detail: 'View', run: () => openFiles()});
    for (const [id, label] of Object.entries({...viewParts, ...actionParts})) commands.push({id, label, detail: viewParts[id] ? 'View' : 'Action', run: () => openPart(id)});
    for (const [id, label] of Object.entries({rename: 'Rename project', save: 'Save project', 'save-as': 'Save project as', export: 'Export ZIP', details: 'Workspace details'})) commands.push({id, label, detail: 'Action', run: () => ignore(projectAction(selected, id))});
    const hosts = live.snapshot?.hosts;
    if (Array.isArray(hosts)) for (const item of hosts) {
      if (item && typeof item === 'object' && 'id' in item && 'ip' in item) commands.push({id: `host-${item.id}`, label: `${item.ip} ${'hostname' in item ? item.hostname || '' : ''}`.trim(), detail: 'Host', run: () => openPart('hosts', Number(item.id))});
    }
  }
  const jobs = live.snapshot?.jobs?.filter(job => job.status === 'running' || job.status === 'queued') || [];
  const metadata = document.getElementById('project-hub-root')?.dataset;
  const currentDetails = live.snapshot?.project.name === selected?.path ? live.snapshot?.project : null;
  const menuItems = menu ? Object.entries({rename: 'Rename project', save: 'Save', 'save-as': 'Save as…', export: 'Export ZIP', details: 'Workspace details'}).map(([action, label]) => ({label, disabled: busy, run: () => ignore(projectAction(menu.project, action))})) : [];
  const title = page === 'setup' ? 'Setup' : page === 'project-setup' ? 'Project setup' : page === 'files' ? 'Files' : page === 'part' ? partTitles[part] : 'Overview';
  const hardwareTarget = page === 'project' && hardwareSelection && hardwareSelection.projectId === selected?.id && hardwareSelection.node?.kind === 'host' ? hardwareSelection.node : null;
  const scanTargets = selected ? hardwareGraph(selected, live.snapshot, settings, null).nodes.filter(node => node.kind === 'host') : [];
  const showResults = selected && ['project', 'project-setup', 'files'].includes(page);
  return <div className={`hub-app${sidebarCollapsed ? ' hub-collapsed' : ''}${desktop ? ' hub-desktop' : ''}`} style={{'--hub-sidebar-width': `${width}px`, '--hub-actions-width': `${actions.width}px`} as CSSProperties}>
    {colorful && <div className="logo-watermark" aria-hidden="true"><pre>{(window as typeof window & {LEGION_CONSOLE_LOGO_ART?: string}).LEGION_CONSOLE_LOGO_ART || ''}</pre></div>}
    <aside id="hub-sidebar" className="hub-sidebar" aria-label="Projects" hidden={sidebarCollapsed}>
      <div className="hub-brand-row" onPointerDown={titlebarPointer} onDoubleClick={titlebarDoubleClick}><button className="hub-brand" onClick={home}><span className="hub-logo" aria-hidden="true">F</span>FlagHop</button><button id="hub-sidebar-toggle" className="hub-sidebar-toggle" aria-label="Collapse sidebar" title="Collapse sidebar" aria-controls="hub-sidebar" aria-expanded={!sidebarCollapsed} onClick={() => toggleSidebar(true)}><Icon kind="left"/></button></div>
      {selected ? <div className="hub-project-context">
        <div className="hub-project-heading" onContextMenu={event => context(event, selected)} onKeyDown={event => context(event, selected)} tabIndex={0} aria-label={`${selected.name} project actions`}><span className="hub-avatar" aria-hidden="true">FH</span><ProjectLabel key={selected.id} name={selected.name} onRename={rename} request={renameRequest} doubleClick/></div>
        <button className="hub-search" onClick={() => setPalette(true)}><Icon kind="search"/><span>Search workspace</span><kbd>Ctrl K</kbd></button>
        <nav aria-label={`${selected.name} tabs`}>
          <button className="hub-overview-tab" aria-current={page === 'project' ? 'page' : undefined} onClick={overview}><Icon kind="home"/>Overview</button>
          <button className="hub-overview-tab hub-project-setup-tab" aria-current={page === 'project-setup' ? 'page' : undefined} onClick={projectSetup}><Icon kind="gear"/>Project setup</button>
          <button className="hub-overview-tab" aria-current={page === 'files' ? 'page' : undefined} onClick={() => openFiles()}><Icon kind="file"/>Files</button>
        </nav>
      </div> : <>
        <label className="hub-search"><Icon kind="search"/><input id="hub-search" aria-label="Search projects" placeholder="Search projects" value={query} onChange={event => setQuery(event.target.value)}/><button aria-label="Search workspace" onClick={() => setPalette(true)}><kbd>Ctrl K</kbd></button></label>
        <div className="hub-section-label"><span>Projects</span><button id="hub-new-project" aria-label="New project" disabled={busy} onClick={() => form('create')}>+</button></div>
        <div className="hub-projects">{visible.map(project => <button key={project.id} className="hub-project" data-hub-project={project.id} disabled={busy} onContextMenu={event => context(event, project)} onKeyDown={event => context(event, project)} onClick={() => ignore(run(() => api.openProject(project.id)))}><span className="hub-avatar" aria-hidden="true">FH</span><span>{project.name}</span></button>)}</div>
      </>}
      <button id="hub-setup" className="hub-setup needs-setup" onClick={setup} aria-label="Setup — VPN not configured" aria-current={page === 'setup' ? 'page' : undefined}><Icon kind="gear"/><span>Setup</span><span className="hub-dot"/></button>
      <div className="hub-resizer" role="separator" aria-label="Resize sidebar" aria-orientation="vertical" aria-valuemin={210} aria-valuemax={340} aria-valuenow={width} tabIndex={0} {...resize}/>
    </aside>
    <main className="hub-main">
      <header className="hub-header" onPointerDown={titlebarPointer} onDoubleClick={titlebarDoubleClick}>{sidebarCollapsed && <button id="hub-sidebar-reopen" className="hub-sidebar-toggle" aria-label="Show sidebar" title="Show sidebar" aria-controls="hub-sidebar" aria-expanded="false" onClick={() => toggleSidebar(false)}><Icon kind="right"/></button>}{sidebarCollapsed && <button className="hub-collapsed-brand" onClick={home}>FlagHop</button>}{selected ? <><span className="hub-avatar" aria-hidden="true">FH</span><ProjectLabel key={selected.id} name={selected.name} onRename={rename}/><span className="hub-divider">/</span><span>{title}</span></> : <span>{page === 'setup' || page === 'part' ? title : 'Projects'}</span>}{selected && <BackgroundControl {...background}/>}<button className="hub-header-details" aria-label="Workspace details" title="Workspace details" onClick={() => form('details')}>ⓘ</button>{desktop && <WindowControls desktop={desktop}/>}</header>
      {error && !dialog && <p className="hub-error" role="alert">{error}</p>}
      <RecoveryNotice/>
      <div className="hub-workspace-body"><div className={`hub-content${page === 'part' ? ' hub-content-part' : ''}${page === 'project' || page === 'project-setup' ? ' hub-content-project' : ''}${page === 'project' ? ' hub-content-hardware' : ''}${page === 'files' ? ' hub-content-files' : ''}`}>
        {page === 'home' && <section className="hub-home" aria-label="Project home"><span className="hub-home-mark">F</span><h1>Projects</h1><div className="hub-home-list">{visible.map(project => <button key={project.id} disabled={busy} onContextMenu={event => context(event, project)} onKeyDown={event => context(event, project)} onClick={() => ignore(run(() => api.openProject(project.id)))}><span className="hub-avatar" aria-hidden="true">FH</span><span>{project.name}</span></button>)}</div><div className="hub-home-actions"><button className="hub-create-link" disabled={busy} onClick={() => form('create')}>+ New project</button><button disabled={busy} onClick={() => form('open')}>Open project</button><button disabled={busy} onClick={() => restoreInput.current?.click()}>Restore ZIP</button></div></section>}
        {page === 'project' && selected && <ProjectOverview key={selected.id} project={selected} snapshot={live.snapshot} settings={settings}
          onSelect={selectHardware} onOpen={id => openPart('hosts', id)} onSetup={projectSetup} onServices={() => openPart('services')} onFiles={() => openFiles()}/>}
        {page === 'project-setup' && selected && <ProjectSetup key={selected.id} project={selected} onChange={next => setSelected(current => current?.id === next.id ? next : current)}/>}
        {page === 'setup' && <Setup settings={settings} openPart={openPart} onSettingsChange={setSettings}/>}
        {page === 'part' && <ReusedPanel part={part} host={host} close={closePart} displayChanged={displayChanged} statusChanged={setStatus}/>}
      </div>{showResults && <><div className="hub-actions-resizer" role="separator" aria-label="Resize action panel" aria-orientation="vertical" aria-valuemin={280} aria-valuemax={480} aria-valuenow={actions.width} tabIndex={0} {...actions.resize}/><BackgroundPanel {...background} scans={scans} project={selected} targets={scanTargets} target={hardwareTarget} header={hardwareTarget && <div className="hardware-context" aria-label="Selected device"><div>{hardwareTarget.ip && <span>{hardwareTarget.ip}</span>}{hardwareTarget.hostname && <small>{hardwareTarget.hostname}</small>}{hardwareTarget.os && <small>{hardwareTarget.os}</small>}</div><button onClick={() => openPart('hosts', hardwareTarget.hostId)}>Details</button></div>}/></>}</div>
      <span className="hub-status-announcement" role="status">{busy ? 'Working…' : status}</span>
    </main>
    {desktop && !desktop.maximized && <div className="hub-window-edges" aria-hidden="true">{['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].map(edge => <div key={edge} data-window-edge={edge} onPointerDown={event => {if (event.button === 0) {event.preventDefault(); desktop.resizeEdge(edge);}}}/>)}</div>}
    <input ref={restoreInput} type="file" accept=".zip,application/zip" hidden aria-label="Restore workspace ZIP" onChange={event => {const file = event.target.files?.[0]; if (file) ignore(run(() => api.restoreZip(file))); event.target.value = '';}}/>
    {menu && <Menu items={menuItems} x={menu.x} y={menu.y} close={() => setMenu(null)}/>}
    {palette && <Palette commands={commands} close={() => setPalette(false)}/>}
    {dialog && <Dialog title={dialog === 'create' ? 'New project' : dialog === 'save-as' ? 'Save project as' : dialog === 'open' ? 'Open project' : 'Workspace details'} close={() => {if (!busy) setDialog(null);}}>{dialog === 'details' ? <><dl className="hub-details">{Object.entries({Project: selected?.name, File: selected?.path, Folder: selected?.folder, Output: currentDetails?.output_folder, Running: currentDetails?.running_folder, Autosave: currentDetails?.autosave?.last_saved_at || '—', 'Autosave error': currentDetails?.autosave?.last_error || '—', Status: busy ? 'Working…' : status, 'Running / queued jobs': String(jobs.length), Connection: live.connection, Version: metadata?.version, Bind: metadata?.bind || 'Localhost only', Authentication: metadata?.auth || 'No auth'}).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl><div className="hub-modal-actions"><button onClick={() => setDialog(null)}>Close</button></div></> : <form onSubmit={event => {event.preventDefault(); void submit();}}><input aria-label={dialog === 'open' ? 'Project path' : 'Project name'} maxLength={dialog === 'open' ? undefined : 120} autoComplete="off" value={name} disabled={busy} onChange={event => setName(event.target.value)}/>{error && <p className="hub-error" role="alert">{error}</p>}<div className="hub-modal-actions"><button type="button" disabled={busy} onClick={() => setDialog(null)}>Cancel</button><button className="hub-primary" disabled={busy || !name.trim()}>{busy ? 'Working…' : dialog === 'open' ? 'Open' : dialog === 'save-as' ? 'Save' : 'Create'}</button></div></form>}</Dialog>}
  </div>;
}
