import {useMemo, useRef, useState} from 'react';
import {Dialog} from './Dialog';
export interface Command {id: string; label: string; detail?: string; run(): void}
export function Palette({commands, close}: {commands: Command[]; close(): void}) {
  const [query, setQuery] = useState(''), [index, setIndex] = useState(0);
  const results = useMemo(() => commands.filter(item => `${item.label} ${item.detail || ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 30), [commands, query]);
  const rows = useRef<HTMLDivElement>(null);
  function run(position: number) {const command = results[position]; if (command) {close(); command.run();}}
  return <Dialog title="Search workspace" close={close}><div onKeyDown={event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setIndex(value => {
        const next = (value + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(1, results.length);
        rows.current?.children[next]?.scrollIntoView?.({block: 'nearest'}); return next;
      });
    }
    if (event.key === 'Enter') {event.preventDefault(); run(index);}
  }}><input aria-label="Search views, actions, and hosts" placeholder="Search…" value={query} onChange={event => {setQuery(event.target.value); setIndex(0);}} aria-controls="hub-search-results" aria-activedescendant={results[index] ? `hub-command-${index}` : undefined}/><div id="hub-search-results" className="hub-palette-results" ref={rows} role="listbox">{results.map((item, position) => <button key={item.id} id={`hub-command-${position}`} role="option" aria-selected={position === index} onClick={() => run(position)}><span>{item.label}</span><small>{item.detail}</small></button>)}</div></div></Dialog>;
}
