import {useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {panels} from './state';

export function PanelCount({name}: {name: keyof typeof panels}) {
  const store = panels[name];
  const count = useSyncExternalStore(store.subscribe, () => store.getSnapshot().items.length);
  const id = {processes: 'process-count', approvals: 'approval-count', decisions: 'decision-count', scans: 'scan-history-count', rationale: 'decision-rationale-count'}[name];
  const target = document.getElementById(id);
  return target ? createPortal(String(count), target) : null;
}
