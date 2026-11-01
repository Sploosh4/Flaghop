import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import * as api from './api';
import {RecoveryNotice} from './RecoveryNotice';

vi.mock('./api');
afterEach(() => {cleanup(); vi.clearAllMocks();});

it('keeps a cleanup hold visible and clears it only after checked recovery', async () => {
  const pending = [{execution_id:'one',project_id:'project-a',run_id:'',phase:'cleanup_required',reason:'Administrator authentication required'}];
  vi.mocked(api.executionRecovery).mockResolvedValue({pending});
  vi.mocked(api.retryExecutionRecovery).mockResolvedValueOnce({pending,held:pending,recovered:[]}).mockResolvedValueOnce({pending:[],recovered:['one'],held:[]});
  render(<RecoveryNotice/>);
  await screen.findByText('Administrator authentication required');
  fireEvent.click(screen.getByRole('button',{name:'Retry cleanup and saved results'}));
  await waitFor(() => expect(api.retryExecutionRecovery).toHaveBeenCalledTimes(1));
  await screen.findByRole('button',{name:'Retry cleanup and saved results'});
  expect(screen.getByText('Administrator authentication required')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Retry cleanup and saved results'}));
  await waitFor(() => expect(screen.queryByLabelText('Interrupted work')).toBeNull());
  expect(api.startDeepScan).not.toHaveBeenCalled();
});

it('shows an unavailable check and lets the user retry without starting a scan', async () => {
  vi.mocked(api.executionRecovery).mockRejectedValue(new Error('Backend unavailable'));
  vi.mocked(api.retryExecutionRecovery).mockResolvedValue({pending:[]});
  render(<RecoveryNotice/>);
  await screen.findByText('Recovery check: Backend unavailable');
  fireEvent.click(screen.getByRole('button',{name:'Retry cleanup and saved results'}));
  await waitFor(() => expect(screen.queryByLabelText('Interrupted work')).toBeNull());
  expect(api.startDeepScan).not.toHaveBeenCalled();
});
