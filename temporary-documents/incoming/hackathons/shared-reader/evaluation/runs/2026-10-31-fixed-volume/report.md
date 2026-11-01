# Offline reader collection evaluation

Started: 2026-10-31T05:57:08.280403+00:00

**No CTF was joined, deployed or interacted with.** These are offline data files only. Public files came from upstream regression suites, not challenge platforms.

Known-answer fixtures use default production reader limits and the measured engine profile. No answer regex is supplied. Password tests use a small, explicit audit seed list plus the normal quick list; this measures workflow correctness, not password strength. Per-case evaluation budgets are 20 seconds (15 for unlabelled files), checked between bounded work units, with a 45-second external worker guard. A goal can pass while other incidental work remains pending.

Results so far: {"pass": 18}

| Group | Outcomes |
|---|---|
| larger_logs | {'pass': 11} |
| larger_negative_controls | {'pass': 7} |

| Case | Goal | Outcome | Drained | Seconds | Evidence |
|---|---|---|---|---:|---|
| volume_16384_head | password | pass | True | 1.522 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_16384_head/project/reader-report.json) |
| volume_16384_tail | password | pass | True | 1.508 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_16384_tail/project/reader-report.json) |
| volume_16384_negative | quiet | pass | True | 0.857 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_16384_negative/project/reader-report.json) |
| volume_131072_head | password | pass | True | 1.768 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_131072_head/project/reader-report.json) |
| volume_131072_tail | password | pass | True | 2.015 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_131072_tail/project/reader-report.json) |
| volume_131072_negative | quiet | pass | True | 0.969 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_131072_negative/project/reader-report.json) |
| volume_1048576_head | password | pass | True | 1.772 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_1048576_head/project/reader-report.json) |
| volume_1048576_tail | password | pass | True | 1.784 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_1048576_tail/project/reader-report.json) |
| volume_1048576_negative | quiet | pass | True | 1.028 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_1048576_negative/project/reader-report.json) |
| volume_1900000_head | password | pass | True | 1.905 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_1900000_head/project/reader-report.json) |
| volume_1900000_tail | password | pass | True | 1.959 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_1900000_tail/project/reader-report.json) |
| volume_1900000_negative | quiet | pass | True | 1.17 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_1900000_negative/project/reader-report.json) |
| volume_json_tail | password | pass | True | 1.565 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_json_tail/project/reader-report.json) |
| volume_json_negative | quiet | pass | True | 0.873 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_json_negative/project/reader-report.json) |
| volume_ini_tail | password | pass | True | 1.515 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_ini_tail/project/reader-report.json) |
| volume_ini_negative | quiet | pass | True | 0.816 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_ini_negative/project/reader-report.json) |
| volume_csv_tail | password | pass | True | 1.189 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_csv_tail/project/reader-report.json) |
| volume_csv_negative | quiet | pass | True | 0.475 | [JSON](../../../../../../../hackathons/shared-reader/evaluation/runs/2026-10-31-fixed-volume/volume_csv_negative/project/reader-report.json) |
