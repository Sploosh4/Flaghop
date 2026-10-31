import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {DeepScanRun, HubProject} from '../api';
import * as api from '../api';
import {ScanCard} from './ScanCard';
import type {DeepScanController} from './useDeepScans';

vi.mock('../api', async importOriginal => ({...await importOriginal<typeof import('../api')>(), deepScan: vi.fn()}));
const project = {id: 'one', name: 'Fixture', folder: '/fixture'} as HubProject;
const run: DeepScanRun = {id: 'scan-one', project_id: 'one', host_id: 1, target_ip: '192.0.2.10', status: 'completed', summary: {}, summary_omitted: true};
const scans = {cancel: vi.fn()} as unknown as DeepScanController;

afterEach(() => {cleanup(); vi.clearAllMocks();});

describe('lazy scan results', () => {
  it('loads full evidence only after expansion and releases it on close', async () => {
    vi.mocked(api.deepScan).mockResolvedValue({...run, summary: {candidates: [{title: 'Saved candidate', status: 'candidate'}]}});
    render(<ScanCard run={run} project={project} scans={scans}/>);
    expect(api.deepScan).not.toHaveBeenCalled();
    const details = screen.getByText('Results').parentElement as HTMLDetailsElement;
    details.open = true; fireEvent(details, new Event('toggle'));
    await screen.findByText('Candidate · Saved candidate');
    expect(api.deepScan).toHaveBeenCalledWith('one', 'scan-one');
    details.open = false; fireEvent(details, new Event('toggle'));
    await waitFor(() => expect(screen.queryByText('Candidate · Saved candidate')).toBeNull());
  });

  it('shows a failed detail request and does not fetch from a polling rerender', async () => {
    vi.mocked(api.deepScan).mockReset().mockRejectedValue(new Error('Evidence unavailable'));
    const view = render(<ScanCard run={run} project={project} scans={scans}/>);
    const details = screen.getByText('Results').parentElement as HTMLDetailsElement;
    details.open = true; fireEvent(details, new Event('toggle'));
    await screen.findByText(/Evidence unavailable/);
    view.rerender(<ScanCard run={{...run}} project={{...project}} scans={scans}/>);
    expect(api.deepScan).toHaveBeenCalledTimes(1);
  });
});
