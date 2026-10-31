import {useEffect, useRef} from 'react';
import type {ReactNode} from 'react';

export function Dialog({title, close, children}: {title: string; close(): void; children: ReactNode}) {
  const root = useRef<HTMLDivElement>(null), previous = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {root.current?.querySelector<HTMLElement>('input,button')?.focus(); return () => previous.current?.focus();}, []);
  return <div className="hub-modal-backdrop" onClick={event => {if (event.target === event.currentTarget) close();}}><div className="hub-modal" role="dialog" aria-modal="true" aria-label={title} ref={root} onKeyDown={event => {
    if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); close();}
    if (event.key === 'Tab') {
      const items = [...root.current!.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled),select:not(:disabled),a[href]')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
      if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
    }
  }}><h2>{title}</h2>{children}</div></div>;
}
