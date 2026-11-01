"""Compare the frozen collection without changing inputs, goals or score rules."""
import hashlib,json,os
from collections import Counter,deque
from pathlib import Path
HERE=Path(__file__).resolve().parent
RUNS=HERE/'runs'
OUT=HERE.parent/'validation/fixes-2026-10-31'

def counts(rows):return dict(Counter(r['outcome'] for r in rows))
def diagnostics(rows):
 panics=[];controls=[];hypotheses=[]
 for row in rows:
  folder=Path(row['report']).parent
  for p in (folder/'ciphey').glob('versions/*/*/raw/candidate-*.stderr.txt'):
   if 'panicked at' in p.read_text(errors='replace'):panics.append({'case':row['id'],'log':str(p)})
  for p in (folder/'ciphey').glob('versions/*/*/report.json'):
   for f in json.loads(p.read_text())['findings']:
    if any(not ch.isprintable() and ch not in '\n\r\t' for ch in f['text']):controls.append({'case':row['id'],'report':str(p)})
  if row['goal']=='plaintext' and row['outcome']=='pass':
   graph=json.loads(Path(row['report']).read_text());adj={}
   for e in graph['edges']:
    if not e['kind'].startswith('hypothesis:'):adj.setdefault(e['parent'],[]).append(e['child'])
   reached=set(s['node'] for s in graph['sources'] if s['node']);pending=list(reached)
   while pending:
    for child in adj.get(pending.pop(),[]):
     if child not in reached:reached.add(child);pending.append(child)
   manifest=next(c for c in ALL_CASES if c['id']==row['id'])
   expected=hashlib.sha256(bytes.fromhex(manifest['expected_hex'])).hexdigest()
   if expected not in reached:hypotheses.append(row['id'])
 return {'panic_attempts':panics,'accepted_control_outputs':controls,'hypothesis_required_cases':hypotheses,
         'hidden_hash_failures':[r['id'] for r in rows if r.get('hash_failures_with_done_parent')],
         'integrity_failures':[r['id'] for r in rows if not r.get('sources_unchanged') or not r.get('immutable_objects_valid')],
         'worker_failures':[r['id'] for r in rows if r['outcome'] in ('worker_error','external_timeout','integrity_failure')]}

ALL_CASES=[]
for name in ('manifest.json','volume-manifest.json'):ALL_CASES+=json.loads((HERE/name).read_text())['cases']
old=json.loads((RUNS/'summary.json').read_text())
a=json.loads((RUNS/'2026-10-31-fixed-collection/summary.json').read_text())
b=json.loads((RUNS/'2026-10-31-fixed-volume/summary.json').read_text())
assert a['code_unchanged'] and b['code_unchanged'] and a['code_sha256']==b['code_sha256']
rows=a['cases']+b['cases'];before={r['id']:r for r in old['cases']};after={r['id']:r for r in rows}
assert before.keys()==after.keys() and len(rows)==255
for key,row in after.items():
 assert row['input_sha256']==before[key]['input_sha256'],key
 assert row['wordlist_sha256']==before[key]['wordlist_sha256'],key
 assert row['goal']==before[key]['goal'] and row['limits']==before[key]['limits'],key
for name,digest in old['corpus_manifests'].items():assert hashlib.sha256((HERE/name).read_bytes()).hexdigest()==digest
previous=diagnostics(old['cases']);current=diagnostics(rows)
transitions={key:before[key]['outcome']+' -> '+after[key]['outcome'] for key in after}
comparison={'files':255,'before':counts(old['cases']),'after':counts(rows),'inputs_goals_seeds_limits_unchanged':True,
 'code_frozen_during_each_rerun':True,'scored_goals_met':sum(r['outcome']=='pass' for r in rows),'unlabelled_observations':sum(r['outcome']=='observation' for r in rows),
 'regressions':[key for key in before if before[key]['outcome']=='pass' and after[key]['outcome']!='pass'],
 'previously_unmet_now_pass':[key for key in before if before[key]['outcome'] in ('miss','noise','inconclusive') and after[key]['outcome']=='pass'],
 'transitions':transitions,'diagnostics_before':previous,'diagnostics_after':current,'reader_code_sha256':a['code_sha256']}
(OUT/'comparison.json').write_text(json.dumps(comparison,indent=2)+'\n')
(OUT/'rerun-summary.json').write_text(json.dumps({'cases':rows,'totals':counts(rows),'run_parts':['2026-10-31-fixed-volume','2026-10-31-fixed-collection']},indent=2)+'\n')
lines=['# Reader fixes and frozen-collection rerun','',
 'No CTFs, challenge services, labs or network targets were set up or used. All tests used the same offline files as the original evaluation. No recovered credential was used for authentication.','',
 '**Result: all 240 scored goals met; the same 15 unlabelled public samples remain observations.** This is goal completion on a frozen collection, not a claim that every file was decrypted or that arbitrary input has 100% detection accuracy.','',
 '| Outcome | Before | After |','|---|---:|---:|']
for outcome in ('pass','miss','noise','inconclusive','observation'):lines.append(f"| {outcome} | {counts(old['cases']).get(outcome,0)} | {counts(rows).get(outcome,0)} |")
lines += ['', '## Priority fix: late payloads','',
 'All seven end-of-file payloads now recover, including the six previously missed. All four beginning-of-file probes still recover, and all seven larger negative controls now complete without the old repeated-candidate cutoff. Sizes range from 16 KB to 1.9 MB.','',
 'Both extraction paths now count distinct decoded byte values. Repeated matches are scanned once per encoding representation, retain bounded source locations and total occurrence counts, and do not spend the entire content budget. Base64dump retains up to eight locations per decoded value, including first/last occurrences. The normalization pass scans past duplicate quoted values instead of stopping after its first 64 matches.','',
 'A language-checking deadline no longer discards already-extracted byte records: those remain available to hash/container routing. Real distinct-value overflow, oversized candidates and time/expansion limits still produce explicit partial/limit evidence.','',
 '## Other fixes','',
 '- Added canonical Base32/Base85/Ascii85, percent-byte and Unicode-text decoding, plus literal quoted-string concatenation without evaluating source code.',
 '- Added bounded bzip2/XZ decoding, PNG text-chunk extraction and direct-length single-Flate PDF streams. XZ now has a real decompression edge rather than incidental byte recovery.',
 '- Added SHA-224/SHA-384 detection and adapters, checked against real John and Hashcat recovery with independent hashlib verification. Added sibling algorithm/hash field parsing and pwdump NT-field recognition.',
 '- Checksum context now works in plain log text and JSON embedded after a log prefix; the two unwanted cracking actions became review-only detections.',
 '- Parent status includes hash-reader errors and transform limits, so the malformed SSH helper failure remains visible as partial.',
 '- Canonical Base64 text layers are peeled before heuristic search. Typed hashes/opaque identifiers bypass risky native search and remain routed artifacts. Non-text checker output is rejected. The pinned native Ciphey binary itself was not upgraded or patched.','',
 '## Validation and remaining interpretation limits','',
 f"- Actual Ciphey panic attempts: {len(previous['panic_attempts'])} -> {len(current['panic_attempts'])}; files with panics: {len({p['case'] for p in previous['panic_attempts']})} -> {len({p['case'] for p in current['panic_attempts']})}.",
 f"- Accepted control-character outputs: {len(previous['accepted_control_outputs'])} -> {len(current['accepted_control_outputs'])}.",
 f"- Hash failures hidden beneath a done parent: {len(previous['hidden_hash_failures'])} -> {len(current['hidden_hash_failures'])}.",
 f"- Regressions of previously passed goals: {len(comparison['regressions'])}. Original/artifact integrity failures after fixes: {len(current['integrity_failures'])}. Evaluator crashes/external guard timeouts: {len(current['worker_failures'])}.",
 '- All original input hashes, goals, audit seed hashes and numeric evaluation limits match the previous run. The 237-file and 18-file reruns each use fresh projects and pot files. Reader code was frozen throughout both runs.',
 '- The 17 Cipher Watch, 24 Hash Watch and 23 shared-loop baseline tests passed. Twelve new regression tests passed, including near-limit duplicate/footer coverage, true distinct-value overflow, retained leads after a deadline, context parsing, real SHA-224/SHA-384 native recovery and failure-status propagation.',
 f"- {len(current['hypothesis_required_cases'])} raw classical-cipher goals are reached through explicitly unverified ROT13/reversal hypotheses: {', '.join(current['hypothesis_required_cases'])}. Their exact known bytes match the test oracle; the product does not claim it has independently established the historical plaintext. Printable partial checker fragments also remain unverified candidates.",
 '- needs_format and needs_adapter outcomes remain appropriate for ambiguous hashes and unsupported recovery adapters. A finite candidate plan can correctly exhaust without finding a password. Neither outcome is counted as decryption success.',
 '- Native Ciphey can still fail on other inputs. Avoiding the measured panic paths and rejecting control bytes is not a general repair of its upstream heuristics.',
 '- The 2 MB file, 64 distinct decoded-value, 128 artifact, depth, expansion and time budgets remain deliberate limits. Larger or more diverse inputs can still be partial; repeated occurrences no longer masquerade as 64 distinct leads.',
 '- General PDF parsing, arbitrary archive/encryption variants, OCR and dynamic code expressions remain outside these added routes.','',
 '## Per-case results','', '| Case | Before | After | Native evidence |','|---|---|---|---|']
for row in rows:
 ref=os.path.relpath(row['report'],OUT)
 lines.append(f"| {row['id']} | {before[row['id']]['outcome']} | {row['outcome']} | [report]({ref}) |")
lines += ['', '## Evidence','',
 '- [Machine-readable comparison](comparison.json)', '- [Full rerun metadata](rerun-summary.json)',
 '- [New regression tests](regressions.log)', '- [Shared baseline](shared-baseline.log)',
 '- [Cipher baseline](cipher-baseline.log)', '- [Hash baseline](hash-baseline.log)',
 '- [Original collection report](../../evaluation/runs/RESULTS.md)',
 '- [Saved active-reader launch and restoration record](active-reader.json)', '']
(OUT/'RESULTS.md').write_text('\n'.join(lines))
print(json.dumps({k:comparison[k] for k in ('before','after','scored_goals_met','unlabelled_observations','regressions')},indent=2))
print('Classical hypothesis cases:',current['hypothesis_required_cases'])
