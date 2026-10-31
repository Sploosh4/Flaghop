"""Validate an untrusted profile and its bounded, project-owned evidence before import."""

import hashlib
from datetime import datetime
import ipaddress
import json
from pathlib import Path, PurePosixPath
import re
import stat
import xml.etree.ElementTree as ET

from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Literal

MAX_RETAINED = 16 * 1024 * 1024


def literal_ip(value):
    address = ipaddress.ip_address(value)
    if address.is_multicast or address.is_unspecified or "%" in value or value == "255.255.255.255":
        raise ValueError("Use one literal unicast IP without a zone, hostname or range.")
    return str(address)


def owned_file(root, relative, limit=8 * 1024 * 1024):
    path = PurePosixPath(relative)
    if not relative or path.is_absolute() or ".." in path.parts or "\\" in relative or "\x00" in relative:
        raise ValueError("Invalid scanner evidence path.")
    target = Path(root)
    if target.is_symlink():
        raise ValueError("Scanner output cannot be linked.")
    for part in path.parts:
        target /= part
        if target.is_symlink():
            raise ValueError("Scanner evidence cannot contain links.")
    info = target.stat()
    if not stat.S_ISREG(info.st_mode) or info.st_size > limit:
        raise ValueError("Scanner evidence is not a bounded ordinary file.")
    return target


class Target(BaseModel):
    model_config = ConfigDict(extra="allow")
    ip: str
    scope: Literal["single_ip"]
    dns_resolver: str | None = None


class Run(BaseModel):
    model_config = ConfigDict(extra="allow")
    status: Literal["running", "completed", "partial", "dry_run"]
    mode: Literal["active", "offline", "dry_run"]
    started_at: str = Field(min_length=1, max_length=100)
    finished_at: str = Field(min_length=1, max_length=100)

    @field_validator("started_at", "finished_at")
    @classmethod
    def timestamp(cls, value):
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            raise ValueError("Scanner timestamps must include their timezone.")
        return value


class Artifact(BaseModel):
    model_config = ConfigDict(extra="forbid")
    path: str = Field(min_length=1, max_length=1000)
    bytes: int = Field(ge=0, le=8 * 1024 * 1024, strict=True)
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")


class Profile(BaseModel):
    model_config = ConfigDict(extra="allow")
    schema_version: Literal["1.0"]
    target: Target
    run: Run
    tasks: list[dict] = Field(max_length=1000)
    observations: list[dict] = Field(default_factory=list, max_length=1000)
    assessment_findings: list[dict] = Field(default_factory=list, max_length=1000)
    validated_vulnerabilities: list[dict] = Field(default_factory=list, max_length=1000)
    artifacts: list[Artifact] = Field(max_length=248)
    classification: dict | None = None
    nmap: dict | None = None


def validate_profile(root, target, source_identity):
    path = owned_file(root, "device-profile.json", 2 * 1024 * 1024)
    raw = path.read_bytes()
    document = json.loads(raw)
    profile = Profile.model_validate(document)
    if profile.run.status == "running":
        raise ValueError("The scanner profile has not finished.")
    if literal_ip(profile.target.ip) != target:
        raise ValueError("Profile belongs to a different target.")
    if document.get("source_identity") != source_identity:
        raise ValueError("Profile source identity differs from this scan's packaged source.")
    total, names = len(raw), set()
    for item in profile.artifacts:
        if item.path in names or not item.path.startswith("raw/"):
            raise ValueError("Duplicate or non-raw scanner evidence path.")
        names.add(item.path)
        artifact = owned_file(root, item.path)
        data = artifact.read_bytes()
        if len(data) != item.bytes or hashlib.sha256(data).hexdigest() != item.sha256:
            raise ValueError("Scanner evidence size or checksum changed.")
        total += len(data)
    if total > MAX_RETAINED:
        raise ValueError("Scanner retained evidence exceeds 16 MiB.")
    # Paths in tasks are not opened implicitly. Reject escaping references even on failed tasks.
    for task in profile.tasks:
        if not isinstance(task.get("id"), str) or not isinstance(task.get("status"), str):
            raise ValueError("Scanner task lacks an identifier/status.")
        for key in ("stdout", "stderr", "result_artifact"):
            value = task.get(key)
            if value and (
                not isinstance(value, str) or not value.startswith("raw/") or ".." in PurePosixPath(value).parts
            ):
                raise ValueError("Scanner task references evidence outside its output.")
    xml = None
    if profile.nmap is not None:
        if "raw/nmap.xml" not in names:
            raise ValueError("Parsed Nmap data has no checksummed XML source.")
        xml = owned_file(root, "raw/nmap.xml")
        data = xml.read_bytes()
        if re.search(rb"<!ENTITY|<!DOCTYPE[^>]*(?:SYSTEM|PUBLIC)", data, re.I):
            raise ValueError("External XML declarations are unsupported.")
        tree = ET.fromstring(data)
        hosts = tree.findall("host")
        ips = [a.get("addr") for a in tree.iter("address") if a.get("addrtype") in {"ipv4", "ipv6"}]
        finished = tree.find("runstats/finished")
        if (
            tree.tag != "nmaprun"
            or len(hosts) != 1
            or ips != [target]
            or finished is None
            or finished.get("exit") != "success"
        ):
            raise ValueError("Nmap evidence is incomplete or contains another target.")
    return document, hashlib.sha256(raw).hexdigest(), xml


def summarize(document):
    tasks = document["tasks"]
    problems = [
        {key: task[key] for key in ("id", "tool", "status", "reason", "parse_status", "parse_error") if key in task}
        for task in tasks
        if task["status"] in {"failed", "timed_out", "output_limit", "tool_missing"}
        or task.get("parse_status") == "failed"
    ]
    return {
        "profile_status": document["run"]["status"],
        "mode": document["run"]["mode"],
        "services": (document.get("nmap") or {}).get("services", []),
        "classification": document.get("classification") or {},
        "observations": document.get("observations", []),
        "candidates": document.get("assessment_findings", []),
        "reproduced": document.get("validated_vulnerabilities", []),
        "problems": problems,
        "run": document["run"],
        "cleanup": document.get("cleanup", {}),
        "artifacts": document["artifacts"],
        "limitations": document.get("limitations", []),
        "dependency_audit": "Chrome ELF and WPScan implementation entrypoint identity are not fully covered.",
    }
