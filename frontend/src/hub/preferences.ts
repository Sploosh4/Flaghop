import {useEffect, useRef, useState} from 'react';
import type {KeyboardEvent, PointerEvent} from 'react';

export function readPreference<T>(key: string, fallback: T): T {
  try {const value = localStorage.getItem(`legion.workspace.${key}`); return value === null ? fallback : JSON.parse(value) as T;} catch {return fallback;}
}
export function writePreference(key: string, value: unknown) {
  try {localStorage.setItem(`legion.workspace.${key}`, JSON.stringify(value));} catch { /* Private mode remains usable. */ }
}
const clamp = (value: number) => Math.max(210, Math.min(340, value));
export function useSidebarWidth() {
  const [width, setWidth] = useState(() => {
    const saved = readPreference('sidebarWidth', 260);
    return typeof saved === 'number' && Number.isFinite(saved) ? clamp(saved) : 260;
  });
  const dragging = useRef<{x: number; width: number} | null>(null);
  useEffect(() => writePreference('sidebarWidth', width), [width]);
  return {width, resize: {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (event.button !== 0) return;
      dragging.current = {x: event.clientX, width};
      event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault();
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (dragging.current) setWidth(clamp(dragging.current.width + event.clientX - dragging.current.x));
    },
    onPointerUp() {dragging.current = null;}, onPointerCancel() {dragging.current = null;},
    onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      setWidth(value => event.key === 'Home' ? 210 : event.key === 'End' ? 340 : clamp(value + (event.key === 'ArrowLeft' ? -10 : 10)));
    },
  }};
}
