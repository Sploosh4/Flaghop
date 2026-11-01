import type {DesktopWindow} from './desktop';

export function WindowControls({desktop}: {desktop: DesktopWindow}) {
  return <div className="hub-window-controls" aria-label="Window controls">
    <button aria-label="Minimise window" title="Minimise" onClick={() => desktop.minimize()}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8"/></svg></button>
    <button aria-label={desktop.maximized ? 'Restore window' : 'Maximise window'} title={desktop.maximized ? 'Restore' : 'Maximise'} onClick={() => desktop.toggleMaximize()}><svg viewBox="0 0 16 16" aria-hidden="true"><path d={desktop.maximized ? 'M5 3h8v8M3 5h8v8H3Z' : 'M4 4h8v8H4Z'}/></svg></button>
    <button aria-label="Close window" title="Close" onClick={() => desktop.close()}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 5 6 6m0-6-6 6"/></svg></button>
  </div>;
}
