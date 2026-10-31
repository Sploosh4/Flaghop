import {useEffect, useRef, useState} from 'react';
import * as api from '../api';
import type {HardwareNode} from '../hardware/model';

export function useDeepScans(project: api.HubProject | null) {
  const [runs, setRuns] = useState<api.DeepScanRun[]>([]), [error, setError] = useState('');
  const [busy, setBusy] = useState<number | null>(null), current = useRef(project?.id);
  current.current = project?.id;
  const refresh = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let active = true, loading = false;
    setRuns([]); setError(''); setBusy(null);
    async function load() {
      if (!project || loading) return;
      loading = true;
      try {const result = await api.deepScans(project.id); if (active) {setRuns(result.runs); setError('');}}
      catch (e) {if (active) setError(e instanceof Error ? e.message : String(e));}
      finally {loading = false;}
    }
    refresh.current = load;
    void load(); const timer = setInterval(() => {void load();}, 2000);
    return () => {active = false; clearInterval(timer);};
  }, [project?.id]);
  async function start(node: HardwareNode) {
    if (!project || !node.hostId || busy) return;
    const id = project.id; setBusy(node.hostId); setError('');
    try {
      const context = await api.projectNetwork(id);
      await api.startDeepScan(id, {host_id: node.hostId, target_ip: node.ip, expected_revision: context.revision});
      if (current.current === id) await refresh.current();
    } catch (e) {if (current.current === id) setError(e instanceof Error ? e.message : String(e));}
    finally {if (current.current === id) setBusy(null);}
  }
  async function cancel(run: api.DeepScanRun) {
    if (!run.job_id) return;
    const id = project?.id;
    try {await api.stopDeepScan(run.job_id); if (current.current === id) await refresh.current();}
    catch (e) {if (current.current === id) setError(e instanceof Error ? e.message : String(e));}
  }
  return {runs, error, busy, start, cancel};
}

export type DeepScanController = ReturnType<typeof useDeepScans>;
