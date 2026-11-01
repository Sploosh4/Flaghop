"""Bounded subprocesses and an explicit parser for Ciphey v0.12.1."""
import os
import base64
import hashlib
import re
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")


def run_tool(argv, *, cwd, timeout, env=None, output_limit=2_000_000):
    """Capture bounded diagnostics; terminate the entire child process group."""
    started = time.monotonic()
    status = "complete"
    with tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
        launcher = Path(__file__).with_name("limit_exec.py")
        process = subprocess.Popen([sys.executable, str(launcher), str(os.getpid()), *argv], cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                   stdout=stdout, stderr=stderr, start_new_session=True)
        try:
            while process.poll() is None:
                if time.monotonic() - started > timeout:
                    status = "timeout"
                    break
                if os.fstat(stdout.fileno()).st_size + os.fstat(stderr.fileno()).st_size > output_limit:
                    status = "output_limit"
                    break
                time.sleep(0.02)
        finally:
            if process.poll() is None:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            process.wait()
        if os.fstat(stdout.fileno()).st_size + os.fstat(stderr.fileno()).st_size > output_limit:
            status = "output_limit"
        stdout.seek(0)
        stderr.seek(0)
        out = stdout.read(output_limit).decode("utf-8", errors="replace")
        err = stderr.read(output_limit).decode("utf-8", errors="replace")
    if status == "complete" and process.returncode != 0:
        status = "error"
    return {"status": status, "returncode": process.returncode, "stdout": out,
            "stderr": err, "elapsed_seconds": round(time.monotonic() - started, 3)}


def prepare_home(home):
    config = home / ".ciphey" / "config.toml"
    config.parent.mkdir(parents=True, exist_ok=True)
    if not config.exists():
        config.write_text('verbose = 0\nhuman_checker_on = false\ntimeout = 2\n'
                          'top_results = false\napi_mode = false\nenhanced_detection = false\n'
                          '[colourscheme]\ninformational = "255,255,255"\n'
                          'warning = "255,255,255"\nsuccess = "255,255,255"\n'
                          'question = "255,255,255"\nstatement = "255,255,255"\n')


def parse_ciphey(result):
    if result["status"] != "complete":
        return {"status": result["status"]}
    if "panicked at" in result["stderr"]:
        return {"status": "error", "reason": "Ciphey worker panicked"}
    text = ANSI.sub("", result["stdout"])
    match = re.search(r"(?:^|\n)The plaintext is:\n(.*)\nthe decoders? used (?:is|are) ([^\n]+)\n?\Z", text, re.S)
    if match:
        steps = [s.strip() for s in match[2].split("→")]
        # Already-plaintext results use a placeholder rather than a real decoder.
        steps = [s for s in steps if s != "Default decoder"]
        if any(not ch.isprintable() and ch not in '\n\r\t' for ch in match[1]):
            return {'status':'rejected_candidate','reason':'Checker output contains non-text control bytes'}
        return {"status": "accepted_candidate", "text": match[1], "steps": steps,
                "validation": "Ciphey checker accepted; not human verified"}
    if "failed to decode" in text:
        return {"status": "not_found"}
    return {"status": "parse_error", "reason": "Unrecognised Ciphey output; inspect raw diagnostics"}


def decode(binary, value, *, home, cwd, seconds, regex=None):
    original=value
    peeled=[]
    # Decode canonical Base64 layers before the heuristic native search. Do not
    # irreversibly substitute a binary/ambiguous decode for the original input.
    for _ in range(8):
        if not re.fullmatch(r'[A-Za-z0-9+/]{8,}={0,2}',value) or len(value)%4:
            break
        try:
            decoded=base64.b64decode(value,validate=True)
            text=decoded.decode('utf-8')
            if base64.b64encode(decoded).decode()!=value or any(not ch.isprintable() and ch not in '\n\r\t' for ch in text):
                break
        except (ValueError,UnicodeError):
            break
        value=text;peeled.append('Base64')
    # Typed hash records, identifiers and opaque text are evidence, not useful
    # inputs to this release's Vigenere/substitution heuristics. Preserve them
    # for the shared router rather than provoking native panics or fake text.
    structured=(re.search(r'(?i)\b(?:md5|sha[-_]?\d+|ntlm)(?:_hash)?["\x27]?\s*[:=]',value)
                or value.startswith(('$2','$6$','$argon2','$y$','$5$','pbkdf2_'))
                or re.fullmatch(r'[a-fA-F0-9]{28,128}',value)
                or any(ord(ch)>126 or (ord(ch)<32 and ch not in '\n\r\t') for ch in value)
                or '_' in value or '{' in value or '}' in value)
    if structured:
        raw={'status':'complete','returncode':0,'stdout':'','stderr':'','elapsed_seconds':0,
             'execution_skipped':True,'reason':'Typed/opaque text retained for artifact routing',
             'deterministic_steps':peeled,'input_sha256':hashlib.sha256(original.encode()).hexdigest()}
        if regex and re.search(regex,value) and not any(not ch.isprintable() and ch not in '\n\r\t' for ch in value):
            return {'status':'accepted_candidate','text':value,'steps':peeled,'validation':'Configured regex matched; not human verified'},raw
        return {'status':'structured_text','reason':raw['reason']},raw
    prepare_home(home)
    env = dict(os.environ, HOME=str(home), XDG_CACHE_HOME=str(home / ".cache"), NO_COLOR="1")
    argv = [str(binary), "-d", "-c", str(max(1, int(seconds))), "--text=" + value]
    if regex:
        argv += ["-r", regex]
    raw = run_tool(argv, cwd=cwd, timeout=seconds + 0.5, env=env, output_limit=256_000)
    result = parse_ciphey(raw)
    raw['deterministic_steps']=peeled
    if result.get('steps') is not None:
        result['steps']=peeled+result['steps']
    # This release can accept through another checker even when -r does not
    # match. Enforce the caller's stopping condition at the wrapper boundary.
    if regex and result['status'] == 'accepted_candidate' and not re.search(regex, result['text']):
        result = dict(result, status='checker_mismatch', reason='Returned text does not match configured regex')
    return result, raw
