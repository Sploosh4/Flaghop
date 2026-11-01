"""Job outcome and API representations."""

from app.contracts.base import ActionData
from dataclasses import dataclass


@dataclass
class JobOutcome(ActionData):
    """Explicit terminal outcome for adapters that can retain partial evidence."""

    status: str
    result: dict
    error: str = ""

    def __post_init__(self):
        if self.status not in {"completed", "partial", "failed", "cancelled", "held"}:
            raise ValueError("Invalid terminal job outcome.")
        if not isinstance(self.result, dict) or not isinstance(self.error, str):
            raise TypeError("JobOutcome requires a result dictionary and text error.")
