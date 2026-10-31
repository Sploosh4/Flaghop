import {useEffect, useRef, useState} from 'react';
import type {KeyboardEvent, PointerEvent} from 'react';

export function readPreference<T>(key: string, fallback: T): T {
  try {const value = localStorage.getItem(`legion.workspace.${key}`); return value === null ? fallback : JSON.parse(value) as T;} catch {return fallback;}
}
export function writePreference(key: string, value: unknown) {
  try {localStorage.setItem(`legion.workspace.${key}`, JSON.stringify(value));} catch { /* Private mode remains usable. */ }
}
function useSplitWidth(key: string, initial: number, min: number, max: number, sign = 1) {
  const clamp = (value: number) => Math.max(min, Math.min(max, value));
  const [width, setWidth] = useState(() => {
    const saved = readPreference(key, initial);
    return typeof saved === 'number' && Number.isFinite(saved) ? clamp(saved) : initial;
  });
  const dragging = useRef<{x: number; width: number} | null>(null);
  useEffect(() => writePreference(key, width), [key, width]);
  return {width, resize: {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (event.button !== 0) return;
      dragging.current = {x: event.clientX, width};
      event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault();
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (dragging.current) setWidth(clamp(dragging.current.width + sign * (event.clientX - dragging.current.x)));
    },
    onPointerUp() {dragging.current = null;}, onPointerCancel() {dragging.current = null;},
    onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      setWidth(value => event.key === 'Home' ? min : event.key === 'End' ? max : clamp(value + sign * (event.key === 'ArrowLeft' ? -10 : 10)));
    },
  }};
}
export function useSidebarWidth() {return useSplitWidth('sidebarWidth', 260, 210, 340);}
export function useActionPanelWidth() {return useSplitWidth('actionPanelWidth', 340, 280, 480, -1);}
