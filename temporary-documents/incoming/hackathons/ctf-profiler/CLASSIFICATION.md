# Device classification rules

The fresh local test on 31 October 2026 classified the target as a
**general-purpose service host**, medium confidence, **60/100 rule strength**.
Four service families and Python implementations supported the role; Linux
versus SMB-reported Windows evidence reduced the score from 75 to 60. Hardware
vendor/model, firmware, and NGFW features remained unknown. All 27 automated
tests, 17 live-profile assertions, and 9 actual Metasploit import assertions
passed. The single-sudo runner performed fresh privileged discovery, eight
successful normal-user follow-ups, and repeat import into
`ctf-profiler-classified-lab`.

Evidence: [classified JSON](../../../../hackathons/ctf-profiler/validation/classified-lab/20261030T202134Z-285022/profile/device-profile.json),
[profile verification](../../../../hackathons/ctf-profiler/validation/classified-lab/20261030T202134Z-285022/profile-verification.json),
[Metasploit verification](../../../../hackathons/ctf-profiler/validation/classified-lab/20261030T202134Z-285022/metasploit-verification.json),
[unit tests](../../../../hackathons/ctf-profiler/validation/classifier-unit-tests.log).

Version 0.2.0 combines exposed-service evidence into ranked device-role
hypotheses. The rules consume only the parsed network profile. They never use
the operator's label, the known lab setup, local packages, or a target's private
files. Each hypothesis records its rule, score, confidence, explanation, and
paths back to the supporting observations. The separate lab verifier may use
known expectations; those expectations are not classifier input.

Scores describe **rule strength**, not a probability of being correct. These
initial weights have regression coverage but have not been calibrated against
a labeled fleet of real devices.

| Confidence | Meaning |
| --- | --- |
| Unknown | Insufficient evidence for any rule |
| Low | Score below 55; weak or ambiguous hypothesis |
| Medium | Score at least 55; plausible role, incomplete corroboration |
| High | Score at least 80 and two distinct evidence channels |

HTTP headers, page titles, repeated HTTPS pages, and WhatWeb observations all
count as the same **web** channel. Repeating the same branding never raises
confidence. Channels are protocol families, not claims of statistically
independent evidence; related services can share implementation or branding.

| Rule | Evidence | Scoring |
| --- | --- | --- |
| Service host | At least two distinct recognized service families | 55, plus 8 per family above two, plus 8 for Python/Paramiko/SimpleHTTP software markers; capped at 75 |
| OS conflict | Best Nmap OS family disagrees with SMB-reported Windows/Linux family | Reduce service-host score by 15; OS confidence low |
| Desktop/server ambiguity | RDP and SMB | 50; cannot identify a physical desktop |
| NGFW-capable appliance | Explicit FortiGate or PAN-OS product markers | 65 in one channel; 85 across channels; enabled features remain unknown |
| Firewall | Explicit pfSense or OPNsense markers | Same product-marker scoring |
| Router | RouterOS markers | Same product-marker scoring |
| Router/switch | Cisco IOS markers | Same scoring; routing role ambiguous |
| NAS | Synology DSM/DiskStation or QNAP QTS/QuTS markers | Product-marker score, plus 10 for SMB/NFS, capped at 90 |
| Printer | IPP, JetDirect or printing protocol; optional printer product markers | 55 for protocol; 80 with markers; high still requires two channels |
| Camera/IoT | Explicit camera markers such as Hikvision, Dahua, or network camera | 60 for markers; 80 with RTSP corroboration |
| Embedded IoT | ESP32, ESP8266, Tasmota or ESPHome markers | 65 |

Specific appliance hypotheses take precedence over a generic service-host
description by capping that generic candidate at 50. Different advertised
appliance families reduce each platform candidate by 20 and leave vendor and
NGFW capability unresolved. Alternatives and conflicts are preserved.

Only the best Nmap OS candidate contributes to the OS assessment. Lower-ranked
router/webcam alternatives and hardware CPEs from guessed OS matches cannot
identify an appliance. Exact model and firmware stay unknown. Service versions
remain service versions. Nmap's match percentage describes fingerprint
similarity, as explained in its [OS detection documentation](https://nmap.org/book/osdetect-usage.html).

HTTPS, DNS, VPN, IPS/antivirus words, a generic vendor name, or a WAF alone do
not trigger an NGFW rule. Even explicit product markers cannot establish active
inspection or licenses; the distinction is reflected in the
[PAN-OS subscription documentation](https://docs.paloaltonetworks.com/ngfw/administration/subscriptions).
`ngfw_capability` can become `likely`; `ngfw_features_active` stays `unknown`.

Remote branding and banners can be customized or spoofed. Proxies, emulated
protocols, and multiple backends can yield conflicting results. Missing visible
services do not prove that a capability is absent. A closed port is never used
as positive evidence, and failed optional checks do not supply classification
facts. This classifier does not turn tool warnings into validated vulnerabilities.

## Metasploit representation

The import attaches the complete profile as `ctf.device_profile`, plus a smaller
`ctf.device_classification` note containing ranked hypotheses and their evidence.
Repeated imports update those notes instead of duplicating them. Nmap's host OS,
purpose, and service labels are preserved; inferred roles are not silently
written over the original fingerprint fields.

## One authentication for the complete local workflow

From a normal terminal in the project directory:

```bash
bash lab/run_workflow.sh
```

To reload changed lab code before scanning:

```bash
bash lab/run_workflow.sh --restart-lab
```

The runner authenticates through sudo once and retains that elevated process
for the duration of the run. It starts/restarts the owned local target and runs
privileged Nmap. It then uses `runuser` to run follow-ups and profile validation
as the project owner, keeping parsers and optional tools out of the root account.
No password is saved, no sudoers change is made, and no timestamp keeper runs.
Metasploit is not executed by the current runner in either mode; import resources
remain a separate, explicit operation outside staged evaluation.

Each invocation creates a new timestamped directory under
`validation/classified-lab/`, containing discovery XML, retained evidence, the
JSON profile, logs, and verification reports. It scans only **127.0.0.2**,
including the closed control port. The runner exits nonzero if expected lab
checks fail. It leaves the loopback-only target running for further practice.
