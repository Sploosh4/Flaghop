"""SQLite queue and escaped HTML/JSON evidence exports."""
from datetime import datetime, timezone
import html
import json
import os
from pathlib import Path
import sqlite3
import tempfile
from zoneinfo import ZoneInfo


def now():
    return datetime.now(timezone.utc).isoformat()


def atomic(path,text):
    atomic_bytes(path,text.encode('utf-8'))


def atomic_bytes(path,data,*,mode=0o600,exclusive=False):
    """Publish complete bytes only; fsync before exposing the final filename."""
    path=Path(path)
    fd,name=tempfile.mkstemp(prefix='.reader-write-',suffix='.tmp',dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as handle:
            handle.write(data);handle.flush();os.fchmod(handle.fileno(),mode);os.fsync(handle.fileno())
        if exclusive:
            os.link(name,path)
        else:
            os.replace(name,path)
        directory=os.open(path.parent,os.O_RDONLY|os.O_DIRECTORY)
        try:os.fsync(directory)
        finally:os.close(directory)
    finally:
        Path(name).unlink(missing_ok=True)


class Store:
    def __init__(self, output):
        self.output=Path(output).resolve()
        self.output.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.db=sqlite3.connect(self.output/'state.sqlite')
        self.db.row_factory=sqlite3.Row
        self.db.executescript('''
        CREATE TABLE IF NOT EXISTS targets (
          id TEXT PRIMARY KEY, value TEXT, format TEXT, basis TEXT, status TEXT,
          stage TEXT, offset INTEGER DEFAULT 0, tried INTEGER DEFAULT 0,
          batch_size INTEGER DEFAULT 128, failures INTEGER DEFAULT 0,
          plan_id TEXT, engine TEXT, backend TEXT, recovered_hex TEXT, verification TEXT,
          updated TEXT, resolved_to TEXT);
        CREATE TABLE IF NOT EXISTS scans (
          id TEXT PRIMARY KEY, source TEXT, sha256 TEXT, config TEXT, report TEXT,
          UNIQUE(source,sha256,config));
        CREATE TABLE IF NOT EXISTS attempts (
          id INTEGER PRIMARY KEY, target_id TEXT, stage TEXT, start_offset INTEGER,
          end_offset INTEGER, candidates INTEGER, engine TEXT, backend TEXT,
          status TEXT, seconds REAL, ref TEXT);
        ''')
        # The CLI owns an exclusive lock before this is called. Interrupted work replays.
        self.db.execute("UPDATE attempts SET status='interrupted' WHERE status='running'")
        self.db.execute("UPDATE targets SET status='queued_'||stage WHERE status LIKE 'running_%'")
        self.db.commit()

    def update(self,target_id,**values):
        allowed={'status','stage','offset','tried','batch_size','failures','engine','backend',
                 'recovered_hex','verification','resolved_to','format','basis'}
        if not set(values)<=allowed:
            raise ValueError('Unknown queue field')
        values['updated']=now()
        self.db.execute('UPDATE targets SET '+','.join(k+'=?' for k in values)+' WHERE id=?',(*values.values(),target_id))
        self.db.commit()

    def target(self,identifier):
        row=self.db.execute('SELECT * FROM targets WHERE id=?',(identifier,)).fetchone()
        return dict(row) if row else None

    def targets(self):
        return [dict(r) for r in self.db.execute('SELECT * FROM targets ORDER BY updated DESC')]

    def export(self):
        targets=self.targets()
        attempts=[dict(r) for r in self.db.execute('SELECT * FROM attempts ORDER BY id')]
        scans=[dict(r) for r in self.db.execute('SELECT * FROM scans ORDER BY rowid DESC')]
        data={'schema_version':1,'generated_at':now(),'targets':targets,'attempts':attempts,'scans':scans,
              'host_ip':None,'scope':'local offline recovery; no network authentication attempted'}
        atomic(self.output/'queue.json',json.dumps(data,indent=2,ensure_ascii=True)+'\n')
        cards=[]
        esc=html.escape
        for target in targets[:500]:
            plain=''
            if target['recovered_hex'] is not None:
                text=bytes.fromhex(target['recovered_hex']).decode('utf-8',errors='replace')
                ref='jobs/'+target['id']+'/recovered.json'
                plain=f'<details><summary>Show recovered password</summary><pre>{esc(text)}</pre><p>{esc(target["verification"] or "")} · <a href="{ref}">Recovery evidence</a></p></details>'
            related=[]
            for scan in scans:
                try:
                    report=json.loads((self.output/scan['report']).read_text())
                except (ValueError,OSError):
                    continue
                if any(c.get('target_id')==target['id'] for c in report.get('candidates',[])):
                    related.append(f'<a href="{esc(scan["report"],quote=True)}">{esc(scan["source"])}</a>')
            cards.append(f'<article data-status="{esc(target["status"])}"><div class="meta">{esc(target["status"])} · {esc(target["engine"] or "unselected")} / {esc(target["backend"] or "—")}</div>'
                         f'<h2>{esc(target["format"] or "Unresolved format")}</h2><code>{esc(target["value"][:240])}{"…" if len(target["value"])>240 else ""}</code><details><summary>Full extracted target</summary><code>{esc(target["value"])}</code></details>'
                         f'<p>{esc(target["basis"] or "")} · Stage: {esc(target["stage"])} · {target["tried"]} input candidates in completed batches</p>'
                         f'<p>{" · ".join(related) or "See resolution/evidence history in queue.json"}</p>{plain}'
                         f'<details><summary>Target ID</summary><code>{target["id"]}</code></details></article>')
        errors=[]
        for scan in scans[:100]:
            r=json.loads((self.output/scan['report']).read_text())
            if r['status']!='complete':
                errors.append(f'<li><a href="{esc(scan["report"],quote=True)}">{esc(scan["source"])}</a>: {esc(r["status"])} · {esc("; ".join(r["warnings"]))}</li>')
        counts={s:sum(t['status']==s for t in targets) for s in sorted({t['status'] for t in targets})}
        stamp=datetime.now(ZoneInfo('Australia/Perth')).strftime('%d %b %Y · %H:%M AWST')
        content='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hash Watch · Recovery queue</title>
<style>:root{font-family:system-ui;color:#e7edf7;background:#101621}body{max-width:1100px;margin:48px auto;padding:0 24px}h1{font-size:36px}header p,.meta,footer{color:#b1bfd2}input,select{font:inherit;padding:10px;background:#202d40;color:white;border:1px solid #526581;border-radius:8px;margin:10px 12px 20px 0}input{width:55%}article{background:#192333;border:1px solid #33445d;border-left:4px solid #edb76d;border-radius:10px;padding:20px;margin:16px 0}article[data-status="recovered"]{border-left-color:#64b9ae}pre{padding:16px;background:#101621;white-space:pre-wrap}code{overflow-wrap:anywhere;white-space:pre-wrap}a{color:#8fc8ff}summary{cursor:pointer}footer{padding:24px 0}</style>
<header><div>HASH WATCH / LOCAL PROTOTYPE</div><h1>Recovery queue</h1><p>Track source evidence, quick attempts and checkpointed deeper searches. A matching pattern is a hypothesis; an exhausted plan is not proof that a password cannot be recovered.</p></header>'''
        content+=f'<p class="meta">{stamp} · {len(scans)} source/config audits · {len(targets)} targets · {esc(json.dumps(counts))}</p>'
        content+='<input id="search" aria-label="Search targets" placeholder="Search format, file, hash or status…"><select id="state" aria-label="Filter queue state"><option value="">All queue states</option>'
        content+=''.join(f'<option>{esc(status)}</option>' for status in counts)+'</select>'
        content+=''.join(cards) or '<p>No recovery targets yet.</p>'
        content+=f'<details><summary>Partial/skipped/error scans ({len(errors)})</summary><ul>{"".join(errors)}</ul></details>'
        content+='''<footer><a href="queue.json">Full JSON evidence and attempts</a> · Latest 500 targets shown · Refresh for updates · Original files remain unchanged.</footer>
<script>function filter(){const q=document.getElementById('search').value.toLowerCase(),s=document.getElementById('state').value;document.querySelectorAll('article').forEach(a=>a.hidden=!(a.textContent.toLowerCase().includes(q)&&(!s||a.dataset.status===s)))}document.getElementById('search').addEventListener('input',filter);document.getElementById('state').addEventListener('change',filter);</script></html>'''
        atomic(self.output/'index.html',content)

    def close(self):
        self.db.close()
