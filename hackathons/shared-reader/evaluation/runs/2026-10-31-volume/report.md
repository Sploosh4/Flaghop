# Offline reader collection evaluation

Started: 2026-10-31T05:37:37.190953+00:00

**No CTF was joined, deployed or interacted with.** These are offline data files only. Public files came from upstream regression suites, not challenge platforms.

Known-answer fixtures use default production reader limits and the measured engine profile. No answer regex is supplied. Password tests use a small, explicit audit seed list plus the normal quick list; this measures workflow correctness, not password strength. Per-case evaluation budgets are 20 seconds (15 for unlabelled files), checked between bounded work units, with a 45-second external worker guard. A goal can pass while other incidental work remains pending.

Results so far: {"inconclusive": 7, "miss": 6, "pass": 5}

| Group | Outcomes |
|---|---|
| larger_logs | {'pass': 5, 'miss': 6} |
| larger_negative_controls | {'inconclusive': 7} |

| Case | Goal | Outcome | Drained | Seconds | Evidence |
|---|---|---|---|---:|---|
| volume_16384_head | password | pass | True | 4.391 | [JSON](volume_16384_head/project/reader-report.json) |
| volume_16384_tail | password | miss | True | 1.147 | [JSON](volume_16384_tail/project/reader-report.json) |
| volume_16384_negative | quiet | inconclusive | True | 1.098 | [JSON](volume_16384_negative/project/reader-report.json) |
| volume_131072_head | password | pass | True | 3.33 | [JSON](volume_131072_head/project/reader-report.json) |
| volume_131072_tail | password | miss | True | 1.212 | [JSON](volume_131072_tail/project/reader-report.json) |
| volume_131072_negative | quiet | inconclusive | True | 1.238 | [JSON](volume_131072_negative/project/reader-report.json) |
| volume_1048576_head | password | pass | True | 3.327 | [JSON](volume_1048576_head/project/reader-report.json) |
| volume_1048576_tail | password | miss | True | 1.653 | [JSON](volume_1048576_tail/project/reader-report.json) |
| volume_1048576_negative | quiet | inconclusive | True | 1.633 | [JSON](volume_1048576_negative/project/reader-report.json) |
| volume_1900000_head | password | pass | True | 4.065 | [JSON](volume_1900000_head/project/reader-report.json) |
| volume_1900000_tail | password | miss | True | 1.665 | [JSON](volume_1900000_tail/project/reader-report.json) |
| volume_1900000_negative | quiet | inconclusive | True | 1.601 | [JSON](volume_1900000_negative/project/reader-report.json) |
| volume_json_tail | password | miss | True | 1.393 | [JSON](volume_json_tail/project/reader-report.json) |
| volume_json_negative | quiet | inconclusive | True | 1.239 | [JSON](volume_json_negative/project/reader-report.json) |
| volume_ini_tail | password | miss | True | 1.83 | [JSON](volume_ini_tail/project/reader-report.json) |
| volume_ini_negative | quiet | inconclusive | True | 1.532 | [JSON](volume_ini_negative/project/reader-report.json) |
| volume_csv_tail | password | pass | True | 2.466 | [JSON](volume_csv_tail/project/reader-report.json) |
| volume_csv_negative | quiet | inconclusive | True | 0.863 | [JSON](volume_csv_negative/project/reader-report.json) |
