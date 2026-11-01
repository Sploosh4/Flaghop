import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {JobsTable} from './JobsTable';
import {jobsStore} from './store';

beforeEach(() => jobsStore.set([{id: 17, type: 'fixture-job', status: 'running', result: {warnings: ['Fixture warning']}}]));
afterEach(() => {cleanup(); document.body.replaceChildren(); vi.unstubAllGlobals();});
function mount() {
  const table = document.createElement('table'); const body = document.createElement('tbody');
  table.appendChild(body); document.body.appendChild(table); render(<JobsTable/>, {container: body});
}
function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {status, headers: {'Content-Type': 'application/json'}});
}
it('renders diagnostics and sends one stop request before refreshing typed job data', async () => {
  const fetch = vi.fn(async (request: Request) => {
    if (request.method === 'POST') {
      expect(new URL(request.url).pathname).toBe('/api/jobs/17/stop');
      return response({status: 'ok', stopped: true, job: {id: 17, type: 'fixture-job', status: 'cancelled'}});
    }
    return response({jobs: [{id: 17, type: 'fixture-job', status: 'cancelled'}]});
  });
  vi.stubGlobal('fetch', fetch); mount();
  expect(screen.getByText('Fixture warning')).toBeTruthy();
  await userEvent.setup().click(screen.getByRole('button', {name: 'Stop'}));
  await waitFor(() => expect(screen.getByText('cancelled')).toBeTruthy());
  expect(fetch.mock.calls.filter(([request]) => request.method === 'POST')).toHaveLength(1);
  expect(screen.queryByRole('button', {name: 'Stop'})).toBeNull();
});
it('shows a stop failure without losing the current jobs', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response({status: 'error', error: 'Fixture stop failure'}, 409)));
  mount(); await userEvent.setup().click(screen.getByRole('button', {name: 'Stop'}));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Fixture stop failure'));
  expect(screen.getByText('fixture-job')).toBeTruthy();
  expect((screen.getByRole('button', {name: 'Stop'}) as HTMLButtonElement).disabled).toBe(false);
});
