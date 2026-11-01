"""Escaped, local HTML review and versioned JSON evidence."""
from datetime import datetime
import html
import json
import os
import sqlite3
import tempfile
from pathlib import Path
from zoneinfo import ZoneInfo


def atomic_text(path, text):
    atomic_bytes(path,text.encode('utf-8'))


def atomic_bytes(path,data):
    fd,name=tempfile.mkstemp(prefix='.reader-write-',suffix='.tmp',dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as stream:
            stream.write(data);stream.flush();os.fsync(stream.fileno())
        os.replace(name,path)
        directory=os.open(path.parent,os.O_RDONLY|os.O_DIRECTORY)
        try:os.fsync(directory)
        finally:os.close(directory)
    finally:Path(name).unlink(missing_ok=True)


class Store:
    def __init__(self, root):
        self.root = root
        self.db = sqlite3.connect(root / "state.sqlite")
        self.db.execute("CREATE TABLE IF NOT EXISTS scans (id TEXT PRIMARY KEY, path TEXT, fingerprint TEXT, config TEXT, report TEXT)")
        self.db.commit()

    def seen(self, path, fingerprint, config):
        row = self.db.execute("SELECT report FROM scans WHERE path=? AND fingerprint=? AND config=? ORDER BY rowid DESC LIMIT 1",
                              (path, fingerprint, config)).fetchone()
        if row and (self.root / row[0]).is_file():
            try:
                return json.loads((self.root / row[0]).read_text())["status"]
            except (OSError, ValueError, KeyError):
                return None
        return None

    def save(self, report, folder):
        relative = (folder / "report.json").relative_to(self.root).as_posix()
        atomic_text(folder / "report.json", json.dumps(report, indent=2, ensure_ascii=True) + "\n")
        self.db.execute("INSERT INTO scans VALUES (?,?,?,?,?)", (report["scan_id"], report["source"]["relative_path"],
                        report["source"]["fingerprint"], report["configuration_id"], relative))
        self.db.commit()
        self.render()
        return self.root / relative

    def render(self):
        rows = self.db.execute("SELECT path, report FROM scans ORDER BY rowid DESC LIMIT 500").fetchall()
        cards = []
        for source, ref in rows:
            try:
                report = json.loads((self.root / ref).read_text())
            except (OSError, ValueError):
                continue
            escaped = html.escape
            local_time = datetime.fromisoformat(report["created_at"]).astimezone(ZoneInfo("Australia/Perth")).strftime("%d %b %Y · %H:%M AWST")
            details = []
            for finding in report["findings"]:
                location = finding["location"]
                link = (Path(ref).parent / finding["decoded_file"]).as_posix()
                details.append(f'<li><b>Line {location["line"]}, byte {location["offset"]}</b> · '
                               f'{escaped(" → ".join(finding["steps"]))}<pre>{escaped(finding["text"])}</pre>'
                               f'<a href="{escaped(link, quote=True)}">Decoded text</a> · Checker accepted; review required</li>')
            warnings = "; ".join(report["coverage"]["warnings"]) or "No processing errors recorded"
            cards.append(f'<article data-status="{escaped(report["status"])}"><div class="meta">'
                         f'{escaped(local_time)} · <strong>{escaped(report["status"])}</strong></div>'
                         f'<h2>{escaped(source)}</h2><p>{len(report["findings"])} decoded candidate(s) · '
                         f'{report["coverage"]["attempted"]} Ciphey attempt(s)</p><p>{escaped(warnings)}</p>'
                         f'<details {"open" if details else ""}><summary>Review decoded candidates</summary><ul>{"".join(details)}</ul></details>'
                         f'<p><a href="{escaped(ref, quote=True)}">JSON evidence</a> · '
                         f'SHA-256: <code>{escaped(report["source"].get("sha256") or "not read")}</code></p></article>')
        document = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Cipher Watch · Findings</title><style>
:root{font-family:system-ui,sans-serif;color:#e7edf7;background:#101621}body{max-width:1100px;margin:48px auto;padding:0 24px}
h1{font-size:36px;margin-bottom:8px}header p{color:#b1bfd2;max-width:780px}input,select{font:inherit;padding:10px;background:#202d40;color:#fff;border:1px solid #526581;border-radius:8px;margin:12px 12px 20px 0}
input{width:min(500px,75%)}article{background:#192333;border:1px solid #33445d;border-left:4px solid #64b9ae;border-radius:10px;padding:20px;margin:16px 0}
article[data-status="partial"],article[data-status="error"]{border-left-color:#f2b66c}.meta{color:#b1bfd2;font-size:13px}h2{font-size:20px;overflow-wrap:anywhere}a{color:#8fc8ff}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#101621;padding:16px;border-radius:8px}code{overflow-wrap:anywhere;font-size:12px}li{margin:18px 0}summary{cursor:pointer}footer{color:#b1bfd2;padding:24px 0}
</style><header><div>CIPHER WATCH / LOCAL PROTOTYPE</div><h1>Decoded evidence</h1>
<p>Review where a string was found, what decoded it, and what still needs checking. Original files are preserved. These are candidate interpretations, not confirmed flags or security findings.</p></header>
<input id="search" aria-label="Search findings" placeholder="Search filenames, text or decoder…"><select id="status" aria-label="Filter scan status"><option value="">All scan states</option><option>complete</option><option>partial</option><option>skipped</option><option>error</option></select>
<main>''' + ("".join(cards) or "<p>No file versions processed yet.</p>") + '''</main>
<footer>Latest 500 file versions · Refresh to load new results · All historical JSON and decoded files remain on disk.</footer>
<script>function filter(){const q=document.getElementById('search').value.toLowerCase(),s=document.getElementById('status').value;document.querySelectorAll('article').forEach(a=>a.hidden=!(a.textContent.toLowerCase().includes(q)&&(!s||a.dataset.status===s)))}document.getElementById('search').addEventListener('input',filter);document.getElementById('status').addEventListener('change',filter);</script></html>'''
        atomic_text(self.root / "index.html", document)

    def close(self):
        self.db.close()
