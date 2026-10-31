"""Synthetic scanner evidence, clearly separated from live acceptance outputs."""

import hashlib
import json
from pathlib import Path

from app.scanning.source import scanner_source


def write_profile(output, target="192.0.2.10", status="completed", tasks=None):
    output = Path(output)
    (output / "raw").mkdir(parents=True, exist_ok=True)
    xml = f"""<?xml version="1.0"?><nmaprun scanner="nmap" args="SYNTHETIC UI FIXTURE" start="1793404800" version="fixture"><scaninfo type="connect" protocol="tcp" numservices="1" services="8080"/><host><status state="up" reason="fixture"/><address addr="{target}" addrtype="ipv4"/><hostnames><hostname name="fixture.test" type="user"/></hostnames><ports><port protocol="tcp" portid="8080"><state state="open" reason="fixture"/><service name="http" product="Synthetic fixture" version="1" method="probed" conf="10"/></port></ports></host><runstats><finished time="1793404801" exit="success"/><hosts up="1" down="0" total="1"/></runstats></nmaprun>""".encode()
    (output / "raw/nmap.xml").write_bytes(xml)
    _, manifest = scanner_source()
    profile = {
        "schema_version": "1.0",
        "target": {"ip": target, "scope": "single_ip", "dns_resolver": None},
        "run": {
            "status": status,
            "mode": "active",
            "started_at": "2026-10-31T00:00:00Z",
            "finished_at": "2026-10-31T00:00:01Z",
        },
        "source_identity": {key: value for key, value in manifest.items() if key.endswith(".py")},
        "tasks": tasks or [{"id": "discovery", "tool": "nmap", "status": "completed"}],
        "observations": [{"tool": "http", "port": 8080, "title": "Synthetic fixture"}],
        "classification": {
            "status": "hypothesis",
            "primary": {
                "device_type": "server",
                "score": 60,
                "confidence": "medium",
                "explanation": "Synthetic fixture rule strength, not probability.",
            },
            "alternatives": [],
            "conflicts": [],
        },
        "nmap": {
            "services": [
                {
                    "port": 8080,
                    "protocol": "tcp",
                    "state": "open",
                    "fingerprint": {"name": "http", "product": "Synthetic fixture"},
                }
            ]
        },
        "assessment_findings": [{"title": "Synthetic assessment candidate", "status": "candidate"}],
        "validated_vulnerabilities": [
            {"type": "Synthetic independent reproduction", "status": "reproduced", "evidence": "raw/nmap.xml"}
        ],
        "cleanup": {"success": True},
        "artifacts": [{"path": "raw/nmap.xml", "bytes": len(xml), "sha256": hashlib.sha256(xml).hexdigest()}],
    }
    (output / "device-profile.json").write_text(json.dumps(profile))
    return profile
