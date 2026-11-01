import {useRef, useState, useSyncExternalStore} from 'react';
import {jobsStore} from './store';
import {listJobs, stopJob} from './api/client';
import {setActionStatus} from '../../app/web/static/js/workspace/dom.js';

export function JobsTable() {
  const jobs = useSyncExternalStore(jobsStore.subscribe, jobsStore.getSnapshot);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const requests = useRef(new Set<number>());
  async function stop(id: number) {
    if (requests.current.has(id)) return;
    requests.current.add(id);
    setPending(previous => new Set(previous).add(id)); setError('');
    try {
      const changed = await stopJob(id);
      jobsStore.set(jobsStore.getSnapshot().map(job => job.id === changed.id ? changed : job));
      setActionStatus('Job stop requested');
      jobsStore.set(await listJobs());
    } catch (failure) {setError(failure instanceof Error ? failure.message : 'Unable to stop job.');}
    finally {requests.current.delete(id); setPending(previous => {const next = new Set(previous); next.delete(id); return next;});}
  }
  return <>
    {error && <tr role="alert"><td colSpan={8}>{error}</td></tr>}
    {jobs.map(job => {
      const active = job.status === 'queued' || job.status === 'running';
      const requested = job.cancel_requested || pending.has(job.id);
      const status = requested && active ? (job.status === 'queued' ? 'cancelling' : 'stopping') : job.status;
      const warnings = Array.isArray(job.result?.warnings) ? job.result.warnings.filter(value => typeof value === 'string') : [];
      const diagnostic = job.error || warnings.join(' | ') || (requested ? job.cancel_reason || 'stop requested' : '');
      return <tr key={job.id} data-job-id={job.id}>
        <td>{job.id}</td><td>{job.type}</td><td>{status}</td><td>{job.created_at}</td>
        <td>{job.started_at}</td><td>{job.finished_at}</td><td>{diagnostic}</td>
        <td>{active && <button type="button" data-job-action="stop" data-job-id={job.id} disabled={requested}
          onClick={event => {event.stopPropagation(); void stop(job.id);}}>
          {requested ? (job.status === 'queued' ? 'Cancelling...' : 'Stopping...') : 'Stop'}
        </button>}</td>
      </tr>;
    })}
  </>;
}
