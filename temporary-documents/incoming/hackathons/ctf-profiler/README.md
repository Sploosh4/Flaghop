# CTF Profiler v0.3

See [the architecture and module guide](../../../../hackathons/ctf-profiler/ARCHITECTURE.md) for component ownership,
task contracts and extension points.

A conditional profiler for **one assigned CTF target IP**. It collects exposed
service evidence, writes a JSON device profile, and generates a portable
Metasploit resource script. It supplies no target credentials and installs
nothing on the target.

## Run

Requires Linux, Python 3.10+, and Nmap. curl enables HTTP collection. Optional
tools are used when installed and applicable; the script never installs tools.
No Python packages are required.

From this directory:

```bash
python3 ctf_profiler.py --check-tools
```

For an actual assigned IP, replace `YOUR_CTF_IP` below. The output directory must
be new; existing directories are never overwritten.

```bash
sudo -v
python3 ctf_profiler.py YOUR_CTF_IP --sudo --out results/first-run
```

`sudo -v` authorises local sudo; `--sudo` applies noninteractive sudo only to
Nmap. Without sudo, TCP connect scanning still works and automatic OS detection
is omitted. Use `--os-detection off` to omit it explicitly.

The default discovery scans the top 1,000 TCP ports. Choose your coverage:

```bash
python3 ctf_profiler.py YOUR_CTF_IP --sudo --ports all --out results/all-tcp
python3 ctf_profiler.py YOUR_CTF_IP --ports 22,80,443,8000-8100 --out results/selected-tcp
```

For reverse DNS, supply the CTF's resolver IP explicitly:

```bash
python3 ctf_profiler.py YOUR_CTF_IP --dns-server YOUR_CTF_DNS_IP --out results/with-dns
```

There are no implicit DNS queries by the generated commands. Resolver contact is
an explicit exception to the single target IP, limited to a PTR query for that
target. Discovered hostnames and redirect locations do not become scan targets.
Proxy and tool authentication/option environment variables are not inherited.
curl configuration files and HTTP redirects are disabled.

## Conditional checks

Version 0.3.0 applies [device-classification rules](../../../../hackathons/ctf-profiler/CLASSIFICATION.md) to the
combined evidence. The profile includes ranked types, heuristic confidence,
supporting evidence, and contradictions; appliance identity and enabled NGFW
features remain distinct. A [single-authentication lab runner](../../../../hackathons/ctf-profiler/CLASSIFICATION.md#one-authentication-for-the-complete-local-workflow)
performs discovery, all follow-ups, and profile verification. Staged runs exclude
Metasploit; import resources are generated only when explicitly requested.

| Evidence from discovery | Follow-up |
| --- | --- |
| HTTP service, including nonstandard ports | curl GET: headers, title, generator tags, response prefix |
| TLS with unidentified application | Bounded curl HTTPS check; WhatWeb requires confirmed HTTP |
| HTTP response confirmed by curl | WhatWeb level 1, JSON, redirects disabled |
| Direct TLS service | testssl.sh protocol, server-default and cipher-category checks; JSON |
| SSH service | ssh-keyscan public host keys and SHA-256 fingerprints |
| SMB on port 139 or 445 | enum4linux-ng OS/share checks with default empty credentials |
| Explicit DNS resolver | dig PTR query |

## Staged workflow

`--stages 1-5` extends the conditional follow-ups into five recorded stages:

| Stage | Tools and behaviour |
| --- | --- |
| Discovery | Nmap, or validated `--from-nmap` XML |
| Identification | curl, WhatWeb, httpx, fingerprintx for unidentified ports |
| Enumeration | Katana, ffuf, testssl.sh, enum4linux-ng, ssh-keyscan, dig |
| Assessment | Nuclei, ZAP web scan, ZAP API scan when a same-target OpenAPI file exists, conditional WPScan |
| Validation | sqlmap, Dalfox, independent Git/SQL HTTP checks, headless-browser XSS proof |

Every stage has a separate record. A tool process that exits successfully but
whose output cannot be parsed makes that stage and the run `partial`; it is not
reported as completed. Scanner alerts remain `assessment_findings` candidates
until an independent validation step reproduces them.

Run the complete owned-lab workflow (one sudo authentication, Metasploit
excluded):

```bash
bash lab/run_workflow.sh --staged --restart-lab
```

If the owned lab and a complete Nmap XML already exist, a normal-user staged run
can use them without another privileged scan:

```bash
PATH="$PWD/.tools/bin:$PATH" python3 ctf_profiler.py 127.0.0.2 \
  --from-nmap validation/staged-lab/20261031T055530Z-163656/discovery/nmap.xml \
  --ports 53,445,12222,18080,18443,18444 --dns-server 127.0.0.2 \
  --tool-timeout 45 --tls-timeout 240 --stages 1-5 --no-metasploit \
  --skip metasploit_check --out validation/my-staged-run
```

`lab/verify_staged_profile.py RUN_DIR` checks the saved profile against the
separate [ground truth](../../../../hackathons/ctf-profiler/lab/ground-truth.json), parses URL scope instead of
substring matching, resolves every evidence path, and re-derives Git, SQL and
browser proof content. It does not run Metasploit.

Two focused owned fixtures cover branches outside the main lab:

```bash
python3 lab/verify_wordpress_fixture.py --lab-profile RUN_DIR/profile
python3 -m unittest tests.test_negative_fixtures -v
```

The WordPress fixture is static, local, and requires no API token. The negative
fixture exposes a corrected non-repository Git path, parameterised item lookup,
and HTML-escaped greeting; none may be reproduced as a finding. Reserved
classification cases live in `tests/fixtures/classification-heldout.json` and
are read only by the evaluator.

Service names and TLS detection drive the plan. A port number alone does not
establish the protocol. Nmap service classifications can still be wrong;
follow-up failures and available evidence are retained.

Optional executables: `whatweb`, `testssl.sh` (or `testssl`),
`enum4linux-ng` (or `enum4linux-ng.py`), `ssh-keyscan`, and `dig`.
Some have their own runtime dependencies. Older incompatible versions are
reported as failed checks, rather than silently treated as successful.

Anonymous SMB sessions may be denied. Those restrictions are recorded explicitly.
There is no password guessing, supplied account/token/cookie, target agent, or
remote software installation in this version.

## Outputs

Each run produces:

```text
device-profile.json
metasploit-import.rc
raw/
  nmap.xml
  ...per-check stdout, stderr, headers and tool JSON...
```

The profile includes:

- Target and scan coverage, OS candidates, ports, service products and versions.
- Conditional task plan, commands, timings, outcomes and parser errors.
- HTTP clues, SSH keys, configured PTR results and optional tool JSON.
- Raw artifact paths, byte counts and SHA-256 hashes.
- Separate unassessed vendor, model, firmware and device-role hypotheses.

Product banners and OS candidates are observations, not confirmed hardware
identity. NGFW capability and active features remain unknown, and no
vulnerabilities are automatically validated.

Checks run sequentially with per-process deadlines. The default limit is 32 open
TCP services for follow-ups; all discovered services remain in the profile and
omitted follow-ups are listed. HTTP bodies are capped at 256 KiB by default.
Truncated responses and interrupted/failed runs are labelled partial.

Common controls:

```bash
python3 ctf_profiler.py YOUR_CTF_IP --skip smb --skip tls --out results/reduced
python3 ctf_profiler.py YOUR_CTF_IP --tool-timeout 15 --tls-timeout 90 --max-services 16 --out results/bounded
python3 ctf_profiler.py YOUR_CTF_IP --dry-run --out results/planned
```

`--dry-run` writes the discovery plan without sending traffic. Supplying
`--from-nmap` with `--dry-run` also reveals the conditional follow-up plan.
`--verify-tls` makes curl require certificate validation; the default permits
self-signed CTF HTTPS certificates and records that verification was disabled.

Exit codes: **0** completed/planned (possibly with skipped or missing optional
tools); **1** invalid input/setup; **2** partial results, timeout, failed parsing,
truncation, restricted SMB checks, or interrupted run. Inspect individual tasks
to assess coverage; a successful process exit does not prove complete visibility.

## Runtime workspace, cleanup and dependencies

Each run creates a short-lived owned workspace under `TMPDIR` (or
`CTF_PROFILER_WORKSPACE` when set). Browser profiles, Chrome sockets, version
probes and other tool scratch live there; ZAP homes and isolated tool state are
also removed after their reports/proofs are harvested. The observer's `--work`
directory is therefore the declared temporary root, not an unmeasured `/tmp`
side channel. Cleanup reports attempted paths, errors, leftovers and bytes, and
a failed deletion makes the run partial instead of silently successful.

WPScan reads the installed vulnerability database from the existing user cache;
the run uses a run-local cookie jar and does not update that database. Profiles
record launcher hashes, resolved implementation files, ZAP core/plugin and
WPScan gem/database identities before and after the run. The installed
dependencies are not copied into retained evidence.

## Existing scans and offline use

Use a complete, single-target Nmap XML file:

```bash
python3 ctf_profiler.py YOUR_CTF_IP --from-nmap previous.xml --out results/followups
```

This **does run conditional network checks**. Add `--offline` for parsing and
artifact generation without running any tools:

```bash
python3 ctf_profiler.py 192.0.2.10 \
  --from-nmap tests/fixtures/single-target.xml \
  --offline --label "Synthetic example; not a real device" \
  --out results/offline-example
```

The included fixture and checked-in sample outputs are **synthetic**. They
demonstrate structure and import generation, not observations of a real CTF
device. The source scan's authentication history cannot be verified when XML is
supplied; the generated follow-up commands still supply no credentials.

Multi-host XML, mismatched target IPs, and incomplete scans are rejected before
creating output. Hostname, CIDR, multicast, unspecified, and zoned IPv6 target
arguments are not accepted.

## Metasploit import

Run on your machine with a configured, connected Metasploit database:

```bash
msfconsole -q -r /absolute/path/to/metasploit-import.rc
```

Or, from an existing console:

```text
db_status
resource /absolute/path/to/metasploit-import.rc
hosts
services
notes -t ctf.device_profile
```

The script creates/selects the run's workspace, imports the validated Nmap XML,
and attaches the JSON as a structured host note. It contains only database
import operations and does not launch scans or modules. Its data is Base64
encoded to keep target-controlled text out of executable Ruby.

The resource is self-contained and portable. Re-import replaces the profile
note of the same host/type in that workspace. Use `--workspace NAME` for a
different workspace. If discovery failed or a dry run has no XML, the resource
attaches the labelled profile only.

## Coverage and limitations

The staged workflow covers the tools listed above. The original profiler remains
available when `--stages` is omitted. ZAP, ffuf, httpx, fingerprintx, Katana,
Nuclei, WPScan, sqlmap, Dalfox and the browser proof are implemented adapters.

Not implemented: general UDP coverage beyond an explicitly requested port,
STARTTLS negotiation, named virtual-host/SNI discovery, WAF detection, ARP,
packet capture, caching/resume, and parallel follow-ups. Direct-IP web requests
can miss named virtual hosts. No exact device identity, calibrated probability,
or exploit applicability is inferred automatically. Classification confidence
values are heuristic rule strengths, not measured probabilities.

Metasploit import generation remains available outside staged evaluation. The
staged runner passes `--no-metasploit`; Metasploit and Legion integration are
outside this workflow's current evaluation scope.

## Validation

```bash
python3 -m unittest discover -s tests -v
```

Tests cover target validation, XML scope, nonstandard-port conditions, skipped
tools, output limits, timeouts, interruption, offline mode, encoded imports,
anonymous-access restrictions, parser failures, fingerprintx/Dalfox contracts,
and empty-versus-failed artifacts. Simulated executables exercise every adapter.
Owned loopback fixtures verify redirect handling, the actual Nmap/curl pipeline,
corrected negative cases for all three weakness types, and reserved
classification inputs. None contacts another machine.

Optional scanner integrations have adapter tests with simulated outputs. The
installed tools also have a complete live local-lab test described below.

## Live local target

The [local lab](../../../../hackathons/ctf-profiler/lab/README.md) runs HTTP, HTTPS, SSH, guest SMB, and DNS on
127.0.0.2. It contains small flag challenges and needs no target credentials.
Services are installed locally to create the owned target; the profiler uses
only network requests when inspecting it.

On 31 October 2026, privileged Nmap discovered five open TCP ports and one
closed control port. The staged runner's current evidence is under
`validation/deepseek-evaluation/`; the older partial smoke runs are preserved
unchanged. All eight applicable follow-ups completed using curl,
WhatWeb, testssl.sh, ssh-keyscan, enum4linux-ng, and dig. The live run exposed
an unidentified-TLS planning gap, now covered by a regression test. Nmap's
original service labels remain unchanged in the evidence.

The resulting profile was imported twice into Metasploit workspace
`ctf-profiler-live-lab`: one host, five open services, and one complete profile
note, with no duplicate records or invented vulnerabilities. The closed port
is also preserved as closed in the Metasploit service table.

- [Live JSON profile](../../../../hackathons/ctf-profiler/validation/live-lab/profile/device-profile.json)
- [Portable Metasploit resource](../../../../hackathons/ctf-profiler/validation/live-lab/profile/metasploit-import.rc)
- [Profile checks](../../../../hackathons/ctf-profiler/validation/live-lab/profile-verification.json)
- [Metasploit import checks](../../../../hackathons/ctf-profiler/validation/live-lab/metasploit-import-verification.json)
- [Console transcript](../../../../hackathons/ctf-profiler/validation/live-lab/metasploit-import-test.log)

This is a protocol-profiling lab rather than an independent vulnerable VM.
OS fingerprints describe the laptop stack. SMB's reported OS/version and
supported dialects are server responses, not verified device facts; unsupported
RPC calls and tool warnings remain in the raw observations. The separate
[ground truth](../../../../hackathons/ctf-profiler/lab/ground-truth.json) is used for validation, never profiling.

On 31 October 2026, the generated import was verified in the installed Metasploit
Framework 6.5.9 using workspace `ctf-profiler-synthetic-test`. Importing the
synthetic profile twice produced exactly one host, four services, and one
profile note. The complete JSON was preserved and no vulnerability records were
created. See [the verification report](../../../../hackathons/ctf-profiler/validation/metasploit-import-verification.json)
and [console transcript](../../../../hackathons/ctf-profiler/validation/metasploit-import-test.log).

## Installed tools on this computer

- Metasploit Framework 6.5.9 and testssl.sh 3.2.2 are managed through APT.
- WhatWeb 0.6.4 is the official upstream release in
  `/home/joshua/.local/share/ctf-profiler/WhatWeb`, exposed through
  `/home/joshua/.local/bin/whatweb`. It takes precedence over Ubuntu's packaged
  0.6.3 launcher, which failed with a missing relative library path.
- enum4linux-ng 1.3.10 is in
  `/home/joshua/.local/share/ctf-profiler/enum4linux-ng`, exposed through
  `/home/joshua/.local/bin/enum4linux-ng`. Its Python and Samba dependencies are
  installed through Ubuntu packages.
- Metasploit's user database is configured in `~/.msf4` and listens on
  `127.0.0.1:5433`. Launch `msfconsole` as your normal user; its wrapper starts the
  local database when needed.

[The installation manifest](../../../../hackathons/ctf-profiler/setup/installed-tools.json) records package versions,
official upstream URLs and the installed source commits. The upstream source
checkouts are separate from APT updates.

Implementation references:

- [Nmap XML](https://nmap.org/book/man-output.html)
- [WhatWeb](https://github.com/urbanadventurer/WhatWeb)
- [testssl.sh options](https://github.com/testssl/testssl.sh/blob/3.2/doc/testssl.1.md)
- [enum4linux-ng](https://github.com/cddmp/enum4linux-ng)
- [Metasploit resource scripts](https://docs.rapid7.com/metasploit/resource-scripts/)
- [Metasploit database notes](https://github.com/rapid7/metasploit-framework/blob/master/lib/msf/core/db_manager/note.rb)
