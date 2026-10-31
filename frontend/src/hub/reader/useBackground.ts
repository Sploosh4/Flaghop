import {useEffect, useMemo, useRef, useState} from 'react';
import * as api from '../api';
import type {HubProject} from '../api';
import {WorkspaceController} from './workspace-controller.js';
import type {WorkspaceView} from './workspace-controller.js';

export function useBackground(project: HubProject | null, openResult: (id: string) => void) {
  const callback = useRef(openResult); callback.current = openResult;
  const selected = useRef(project?.id); selected.current = project?.id;
  const controller = useMemo(() => new WorkspaceController({openResult: ({workspaceId, alert}) => {
    if (selected.current === workspaceId) callback.current(alert.id);
  }}), []);
  const [view, setView] = useState<WorkspaceView | null>(null);
  useEffect(() => controller.subscribe(setView), [controller]);
  useEffect(() => {
    const id = project?.id;
    if (!id || !project) {void controller.select(null); return;}
    if (!controller.workspaces.has(id)) controller.register({id, label: project.name, adapter: {
      read: () => api.background(id), setRunning: running => api.controlBackground(id, running),
      dismiss: alertId => api.dismissAlert(id, alertId), result: alert => api.readerResult(id, alert.id),
    }});
    controller.workspaces.get(id)!.label = project.name;
    void controller.select(id);
    let stopped = false, timer: ReturnType<typeof setTimeout>;
    async function poll() {await controller.refresh(id); if (!stopped) timer = setTimeout(poll, 2000);}
    timer = setTimeout(poll, 2000);
    return () => {stopped = true; clearTimeout(timer);};
  }, [controller, project?.id, project?.name]);
  return {controller, view: view?.id === project?.id ? view : null};
}
