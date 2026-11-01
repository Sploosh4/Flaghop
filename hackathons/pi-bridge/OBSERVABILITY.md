# Pi tool observability

`observe.py` reads native Pi session records and scanner profiles. It neither
starts agents nor runs their commands. It works with the currently running
DeepSeek session without restarting the Pi bridge or changing MCP configuration.

The design takes inspiration from [T3 Code’s observability model](https://github.com/pingdotgg/t3code/blob/main/docs/operations/observability.md):
correlated call IDs, explicit outcomes, duration summaries/percentiles, failure
inspection, and a separate human-facing live view. No T3 source was copied.

## Commands

The `pi-observe` launcher runs this script; no additional packages are needed.

```bash
pi-observe summary 6163dacad4ae4aa6 --since 30m
pi-observe calls 6163dacad4ae4aa6 --status failed --limit 20
pi-observe calls 6163dacad4ae4aa6 --slow-ms 10000 --since 1h
pi-observe watch 6163dacad4ae4aa6 --since 30m --interval 2
pi-observe summary 6163dacad4ae4aa6 --json
pi-observe scanner /absolute/path/to/run/profile/device-profile.json
```

Without the launcher, use:

```bash
python3 -B /home/joshua/Documents/ChatGPT/Hackathons/pi-bridge/observe.py summary 6163dacad4ae4aa6
```

The live terminal refreshes every two seconds. **Ctrl-C stops only the monitor**,
not DeepSeek. Display times default to Australia/Perth; `--timezone` changes that.
Machine-readable timestamps remain UTC.

## What is measured

- Native `read`, `write`, `edit`, `bash`, or other Pi tool calls, correlated with
  their results by `toolCallId`. Each row includes call, turn, and provider
  response identifiers where available.
- Successful/failed/unknown results and requests still awaiting a result.
  Explicit shell exit codes are shown when Pi records them.
- Pi-reported execution duration, totals, mean, median, p95 and maximum by tool.
  These statistics include failures with measured durations.
- What a call appears to be doing: a bounded first command line or file path,
  plus a heuristic action label. File-write bodies and successful output text
  are not copied into the monitor.
- A bounded error excerpt, output byte count, slow calls, repeated identical
  argument signatures, and counts of repeated failures.
- Provider-reported model token totals and costs, where present. Token totals
  include reused context processed across requests; they are not unique words
  or a context-window utilisation measurement. Costs are reported values, not
  an independent billing calculation.
- Scanner-profile task execution, parsing failures, restrictions, skips, stage,
  trigger/reason, elapsed duration and reproduced-finding count, separately from
  the agent’s file/shell tools.

## Outcome and timing semantics

**Tool success is not test or task success.** For example, `bash` may succeed
after running a deliberately failing test under `|| true`. Inspect the test
report/score separately. Likewise scanner process completion is kept separate
from parsing failure and reproduced findings.

Native Pi results currently contain `durationMs`. The monitor uses that value.
If a historical result lacks it, a request-to-result estimate is explicitly
labelled and excluded from reported-duration percentiles. Pending requests have
a queue-inclusive age, never an invented execution duration. A missing result
after an agent stops is `incomplete`, not automatically a failed command.

Repeated identical calls can be intentional; they are not automatically labelled
retries. Heuristic action labels describe command patterns, not model intent.
The native session is a recorded-history view and may include earlier turns.
Use `--since` to narrow it. Scanner profiles may not appear until a run ends;
the agent-tool view still updates while an outer shell call is running.

## Storage and privacy behaviour

No session transcript is duplicated. Watch mode consumes only appended session
bytes after its initial read. In memory it retains at most 10,000 calls and
model-response records, and explicitly reports dropped older calls. Malformed
or oversized records produce coverage counters. A partial concurrent append is
retried on the next refresh.

Optional `--output /path/current.json` atomically replaces one **owner-readable**
snapshot capped at **2 MiB**; it does not accumulate a new file per refresh.
The running monitor uses `pi-bridge/observability/current.json`. Common token,
password, API-key, bearer and URL-password patterns are redacted from previews;
previews are intentionally bounded. Native Pi sessions remain unchanged.

No write is allowed into the observed agent’s native state directory, and a
scanner snapshot cannot overwrite its source profile. Keep monitor snapshots
outside scanner run directories so they do not inflate the 16 MiB final-run
budget.

## Verify

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover \
  -s /home/joshua/Documents/ChatGPT/Hackathons/pi-bridge/tests \
  -p test_observe.py -v
```

The 13 tests cover correlation, failure/exit handling, precise versus estimated
timing, partial writes, incremental refresh, truncation, retention, filtering,
repeats, preview redaction, usage counters, private bounded output, and scanner
execution/parse outcome separation.
