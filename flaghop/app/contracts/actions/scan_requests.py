from __future__ import annotations
from app.contracts.actions.inputs import LegacyBool, LegacyInt, NmapTargets
from app.contracts.base import ActionRequest
from pydantic import Field
from typing import Literal


class TargetsImportRequest(ActionRequest):
    path: str = Field(min_length=1, max_length=4096)


class NmapImportRequest(ActionRequest):
    path: str = Field(min_length=1, max_length=4096)
    run_actions: LegacyBool = False


class NmapScanOptions(ActionRequest):
    discovery: LegacyBool = True
    skip_dns: LegacyBool = True
    force_pn: LegacyBool = False
    timing: Literal["T0", "T1", "T2", "T3", "T4", "T5"] = "T3"
    top_ports: LegacyInt = Field(default=1000, ge=0, le=65535)
    explicit_ports: str = Field(default="", max_length=65536, pattern=r"^[0-9,\- ]*$")
    service_detection: LegacyBool = True
    default_scripts: LegacyBool = True
    os_detection: LegacyBool = False
    aggressive: LegacyBool = False
    full_ports: LegacyBool = False
    vuln_scripts: LegacyBool = False
    arp_ping: LegacyBool = True
    host_discovery_only: LegacyBool = False
    scan_profile: Literal["quick", "comprehensive"] = "quick"
    chunk_concurrency: LegacyInt = Field(default=1, ge=1, le=16)


class NmapScanRequest(ActionRequest):
    targets: NmapTargets = Field(min_length=1, max_length=4096)
    discovery: LegacyBool = True
    staged: LegacyBool = False
    run_actions: LegacyBool = False
    nmap_path: str = Field(default="nmap", max_length=4096)
    nmap_args: str = Field(default="", max_length=16384)
    scan_mode: Literal["legacy", "rfc1918_discovery", "easy", "hard"] = "legacy"
    scan_options: NmapScanOptions = Field(default_factory=NmapScanOptions)


class PassiveCaptureRequest(ActionRequest):
    interface_name: str = Field(min_length=1, max_length=256)
    scan_mode: Literal["passive_capture"] = "passive_capture"
    duration_minutes: LegacyInt = Field(default=15, ge=1, le=1440)
    run_actions: LegacyBool = False


class SubnetRescanRequest(ActionRequest):
    subnet: str = Field(min_length=1, max_length=253)


class DiscoveryRequest(ActionRequest):
    target: str = Field(default="localhost", max_length=253)
    run_actions: LegacyBool = False
