import {useLayoutEffect, useRef} from 'react';
import {ansiTextToHtml} from '../../../app/web/static/js/workspace/output_format.js';

export function IconButton({id, label, icon, disabled, danger, className = 'icon-btn', onClick}: {
  id?: string; label: string; icon: string; disabled?: boolean; danger?: boolean; className?: string; onClick(): void;
}) {
  return <button id={id} type="button" className={`${className}${danger ? ' icon-btn-danger' : ''}`} title={label} aria-label={label}
    disabled={disabled} onClick={onClick}><i className={icon} aria-hidden="true"/></button>;
}

export function TableStatus({error, loading, empty, columns}: {error: string; loading: boolean; empty: boolean; columns: number}) {
  const message = error || (loading ? 'Loading...' : empty ? 'No entries yet.' : '');
  return message ? <tr role={error ? 'alert' : 'status'}><td colSpan={columns}>{message}</td></tr> : null;
}

export function AnsiOutput({id, text}: {id: string; text: string}) {
  const ref = useRef<HTMLDivElement>(null), following = useRef(true);
  useLayoutEffect(() => {
    if (following.current && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);
  // The shared ANSI formatter escapes all text and emits only fixed span/class markup.
  return <div ref={ref} id={id} className="ansi-output-view" role="textbox" aria-readonly="true"
    onScroll={() => {const node = ref.current; if (node) following.current = node.scrollHeight - node.scrollTop - node.clientHeight < 24;}}
    dangerouslySetInnerHTML={{__html: ansiTextToHtml(text)}}/>;
}
