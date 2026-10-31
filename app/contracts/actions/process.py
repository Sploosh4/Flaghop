"""Local process request and result values."""

from app.contracts.base import ActionData
from dataclasses import dataclass, field


@dataclass(frozen=True)
class CommandRequest(ActionData):
    tool_name: str
    tab_title: str
    host_ip: str
    port: str
    protocol: str
    command: str
    outputfile: str
    timeout: int
    job_id: int = 0
    network_targets: tuple[str, ...] = ()
    argv: tuple[str, ...] = ()
    cwd: str | None = None
    output_limit: int = 0
    cancel_grace: int = 2
    hard_timeout: int = 0
    proxy_channel: str = ""
    proxy_token: str = ""


@dataclass(frozen=True)
class ExecutionResult(ActionData):
    executed: bool
    reason: str
    process_id: int
    metadata: dict = field(default_factory=dict)

    def as_legacy(self, include_metadata=False):
        values = (self.executed, self.reason, self.process_id)
        return values + (self.metadata,) if include_metadata else values
