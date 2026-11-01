"""Single-target Nmap command preparation and bounded XML parsing."""
from __future__ import annotations

import ipaddress
import os
import re
import xml.etree.ElementTree as ET
from execution import task
from settings import MAX_XML


def parse_nmap(data, target):
    """Reject multi-target input before it can be embedded in a Metasploit import."""
    if len(data) > MAX_XML:
        raise ValueError("Nmap XML exceeds the input limit")
    if re.search(br"<!ENTITY|<!DOCTYPE[^>]*(?:SYSTEM|PUBLIC)", data, re.I):
        raise ValueError("XML entity declarations and external document types are unsupported")
    root = ET.fromstring(data)
    finished = root.find("runstats/finished")
    if root.tag != "nmaprun" or finished is None or finished.get("exit") != "success":
        raise ValueError("A complete, successful Nmap XML file is required")
    hosts = list(root.iter("host"))
    if len(hosts) != 1:
        raise ValueError("Nmap XML must contain exactly one host")
    host = hosts[0]
    addresses = host.findall("address")
    ips = {
        str(ipaddress.ip_address(a.get("addr")))
        for a in root.iter("address") if a.get("addrtype") in ("ipv4", "ipv6")
    }
    if ips != {target}:
        raise ValueError("Nmap XML contains a different or additional target IP")
    services = []
    for port in host.findall("ports/port"):
        number = int(port.get("portid", "0"))
        if not 1 <= number <= 65535:
            raise ValueError("Invalid port in Nmap XML")
        state = port.find("state")
        service = port.find("service")
        services.append({
            "port": number,
            "protocol": port.get("protocol"),
            "state": state.get("state") if state is not None else "unknown",
            "state_reason": state.get("reason") if state is not None else None,
            "fingerprint": dict(service.attrib) if service is not None else {},
            "cpes": [c.text for c in port.findall("service/cpe")],
            "scripts": [
                {"id": node.get("id"), "output": node.get("output", "")}
                for node in port.findall("script")
            ],
        })
    status = host.find("status")
    return {
        "nmap_version": root.get("version"),
        "recorded_arguments": root.get("args"),
        "started_epoch": root.get("start"),
        "finished_epoch": finished.get("time"),
        "host_status": dict(status.attrib) if status is not None else {},
        "addresses": [dict(a.attrib) for a in addresses],
        "hostnames": [dict(n.attrib) for n in host.findall("hostnames/hostname")],
        "scan_coverage": [dict(n.attrib) for n in root.findall("scaninfo")],
        "other_port_states": [dict(n.attrib) for n in host.findall("ports/extraports")],
        "services": sorted(services, key=lambda s: (s["protocol"] or "", s["port"])),
        "os_candidates": [
            {
                "description": match.get("name"),
                "nmap_match_accuracy": match.get("accuracy"),
                "classes": [
                    {**node.attrib, "cpes": [c.text for c in node.findall("cpe")]}
                    for node in match.findall("osclass")
                ],
            }
            for match in host.findall("os/osmatch")
        ],
        "host_scripts": [
            {"id": n.get("id"), "output": n.get("output", "")}
            for n in host.findall("hostscript/script")
        ],
    }


def nmap_task(args, tools, privileged):
    binary = tools.get("nmap") or "nmap"
    command = [binary]
    if args.sudo and os.geteuid() != 0:
        command = ["sudo", "-n", binary]
    if ipaddress.ip_address(args.target).version == 6:
        command.append("-6")
    command += ["-sS" if privileged else "-sT", "-sV", "-n", "-Pn", "--reason"]
    if args.os_detection != "off" and privileged:
        command += ["-O", "--osscan-limit"]
    command += ["--script", "ssl-cert"]
    if args.udp_ports:
        command.append("-sU")
        command += ["-p", "T:" + ("1-65535" if args.ports == "all" else args.ports) + ",U:" + args.udp_ports]
    elif args.ports == "all":
        command.append("-p-")
    elif args.ports == "top1000":
        command += ["--top-ports", "1000"]
    else:
        command += ["-p", args.ports]
    xml_path = str(args.out / "raw" / "nmap.xml")
    command += ["--host-timeout", f"{args.nmap_timeout}s", "-oX", xml_path, args.target]
    return task(
        "discovery", "nmap", command, "Single explicit target",
        args.nmap_timeout + 5, watch=[xml_path],
    )
