import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {WorkspaceIdentity} from './WorkspaceIdentity';
import {projectStore, renameStore} from './store';

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {status, headers: {'Content-Type': 'application/json'}});
}
function mount() {
  document.body.innerHTML = `<div class="workspace-project-shell"><button class="workspace-project"><span id="sidebar"></span></button></div>
    <div class="workspace-breadcrumb"><span id="title"></span></div><span id="project-name"></span>`;
  const sidebar = document.getElementById('sidebar')!;
  const title = document.getElementById('title')!;
  render(<WorkspaceIdentity sidebar={sidebar} title={title} sidebarEditor={sidebar.parentElement!.parentElement!} titleEditor={title.parentElement!}/>);
}

beforeEach(() => {
  projectStore.set({name: '/fixture/workspace.legion', display_name: 'Original workspace', is_temporary: false});
  renameStore.set({token: 0, location: 'sidebar'});
});
afterEach(() => {cleanup(); document.body.replaceChildren(); vi.unstubAllGlobals();});

describe('workspace identity', () => {
  it('renames from the sidebar, sends the expected path, and synchronizes both names', async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.method).toBe('POST');
      expect(await request.json()).toEqual({name: 'New workspace', expected_path: '/fixture/workspace.legion'});
      return response({status: 'ok', project: {name: '/fixture/workspace.legion', display_name: 'New workspace'}});
    });
    vi.stubGlobal('fetch', fetch); mount();
    const user = userEvent.setup();
    await user.dblClick(document.getElementById('sidebar-project-name')!);
    const input = screen.getByRole('textbox', {name: 'Workspace name'}) as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(input.classList.contains('workspace-rename-sidebar')).toBe(true);
    await user.clear(input); await user.type(input, 'New workspace'); await user.keyboard('{Enter}');
    await waitFor(() => expect(document.getElementById('breadcrumb-project')!.textContent).toBe('New workspace'));
    expect(document.getElementById('sidebar-project-name')!.textContent).toBe('New workspace');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('cancels a title edit with Escape without saving on blur', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', {name: 'Rename workspace'}));
    const input = screen.getByRole('textbox', {name: 'Workspace name'});
    await user.clear(input); await user.type(input, 'Discarded'); await user.keyboard('{Escape}');
    fireEvent.blur(input);
    expect(fetch).not.toHaveBeenCalled();
    expect(projectStore.getSnapshot().display_name).toBe('Original workspace');
  });

  it('shows an API validation error and preserves the draft for correction', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({status: 'error', error: 'Workspace name is invalid'}, 422)));
    mount(); const user = userEvent.setup();
    await user.click(screen.getByRole('button', {name: 'Rename workspace'}));
    const input = screen.getByRole('textbox', {name: 'Workspace name'}) as HTMLInputElement;
    await user.clear(input); await user.type(input, 'Invalid'); await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Workspace name is invalid'));
    expect(input.value).toBe('Invalid'); expect(input.disabled).toBe(false);
    expect(projectStore.getSnapshot().display_name).toBe('Original workspace');
  });

  it('does not overwrite a newly opened workspace with a late rename response', async () => {
    let resolve!: (response: Response) => void;
    const fetch = vi.fn(() => new Promise<Response>(done => {resolve = done;}));
    vi.stubGlobal('fetch', fetch); mount(); const user = userEvent.setup();
    await user.click(screen.getByRole('button', {name: 'Rename workspace'}));
    const input = screen.getByRole('textbox', {name: 'Workspace name'});
    await user.clear(input); await user.type(input, 'Old rename'); await user.keyboard('{Enter}');
    fireEvent.blur(input);
    act(() => projectStore.set({name: '/fixture/other.legion', display_name: 'Other workspace'}));
    await act(async () => resolve(response({status: 'ok', project: {name: '/fixture/workspace.legion', display_name: 'Old rename'}})));
    expect(document.getElementById('breadcrumb-project')!.textContent).toBe('Other workspace');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

it('opens a sidebar edit requested by the legacy context menu and saves on blur', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response({status: 'ok', project: {name: '/fixture/workspace.legion', display_name: 'From context menu'}})));
  mount(); const user = userEvent.setup();
  act(() => renameStore.set({token: 1, location: 'sidebar'}));
  const input = screen.getByRole('textbox', {name: 'Workspace name'});
  await user.clear(input); await user.type(input, 'From context menu'); await user.tab();
  await waitFor(() => expect(document.getElementById('sidebar-project-name')!.textContent).toBe('From context menu'));
});
