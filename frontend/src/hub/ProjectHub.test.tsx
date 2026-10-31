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
  vi.mocked(api.setProjectVpn).mockResolvedValue({status: 'ok'});
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
  expect(sidebar().getByRole('button', {name: 'Legion'})).toBeTruthy();
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
  expect(screen.getByRole('navigation', {name: 'Harbour tabs'}).textContent).toBe('Overview');
  expect(sidebar().queryByRole('button', {name: 'Switchyard'})).toBeNull();
  expect(sidebar().queryByRole('textbox', {name: 'Search projects'})).toBeNull();
  expect(sidebar().getByText('Harbour')).toBeTruthy();
  expect(screen.queryByRole('button', {name: 'Hosts'})).toBeNull();
  await userEvent.setup().click(sidebar().getByRole('button', {name: 'Legion'}));
  expect(screen.queryByRole('navigation')).toBeNull(); expect(screen.getByRole('heading', {name: 'Projects'})).toBeTruthy();
});

it('returns to the selected project after switching between projects', async () => {
  render(<ProjectHub/>); const user = userEvent.setup();
  await waitFor(() => expect(sidebar().getByRole('button', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Harbour'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  await user.click(sidebar().getByRole('button', {name: 'Legion'}));
  await user.click(sidebar().getByRole('button', {name: 'Switchyard'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Switchyard'})).toBeTruthy());
  expect(screen.queryByRole('navigation', {name: 'Harbour tabs'})).toBeNull();
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
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
  expect(api.settings).toHaveBeenCalledTimes(1);
  await userEvent.setup().click(screen.getByRole('button', {name: 'Setup — VPN not configured'}));
  expect(screen.getByRole('heading', {name: 'Projects'})).toBeTruthy();
});

it('creates a named project and presents its files and VPN preference', async () => {
  vi.mocked(api.createProject).mockResolvedValue(opened(harbour));
  vi.mocked(api.files).mockResolvedValue({files: [{path: 'notes.md', size: 8}], truncated: false});
  vi.mocked(api.fileUrl).mockReturnValue('/fixture-file');
  render(<ProjectHub/>); const user = userEvent.setup();
  await user.click(screen.getByRole('button', {name: 'New project'}));
  await user.type(screen.getByRole('textbox', {name: 'Project name'}), 'Harbour');
  await user.click(screen.getByRole('button', {name: 'Create'}));
  await waitFor(() => expect(screen.getByRole('heading', {name: 'Harbour'})).toBeTruthy());
  expect(api.createProject).toHaveBeenCalledWith('Harbour');
  expect(screen.getByRole('link', {name: /notes.md/}).getAttribute('href')).toBe('/fixture-file');
  await user.selectOptions(screen.getByRole('combobox', {name: 'VPN'}), 'none');
  await waitFor(() => expect(api.setProjectVpn).toHaveBeenCalledWith('one', 'none'));
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
  fireEvent.click(sidebar().getByRole('button', {name: 'Legion'}));
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
  await user.click(sidebar().getByRole('button', {name: 'Legion'}));
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
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Saved'));
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
