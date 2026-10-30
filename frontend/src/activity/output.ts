import {getProcessOutput} from '../api/activity';
import {createStore} from '../store';

const empty = () => ({id: 0, text: '', command: '', progress: '', meta: 'No process selected',
  loading: false, error: '', offset: 0, complete: true});

/** One output session; late responses cannot repaint a closed or newly selected process. */
export class OutputSession {
  readonly store = createStore(empty());
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private setOpen: (open: boolean) => void) {}

  async open(id: number) {
    this.close();
    this.store.set({...empty(), id, complete: false, meta: `Process ${id} | loading...`});
    this.setOpen(true);
    await this.refresh();
  }
  close() {
    this.generation++;
    clearTimeout(this.timer);
    this.store.set(empty());
    this.setOpen(false);
  }
  async refresh() {
    const current = this.store.getSnapshot();
    if (!current.id || current.loading) return;
    clearTimeout(this.timer);
    const generation = this.generation;
    this.store.set({...current, loading: true, error: ''});
    try {
      const payload = await getProcessOutput(current.id, current.offset);
      if (generation !== this.generation) return;
      const progress = payload.progress;
      const detail = [progress?.source, progress?.updated_at && `updated ${progress.updated_at}`].filter(Boolean).join(' | ');
      this.store.set({...current, text: current.text + payload.output_chunk, command: payload.command || '',
        progress: [progress?.summary, detail].filter(Boolean).join('\n'),
        meta: `Process ${payload.id} | ${payload.status || ''} | bytes ${payload.next_offset}/${payload.output_length}`,
        offset: payload.next_offset, complete: payload.completed && payload.next_offset >= payload.output_length,
        loading: false, error: ''});
    } catch (error) {
      if (generation !== this.generation) return;
      this.store.set({...current, loading: false, error: `Failed to load process output: ${error instanceof Error ? error.message : error}`});
    }
    if (generation === this.generation && !this.store.getSnapshot().complete) {
      this.timer = setTimeout(() => {void this.refresh();}, 1200);
    }
  }
}
