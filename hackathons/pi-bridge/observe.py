#!/usr/bin/env python3
"""Read-only Pi tool observability: summaries, calls, live view and scanner tasks.

Reads native session records; never controls an agent or executes its commands.
"""
from __future__ import annotations

import argparse
from collections import Counter, OrderedDict, defaultdict, deque
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sys
import tempfile
import time
from zoneinfo import ZoneInfo

MAX_LINE = 4 * 1024 * 1024
MAX_CALLS = 10000
MAX_OUTPUT = 2 * 1024 * 1024
DEFAULT_ROOT = Path.home() / ".local/state/pi-bridge"
STATES = ("succeeded", "failed", "unknown", "awaiting_result", "incomplete")


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def epoch(value):
    if numeric(value):
        return value / 1000 if value > 100_000_000_000 else float(value)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
        except ValueError:
            pass
    return None


def iso(value):
    return datetime.fromtimestamp(value, timezone.utc).isoformat() if value is not None else None


def clean(text, limit=240):
    text = str(text)
    text = re.sub(r"\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))", "", text)
    text = re.sub(r"(?i)(\b[\w]*(?:token|password|secret|api_key|access_key)[\w]*\s*=\s*)(?:\"[^\"]*\"|'[^']*'|[^\s;]+)", r"\1[REDACTED]", text)
    text = re.sub(r"(?i)(--(?:api[-_]?key|token|password|secret|authorization)(?:=|\s+))(?:\"[^\"]*\"|'[^']*'|[^\s;]+)", r"\1[REDACTED]", text)
    text = re.sub(r"(?i)(bearer\s+)[A-Za-z0-9._~+/=-]+", r"\1[REDACTED]", text)
    text = re.sub(r"(https?://)[^/\s:@]+:[^/\s@]+@", r"\1[REDACTED]@", text)
    text = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", "", text)
    return text[:limit] + ("…" if len(text) > limit else "")


def describe(tool, args):
    if not isinstance(args, dict):
        return "Unknown arguments", "Invalid argument object"
    if tool == "bash":
        command = str(args.get("command", ""))
        first = next((line.strip() for line in command.splitlines() if line.strip()), "Shell command")
        action = "Run shell command"
        for pattern, label in ((r"acceptance\.py|unittest|pytest", "Run tests"),
                               (r"ctf_profiler\.py", "Run scanner"),
                               (r"verify_staged_profile|verify_wordpress", "Verify workflow"),
                               (r"write_text\(|apply_patch|write_bytes\(", "Write/change files"),
                               (r"\brg\b|\bfind\b", "Search files"),
                               (r"read_text\(|\bcat\b|\bsed\b|\bnl\b", "Inspect files")):
            if re.search(pattern, command):
                action = label
                break
        return action, clean(first)
    path = args.get("path", args.get("file_path", args.get("file", "")))
    if tool in ("write", "edit"):
        extra = ""
        content = args.get("content")
        if isinstance(content, str):
            extra = f" ({len(content.encode())} bytes)"
        return "Write file" if tool == "write" else "Edit file", clean(str(path) + extra)
    if tool == "read":
        return "Read file", clean(str(path))
    return "Call " + clean(tool, 60), "Arguments: " + ", ".join(clean(k, 40) for k in list(args)[:12])


def percentile(values, fraction):
    if not values:
        return None
    return sorted(values)[max(0, math.ceil(len(values) * fraction) - 1)]


class SessionIndex:
    def __init__(self, path, max_calls=MAX_CALLS):
        self.path, self.max_calls = Path(path), max_calls
        self.reset()

    def reset(self):
        self.offset = 0
        self.inode = None
        self.calls = OrderedDict()
        self.models = deque(maxlen=self.max_calls)
        self.turn = None
        self.dropped_calls = 0
        self.bad_lines = 0
        self.oversized_lines = 0
        self.last_event = None

    def update(self):
        info = self.path.stat()
        identity = (info.st_dev, info.st_ino)
        if self.inode != identity or info.st_size < self.offset:
            self.reset()
            self.inode = identity
        old_offset = self.offset
        with self.path.open("rb") as stream:
            stream.seek(self.offset)
            while True:
                start = stream.tell()
                line = stream.readline(MAX_LINE + 1)
                if not line:
                    break
                if len(line) > MAX_LINE:
                    while line and not line.endswith(b"\n"):
                        line = stream.readline(MAX_LINE + 1)
                    if not line:
                        stream.seek(start)
                        break
                    self.oversized_lines += 1
                    self.offset = stream.tell()
                    continue
                if not line.endswith(b"\n"):
                    break  # Retry a concurrent partial append on the next refresh.
                self.offset = stream.tell()
                try:
                    event = json.loads(line)
                except (ValueError, UnicodeError):
                    self.bad_lines += 1
                    continue
                if not isinstance(event, dict):
                    self.bad_lines += 1
                    continue
                self.consume(event)
        return self.offset - old_offset

    def consume(self, event):
        message = event.get("message")
        if not isinstance(message, dict):
            return
        stamp = epoch(event.get("timestamp")) or epoch(message.get("timestamp"))
        self.last_event = stamp or self.last_event
        role = message.get("role")
        content = message.get("content", [])
        if not isinstance(content, list):
            content = []
        if role == "user":
            self.turn = event.get("id")
        elif role == "assistant":
            usage = message.get("usage") or {}
            self.models.append({"time": stamp, "duration_ms": message.get("durationMs"),
                                "usage": usage if isinstance(usage, dict) else {}})
            for block in content:
                if not isinstance(block, dict) or block.get("type") != "toolCall":
                    continue
                identifier = block.get("id")
                if not isinstance(identifier, str):
                    continue
                tool = block.get("name", "unknown")
                args = block.get("arguments", {})
                action, preview = describe(tool, args)
                signature = hashlib.sha256(json.dumps([tool, args], sort_keys=True).encode()).hexdigest()
                previous = self.calls.get(identifier, {})
                self.calls[identifier] = {"call_id": identifier, "tool": clean(tool, 80),
                    "turn_id": self.turn, "response_id": message.get("responseId"),
                    "requested_epoch": stamp, "action": action, "preview": preview,
                    "argument_signature": signature, **previous}
                self.trim()
        elif role == "toolResult":
            identifier = message.get("toolCallId")
            if not isinstance(identifier, str):
                return
            record = self.calls.setdefault(identifier, {"call_id": identifier,
                "tool": clean(message.get("toolName", "unknown"), 80), "turn_id": None,
                "requested_epoch": None, "action": "Result without retained request", "preview": "",
                "argument_signature": None})
            chunks = [b.get("text", "") for b in content if isinstance(b, dict) and isinstance(b.get("text"), str)]
            tail = "\n".join(chunk[-1200:] for chunk in chunks[-3:])
            details = message.get("details")
            code = details.get("exitCode") if isinstance(details, dict) else None
            matched = re.search(r"(?:^|\n)Command exited with code (-?\d+)\s*$", tail)
            if not isinstance(code, int) and matched:
                code = int(matched.group(1))
            error = message.get("isError")
            status = "failed" if error is True or (isinstance(code, int) and code != 0) else "succeeded" if error is False else "unknown"
            duration = message.get("durationMs")
            basis = "pi_reported"
            if not numeric(duration) or duration < 0:
                duration = None
                basis = "unavailable"
                if stamp is not None and record.get("requested_epoch") is not None:
                    duration = max(0, 1000 * (stamp - record["requested_epoch"]))
                    basis = "estimated_request_to_result_including_queue"
            record.update(finished_epoch=stamp, status=status, duration_ms=duration,
                          timing_basis=basis, exit_code=code,
                          output_bytes=sum(len(chunk.encode()) for chunk in chunks),
                          error_preview=clean(tail.strip()[-600:], 400) if status == "failed" else None)
            self.trim()

    def trim(self):
        while len(self.calls) > self.max_calls:
            self.calls.popitem(last=False)
            self.dropped_calls += 1

    def snapshot(self, metadata, since=None, limit=30, status="all", slow_ms=0):
        current = time.time()
        rows = []
        for call in self.calls.values():
            if since is not None and (call.get("finished_epoch") or call.get("requested_epoch") or 0) < since:
                continue
            row = dict(call)
            if "status" not in row:
                row["status"] = "awaiting_result" if metadata.get("status") in ("starting", "running") else "incomplete"
                row["timing_basis"] = "no_result_no_execution_start_observed"
                row["duration_ms"] = None
                row["awaiting_result_ms"] = round(1000 * max(0, current - row["requested_epoch"]), 1) if row.get("requested_epoch") else None
            row["requested_at"] = iso(row.pop("requested_epoch", None))
            row["finished_at"] = iso(row.pop("finished_epoch", None))
            rows.append(row)
        grouped = defaultdict(list)
        for row in rows:
            grouped[row["tool"]].append(row)
        totals = Counter(row["status"] for row in rows)
        tools = []
        for tool, calls in sorted(grouped.items()):
            times = [c["duration_ms"] for c in calls if c.get("timing_basis") == "pi_reported" and numeric(c.get("duration_ms"))]
            counts = Counter(c["status"] for c in calls)
            tools.append({"tool": tool, "calls": len(calls), "statuses": dict(counts),
                          "reported_duration_count": len(times), "estimated_duration_count": sum(c.get("timing_basis", "").startswith("estimated") for c in calls),
                          "total_ms": round(sum(times), 2), "mean_ms": round(sum(times) / len(times), 2) if times else None,
                          "p50_ms": percentile(times, .5), "p95_ms": percentile(times, .95), "max_ms": max(times) if times else None})
        repeated = defaultdict(list)
        for row in rows:
            if row.get("argument_signature"):
                repeated[row["argument_signature"]].append(row)
        repeats = [{"tool": calls[0]["tool"], "preview": calls[0]["preview"], "calls": len(calls),
                    "failures": sum(c["status"] == "failed" for c in calls)} for calls in repeated.values() if len(calls) > 1]
        repeats.sort(key=lambda r: (r["failures"], r["calls"]), reverse=True)
        models = [m for m in self.models if since is None or (m["time"] or 0) >= since]
        usage = {key: sum(m["usage"].get(key, 0) for m in models if numeric(m["usage"].get(key)))
                 for key in ("input", "output", "cacheRead", "cacheWrite", "totalTokens")}
        costs = [m["usage"]["cost"]["total"] for m in models if isinstance(m["usage"].get("cost"), dict) and numeric(m["usage"]["cost"].get("total"))]
        chosen = [r for r in rows if (status == "all" or r["status"] == status)
                  and (not slow_ms or (numeric(r.get("duration_ms")) and r["duration_ms"] >= slow_ms))]
        pending = [r for r in rows if r["status"] == "awaiting_result"]
        return {"schema_version": 1, "agent_id": metadata.get("agent_id"), "name": clean(metadata.get("name", "Pi agent")),
                "agent_state": metadata.get("status", "unknown"), "as_of": iso(current), "since": iso(since),
                "session_file": str(self.path), "session_bytes_observed": self.offset,
                "window": f"Most recent {self.max_calls} retained calls; filtered by result/request time",
                "calls_dropped_by_memory_limit": self.dropped_calls,
                "parse_warnings": {"malformed_lines": self.bad_lines, "oversized_lines": self.oversized_lines},
                "last_session_event_at": iso(self.last_event), "current_calls": pending[-10:],
                "counts": {"calls": len(rows), **{key: totals[key] for key in STATES}}, "tools": tools,
                "model": {"messages": len(models), "reported_usage": usage,
                          "reported_cost_usd": round(sum(costs), 8) if costs else None},
                "repeated_identical_calls": repeats[:10], "calls": chosen[-limit:],
                "semantics": "Tool success is not task/test success. Reported durations come from Pi; estimates include queue time. Pending requests are not proven execution starts. Repeats are not automatically retries."}


def metadata(root, identifier):
    if not re.fullmatch(r"[a-f0-9]{16}", identifier):
        raise ValueError("Use a 16-character Pi agent ID")
    data = json.loads((root / identifier / "agent.json").read_text())
    if not data.get("session_file"):
        raise ValueError("Agent has no persisted session yet")
    return data


def scanner_snapshot(path):
    if path.stat().st_size > 16 * 1024 * 1024:
        raise ValueError("Profile exceeds 16 MiB")
    profile = json.loads(path.read_text())
    calls = []
    for task in profile.get("tasks", []):
        outcome = "parse_failed" if task.get("parse_status") == "failed" else "access_restricted" if task.get("access_restrictions") else task.get("status", "unknown")
        duration = task.get("duration_seconds")
        calls.append({"id": task.get("id"), "tool": task.get("tool"), "stage": task.get("stage"),
                      "execution_status": task.get("status"), "parse_status": task.get("parse_status"),
                      "outcome": outcome, "exit_code": task.get("exit_code"),
                      "duration_ms": round(duration * 1000, 1) if numeric(duration) else None,
                      "doing": clean(task.get("trigger", "")),
                      "reason": clean(task.get("parse_error") or task.get("reason") or "")})
    return {"source": "scanner_profile", "profile": str(path), "run": profile.get("run"),
            "counts": dict(Counter(c["outcome"] for c in calls)),
            "reproduced_findings": sum(f.get("status") == "reproduced" for f in profile.get("validated_vulnerabilities", [])),
            "tasks": calls, "semantics": "Scanner subprocess outcomes, separate from the agent's read/write/bash calls. Profiles may only be persisted at the end of a run."}


def atomic_output(path, data):
    payload = (json.dumps(data, ensure_ascii=False, allow_nan=False, indent=2) + "\n").encode()
    if len(payload) > MAX_OUTPUT:
        raise ValueError("Snapshot exceeds 2 MiB; reduce --limit")
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    descriptor, temporary = tempfile.mkstemp(prefix=".observe-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(payload)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def display(data, timezone_name="Australia/Perth"):
    if data.get("source") == "scanner_profile":
        lines = ["SCANNER TASKS — " + str(data.get("run", {}).get("status", "unknown")), str(data["counts"]),
                 "TOOL / TASK                         OUTCOME                TIME      WHAT IT IS DOING"]
        for row in data["tasks"]:
            duration = f"{row['duration_ms']/1000:.2f}s" if row["duration_ms"] is not None else "—"
            lines.append(f"{str(row['id'])[:34]:34} {row['outcome'][:21]:21} {duration:>8}  {row['doing'][:75]}")
        return "\n".join(lines)
    counts = data["counts"]
    local = datetime.fromisoformat(data["as_of"]).astimezone(ZoneInfo(timezone_name)).strftime("%Y-%m-%d %H:%M:%S %Z")
    lines = [f"{data['name']} — {data['agent_state']} — {local}",
             f"{counts['calls']} calls | {counts['succeeded']} succeeded | {counts['failed']} failed | {counts['awaiting_result']} awaiting result | {counts['incomplete']} incomplete",
             "TOOL          CALLS  FAILED    TOTAL      MEDIAN       P95       MAX"]
    for row in data["tools"]:
        duration = lambda v: (f"{v:.0f}ms" if v < 1000 else f"{v/1000:.2f}s") if v is not None else "—"
        lines.append(f"{row['tool'][:12]:12} {row['calls']:6} {row['statuses'].get('failed',0):7} {duration(row['total_ms']):>9} {duration(row['p50_ms']):>11} {duration(row['p95_ms']):>9} {duration(row['max_ms']):>9}")
    lines += ["", "RECENT CALLS — tool-level outcomes; successful shell commands may contain failing tests"]
    for row in data["calls"]:
        duration = f"{row['duration_ms']/1000:.2f}s" if numeric(row.get("duration_ms")) else "—"
        lines.append(f"{row['status']:16} {row['tool'][:8]:8} {duration:>8}  {row['action']}: {row['preview'][:120]}")
        if row.get("error_preview"):
            lines.append("    " + row["error_preview"].replace("\n", " | ")[:180])
    if data["current_calls"]:
        lines += ["", "AWAITING RESULTS (queue-inclusive age; not measured execution time)"]
        for row in data["current_calls"]:
            age = row.get("awaiting_result_ms")
            lines.append(f"  {row['tool']}: {age/1000:.1f}s — {row['preview']}" if age is not None else "  " + row["tool"])
    if data["repeated_identical_calls"]:
        lines += ["", "REPEATED IDENTICAL CALLS (may be intentional)"]
        for row in data["repeated_identical_calls"][:4]:
            lines.append(f"  {row['calls']} calls / {row['failures']} failures: {row['tool']} {row['preview'][:100]}")
    usage = data["model"]
    lines += ["", f"Model: {usage['messages']} recorded responses | {usage['reported_usage']['totalTokens']:,} reported tokens processed (includes reused context) | reported cost USD {usage['reported_cost_usd']}"]
    warnings = data["parse_warnings"]
    if any(warnings.values()) or data["calls_dropped_by_memory_limit"]:
        lines.append("Coverage: " + json.dumps(warnings) + f"; older calls dropped: {data['calls_dropped_by_memory_limit']}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("summary", "calls", "watch", "scanner"))
    parser.add_argument("target", help="Pi agent ID, or scanner profile JSON with scanner mode")
    parser.add_argument("--state-dir", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--since", help="Window such as 10m, 2h, or 1d")
    parser.add_argument("--status", choices=("all", *STATES), default="all")
    parser.add_argument("--slow-ms", type=float, default=0)
    parser.add_argument("--limit", type=int, default=15)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--output", type=Path, help="Atomically update one bounded JSON snapshot, no copied transcript")
    parser.add_argument("--interval", type=float, default=2)
    parser.add_argument("--timezone", default="Australia/Perth", help="Terminal display timezone; trace timestamps stay UTC")
    args = parser.parse_args()
    if not 1 <= args.limit <= 500 or not 0.5 <= args.interval <= 60 or args.slow_ms < 0:
        parser.error("limit 1..500, interval 0.5..60 seconds, slow-ms >= 0")
    window = None
    if args.since:
        match = re.fullmatch(r"(\d+)([smhd])", args.since)
        if not match:
            parser.error("Use --since 30m, 2h, 1d, etc.")
        window = int(match[1]) * {"s": 1, "m": 60, "h": 3600, "d": 86400}[match[2]]
    if args.mode == "scanner":
        source = Path(args.target).resolve()
        if args.output and args.output.resolve() == source:
            raise ValueError("Snapshot cannot overwrite its source profile")
        data = scanner_snapshot(source)
        if args.output:
            atomic_output(args.output, data)
        print(json.dumps(data, indent=2) if args.json else display(data, args.timezone))
        return 0
    index = None
    while True:
        saved = metadata(args.state_dir, args.target)
        path = Path(saved["session_file"])
        if index is None or index.path != path:
            index = SessionIndex(path)
        read = index.update()
        data = index.snapshot(saved, time.time() - window if window is not None else None,
                              args.limit, args.status, args.slow_ms)
        data["bytes_read_this_refresh"] = read
        if args.output:
            if args.output.resolve() == path.resolve() or args.output.resolve().is_relative_to((args.state_dir / args.target).resolve()):
                raise ValueError("Snapshot must be outside the agent's native state directory")
            atomic_output(args.output, data)
        if args.mode == "watch" and sys.stdout.isatty():
            print("\x1b[2J\x1b[H", end="")
        print(json.dumps(data, indent=2) if args.json else display(data, args.timezone), flush=True)
        if args.mode != "watch":
            break
        if not sys.stdout.isatty() and not args.json:
            print("---", flush=True)
        time.sleep(args.interval)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(0)
    except (OSError, ValueError) as error:
        print("pi-observe: " + str(error), file=sys.stderr)
        raise SystemExit(1)
