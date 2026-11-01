"""Bounded event stream used by HTTP polling and WebSocket transports."""

import datetime
import logging
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
        self._listeners = set()

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
            payload = dict(self.events[-1])
            listeners = tuple(self._listeners)
        for listener in listeners:
            try:
                listener({**payload, "channels": list(payload["channels"])})
            except Exception:
                logging.getLogger(__name__).exception("Event subscriber failed")

    def wait(self, after_seq: int = 0, timeout_seconds: float = 30.0) -> Dict[str, Any]:
        cursor = max(0, int(after_seq or 0))
        timeout_value = max(0.0, float(timeout_seconds or 0.0))
        deadline = time.monotonic() + timeout_value if timeout_value > 0 else None
        with self.condition:
            while True:
                pending = self._pending_after_locked(cursor)
                if pending:
                    return pending
                if deadline is None:
                    self.condition.wait()
                    continue
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    return {"type": "heartbeat", "seq": cursor, "channels": []}
                self.condition.wait(remaining)

    def subscribe(self, listener):
        """Atomically subscribe and return buffered events, without allocating a waiting thread."""
        with self.condition:
            self._listeners.add(listener)
            pending = [{**item, "channels": list(item["channels"])} for item in self.events]

        def unsubscribe():
            with self.condition:
                self._listeners.discard(listener)

        return unsubscribe, pending

    def _pending_after_locked(self, cursor):
        pending = [item for item in self.events if item["seq"] > cursor]
        if not pending:
            return None
        return {
            "type": "invalidate",
            "seq": max(item["seq"] for item in pending),
            "channels": sorted({channel for item in pending for channel in item["channels"]}),
        }

    def pending_after(self, cursor):
        """Read the ordered journal; subscriber notifications may arrive out of order."""
        with self.condition:
            return self._pending_after_locked(cursor)
