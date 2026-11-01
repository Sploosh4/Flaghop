import {useEffect, useLayoutEffect, useRef} from 'react';

export interface MenuItem {label: string; run(): void; disabled?: boolean}
export function Menu({items, x, y, close, label = 'Project actions'}: {items: MenuItem[]; x: number; y: number; close(): void; label?: string}) {
  const root = useRef<HTMLDivElement>(null), previous = useRef(document.activeElement as HTMLElement | null);
  useLayoutEffect(() => {
    const menu = root.current!;
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - menu.offsetHeight - 8))}px`;
    menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    return () => previous.current?.focus();
  }, []);
  useEffect(() => {
    const outside = (event: PointerEvent) => {if (!root.current?.contains(event.target as Node)) close();};
    window.addEventListener('pointerdown', outside); window.addEventListener('blur', close); window.addEventListener('resize', close);
    return () => {window.removeEventListener('pointerdown', outside); window.removeEventListener('blur', close); window.removeEventListener('resize', close);};
  }, [close]);
  return <div className="hub-context-menu" role="menu" aria-label={label} ref={root} style={{left: x, top: y}} onKeyDown={event => {
    if (event.key === 'Escape' || event.key === 'Tab') {event.preventDefault(); close();}
    if (/^[1-9]$/.test(event.key)) {event.preventDefault(); root.current!.querySelectorAll<HTMLButtonElement>('button')[Number(event.key) - 1]?.click();}
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...root.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')], index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }}>{items.map(item => <button key={item.label} role="menuitem" disabled={item.disabled} onClick={() => {close(); item.run();}}>{item.label}</button>)}</div>;
}
