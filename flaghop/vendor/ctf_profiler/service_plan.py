"""Conditional service follow-up plans derived from discovery evidence."""
from __future__ import annotations

from execution import task


def plan_followups(args, nmap):
    plans = []
    authority = f"[{args.target}]" if ":" in args.target else args.target
    open_tcp = [s for s in nmap["services"] if s["state"] == "open" and s["protocol"] == "tcp"]
    selected = open_tcp[:args.max_services]
    smb_planned = False
    for service in selected:
        port = service["port"]
        fp = service["fingerprint"]
        name = fp.get("name", "").lower()
        tls = fp.get("tunnel") == "ssl" or name in ("https", "ssl", "ssl/http") or name.startswith("ssl/")
        http = name in ("http", "https", "http-proxy", "ssl/http") or name.startswith("http-")
        # TLS can be confirmed even when Nmap cannot identify the application.
        # Try one bounded HTTPS request; WhatWeb still requires real HTTP headers.
        # Do not send this request to identified non-HTTP TLS applications.
        http = http or (tls and name in ("", "unknown", "ssl", "ssl/unknown"))
        trigger = f"Nmap reports {name or 'unknown'} on tcp/{port}"
        if http:
            scheme = "https" if tls else "http"
            url = f"{scheme}://{authority}:{port}/"
            headers = str(args.out / "raw" / f"http-{port}.headers")
            command = [
                "curl", "--disable", "--silent", "--show-error", "--noproxy", "*",
                "--proto", "=http,https", "--connect-timeout", "5",
                "--max-time", str(args.tool_timeout), "--dump-header", headers,
                "--output", "-",
            ]
            if tls and not args.verify_tls:
                command.append("--insecure")
            command += ["--url", url]
            plans.append(task(
                f"http-{port}", "http", command, trigger, args.tool_timeout + 2,
                port=port, url=url, watch=[headers], stdout_limit=args.max_body_bytes,
            ))
            artifact = str(args.out / "raw" / f"whatweb-{port}.json")
            plans.append(task(
                f"whatweb-{port}", "whatweb",
                [
                    "whatweb", "--aggression=1", "--follow-redirect=never",
                    "--no-cookies", "--max-threads=1", "--open-timeout=5",
                    f"--read-timeout={args.tool_timeout}", f"--log-json={artifact}", url,
                ],
                "HTTP response confirmed by curl", args.tool_timeout,
                port=port, url=url, requires=f"http-{port}",
                json_artifact=artifact, watch=[artifact],
            ))
        if tls:
            artifact = str(args.out / "raw" / f"tls-{port}.json")
            command = [
                "testssl.sh", "-p", "-S", "-s", "--nodns", "none",
                "--warnings", "batch", "--color", "0", "--connect-timeout", "5",
                "--openssl-timeout", "5", "--jsonfile-pretty", artifact,
            ]
            if ":" in args.target:
                command.append("-6")
            command.append(f"{authority}:{port}")
            plans.append(task(
                f"tls-{port}", "tls", command, trigger, args.tls_timeout,
                port=port, json_artifact=artifact, watch=[artifact],
            ))
        if name == "ssh":
            command = ["ssh-keyscan", "-T", "5", "-p", str(port)]
            command += ["-6" if ":" in args.target else "-4", args.target]
            plans.append(task(
                f"ssh-{port}", "ssh", command, trigger, args.tool_timeout, port=port,
            ))
        if name in ("microsoft-ds", "netbios-ssn", "smb") and not smb_planned:
            if port not in (139, 445):
                plans.append(task(
                    f"smb-{port}", "smb", [], trigger, args.tool_timeout, port=port,
                    skip_reason="enum4linux-ng adapter supports standard SMB ports only",
                ))
                continue
            smb_planned = True
            prefix = str(args.out / "raw" / "smb")
            artifact = prefix + ".json"
            plans.append(task(
                "smb", "smb", ["enum4linux-ng", "-O", "-S", "-oJ", prefix, args.target],
                trigger, args.tool_timeout, json_artifact=artifact,
                watch=[artifact], port=port,
            ))
    if args.dns_server:
        plans.append(task(
            "dns", "dns",
            ["dig", "-r", "@" + args.dns_server, "-x", args.target, "+short", "+time=3", "+tries=1"],
            "Explicit DNS resolver configured", args.tool_timeout,
        ))
    else:
        plans.append(task(
            "dns", "dns", [], "Reverse DNS", args.tool_timeout,
            skip_reason="No DNS resolver configured; no implicit resolver requests",
        ))
    return plans, [f"tcp/{s['port']}" for s in open_tcp[args.max_services:]]
