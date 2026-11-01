import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {ProjectHub} from './ProjectHub';
import * as api from './api';
import type {HubProject} from './api';

vi.mock('./api');
vi.mock('./parts', async importOriginal => {
  const actual = await importOriginal<typeof import('./parts')>();
  return {...actual, ReusedPanel: ({part, host, close}: Parameters<typeof actual.ReusedPanel>[0]) => <section><button aria-label={`Close ${actual.partTitles[part]}`} onClick={close}>×</button><div title={actual.partTitles[part]} data-src={`/?part=${part}${host ? `&host=${host}` : ''}`}/></section>};
});
const harbour: HubProject = {id: 'one', name: 'Harbour', path: '/Documents/Hackathon/Harbour/workspace.legion', folder: '/Documents/Hackathon/Harbour', managed: true, vpn: 'inherit'};
const other: HubProject = {...harbour, id: 'two', name: 'Switchyard'};
const opened = (project: HubProject) => ({project, workspace: {name: project.path, display_name: project.name}});

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.projects).mockResolvedValue([harbour, other]);
  vi.mocked(api.settings).mockResolvedValue({vpn_status: 'unconfigured', computer: {name: 'Fixture laptop', system: 'Linux'}, projects_folder: '/Documents/Hackathon', vpns: []});
  vi.mocked(api.openProject).mockImplementation(async id => opened(id === 'one' ? harbour : other));
  vi.mocked(api.files).mockResolvedValue({files: [], truncated: false});
  vi.mocked(api.snapshot).mockResolvedValue({project: {name: harbour.path}, jobs: [], hosts: [{id: 7, ip: '192.0.2.7', hostname: 'fixture'}]});
  vi.mocked(api.projectNetwork).mockImplementation(async project_id => ({project_id, config_id: `network-${project_id}`, revision: 0, connector: 'networkmanager', configured: false, settings: {}, enforcement_available: true, enforcement_reason: 'Fixture enforcement tools', recent_checks: []}));
  vi.mocked(api.setProjectConnector).mockResolvedValue({status: 'ok'});
  vi.mocked(api.background).mockImplementation(async id => backgroundState(id, false));
  vi.mocked(api.deepScans).mockResolvedValue({runs: []});
  vi.mocked(api.executionRecovery).mockResolvedValue({pending: []});
  vi.mocked(api.documentUrl).mockImplementation((id, path) => '/api/hub/projects/' + id + '/editor?path=' + encodeURIComponent(path));
  vi.spyOn(window, 'open').mockReturnValue(null);
  vi.mocked(api.filesystemUrl).mockImplementation(id => '/api/hub/projects/' + id + '/filesystem');
  vi.mocked(api.editorUrl).mockImplementation((id, result) => '/api/hub/projects/' + id + '/editor?result=' + result);
});

it('collapses the sidebar, remembers it after reload and restores focus when reopened', async () => {
  const user = userEvent.setup();
  const first = render(<ProjectHub/>);
  await user.click(screen.getByRole('button', {name: 'Collapse sidebar'}));
  expect(screen.queryByRole('complementary', {name: 'Projects'})).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Show sidebar'}));
  expect(localStorage.getItem('legion.workspace.sidebarCollapsed')).toBe('true');
  first.unmount();
  render(<ProjectHub/>);
  expect(screen.queryByRole('complementary', {name: 'Projects'})).toBeNull();
  await user.click(screen.getByRole('button', {name: 'Show sidebar'}));
  expect(sidebar().getByRole('button', {name: 'FlagHop'})).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Collapse sidebar'}));
  expect(localStorage.getItem('legion.workspace.sidebarCollapsed')).toBe('false');
});

it('keeps the open project and Setup selection when the sidebar is toggled', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}));
  await user.click(sidebar().getByRole('button', {name: 'Collapse sidebar'}));
  expect(screen.getByRole('heading', {name: 'Fixture laptop'})).toBeTruthy();
  await user.click(screen.getByRole('button', {name: 'Show sidebar'}));
  expect(sidebar().getByText('Harbour')).toBeTruthy();
  expect(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}).getAttribute('aria-current')).toBe('page');
  expect(api.openProject).toHaveBeenCalledTimes(1);
});
afterEach(() => {cleanup(); vi.clearAllMocks();});

const sidebar = () => within(screen.getByRole('complementary', {name: 'Projects'}));
it('opens a dedicated project page instead of expanding the project list', async () => {
  render(<ProjectHub/>);
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  expect(screen.queryByRole('navigation')).toBeNull();
  await userEvent.setup().click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  expect(screen.getByRole('navigation', {name: 'Harbour tabs'}).textContent).toBe('OverviewProject setupFiles');
  expect(sidebar().queryByRole('button', {name: 'Switchyard'})).toBeNull();
  expect(sidebar().queryByRole('textbox', {name: 'Search projects'})).toBeNull();
  expect(sidebar().getByText('Harbour')).toBeTruthy();
  expect(screen.queryByRole('button', {name: 'Hosts'})).toBeNull();
  await userEvent.setup().click(sidebar().getByRole('button', {name: 'FlagHop'}));
  expect(screen.queryByRole('navigation')).toBeNull(); expect(screen.getByRole('heading', {name: 'Projects'})).toBeTruthy();
});

it('returns to the selected project after switching between projects', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'FlagHop'}));
  await user.click(sidebar().getByRole('button', {name: 'Switchyard'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Switchyard'})).toBeTruthy());
  expect(screen.queryByRole('navigation', {name: 'Harbour tabs'})).toBeNull();
  expect(sidebar().getAllByRole('navigation')).toHaveLength(1);
});

it('keeps the project sidebar in Setup and lets Overview return to its new home', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}));
  expect(sidebar().getByText('Harbour')).toBeTruthy();
  expect(sidebar().getByRole('button', {name: 'Overview'}).getAttribute('aria-current')).toBeNull();
  expect(screen.getByRole('heading', {name: 'Fixture laptop'})).toBeTruthy();
  await user.click(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}));
  expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy();
  await user.click(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}));
  await user.click(sidebar().getByRole('button', {name: 'Overview'}));
  expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy();
  expect(sidebar().getByRole('button', {name: 'Overview'}).getAttribute('aria-current')).toBe('page');
  expect(api.openProject).toHaveBeenCalledTimes(1);
});

it('searches views, actions and hosts with Ctrl K while retaining the selected project', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Collapse sidebar'}));
  fireEvent.keyDown(document, {key: 'k', ctrlKey: true});
  expect(screen.getByRole('dialog', {name: 'Search workspace'})).toBeTruthy();
  const input = screen.getByRole('textbox', {name: 'Search views, actions, and hosts'});
  expect(document.activeElement).toBe(input);
  await user.type(input, '192.0.2.7');
  expect(screen.getByRole('option', {name: /192.0.2.7 fixture/})).toBeTruthy();
  await user.keyboard('{Enter}');
  expect(screen.getByTitle('Hosts').getAttribute('data-src')).toContain('part=hosts&host=7');
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('shows the computer and honest, inactive VPN controls without discovery', async () => {
  render(<ProjectHub/>); await userEvent.setup().click(screen.getByRole('button', {name: 'Setup — VPN not configured'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Fixture laptop'})).toBeTruthy());
  expect(screen.getByText('Not configured')).toBeTruthy();
  expect((screen.getByRole('combobox', {name: 'Default VPN'}) as HTMLSelectElement).disabled).toBe(true);
  expect((screen.getByRole('button', {name: 'Refresh VPNs — not available yet'}) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByRole('button', {name: 'Install OpenVPN'})).toBeTruthy();
  expect(screen.getByRole('button', {name: 'Install WireGuard'})).toBeTruthy();
  expect(api.installConnector).not.toHaveBeenCalled();
  expect(api.settings).toHaveBeenCalledTimes(1);
  await userEvent.setup().click(screen.getByRole('button', {name: 'Setup — VPN not configured'}));
  expect(screen.getByRole('heading', {name: 'Projects'})).toBeTruthy();
});

it('queues only the requested connector and reports installation failures', async () => {
  vi.mocked(api.installConnector).mockResolvedValue({status: 'accepted', job: {id: 91, type: 'tool-install', status: 'queued'}});
  vi.mocked(api.connectorInstallJob).mockResolvedValue({id: 91, type: 'tool-install', status: 'failed', error: 'Administrator access is required.'});
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(screen.getByRole('button', {name: 'Setup — VPN not configured'}));
  for (const [label, connector] of [['OpenVPN', 'openvpn'], ['WireGuard', 'wireguard']] as const) {
    await user.click(screen.getByRole('button', {name: `Install ${label}`}));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Administrator access is required.'));
    expect(api.installConnector).toHaveBeenLastCalledWith(connector);
  }
  expect(api.installConnector).toHaveBeenCalledTimes(2);
});

it('saves the default folder below VPN and keeps an invalid path editable', async () => {
  const settings = {vpn_status: 'unconfigured' as const, computer: {name: 'Fixture laptop', system: 'Linux'}, projects_folder: '/Documents/FlagHop', vpns: []};
  vi.mocked(api.settings).mockResolvedValue(settings);
  vi.mocked(api.setSaveFolder).mockRejectedValueOnce(new Error('The save folder is not writable.'));
  const first = render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(screen.getByRole('button', {name: 'Setup — VPN not configured'}));
  const input = screen.getByRole('textbox', {name: 'Default save folder'}) as HTMLInputElement;
  await waitFor(() => expect(input.value).toBe('/Documents/FlagHop'));
  expect(screen.getByRole('combobox', {name: 'Default VPN'}).compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await user.clear(input); await user.type(input, '/custom/FlagHop');
  await user.click(screen.getByRole('button', {name: 'Save'}));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('not writable'));
  expect(input.value).toBe('/custom/FlagHop');
  const saved = {...settings, projects_folder: '/custom/FlagHop'};
  vi.mocked(api.setSaveFolder).mockResolvedValue(saved);
  await user.click(screen.getByRole('button', {name: 'Save'}));
  await waitFor(() => expect((screen.getByRole('button', {name: 'Save'}) as HTMLButtonElement).disabled).toBe(true));
  expect(api.setSaveFolder).toHaveBeenCalledWith('/custom/FlagHop');
  vi.mocked(api.settings).mockResolvedValue(saved);
  first.unmount(); render(<ProjectHub/>);
  await waitFor(() => expect((screen.getByRole('textbox', {name: 'Default save folder'}) as HTMLInputElement).value).toBe('/custom/FlagHop'));
});

it('keeps Overview clear and moves working files and connector preferences into Project setup', async () => {
  vi.mocked(api.createProject).mockResolvedValue(opened(harbour));
  vi.mocked(api.files).mockResolvedValue({files: [{path: 'notes.md', size: 8}], truncated: false});
  vi.mocked(api.fileUrl).mockReturnValue('/fixture-file');
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(screen.getByRole('button', {name: 'New project'}));
  await user.type(screen.getByRole('textbox', {name: 'Project name'}), 'Harbour');
  await user.click(screen.getByRole('button', {name: 'Create'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  expect(api.createProject).toHaveBeenCalledWith('Harbour');
  expect(screen.getByText(harbour.folder)).toBeTruthy();
  expect(screen.queryByRole('combobox', {name: 'Connector'})).toBeNull();
  expect(screen.queryByRole('heading', {name: 'Files'})).toBeNull();
  await user.click(sidebar().getByRole('button', {name: 'Project setup'}));
  await waitFor(() => expect(screen.getByRole('link', {name: /notes.md/}).getAttribute('href')).toBe('/fixture-file'));
  expect(within(screen.getByRole('combobox', {name: 'Connector'})).getAllByRole('option').map(option => option.textContent)).toEqual(['NetworkManager', 'OpenVPN', 'WireGuard']);
  await user.selectOptions(screen.getByRole('combobox', {name: 'Connector'}), 'wireguard');
  await waitFor(() => expect(api.setProjectConnector).toHaveBeenCalledWith('one', 'wireguard'));
  await user.click(sidebar().getByRole('button', {name: 'Overview'}));
  expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy();
  expect(screen.queryByRole('combobox', {name: 'Connector'})).toBeNull();
});

it('restores Project setup after reload and after toggling the bottom Setup button', async () => {
  let mounted = render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Project setup'}));
  mounted.unmount(); mounted = render(<ProjectHub/>);
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Project setup'})).toBeTruthy());
  expect(sidebar().getByRole('button', {name: 'Project setup'}).getAttribute('aria-current')).toBe('page');
  await user.click(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}));
  mounted.unmount(); render(<ProjectHub/>);
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Fixture laptop'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}));
  expect(screen.getByRole('heading', {name: 'Project setup'})).toBeTruthy();
  expect(screen.getByRole('combobox', {name: 'Connector'})).toBeTruthy();
});

it('keeps the home page and shows the reason when a project cannot be opened', async () => {
  vi.mocked(api.openProject).mockRejectedValue(new Error('Stop running jobs before switching projects.'));
  render(<ProjectHub/>);
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await userEvent.setup().click(sidebar().getByRole('button', {name: 'Harbour'}));
  expect(screen.getByRole('alert').textContent).toContain('Stop running jobs');
  expect(screen.queryByRole('navigation')).toBeNull();
});

it('does not reopen a project when its pending response arrives after Home', async () => {
  let resolve!: (value: ReturnType<typeof opened>) => void;
  vi.mocked(api.openProject).mockReturnValue(new Promise(done => {resolve = done;}));
  render(<ProjectHub/>);
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  fireEvent.click(sidebar().getByRole('button', {name: 'Harbour'}));
  fireEvent.click(sidebar().getByRole('button', {name: 'FlagHop'}));
  resolve(opened(harbour));
  await waitFor(() => expect((sidebar().getByRole('button', {name: 'Harbour'}) as HTMLButtonElement).disabled).toBe(false));
  expect(screen.queryByRole('navigation')).toBeNull();
});


it('resizes the sidebar by keyboard and restores the saved width', async () => {
  const first = render(<ProjectHub/>);
  const grip = screen.getByRole('separator', {name: 'Resize sidebar'});
  fireEvent.keyDown(grip, {key: 'End'});
  expect(grip.getAttribute('aria-valuenow')).toBe('340');
  expect(localStorage.getItem('legion.workspace.sidebarWidth')).toBe('340');
  first.unmount(); render(<ProjectHub/>);
  expect(screen.getByRole('separator', {name: 'Resize sidebar'}).getAttribute('aria-valuenow')).toBe('340');
});

it('renames the project from the sidebar and updates the breadcrumb and catalog', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  const renamed = {...harbour, name: 'Harbour lab'};
  vi.mocked(api.renameProject).mockResolvedValue(opened(renamed));
  vi.mocked(api.projects).mockResolvedValue([renamed, other]);
  await user.dblClick(sidebar().getByRole('button', {name: 'Rename Harbour'}));
  const input = sidebar().getByRole('textbox', {name: 'Project name'});
  await user.clear(input); await user.type(input, 'Harbour lab{Enter}');
  await waitFor(() => expect(api.renameProject).toHaveBeenCalledWith('one', 'Harbour lab'));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour lab'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'FlagHop'}));
  expect(sidebar().getByRole('button', {name: 'Harbour lab'})).toBeTruthy();
});

it('runs Save from the project context menu using arrow keys', async () => {
  vi.mocked(api.saveProject).mockResolvedValue(opened(harbour));
  render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  fireEvent.contextMenu(sidebar().getByRole('button', {name: 'Harbour'}), {clientX: 80, clientY: 180});
  expect(document.activeElement).toBe(screen.getByRole('menuitem', {name: 'Rename project'}));
  await user.keyboard('{ArrowDown}{Enter}');
  await waitFor(() => expect(api.saveProject).toHaveBeenCalledWith('one'));
  await waitFor(() => expect(screen.getByText('Saved', {selector: '[role="status"]'})).toBeTruthy());
  expect(screen.queryByRole('menu')).toBeNull();
});

it('opens an existing project path and restores the selected Setup after reload', async () => {
  vi.mocked(api.openPath).mockResolvedValue(opened(harbour));
  const first = render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(screen.getByRole('button', {name: 'Open project'}));
  await user.type(screen.getByRole('textbox', {name: 'Project path'}), '/fixture/existing.legion');
  await user.click(screen.getByRole('button', {name: 'Open'}));
  await waitFor(() => expect(api.openPath).toHaveBeenCalledWith('/fixture/existing.legion'));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}));
  first.unmount(); render(<ProjectHub/>);
  await waitFor(() => expect(sidebar().getByText('Harbour')).toBeTruthy());
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Fixture laptop'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Setup — VPN not configured'}));
  expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy();
});

it('Setup returns to the previous inspector after visiting another settings panel', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  fireEvent.keyDown(document, {key: 'k', ctrlKey: true});
  await user.type(screen.getByRole('textbox', {name: 'Search views, actions, and hosts'}), '192.0.2.7');
  await user.keyboard('{Enter}');
  const setup = () => sidebar().getByRole('button', {name: 'Setup — VPN not configured'});
  await user.click(setup());
  await user.click(screen.getByRole('button', {name: 'Application settings'}));
  await user.click(screen.getByRole('button', {name: 'Close Application settings'}));
  await user.click(setup());
  expect(screen.getByTitle('Hosts').getAttribute('data-src')).toBe('/?part=hosts&host=7');
  await user.click(screen.getByRole('button', {name: 'Close Hosts'}));
  expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy();
});

it('exposes the original settings dialogs from Setup', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(screen.getByRole('button', {name: 'Setup — VPN not configured'}));
  await user.click(screen.getByRole('button', {name: 'Application settings'}));
  expect(screen.getByTitle('Application settings').getAttribute('data-src')).toBe('/?part=app-settings');
  await user.click(screen.getByRole('button', {name: 'Close Application settings'}));
  expect(screen.getByRole('heading', {name: 'Fixture laptop'})).toBeTruthy();
});

it('keeps live status and job information in workspace details without a bottom bar', async () => {
  vi.mocked(api.snapshot).mockResolvedValue({project: {name: harbour.path}, jobs: [{id: 9, type: 'fixture', status: 'running'}]});
  render(<ProjectHub/>); const user = userEvent.setup();
  expect(screen.queryByRole('contentinfo')).toBeNull();
  await user.click(screen.getByRole('button', {name: 'Workspace details'}));
  const details = within(screen.getByRole('dialog', {name: 'Workspace details'}));
  await waitFor(() => expect(details.getByText('Polling/API')).toBeTruthy());
  expect(details.getByText('Running / queued jobs').nextElementSibling?.textContent).toBe('1');
  expect(details.getByText('Status').nextElementSibling?.textContent).toBe('Ready');
  expect(details.getByText('Authentication').nextElementSibling?.textContent).toBe('No auth');
});

it('exposes native window controls only when the desktop bridge is available', async () => {
  const desktop = {maximized: false, minimize: vi.fn(), toggleMaximize: vi.fn(), close: vi.fn(), startMove: vi.fn(), resizeEdge: vi.fn()};
  const first = render(<ProjectHub/>);
  expect(screen.queryByRole('button', {name: 'Minimise window'})).toBeNull();
  first.unmount();
  window.legionDesktop = desktop;
  try {
    render(<ProjectHub/>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', {name: 'Minimise window'}));
    await user.click(screen.getByRole('button', {name: 'Maximise window'}));
    expect(desktop.minimize).toHaveBeenCalledOnce(); expect(desktop.toggleMaximize).toHaveBeenCalledOnce();
    expect(desktop.startMove).not.toHaveBeenCalled();
    fireEvent.doubleClick(document.querySelector('.hub-header')!);
    expect(desktop.toggleMaximize).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', {name: 'Close window'}));
    expect(desktop.close).toHaveBeenCalledOnce();
  } finally {delete window.legionDesktop;}
});

function backgroundState(id: string, running: boolean): api.BackgroundStatus {
  return {project_id: id, project: '/configured/' + id, running, requested_state: running ? 'running' : 'paused', control_configured: true,
    observed_state: 'unsupported', worker_observation: 'unsupported', worker: {available: true, engines: ['cipher', 'password']},
    alerts: [], working: [], node_states: {}, hash_states: {}, pause_semantics: 'Workspace only'};
}
it('retains independent pause requests while navigating between workspaces without auto-starting', async () => {
  const states = {one: true, two: false};
  vi.mocked(api.background).mockImplementation(async id => backgroundState(id, states[id as keyof typeof states]));
  vi.mocked(api.controlBackground).mockImplementation(async (id, running) => {states[id as keyof typeof states] = running; return backgroundState(id, running);});
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(await sidebar().findByRole('button', {name: 'Harbour'}));
  await user.click(await screen.findByRole('button', {name: 'Stop background jobs for Harbour'}));
  await screen.findByRole('button', {name: 'Start background jobs for Harbour'});
  expect(screen.queryByText('Pause requested')).toBeNull();
  await user.click(sidebar().getByRole('button', {name: 'FlagHop'}));
  await user.click(await sidebar().findByRole('button', {name: 'Switchyard'}));
  await user.click(await screen.findByRole('button', {name: 'Start background jobs for Switchyard'}));
  await screen.findByRole('button', {name: 'Stop background jobs for Switchyard'});
  await user.click(sidebar().getByRole('button', {name: 'FlagHop'}));
  await user.click(await sidebar().findByRole('button', {name: 'Harbour'}));
  await screen.findByRole('button', {name: 'Start background jobs for Harbour'});
  expect(states).toEqual({one: false, two: true});
  expect(vi.mocked(api.controlBackground).mock.calls).toEqual([['one', false], ['two', true]]);
  await user.click(sidebar().getByRole('button', {name: 'Files'}));
  expect(api.controlBackground).toHaveBeenCalledTimes(2);
});
it('groups Cipher and Hash notifications and opens an independent editor link', async () => {
  const alert: api.ReaderAlert = {id: 'actual-artifact', result_path: 'ciphey/artifacts/result.bin', size: 8, completed: 123, state: 'done', label: 'Derived artifact', origins: [{path: 'input.txt'}], transformations: ['base64'], display_name: 'input.txt'};
  const hash = {...alert, id: 'hash-target', result_path: 'password-crackers/jobs/target/recovered.txt', display_name: 'credentials.txt'};
  let dismissed = false;
  vi.mocked(api.background).mockImplementation(async id => ({...backgroundState(id, false), alerts: dismissed ? [hash] : [alert, hash], history: dismissed ? [alert] : []}));
  vi.mocked(api.dismissAlert).mockImplementation(async () => {dismissed = true; return {status: 'ok'};});
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(await sidebar().findByRole('button', {name: 'Harbour'}));
  await screen.findByText('credentials.txt');
  const killChain = document.getElementById('hub-cyber-kill-chain')!;
  expect(killChain.querySelector('summary')?.textContent).toBe('Cyber Kill Chain0');
  expect(killChain.compareDocumentPosition(document.getElementById('hub-reader-hash')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await user.click(within(killChain).getByText('Cyber Kill Chain'));
  expect(killChain.hasAttribute('open')).toBe(true);
  await user.click(within(killChain).getByText('Cyber Kill Chain'));
  expect(killChain.hasAttribute('open')).toBe(false);
  const cipher = document.getElementById('hub-reader-cipher')!;
  const link = await within(cipher).findByRole('link', {name: 'Open'});
  expect(link.getAttribute('href')).toBe('/api/hub/projects/one/editor?result=actual-artifact');
  expect(link.getAttribute('target')).toBe('_blank');
  expect(within(document.getElementById('hub-reader-hash')!).getByText('credentials.txt')).toBeTruthy();
  expect(document.querySelector('.hub-files-view')).toBeNull();
  await user.click(within(cipher).getByRole('button', {name: 'Dismiss input.txt'}));
  await waitFor(() => expect(within(cipher).queryByText('input.txt')).toBeNull());
  expect(api.dismissAlert).toHaveBeenCalledWith('one', 'actual-artifact');
  expect(api.controlBackground).not.toHaveBeenCalled();
  const working = document.getElementById('hub-background-working')!, history = document.getElementById('hub-background-history')!;
  expect(working.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('opens Files independently and leaves Overview selected', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(await sidebar().findByRole('button', {name: 'Harbour'}));
  await user.click(sidebar().getByRole('button', {name: 'Files'}));
  expect(window.open).toHaveBeenCalledWith('/api/hub/projects/one/filesystem', '_blank', 'noopener');
  expect(document.querySelector('.hub-files-view')).toBeNull();
  expect(sidebar().getByRole('button', {name: 'Overview'}).getAttribute('aria-current')).toBe('page');
});

it('runs one selected-device scan through Working, cancellation and saved evidence History', async () => {
  vi.mocked(api.snapshot).mockResolvedValue({project: opened(harbour).workspace, hosts: [{id: 1, ip: '192.0.2.10', hostname: 'fixture.test'}]});
  let runs: api.DeepScanRun[] = [];
  vi.mocked(api.deepScans).mockImplementation(async () => ({runs}));
  vi.mocked(api.startDeepScan).mockImplementation(async (_id, body) => {
    const run: api.DeepScanRun = {id: 'scan-one', project_id: 'one', host_id: body.host_id, target_ip: body.target_ip, status: 'queued', job_id: 123, profile_path: '', summary: {}};
    runs = [run]; return run;
  });
  vi.mocked(api.stopDeepScan).mockImplementation(async () => {
    runs = [{...runs[0], status: 'cancelled', reason: 'Stopped by user', log_path: 'workspace-tool-output/deep-scans/scan-one/log.txt'}];
    return {status: 'ok', stopped: true, job: {id: 123, type: 'deep-scan', status: 'cancelled'}};
  });
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(await sidebar().findByRole('button', {name: 'Harbour'}));
  await user.click(await screen.findByRole('button', {name: '192.0.2.10 · fixture.test'}));
  expect(document.getElementById('hub-deep-scan')).toBeNull();
  await user.click(screen.getByRole('button', {name: 'Deep scan 192.0.2.10'}));
  await screen.findByText('queued');
  expect(api.startDeepScan).toHaveBeenCalledWith('one', {host_id: 1, target_ip: '192.0.2.10', expected_revision: 0});
  expect(screen.getByRole('button', {name: 'Deep scan 192.0.2.10'}).hasAttribute('disabled')).toBe(true);
  await user.click(within(document.getElementById('hub-background-working')!).getByRole('button', {name: 'Stop'}));
  await waitFor(() => expect(document.querySelector('#hub-background-working [data-scan-id]')).toBeNull());
  await user.click(within(document.getElementById('hub-background-history')!).getByText('History'));
  expect(await screen.findByText('cancelled')).toBeTruthy();
  const link = within(document.querySelector('[data-scan-id="scan-one"]') as HTMLElement).getByRole('link', {name: 'Open'});
  expect(link.getAttribute('href')).toContain('/one/editor?path=');
  expect(link.getAttribute('target')).toBe('_blank');
  expect(sidebar().getByRole('button', {name: 'Overview'}).getAttribute('aria-current')).toBe('page');
});

it('keeps result links bound to their original project when switching views', async () => {
  const alert: api.ReaderAlert = {id: 'late', result_path: 'ciphey/artifacts/late.bin', size: 4, completed: 1, state: 'done', label: 'Saved result', origins: [], transformations: ['base64']};
  vi.mocked(api.background).mockImplementation(async id => ({...backgroundState(id, false), alerts: id === 'one' ? [alert] : []}));
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(await sidebar().findByRole('button', {name: 'Harbour'}));
  const link = await screen.findByRole('link', {name: 'Open'});
  expect(link.getAttribute('href')).toContain('/one/editor?result=late');
  await user.click(sidebar().getByRole('button', {name: 'FlagHop'}));
  await user.click(await sidebar().findByRole('button', {name: 'Switchyard'}));
  await screen.findByRole('heading', {name: 'Switchyard'});
  expect(screen.queryByRole('link', {name: 'Open'})).toBeNull();
  expect(window.open).not.toHaveBeenCalled();
  expect(api.readerResult).not.toHaveBeenCalled();
});
