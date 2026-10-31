"""Validate an untrusted profile and its bounded, project-owned evidence before import."""

from app.contracts.observations.profile import Profile
from app.core.contract_values import literal_ip


import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import xml.etree.ElementTree as ET

MAX_RETAINED = 16 * 1024 * 1024


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
    for observation in profile.observations:
        if observation.source and observation.source not in names:
            raise ValueError("Scanner observation refers to evidence absent from its checksum manifest.")
    for finding in profile.validated_vulnerabilities:
        references = [finding.evidence] if isinstance(finding.evidence, str) else finding.evidence
        if any(reference not in names for reference in references):
            raise ValueError("Reproduced finding refers to evidence absent from its checksum manifest.")
        if not any(item.path in references and item.bytes > 0 for item in profile.artifacts):
            raise ValueError("Reproduced finding has no nonempty retained evidence.")
    if total > MAX_RETAINED:
        raise ValueError("Scanner retained evidence exceeds 16 MiB.")
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
