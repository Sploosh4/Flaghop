import {useEffect, useState} from 'react';

export interface DesktopWindow {
  maximized: boolean;
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
  startMove(): void;
  resizeEdge(edge: string): void;
}

declare global {
  interface Window {legionDesktop?: DesktopWindow}
}

export function useDesktopWindow() {
  const [desktop, setDesktop] = useState(() => window.legionDesktop);
  useEffect(() => {
    const changed = () => setDesktop(window.legionDesktop ? {...window.legionDesktop} : undefined);
    window.addEventListener('legion-desktop-changed', changed);
    changed();
    return () => window.removeEventListener('legion-desktop-changed', changed);
  }, []);
  return desktop;
}
