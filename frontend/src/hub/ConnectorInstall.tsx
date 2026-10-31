import {useEffect, useState} from 'react';
import * as api from './api';

const labels = {openvpn: 'OpenVPN', wireguard: 'WireGuard'};
type InstallableConnector = keyof typeof labels;

export function ConnectorInstall() {
  const [busy, setBusy] = useState<InstallableConnector | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (jobId === null) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      try {
        const job = await api.connectorInstallJob(jobId!);
        if (!active) return;
        setError('');
        if (job.status === 'queued' || job.status === 'running') {
          setStatus(`${labels[busy!]} installation ${job.status} (job #${job.id}).`);
        } else {
          setStatus(job.status === 'completed' ? String(job.result?.message || 'Installation completed.') : '');
          if (job.status !== 'completed') setError(job.error || `Installation ${job.status}.`);
          setBusy(null); setJobId(null);
          return;
        }
      } catch (err) {
        if (!active) return;
        setError(`Could not check installation: ${(err as Error).message}. Retrying…`);
      }
      timer = setTimeout(() => {void check();}, 2000);
    }
    void check();
    return () => {active = false; clearTimeout(timer);};
  }, [jobId, busy]);

  async function install(connector: InstallableConnector) {
    setBusy(connector); setError(''); setStatus(`Queueing ${labels[connector]} installation…`);
    try {
      const response = await api.installConnector(connector);
      setJobId(response.job.id);
      setStatus(`${labels[connector]} installation queued (job #${response.job.id}).`);
    } catch (err) {
      setBusy(null); setStatus(''); setError((err as Error).message);
    }
  }

  return <div className="hub-connector-install">
    <div className="hub-connector-install-buttons">
      <button disabled={busy !== null} onClick={() => {void install('openvpn');}}>Install OpenVPN</button>
      <button disabled={busy !== null} onClick={() => {void install('wireguard');}}>Install WireGuard</button>
    </div>
    {status && <p role="status" className="hub-muted">{status}</p>}
    {error && <p role="alert" className="hub-error">{error}</p>}
  </div>;
}
