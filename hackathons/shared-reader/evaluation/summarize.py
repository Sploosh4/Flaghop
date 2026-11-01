"""Summarise scored goals separately from unlabelled observations and errors."""
import argparse,json,os
from collections import Counter,defaultdict
from datetime import datetime
from pathlib import Path
HERE=Path(__file__).resolve().parent

def main():
 p=argparse.ArgumentParser();p.add_argument('run',type=Path);args=p.parse_args()
 run=args.run.resolve();report=json.loads((run/'summary.json').read_text());rows=report['cases']
 manifest=json.loads((HERE/'manifest.json').read_text());cases={c['id']:c for c in manifest['cases']}
 counts=lambda values:dict(Counter(r['outcome'] for r in values))
 content=[r for r in rows if r['goal'] in ('plaintext','password')]
 negatives=[r for r in rows if r['group'] in ('negative_controls','larger_negative_controls')]
 public=[r for r in rows if r['scope']=='unlabelled']
 labelled=[r for r in rows if r['scope']!='unlabelled']
 groups={g:counts(r for r in rows if r['group']==g) for g in sorted({r['group'] for r in rows})}
 analysis={'total_files':len(rows),'labelled_files':len(labelled),'unlabelled_files':len(public),
  'totals':counts(rows),'content_recovery_goals':{'cases':len(content),'outcomes':counts(content)},
  'supported_content_goals':counts(r for r in content if r['scope']=='supported'),
  'desired_content_goals':counts(r for r in content if r['scope']=='desired'),
  'negative_controls':counts(negatives),'public_unlabelled':counts(public),'groups':groups,
  'cases_not_fully_drained':[r['id'] for r in rows if r.get('remaining_work')],
  'original_integrity_failures':[r['id'] for r in rows if r.get('sources_unchanged') is False],
  'artifact_integrity_failures':[r['id'] for r in rows if r.get('immutable_objects_valid') is False],
  'worker_failures':[r['id'] for r in rows if r['outcome'] in ('worker_error','external_timeout','integrity_failure')],
  'cases_with_ciphey_error_warnings':[r['id'] for r in rows if r.get('cipher_warnings',{}).get('ciphey_panic_or_error')],
  'cases_with_any_ciphey_timeout':[r['id'] for r in rows if r.get('cipher_warnings',{}).get('ciphey_timeout')],
  'cases_with_hash_scan_failures':[r['id'] for r in rows if r.get('hash_scan_failures')],
  'cases_with_hash_failure_and_done_parent':[r['id'] for r in rows if r.get('hash_failures_with_done_parent')],
  'negative_files_with_accepted_candidates':[r['id'] for r in negatives if r.get('accepted_plaintext_candidates',0)>0],
  'public_files_with_accepted_candidates':[r['id'] for r in public if r.get('accepted_plaintext_candidates',0)>0],
  'cases_with_unexpected_checker_outputs':[r['id'] for r in content if (r.get('candidate_output_unexpected') or 0)>0],
  'production_code_unchanged':report.get('code_unchanged'),
  'service_lifecycle':json.loads((run/'service-lifecycle.json').read_text())}
 if 'finished_at'in report:analysis['elapsed_seconds']=(datetime.fromisoformat(report['finished_at'])-datetime.fromisoformat(report['started_at'])).total_seconds()
 (run/'analysis.json').write_text(json.dumps(analysis,indent=2)+'\n')
 lines=['# Larger offline reader evaluation','',
  '**Scope:** Static local files only. No CTF platform, challenge instance, vulnerable machine, network target or authentication attempt was set up or used. Public downloads were upstream regression data, not CTF challenges.','',
  f"Evaluated **{len(rows)} files**: {len(labelled)} with a stated oracle and {len(public)} unchanged public samples without assumed hidden-content ground truth.",'',
  f"Overall goal outcomes: **{counts(rows)}**. These categories test different things and must not be combined into a general accuracy percentage.",'',
  '## Exact end-result recovery','',
  f"The {len(content)} text/password cases require exact known bytes. Results: {counts(content)}.",
  f"Cases classified as existing supported workflows: {analysis['supported_content_goals']}. Broader desired coverage: {analysis['desired_content_goals']}.",'',
  'The evaluator supplies no plaintext regex. Hash workers receive a small, disclosed audit seed list plus their normal quick candidates. Password recovery results measure the pipeline with candidates in that finite plan; they do not measure resistance to arbitrary passwords. A separate out-of-plan password case checks that exhaustion is not called recovery.','',
  '## Breakdown','', '| File group | Outcomes |','|---|---|']
 for group,result in groups.items():lines.append(f'| {group} | {result} |')
 lines+=['','## Completion and error signals','',
  f"- Cases with work remaining at their evaluation deadline: {len(analysis['cases_not_fully_drained'])}. A passed goal does not imply all incidental work completed.",
  f"- Worker crashes/external guard timeouts/integrity failures: {len(analysis['worker_failures'])}.",
  f"- Original-input integrity failures: {len(analysis['original_integrity_failures'])}; immutable-artifact integrity failures: {len(analysis['artifact_integrity_failures'])}.",
  f"- Files with a Ciphey error/panic warning on at least one artifact: {len(analysis['cases_with_ciphey_error_warnings'])}; files with a Ciphey timeout warning: {len(analysis['cases_with_any_ciphey_timeout'])}.",
  f"- Files with partial/error hash scans: {len(analysis['cases_with_hash_scan_failures'])}. Files where at least one such scan has a combined parent marked done: {len(analysis['cases_with_hash_failure_and_done_parent'])}.",
  f"- Negative controls: {counts(negatives)}. Accepted checker candidates occurred in {len(analysis['negative_files_with_accepted_candidates'])} of these {len(negatives)} files.",
  f"- Unlabelled public files producing checker-accepted candidates: {len(analysis['public_files_with_accepted_candidates'])}/{len(public)}. They are observations requiring review, not scored true or false positives.",
  f"- Text/password goal files producing additional unexpected checker text: {len(analysis['cases_with_unexpected_checker_outputs'])}. The expected result may still have been recovered correctly.",
  f"- Production reader code unchanged during the run: {report.get('code_unchanged')}. Live watcher lifecycle: {analysis['service_lifecycle']}.",'',
  '## Unmet or inconclusive goals','', '| Case | Goal | Outcome | Native evidence |','|---|---|---|---|']
 for row in rows:
  if row['outcome'] not in ('pass','observation'):
   ref=Path(row['report']).relative_to(run).as_posix()
   lines.append(f"| {row['id']} | {row['goal']} | {row['outcome']} | [report]({ref}) |")
 lines+=['','## Method and limits','',
  '- Each case has its own fresh project, graph, native job folders and pot files. Cross-case recovery caches cannot satisfy an oracle.',
  '- Default production depth, node, file-size, expansion, member, decoder and hash-slice limits are unchanged. Per-case evaluation limits are 20 seconds (15 for unlabelled files), checked between bounded units, and 160 coordinator turns; a separate 45-second process-tree guard handles stuck workers.',
  '- A miss means this run reached queue idle without the expected goal; inspect diagnostics to distinguish routing gaps, unsupported formats and explicit reader failures. Inconclusive means the evaluator lacks a sound conclusion because of its own budget or incomplete/error reader coverage. An idle queue can still contain partial scans.',
  '- ZIP member paths are never extracted to their named filesystem paths. Key material is a disposable local data fixture and was never used for authentication.',
  '- TAR/XZ or other container passes can be incidental byte-pattern recovery. A pass does not establish structural support for that format.',
  '- The size/expansion tests check deliberate limits. A file larger than 2 MB is explicitly skipped; this is not coverage of larger files.',
  '- No reader fixes were applied while measuring. Parser crashes inside bounded subprocesses are preserved even when another branch reaches the expected answer.',
  '- This is a diverse test collection, not a representative random sample of all CTF files, a security verdict, or proof that arbitrary modern encryption can be decoded.','',
  '## Evidence and sources','',
  '- [Full case matrix](report.md)',
  '- [Raw results](summary.json)',
  '- [Aggregated results](analysis.json)',
  '- [Frozen evaluation design](evaluation-design.json)',
  '- [Watcher pause/restore record](service-lifecycle.json)',
  f'- [Corpus manifest]({os.path.relpath(HERE/"manifest.json",run)})',
  f'- [Volume-probe manifest]({os.path.relpath(HERE/"volume-manifest.json",run)})',
  f'- [Public download provenance, commits, hashes and acquisition failures]({os.path.relpath(HERE/"public-manifest.json",run)})',
  '- Public fixtures: CPython archive tests, Pillow image tests and qpdf PDF tests; source licences are retained beside downloaded files.',
  '- Three external MD5 known-answer vectors come from the pinned installed John Jumbo rawMD5 test source.','']
 (run/'RESULTS.md').write_text('\n'.join(lines))
 print(json.dumps({k:analysis[k] for k in ('total_files','totals','content_recovery_goals','supported_content_goals','desired_content_goals','negative_controls','worker_failures','production_code_unchanged')},indent=2))
if __name__=='__main__':main()
