import {useEffect, useRef} from 'react';
import {filesystemUrl} from '../api';
import type {HubProject} from '../api';

export function FilesView({project, resultId, active}: {project: HubProject; resultId?: string; active: boolean}) {
  const frame = useRef<HTMLIFrameElement>(null), loaded = useRef(false);
  const initial = useRef(filesystemUrl(project.id, resultId));
  useEffect(() => {
    if (resultId && active && loaded.current) frame.current?.contentWindow?.postMessage({type: 'hub-open-result', id: resultId}, window.location.origin);
  }, [resultId, active]);
  return <div className="hub-files-view" hidden={!active}><iframe ref={frame} src={initial.current} title={`${project.name} files and editor`} onLoad={() => {
    loaded.current = true;
    if (resultId && active) frame.current?.contentWindow?.postMessage({type: 'hub-open-result', id: resultId}, window.location.origin);
  }}/></div>;
}
