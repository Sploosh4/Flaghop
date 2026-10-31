import {useEffect, useRef, useState} from 'react';

export function ProjectLabel({name, onRename, request = 0, doubleClick = false}: {
  name: string; onRename(name: string): Promise<void>; request?: number; doubleClick?: boolean;
}) {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState(name), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  function begin() {setDraft(name); setError(''); setEditing(true);}
  useEffect(() => {if (request) begin();}, [request]);
  useEffect(() => {if (editing) {input.current?.focus(); input.current?.select();}}, [editing]);
  async function save() {
    if (pending.current) return;
    if (draft.trim() === name) {setEditing(false); return;}
    if (!draft.trim()) {setError('Enter a project name.'); input.current?.focus(); return;}
    pending.current = true; setBusy(true); setError('');
    try {await onRename(draft.trim()); setEditing(false);}
    catch (error) {setError(error instanceof Error ? error.message : String(error)); input.current?.focus();}
    finally {pending.current = false; setBusy(false);}
  }
  return <span className="hub-project-label">{editing ? <input ref={input} aria-label="Project name" maxLength={120} value={draft} disabled={busy} onChange={event => setDraft(event.target.value)} onBlur={() => {void save();}} onKeyDown={event => {
    if (event.key === 'Enter') {event.preventDefault(); void save();}
    if (event.key === 'Escape' && !pending.current) {event.preventDefault(); event.stopPropagation(); setEditing(false);}
  }}/> : <button className="hub-name" aria-label={`Rename ${name}`} title={doubleClick ? 'Double-click to rename' : 'Rename project'} onClick={doubleClick ? undefined : begin} onDoubleClick={doubleClick ? begin : undefined}>{name}</button>}{error && <span className="hub-inline-error" role="alert">{error}</span>}</span>;
}
