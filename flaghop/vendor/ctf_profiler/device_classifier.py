"""Explainable device-role heuristics. Pure inference over saved observations."""
from __future__ import annotations

import re

RULE_VERSION = "1.0"
# Explicit product-family markers, not generic vendor names or feature words.
PLATFORMS = (
    ("fortigate", r"\bfortigate\b", "ngfw_appliance", "Fortinet", "FortiGate"),
    ("pan_os", r"\bpan-os\b", "ngfw_appliance", "Palo Alto Networks", "PAN-OS"),
    ("pfsense", r"\bpfsense\b", "firewall", "Netgate", "pfSense"),
    ("opnsense", r"\bopnsense\b", "firewall", "Deciso", "OPNsense"),
    ("routeros", r"\brouteros\b", "router", "MikroTik", "RouterOS"),
    ("cisco_ios", r"\bcisco ios(?: xe| xr)?\b", "router_or_switch", "Cisco", "IOS"),
    ("synology", r"\bsynology (?:diskstation|dsm)\b", "nas", "Synology", "DSM"),
    ("qnap", r"\bqnap (?:qts|qu?ts hero)\b", "nas", "QNAP", "QTS"),
)
LABELS = {
    "general_purpose_service_host": "General-purpose service host",
    "desktop_or_server": "Desktop or server",
    "ngfw_appliance": "NGFW-capable appliance",
    "firewall": "Firewall appliance",
    "router": "Router",
    "router_or_switch": "Router or switch",
    "nas": "Network-attached storage",
    "printer": "Network printer",
    "camera_iot": "Network camera / IoT",
    "iot_device": "IoT / embedded device",
}


def classify_device(profile):
    nmap = profile.get("nmap") or {}
    services = [s for s in nmap.get("services", []) if s.get("state") == "open"]
    observations = [o for o in profile.get("observations", [])
                    if o.get("execution_status") == "completed"]
    http_ports = {o.get("port") for o in observations if o.get("tool") == "http"}
    facts = []
    protocols = {}

    def fact(source, path, value, channel):
        item = {"source": source, "path": path, "value": str(value)[:500], "channel": channel}
        facts.append(item)
        return item

    def protocol(name):
        name = name.lower().removeprefix("ssl/")
        if name in ("http", "https", "http-proxy") or name.startswith("http-"):
            return "web"
        if name in ("microsoft-ds", "netbios-ssn", "smb"):
            return "smb"
        if name in ("domain", "dns"):
            return "dns"
        if name in ("ms-wbt-server", "rdp"):
            return "rdp"
        if name in ("jetdirect", "pdl-datastream", "ipp", "printer"):
            return "printing"
        return name

    for i, service in enumerate(services):
        fp = service.get("fingerprint", {})
        name = fp.get("name", "")
        channel = "web" if service.get("port") in http_ports else protocol(name)
        base = f"nmap.services[port={service['port']},protocol={service.get('protocol')}]"
        if channel and channel not in ("unknown", "ssl"):
            protocols.setdefault(channel, []).append(fact("nmap", base + ".fingerprint.name", name, channel))
        for key in ("product", "extrainfo"):
            if fp.get(key):
                fact("nmap", base + ".fingerprint." + key, fp[key], channel or "unknown")

    smb_os = []
    for i, obs in enumerate(observations):
        base = f"observations[task_id={obs.get('task_id')}]"
        if obs.get("tool") == "http":
            for key in ("title", "meta_generators"):
                values = obs.get(key) or []
                for value in values if isinstance(values, list) else [values]:
                    fact("http", base + "." + key, value, "web")
            for header in obs.get("headers", []):
                if header.get("name", "").lower() == "server":
                    fact("http", base + ".headers.Server", header.get("value"), "web")
        elif obs.get("tool") == "whatweb":
            rows = obs.get("data", [])
            for row in rows if isinstance(rows, list) else []:
                if not isinstance(row, dict) or not isinstance(row.get("plugins"), dict):
                    continue
                for plugin, data in row["plugins"].items():
                    if plugin in ("Country", "IP", "UncommonHeaders"):
                        continue
                    fact("whatweb", base + ".plugins." + plugin, plugin, "web")
                    if not isinstance(data, dict):
                        continue
                    for key in ("string", "version"):
                        values = data.get(key, [])
                        for value in values if isinstance(values, list) else []:
                            fact("whatweb", base + ".plugins." + plugin + "." + key, value, "web")
        elif obs.get("tool") == "smb":
            data = obs.get("data", {})
            if not isinstance(data, dict):
                continue
            for key in ("OS", "Native OS", "Native LAN manager"):
                value = data.get("os_info", {}).get(key)
                if value:
                    item = fact("smb", base + ".os_info." + key, value, "smb")
                    if key == "OS":
                        smb_os.append(item)
            if data.get("shares"):
                protocols.setdefault("smb", []).append(fact("smb", base + ".shares", ", ".join(data["shares"]), "smb"))

    candidates = []
    conflicts = []
    # Only the best OS candidate influences the OS assessment. Lower-ranking
    # hardware alternatives (e.g. webcam/router) never trigger identity rules.
    os_candidates = nmap.get("os_candidates", [])
    best = os_candidates[0] if os_candidates else None
    families = sorted({c.get("osfamily") for c in (best or {}).get("classes", []) if c.get("osfamily")})
    likely_os = families[0] if len(families) == 1 else None
    os_evidence = []
    if best:
        os_evidence.append({"source": "nmap", "path": "nmap.os_candidates[0]", "value": best.get("description"),
                            "fingerprint_match_score": best.get("nmap_match_accuracy")})
    if likely_os and any(re.search(r"windows|linux", x["value"], re.I).group().lower() != likely_os.lower()
                         for x in smb_os if re.search(r"windows|linux", x["value"], re.I)):
        conflicts.append({"id": "os_sources_disagree", "explanation": "Nmap's best OS family conflicts with SMB-reported OS information; emulation or customized banners are possible.",
                          "evidence": os_evidence + smb_os})

    def add(kind, score, evidence, explanation, rule, **extra):
        # Repeated HTTP/HTTPS/WhatWeb observations count as one web channel.
        channels = {e.get("channel") for e in evidence if e.get("channel")}
        rating = "high" if score >= 80 and len(channels) >= 2 else "medium" if score >= 55 else "low"
        candidates.append({"device_type": kind, "label": LABELS[kind], "score": score,
                           "confidence": rating, "rule": rule, "explanation": explanation,
                           "evidence": evidence, "evidence_channels": sorted(channels), **extra})

    matched_platforms = []
    for rule, pattern, kind, vendor, family in PLATFORMS:
        hits = [f for f in facts if re.search(pattern, f["value"], re.I)]
        if not hits:
            continue
        matched_platforms.append(family)
        channels = {h["channel"] for h in hits}
        score = 85 if len(channels) >= 2 else 65
        support = []
        if kind == "nas" and ("smb" in protocols or "nfs" in protocols):
            support = protocols.get("smb", []) + protocols.get("nfs", [])
            score = min(90, score + 10)
        add(kind, score, hits + support,
            f"Explicit {family} product markers support this role. Repeated web responses count once; exposed services cannot confirm licensed or enabled security features.",
            rule, vendor=vendor, product_family=family)

    printing = protocols.get("printing", [])
    printer_hits = [f for f in facts if re.search(r"\b(?:laserjet|officejet|epson|brother|xerox|printer)\b", f["value"], re.I)
                    and not f["path"].endswith(".fingerprint.name")]
    if printing:
        add("printer", 80 if printer_hits else 55, printing + printer_hits,
            "Printing protocol detected" + (" with printer product markers." if printer_hits else "; a print server can expose the same protocol."), "printing_protocol")
    camera_hits = [f for f in facts if re.search(r"\b(?:hikvision|dahua|axis (?:network|communications)|ip camera|network camera)\b", f["value"], re.I)]
    if camera_hits:
        media = protocols.get("rtsp", [])
        add("camera_iot", 80 if media else 60, camera_hits + media,
            "Camera product markers" + (" corroborated by RTSP media service." if media else "; media service not corroborated."), "camera_identity")
    embedded = [f for f in facts if re.search(r"\b(?:esp8266|esp32|tasmota|esphome)\b", f["value"], re.I)]
    if embedded:
        add("iot_device", 65, embedded, "Embedded-device platform markers observed; physical model remains unverified.", "embedded_platform")

    groups = set(protocols) & {"web", "ssh", "smb", "dns", "ftp", "nfs", "rdp", "ldap", "mysql", "postgresql"}
    if len(groups) >= 2:
        ev = [protocols[g][0] for g in sorted(groups)]
        runtime = [f for f in facts if re.search(r"\b(?:python|paramiko|simplehttpserver)\b", f["value"], re.I)]
        score = min(75, 55 + 8 * (len(groups) - 2) + (8 if runtime else 0))
        score -= 15 if conflicts else 0
        if candidates:
            score = min(score, 50)  # Generic services do not override explicit appliance markers.
        add("general_purpose_service_host", score, ev + runtime,
            f"Exposes {len(groups)} distinct service families ({', '.join(sorted(groups))}). "
            + ("General-purpose software implementations are advertised. " if runtime else "")
            + ("Conflicting OS reports reduce the score. " if conflicts else "")
            + "Describes a service role; physical desktop versus server cannot be established remotely.", "multiple_service_families")
    if "rdp" in protocols and "smb" in protocols:
        add("desktop_or_server", 50, protocols["rdp"] + protocols["smb"],
            "RDP and SMB support a Windows-style host role, but do not distinguish a desktop from a server.", "rdp_and_smb")

    if len(set(matched_platforms)) > 1:
        conflicts.append({"id": "multiple_appliance_families", "explanation": "Different appliance product families are advertised. A proxy, mixed services, or spoofed branding may explain this.", "families": matched_platforms})
        for item in candidates:
            if item.get("product_family"):
                item["score"] = max(0, item["score"] - 20)
                item["confidence"] = "medium" if item["score"] >= 55 else "low"

    candidates.sort(key=lambda c: (-c["score"], c["device_type"], c.get("product_family", "")))
    primary = candidates[0] if candidates else None
    identities = {field: {"value": None, "status": "unknown", "evidence": []}
                  for field in ("vendor", "product_family", "model", "firmware", "device_role")}
    if primary:
        identities["device_role"] = {"value": primary["device_type"], "status": "hypothesis",
                                      "confidence": primary["confidence"], "score": primary["score"], "evidence": primary["evidence"]}
        if len(set(matched_platforms)) == 1:
            platform = next(c for c in candidates if c.get("product_family"))
            for key in ("vendor", "product_family"):
                identities[key] = {"value": platform[key], "status": "hypothesis", "confidence": platform["confidence"], "evidence": platform["evidence"]}
    ngfw = [c for c in candidates if c["device_type"] == "ngfw_appliance"]
    result = {
        "rule_version": RULE_VERSION, "method": "deterministic evidence heuristics",
        "status": "hypothesis" if primary else "insufficient_evidence",
        "confidence": primary["confidence"] if primary else "unknown",
        "score_semantics": "0-100 rule strength, not a calibrated probability. low <55; medium >=55; high >=80 plus at least two distinct evidence channels. Correlated web observations count once.",
        "primary": primary, "alternatives": candidates[1:], "conflicts": conflicts,
        "os_assessment": {"likely_family": likely_os, "confidence": "low" if conflicts else "medium" if likely_os else "unknown", "evidence": os_evidence + smb_os,
                          "explanation": "OS fingerprint similarity and SMB banners are unverified; exact OS versions are not asserted."},
        "limitations": ["Service role does not identify physical hardware or distinguish a desktop running services from a server.",
                        "Banners and web branding can be spoofed; a reverse proxy can combine different systems.",
                        "No model or firmware inferred from a generic OS match or service version.",
                        "NGFW product-family inference does not confirm enabled inspection, licenses, or traffic policies.",
                        "Missing evidence is not evidence a capability is absent; only exposed, scanned services are considered."]}
    if not primary:
        result["explanation"] = "Insufficient corroborated observations to identify a device type."
    return result, identities, "likely" if ngfw and len(set(matched_platforms)) == 1 else "unknown"
