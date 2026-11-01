import {useEffect, useState} from 'react';
import * as api from './api';

export function RecoveryNotice() {
  const [report, setReport] = useState<Awaited<ReturnType<typeof api.executionRecovery>> | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    let active = true, loading = false;
    async function refresh() {
      if (loading) return;
      loading = true;
      try {const next = await api.executionRecovery(); if (active) {setReport(next); setError('');}}
      catch (e) {if (active) setError(e instanceof Error ? e.message : String(e));}
      finally {loading = false;}
    }
    void refresh(); const timer = setInterval(() => {void refresh();}, 10000);
    return () => {active = false; clearInterval(timer);};
  }, []);
  async function retry() {
    setBusy(true); setError('');
    try {setReport(await api.retryExecutionRecovery());}
    catch (e) {setError(e instanceof Error ? e.message : String(e));}
    finally {setBusy(false);}
  }
  if (!error && !report?.pending?.length) return null;
  return <section className="hub-recovery-notice" aria-label="Interrupted work">
    {error && <p className="hub-error" role="alert">Recovery check: {error}</p>}
    {report?.pending?.map(item => <p className="hub-error" key={item.execution_id}>{item.reason}</p>)}
    <button disabled={busy} onClick={() => {void retry();}}>{busy ? 'Recovering…' : 'Retry cleanup and saved results'}</button>
  </section>;
}
