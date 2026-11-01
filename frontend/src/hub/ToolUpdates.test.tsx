import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, expect, it, vi} from 'vitest';
import * as api from './api';
import {ToolUpdates} from './ToolUpdates';

vi.mock('./api');
afterEach(() => {cleanup(); vi.clearAllMocks();});

it('starts only on click and keeps the compact sidebar update control', async () => {
  vi.mocked(api.toolUpdates).mockResolvedValue({running: false, tools: [{name: 'john', status: 'pending'}]});
  vi.mocked(api.updateTools).mockResolvedValue({running: true, tools: [{name: 'john', status: 'checking'}]});
  render(<ToolUpdates/>);
  await waitFor(() => expect(api.toolUpdates).toHaveBeenCalled());
  expect(api.updateTools).not.toHaveBeenCalled();
  await userEvent.setup().click(screen.getByRole('button', {name: 'Update tools'}));
  expect(api.updateTools).toHaveBeenCalledWith(false);
  expect(screen.getByRole('dialog', {name: 'Tool updates'})).toBeTruthy();
  expect(screen.getByText('Checking')).toBeTruthy();
  expect(screen.getByRole('link', {name: /inspired by T3 Code/}).getAttribute('href')).toBe('https://github.com/pingdotgg/t3code');
});

it('shows successful later tools after a failure and retries failed tools', async () => {
  vi.mocked(api.toolUpdates).mockResolvedValue({running: false, tools: [
    {name: 'nuclei', status: 'current'}, {name: 'john', status: 'failed', error: 'Download failed'}, {name: 'wpscan', status: 'updated'},
  ]});
  vi.mocked(api.updateTools).mockResolvedValue({running: true, tools: [
    {name: 'nuclei', status: 'current'}, {name: 'john', status: 'checking'}, {name: 'wpscan', status: 'updated'},
  ]});
  render(<ToolUpdates/>);
  await userEvent.setup().click(await screen.findByRole('button', {name: '1 update failed'}));
  expect(screen.getByText('Updated')).toBeTruthy();
  expect(screen.getByText('Download failed')).toBeTruthy();
  await userEvent.setup().click(screen.getByRole('button', {name: 'Retry failed'}));
  expect(api.updateTools).toHaveBeenCalledWith(true);
});
