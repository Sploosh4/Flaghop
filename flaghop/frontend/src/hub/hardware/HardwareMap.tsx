import {useEffect, useMemo, useRef, useState} from 'react';
import type {CSSProperties, PointerEvent} from 'react';
import {Menu} from '../Menu';
import {readPreference, writePreference} from '../preferences';
import {hardwareLayout} from './model';
import type {HardwareGraph, HardwareNode} from './model';

const assets = '/static/images/hardware/';
const editable = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"],[role="menu"]'));

export function HardwareMap({projectId, graph, onSelect, onOpen, onSetup}: {
  projectId: string; graph: HardwareGraph; onSelect(node: HardwareNode | null): void; onOpen(id: number): void; onSetup(): void;
}) {
  const canvas = useRef<HTMLDivElement>(null), drag = useRef<{x: number; y: number; dx: number; dy: number} | null>(null);
  const [size, setSize] = useState({width: 840, height: 650});
  const [view, setView] = useState({x: 0, y: 0, zoom: 1}), [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{node: HardwareNode; x: number; y: number} | null>(null);
  const layout = useMemo(() => hardwareLayout(graph), [graph]);
  const [numbers, setNumbers] = useState<string[]>(() => {
    const saved = readPreference<unknown>(`hardwareNumbers:${projectId}`, []);
    return Array.isArray(saved) ? [...new Set(saved.filter((id): id is string => typeof id === 'string' && /^host-\d+$/.test(id)))].slice(0, 9) : [];
  });
  useEffect(() => {
    setNumbers(current => {
      const next = [...current];
      for (const node of graph.nodes) if (node.kind === 'host' && !next.includes(node.id) && next.length < 9) next.push(node.id);
      if (next.length === current.length) return current;
      writePreference(`hardwareNumbers:${projectId}`, next); return next;
    });
  }, [projectId, graph.nodes]);
  useEffect(() => {
    const element = canvas.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      if (rect.width && rect.height) setSize({width: rect.width, height: rect.height});
    });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || !event.deltaY) return;
      event.preventDefault();
      setView(current => ({...current, zoom: Math.max(.3, Math.min(3, current.zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12)))}));
    };
    element.addEventListener('wheel', wheel, {passive: false});
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  // Inventory growth refits automatically; changing the selection keeps the view still.
  useEffect(() => setView({x: 0, y: 0, zoom: 1}), [layout.width, layout.height]);
  const scale = Math.max(.001, Math.min(1, (size.width - 28) / layout.width, (size.height - 28) / layout.height)) * view.zoom;
  const x = (size.width - layout.width * scale) / 2 + view.x, y = (size.height - layout.height * scale) / 2 + view.y;
  const select = (node: HardwareNode | null) => {setSelected(node?.id || null); onSelect(node);};
  useEffect(() => {
    if (!selected) return;
    const current = graph.nodes.find(node => node.id === selected);
    if (!current) {setSelected(null); onSelect(null);} else onSelect(current);
  }, [graph.nodes, selected, onSelect]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || editable(event.target)
        || [...document.querySelectorAll('[role="dialog"],[role="menu"]')].some(element => element.getClientRects().length > 0)) return;
      if (event.key === '0' || event.key === 'Escape') {event.preventDefault(); select(null); setView({x: 0, y: 0, zoom: 1});}
      const index = Number(event.key) - 1;
      if (/^[1-9]$/.test(event.key)) {
        const node = graph.nodes.find(node => node.id === numbers[index]);
        if (node) {event.preventDefault(); select(node); canvas.current?.querySelector<HTMLButtonElement>(`[data-hardware-id="${node.id}"]`)?.focus({preventScroll: true});}
      }
      if (event.key === '`' && selected) {
        const node = graph.nodes.find(node => node.id === selected), element = canvas.current?.querySelector(`[data-hardware-id="${selected}"]`);
        if (node && element) {event.preventDefault(); const rect = element.getBoundingClientRect(); setMenu({node, x: rect.right, y: rect.top});}
      }
    };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [graph.nodes, selected, numbers, onSelect]);
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as Element).closest('button')) return;
    drag.current = {x: event.clientX, y: event.clientY, dx: view.x, dy: view.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  return <div ref={canvas} className="hardware-canvas" role="region" aria-label="Hardware map" tabIndex={-1}
    onPointerDown={pointerDown} onPointerMove={event => {if (drag.current) {const start = drag.current; setView(current => ({...current, x: start.dx + event.clientX - start.x, y: start.dy + event.clientY - start.y}));}}}
    onPointerUp={event => {if (drag.current && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) < 4) select(null); drag.current = null;}}
    onPointerCancel={() => {drag.current = null;}}>
    <div className="hardware-world" style={{width: layout.width, height: layout.height, transform: `translate(${x}px, ${y}px) scale(${scale})`}}>
      <svg className="hardware-links" width={layout.width} height={layout.height} aria-label="Observed connections">
        {graph.links.map(link => {
          const from = layout.nodes.find(node => node.id === link.from), to = layout.nodes.find(node => node.id === link.to);
          if (!from || !to) return null;
          return <line key={link.id} data-link-kind={link.kind} x1={from.x} y1={from.y} x2={to.x} y2={to.y}><title>{`${link.kind === 'vpn' ? 'VPN route' : 'Observed route'} · ${link.observedAt}`}</title></line>;
        })}
      </svg>
      {layout.nodes.map(node => {
        const active = node.id === selected, number = node.kind === 'laptop' ? '0' : numbers.includes(node.id) ? String(numbers.indexOf(node.id) + 1) : '';
        const label = [node.label, node.ip, node.hostname, node.os].filter(Boolean).join(' · ') || 'Unknown device';
        return <button key={node.id} type="button" className="hardware-node" data-hardware-id={node.id} data-artwork={node.artwork} aria-label={label} aria-pressed={active}
          style={{left: node.x, top: node.y, '--hardware-contour': `url("${assets}${node.artwork}-contour.svg")`} as CSSProperties}
          onClick={() => select(node)} onDoubleClick={() => {if (node.hostId) onOpen(node.hostId); else onSetup();}}
          onContextMenu={event => {event.preventDefault(); select(node); setMenu({node, x: event.clientX, y: event.clientY});}}>
          {number && <span className="hardware-number" aria-hidden="true">{number}</span>}
          <span className="hardware-artwork"><img src={`${assets}${node.artwork}.png`} width="70" height="70" alt="" draggable={false}/><span className="hardware-contour"/></span>
          <span className="hardware-labels">{[node.label, node.ip, node.hostname, node.os].filter(Boolean).map((value, index) => <span key={index} title={value}>{value}</span>)}</span>
        </button>;
      })}
    </div>
    {menu && <Menu label="Device actions" x={menu.x} y={menu.y} close={() => setMenu(null)} items={[
      ...(menu.node.hostId ? [{label: 'Details', run: () => onOpen(menu.node.hostId!)}] : []),
      {label: 'Project setup', run: onSetup}, {label: 'Home', run: () => {select(null); setView({x: 0, y: 0, zoom: 1});}},
    ]}/>}
  </div>;
}
