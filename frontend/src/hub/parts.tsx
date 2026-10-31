import {useEffect, useRef} from 'react';

export const settingParts: Record<string, string> = {'app-settings': 'Application settings', 'interface-settings': 'Interface settings', 'scheduler-settings': 'Scheduler settings', 'device-category-settings': 'Device categories', 'report-provider-settings': 'Report delivery'};
export const viewParts: Record<string, string> = {hosts: 'Hosts', services: 'Services', graph: 'Graph', activity: 'Activity', capture: 'Credentials & relay', approvals: 'Approvals'};
export const actionParts: Record<string, string> = {scan: 'New scan', tool: 'Run a tool', import: 'Import results'};
export const partTitles = {...viewParts, ...settingParts, ...actionParts};
export function ReusedPanel({part, host, close, displayChanged, statusChanged}: {part: string; host?: number; close(): void; displayChanged(enabled: boolean): void; statusChanged(status: string): void}) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'legion-part-closed') close();
      if (event.data?.type === 'legion-display') displayChanged(Boolean(event.data.enabled));
      if (event.data?.type === 'legion-status' && typeof event.data.text === 'string') statusChanged(event.data.text === 'Idle' ? 'Ready' : event.data.text);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [close, displayChanged, statusChanged]);
  return <section className="hub-reused-panel" aria-label={partTitles[part]}>{!settingParts[part] && part !== 'scan' && part !== 'tool' && <button className="hub-part-close" aria-label={`Close ${partTitles[part]}`} onClick={close}>×</button>}<iframe ref={frame} title={partTitles[part]} src={`/?part=${encodeURIComponent(part)}${host ? `&host=${host}` : ''}`}/></section>;
}
