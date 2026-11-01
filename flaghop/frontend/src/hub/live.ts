import {useEffect, useRef, useState} from 'react';
import * as api from './api';

export function useLiveWorkspace() {
  const [snapshot, setSnapshot] = useState<api.Snapshot | null>(null);
  const [connection, setConnection] = useState('Connecting');
  const refresh = useRef(() => {});
  useEffect(() => {
    let active = true, loading = false, socket: WebSocket | null = null, reconnect: ReturnType<typeof setTimeout>;
    let again = false;
    async function update() {
      if (loading) {again = true; return;}
      loading = true;
      try {
        const data = await api.snapshot();
        if (active) {setSnapshot(data); setConnection(socket?.readyState === 1 ? 'Live' : 'Polling/API');}
      } catch {if (active) setConnection('Offline');}
      finally {loading = false; if (active && again) {again = false; void update();}}
    }
    refresh.current = () => {void update();};
    function connect() {
      if (document.getElementById('project-hub-root')?.dataset.wsEnabled !== 'true' || typeof WebSocket === 'undefined') return;
      socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/snapshot`);
      socket.onopen = () => {if (active) {setConnection('Live'); void update();}};
      socket.onmessage = event => {
        try {if (JSON.parse(event.data).type === 'invalidate') void update();} catch { /* Ignore malformed notifications; polling remains available. */ }
      };
      socket.onclose = () => {if (active) {setConnection('Polling/API'); reconnect = setTimeout(connect, 3000);}};
      socket.onerror = () => socket?.close();
    }
    void update(); connect();
    const poll = setInterval(() => {if (socket?.readyState !== 1) void update();}, 2000);
    const heartbeat = setInterval(() => {void update();}, 30000);
    return () => {active = false; clearInterval(poll); clearInterval(heartbeat); clearTimeout(reconnect); socket?.close(); refresh.current = () => {};};
  }, []);
  return {snapshot, connection, refresh: () => refresh.current()};
}
