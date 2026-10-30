"""Bounded event stream used by HTTP polling and WebSocket transports."""

import datetime
import time
import threading
from collections import defaultdict
from typing import Any, Dict


class EventStream:
    def __init__(self):
        self.condition = threading.Condition()
        self.last_emit_monotonic = defaultdict(float)
        self.seq = 0
        self.events = []

    def emit(self, *channels: str, throttle_seconds: float = 0.0):
        normalized = sorted({str(item or "").strip() for item in channels if str(item or "").strip()})
        if not normalized:
            return
        key = ",".join(normalized)
        with self.condition:
            now = time.monotonic()
            if float(throttle_seconds or 0.0) > 0.0:
                last_emitted = float(self.last_emit_monotonic.get(key, 0.0) or 0.0)
                if (now - last_emitted) < float(throttle_seconds):
                    return
            self.last_emit_monotonic[key] = now
            self.seq += 1
            self.events.append(
                {
                    "type": "invalidate",
                    "seq": int(self.seq),
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "channels": normalized,
                }
            )
            if len(self.events) > 256:
                self.events = self.events[-256:]
            self.condition.notify_all()

    def wait(self, after_seq: int = 0, timeout_seconds: float = 30.0) -> Dict[str, Any]:
        cursor = max(0, int(after_seq or 0))
        timeout_value = max(0.0, float(timeout_seconds or 0.0))
        deadline = time.monotonic() + timeout_value if timeout_value > 0 else None
        with self.condition:
            while True:
                pending = [item for item in self.events if int(item.get("seq", 0) or 0) > cursor]
                if pending:
                    channels = sorted(
                        {
                            str(channel or "").strip()
                            for item in pending
                            for channel in list(item.get("channels", []) or [])
                            if str(channel or "").strip()
                        }
                    )
                    return {
                        "type": "invalidate",
                        "seq": max(int(item.get("seq", 0) or 0) for item in pending),
                        "channels": channels,
                    }
                if deadline is None:
                    self.condition.wait()
                    continue
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    return {"type": "heartbeat", "seq": cursor, "channels": []}
                self.condition.wait(remaining)
