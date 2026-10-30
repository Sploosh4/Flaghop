"""Shared scheduler run models and defaults."""

from dataclasses import dataclass, field
from typing import Any, Dict

DEFAULT_AI_FEEDBACK_CONFIG = {
    "enabled": True,
    "max_rounds_per_target": 5,
    "max_actions_per_round": 6,
    "recent_output_chars": 900,
    "reflection_enabled": True,
    "stall_rounds_without_progress": 2,
    "stall_repeat_selection_threshold": 2,
    "max_reflections_per_target": 1,
}
DIG_DEEPER_MAX_RUNTIME_SECONDS = 900
DIG_DEEPER_MAX_TOTAL_ACTIONS = 24
DIG_DEEPER_TASK_TIMEOUT_SECONDS = 180
WEB_PARALLEL_FOLLOWUP_MAX_TOOLS = 3
ROOT_DOMAIN_SCOPED_TOOL_IDS = {"subfinder", "grayhatwarfare", "chaos"}
EXTERNAL_RECON_WEB_BUCKET_CAPS = {
    "metadata": 2,
    "content_discovery": 1,
    "heavy_validation": 1,
    "cloud_followup": 1,
}
EXTERNAL_RECON_LOW_YIELD_PHASES = {"broad_vuln", "protocol_checks", "targeted_checks", "deep_web"}
EXTERNAL_RECON_METADATA_TOOL_IDS = {
    "banner",
    "screenshooter",
    "whatweb",
    "whatweb-http",
    "whatweb-https",
    "httpx",
    "curl-headers",
    "curl-options",
    "curl-robots",
}
EXTERNAL_RECON_CONTENT_DISCOVERY_TOOL_IDS = {
    "web-content-discovery",
    "dirsearch",
    "ffuf",
    "katana",
}
EXTERNAL_RECON_HEAVY_VALIDATION_TOOL_IDS = {
    "nikto",
    "nmap-vuln.nse",
    "nuclei-web",
    "nuclei-cves",
    "nuclei-exposures",
    "nuclei-wordpress",
    "sslscan",
    "testssl.sh",
    "wafw00f",
}
EXTERNAL_RECON_CLOUD_FOLLOWUP_TOOL_IDS = {
    "nuclei-cloud",
    "nuclei-aws-storage",
    "nuclei-azure-storage",
    "nuclei-gcp-storage",
    "nuclei-aws-rds",
    "nuclei-aws-aurora",
    "nuclei-azure-cosmos",
    "nuclei-gcp-cloudsql",
}
EXTERNAL_RECON_HIGH_SIGNAL_KEYS = {
    "cloud_exposure_candidate",
    "storage_exposure_candidate",
    "managed_db_exposure_candidate",
    "aws_storage_exposure_candidate",
    "azure_storage_exposure_candidate",
    "gcp_storage_exposure_candidate",
    "rds_public_access_candidate",
    "aurora_public_access_candidate",
    "cosmos_exposure_candidate",
    "cloudsql_public_access_candidate",
    "directory_listing",
    "wordpress_detected",
    "webdav_detected",
}


@dataclass(frozen=True)
class SchedulerTarget:
    host_id: int = 0
    host_ip: str = ""
    hostname: str = ""
    port: str = ""
    protocol: str = "tcp"
    service_name: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SchedulerExecutionTask:
    decision: Any
    tool_id: str
    host_ip: str
    port: str
    protocol: str
    service_name: str
    command_template: str
    timeout: int
    job_id: int = 0
    host_id: int = 0
    hostname: str = ""
    approval_id: int = 0
    runner_preference: str = ""


@dataclass(frozen=True)
class SchedulerDecisionDisposition:
    action: str
    reason: str = ""
    approval_id: int = 0


@dataclass(frozen=True)
class SchedulerRunOptions:
    scheduler_mode: str = "deterministic"
    scheduler_concurrency: int = 1
    host_concurrency: int = 1
    ai_feedback_enabled: bool = False
    max_rounds: int = 1
    max_actions_per_round: int = 0
    recent_output_chars: int = 900
    reflection_enabled: bool = False
    stall_rounds_without_progress: int = 2
    stall_repeat_selection_threshold: int = 2
    max_reflections_per_target: int = 0
    dig_deeper: bool = False
    max_runtime_seconds: int = 0
    max_total_actions: int = 0
    task_timeout_seconds: int = 300
    job_id: int = 0

    @property
    def analysis_mode(self) -> str:
        return "dig_deeper" if bool(self.dig_deeper) else "standard"
