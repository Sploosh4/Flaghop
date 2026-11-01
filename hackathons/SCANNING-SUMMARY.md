# What Scanning has made

Status from the review on **31 October 2026**. Project: [ctf-profiler](/home/joshua/Documents/ChatGPT/Hackathons/ctf-profiler/README.md).

## Single-target device profiler

A Python script that scans one target IP, chooses follow-up tools from the services it finds, and combines their results into a JSON device profile. It collects ports, service versions, OS guesses, web fingerprints, TLS details, SMB information, SSH keys, and DNS records. It saves raw evidence and task outcomes, and supports offline processing, dry runs, timeouts, and output limits.

**Working:** The original local-lab workflow found five open services and completed all eight applicable follow-ups.

**Incomplete:** Broader protocol coverage remains limited. General UDP coverage, STARTTLS, named virtual-host/SNI discovery, WAF detection, ARP, and packet capture are not completed features of this workflow. The newer lab runner requests a DNS UDP probe, but its complete result has not been verified.

## Device classification

Rules that combine observations into likely device types, with confidence levels, explanations, supporting evidence, and conflicting signals. They include general service hosts, several firewall/router families, NAS devices, printers, cameras, and embedded devices.

**Working:** The local target was classified as a general-purpose service host with medium confidence. Conflicting Linux/Windows fingerprints correctly reduced its score.

**Incomplete:** Confidence scores have not been calibrated against a representative collection of real devices. Exact hardware, firmware, physical desktop/server identity, and active NGFW features remain unknown where evidence is insufficient.

## Conditional five-stage scanning workflow

A staged planner, tool adapters, endpoint discovery, a target-restricted web proxy, and separate records for scanner candidates and independently reproduced findings.

| Stage | Tools added or connected |
| --- | --- |
| Discovery | Nmap |
| Identification | curl, WhatWeb, httpx, fingerprintx |
| Enumeration | Katana, ffuf, testssl.sh, enum4linux-ng, ssh-keyscan, dig |
| Assessment | Nuclei, ZAP web/API scans, conditional WPScan |
| Validation | sqlmap, Dalfox, independent HTTP checks, headless-browser XSS checks |

**Working:** The saved web smoke test completed httpx, Katana, ffuf, Nuclei, and ZAP web/API tasks. Git-config exposure and SQL injection were independently reproduced. A separate browser test reproduced XSS. The latest saved automated test run passed **33 tests**.

**Incomplete:** The full five-stage lab run has no completed verification report. fingerprintx output failed parsing. Dalfox exit-code handling was fixed after the smoke test, so the full workflow needs rerunning. WPScan installed successfully but has not been demonstrated against a WordPress target.

## Local CTF target and runner

A loopback-only target at `127.0.0.2` with DNS, SMB, SSH, HTTP, HTTPS, and a closed control port. Added exercises cover SQL injection, reflected XSS, an API, and exposed Git configuration. A runner uses one sudo authentication for privileged setup/discovery and runs follow-up tools under the normal user account.

**Working:** The original lab and single-authentication workflow passed their live checks.

**Incomplete:** The expanded staged runner still needs full verification. The lab shares the laptop’s network stack, so it does not test identification of an independent VM or physical appliance.

## Metasploit export

A portable resource script that imports Nmap host/service records and attaches the full profile and classification as structured notes.

**Working:** Earlier synthetic and live imports preserved the expected records and notes. Repeated imports created no duplicates.

**Incomplete:** Newer staged Metasploit changes have not been live-verified. Further Metasploit work was assigned to another AI and is excluded from Scanning’s current staged runner.

## Workflow visual and documentation

Created [an interactive coloured workflow diagram](/home/joshua/.codex/visualizations/2026/10/30/01a18e39-bfcc-7100-8312-cccff346e68e/ctf-device-profiling.html), project instructions, classification documentation, setup scripts, tests, and saved validation evidence.

**Incomplete:** Parts of the README still describe the older release. No completed custom Legion integration or detailed DeepSeek handoff was demonstrated in the reviewed work.
