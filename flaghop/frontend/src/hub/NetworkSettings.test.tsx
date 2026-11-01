import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {NetworkSettings} from './NetworkSettings';
import * as api from './api';

vi.mock('./api');
const context: api.NetworkContext = {project_id: 'a', config_id: 'network-a', revision: 3, connector: 'networkmanager',
  configured: true, settings: {name: 'CTF fixture', scope_source: 'Organiser instructions',
    allowed_targets: ['192.0.2.0/24'], exclusions: ['192.0.2.9'], interface: 'ctf0', mode: 'local'},
  enforcement_available: true, enforcement_reason: 'Enforcement tools available', recent_checks: []};
beforeEach(() => {
  vi.mocked(api.projectNetwork).mockResolvedValue(context);
});
afterEach(() => {cleanup(); vi.clearAllMocks();});

it('reads saved project scope without running network probes', async () => {
  render(<NetworkSettings projectId="a"/>);
  await waitFor(() => expect((screen.getByRole('textbox', {name: 'Network name'}) as HTMLInputElement).value).toBe('CTF fixture'));
  expect(api.projectNetwork).toHaveBeenCalledWith('a');
  expect(api.checkProjectNetwork).not.toHaveBeenCalled();
  expect(api.saveProjectNetwork).not.toHaveBeenCalled();
});

it('saves project-specific scope with its revision and retains edits on conflict', async () => {
  vi.mocked(api.saveProjectNetwork).mockRejectedValueOnce(new Error('Network settings changed. Reload them before saving.'));
  render(<NetworkSettings projectId="a"/>); const user = userEvent.setup();
  const input = await screen.findByRole('textbox', {name: 'Allowed targets'});
  await user.clear(input); await user.type(input, '198.51.100.0/24');
  await user.click(screen.getByRole('button', {name: 'Save network settings'}));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Reload'));
  expect((input as HTMLTextAreaElement).value).toBe('198.51.100.0/24');
  expect(api.saveProjectNetwork).toHaveBeenCalledWith('a', 3, expect.objectContaining({allowed_targets: ['198.51.100.0/24'], exclusions: ['192.0.2.9'], interface: 'ctf0', execution_environment: 'local'}));
});

it('checks only on request and displays a wrong-network hold in settings', async () => {
  vi.mocked(api.checkProjectNetwork).mockResolvedValue({status: 'held', reason: 'Route uses home0; expected ctf0.', revision: 3,
    checked_at: '2026-10-31T08:00:00Z', target: '192.0.2.7', routes: [], services: []});
  render(<NetworkSettings projectId="a"/>); const user = userEvent.setup();
  await user.type(await screen.findByRole('textbox', {name: 'Check target'}), '192.0.2.7');
  await user.click(screen.getByRole('button', {name: 'Check saved network'}));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('home0'));
  expect(api.checkProjectNetwork).toHaveBeenCalledWith('a', '192.0.2.7', undefined);
  expect(screen.getByText('Recent network checks')).toBeTruthy();
});
