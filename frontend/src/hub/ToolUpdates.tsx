import {useEffect, useRef, useState} from 'react';
import * as api from './api';

const labels = {pending: 'Waiting', checking: 'Checking', updating: 'Updating', current: 'Up to date', updated: 'Updated', failed: 'Failed'};

function UpdateIcon({running, done, progress}: {running: boolean; done: boolean; progress: number}) {
  return <span className="tool-update-icon"><svg viewBox="0 0 32 32" aria-hidden="true">
    {running ? <><circle className="tool-update-track" cx="16" cy="16" r="14"/><circle className="tool-update-progress" cx="16" cy="16" r="14" strokeDasharray={88} strokeDashoffset={88 * (1 - progress)}/><path d="M16 9v13m-5-5 5 5 5-5"/></> : done ? <path d="m10 16 4 4 8-8"/> : <><circle cx="16" cy="16" r="8"/><path d="M16 21V11m-4 4 4-4 4 4"/></>}
  </svg></span>;
}

export function ToolUpdates() {
  const [state, setState] = useState<api.ToolUpdateState | null>(null);
  const [open, setOpen] = useState(false), [starting, setStarting] = useState(false), [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      try {const value = await api.toolUpdates(); if (active) {setState(value); setError('');}}
      catch (err) {if (active) setError((err as Error).message);}
      if (active) timer = setTimeout(() => {void check();}, 1500);
    }
    void check();
    return () => {active = false; clearTimeout(timer);};
  }, []);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {if (!root.current?.contains(event.target as Node)) setOpen(false);}
    document.addEventListener('pointerdown', outside);
    root.current?.querySelector<HTMLButtonElement>('[aria-label="Close tool updates"]')?.focus();
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const rows = state?.tools || [];
  const finished = rows.filter(row => ['current', 'updated', 'failed'].includes(row.status || 'pending')).length;
  const failed = rows.filter(row => row.status === 'failed').length;
  const running = Boolean(state?.running || starting);
  const settled = rows.length > 0 && finished === rows.length && !running;
  const title = running ? `Updating tools ${finished}/${rows.length}` : failed ? `${failed} update${failed === 1 ? '' : 's'} failed` : settled ? 'Tools up to date' : 'Update tools';

  async function start(retry = false) {
    setStarting(true); setError(''); setOpen(true);
    try {setState(await api.updateTools(retry));}
    catch (err) {setError((err as Error).message);}
    finally {setStarting(false);}
  }
  function close() {setOpen(false); trigger.current?.focus();}

  return <div className={`tool-update-control${running ? ' is-running' : ''}${failed ? ' has-failures' : ''}`} ref={root} onKeyDown={event => {if (event.key === 'Escape') {event.stopPropagation(); close();}}}>
    <button ref={trigger} type="button" className="tool-update-capsule" aria-label={title} title={title} aria-expanded={open} aria-controls="tool-update-popover" onClick={() => {if (!running && !settled) void start(); else setOpen(!open);}}>
      {(running || settled) && <span className="tool-update-label" aria-live="polite">{running ? `${finished}/${rows.length} tools` : failed ? `${failed} failed` : 'Up to date'}</span>}
      <UpdateIcon running={running} done={settled && !failed} progress={rows.length ? finished / rows.length : 0}/>
    </button>
    {open && <section id="tool-update-popover" className="tool-update-popover" role="dialog" aria-label="Tool updates" style={{left: Math.max(8, (root.current?.getBoundingClientRect().right || 308) - 300), bottom: window.innerHeight - (root.current?.getBoundingClientRect().top || window.innerHeight - 50) + 10}}>
      <div className="tool-update-heading"><strong>Tool updates</strong><button type="button" aria-label="Close tool updates" onClick={close}>×</button></div>
      <p className="tool-update-description">Latest releases, one tool at a time.</p>
      <div className="tool-update-rows" aria-live="polite">{rows.map(row => <div key={row.name} className="tool-update-row">
        <div><span className="tool-update-name">{row.name}</span><span className={`tool-update-state state-${row.status}`}>{['checking', 'updating'].includes(row.status || 'pending') && <span className="tool-update-spinner"/>}{labels[row.status || 'pending']}</span></div>
        {row.error && <p className="tool-update-error">{row.error}</p>}
      </div>)}</div>
      {error && <p className="tool-update-error" role="alert">{error}</p>}
      {state?.error && !failed && <p className="tool-update-error" role="alert">{state.error}</p>}
      {!running && <div className="tool-update-actions">{failed > 0 && <button type="button" onClick={() => {void start(true);}}>Retry failed</button>}<button type="button" onClick={() => {void start();}}>Update tools</button></div>}
      <a className="tool-update-credit" href="https://github.com/pingdotgg/t3code" target="_blank" rel="noreferrer">Update interface inspired by T3 Code ↗</a>
    </section>}
  </div>;
}
