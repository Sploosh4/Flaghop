# Local CTF profiling lab

This lab runs real Python HTTP/HTTPS, Paramiko SSH, Impacket SMB, and dnspython
DNS services on **127.0.0.2 only**. It includes small web and guest-share flag
challenges. It is a service-profiling target, not a vulnerable OS image or an
exploit exercise. SSH rejects all account logins; the public SMB share is
guest-readable and read-only, enforced by filesystem permissions as well as
the share setting. IPC$ resolves to an empty working directory while retaining
the named pipes needed for share enumeration. The HTTPS certificate is self-signed.

The initial LXD container could not boot because the host reported an
unsupported hybrid cgroup layout. That newly created container was removed;
the diagnostic log is retained here. The working lab runs as the normal user
in a transient systemd service with only CAP_NET_BIND_SERVICE, a read-only
filesystem except its runtime directory, private temporary files, and a
512 MiB memory limit. It does not start automatically after a reboot.

| Service | Port | Implementation |
| --- | --- | --- |
| HTTP | TCP 18080 | Python http.server |
| HTTPS | TCP 18443 | Python http.server + TLS 1.2/1.3 |
| SSH | TCP 12222 | Paramiko; fingerprinting only |
| SMB | TCP 445 | Impacket; public read-only share |
| DNS | TCP/UDP 53 | Local authoritative fixture; no upstream |
| Closed control | TCP 18444 | No listener |

Open http://127.0.0.2:18080/ to view the lab. Do not change the bind address to
0.0.0.0 or expose this intentionally permissive guest SMB server to a network.

## Start and discover

For the complete classified workflow with one sudo authentication, run
`bash lab/run_workflow.sh` from the project directory. Add `--restart-lab` to
reload the lab services first. It runs discovery, conditional follow-ups,
classification checks and actual Metasploit import verification, saving a new
run directory under `validation/classified-lab/`.

From the project directory:

```bash
uv venv --system-site-packages lab/.venv --python /usr/bin/python3
uv pip install --python lab/.venv/bin/python 'paramiko==5.1.0'
pkexec bash "$PWD/lab/start-and-scan.sh"
```

The host packages python3-impacket and python3-dnspython are also required.
Authentication occurs in the Ubuntu system prompt. The script starts the
service and runs privileged Nmap against the six listed TCP ports, including
OS detection and certificate collection. Discovery artifacts are saved under
validation/live-lab/discovery. Later starts replace those discovery files;
the profiler copies XML into each separate run directory for preservation.

Run all conditional follow-ups as your normal user, with a new output path:

```bash
python3 ctf_profiler.py 127.0.0.2 \
  --from-nmap validation/live-lab/discovery/nmap.xml \
  --dns-server 127.0.0.2 --tool-timeout 45 --tls-timeout 240 \
  --workspace ctf-profiler-live-lab \
  --label 'Owned local CTF services' \
  --out validation/live-lab/profile-rerun
msfconsole -q -r validation/live-lab/profile-rerun/metasploit-import.rc
```

Nmap identifies services from responses. It may misidentify implementations
or leave versions unknown. OS detection describes the laptop's network stack,
not a separate guest OS. Ground truth is kept separately from scanner evidence.
SMB implementations may not support every anonymous enumeration RPC; these
limitations should remain visible in the profile.

## Stop

```bash
sudo systemctl stop ctf-profiler-local-lab.service
```

Check status with `systemctl status ctf-profiler-local-lab.service`.
Stopping removes the transient unit; rerun the start script to recreate it.
Service keys and lab files remain in lab/runtime, which is not shared over SMB
except for its public subdirectory. The systemd journal contains service logs.

Implementation references: [Paramiko server interface](https://docs.paramiko.org/en/stable/api/server.html)
and [Impacket SMB server example](https://github.com/fortra/impacket/blob/master/examples/smbserver.py).
