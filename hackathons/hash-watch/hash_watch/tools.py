"""Private tool environment and bounded, cancellable subprocess execution."""
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / '.tools'
JOHN = TOOLS / 'john/run/john'
HASHCAT = TOOLS / 'hashcat/hashcat'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def environment(home, threads=4, backend='cpu'):
    home = Path(home).resolve()
    home.mkdir(parents=True, exist_ok=True)
    sysroot = TOOLS / 'sysroot'
    cache=ROOT/'.cache/compute'
    cache.mkdir(parents=True,exist_ok=True)
    pocl_cache=ROOT/'.cache/pocl'
    pocl_cache.mkdir(parents=True,exist_ok=True)
    env = dict(os.environ)
    env.update(HOME=str(home), XDG_CACHE_HOME=str(cache), POCL_CACHE_DIR=str(pocl_cache), MESA_SHADER_CACHE_MAX_SIZE='128M', XDG_DATA_HOME=str(home / 'data'),
               OMP_NUM_THREADS=str(threads), POCL_MAX_PTHREAD_COUNT=str(threads),
               POCL_CPU_MAX_CU_COUNT=str(threads), POCL_MEMORY_LIMIT='4',
               LD_LIBRARY_PATH=str(sysroot / 'usr/lib/x86_64-linux-gnu'),
               OCL_ICD_VENDORS=str(TOOLS / ('vendors-gpu' if backend == 'gpu' else 'vendors-cpu')),
               RUSTICL_ENABLE='radeonsi',
               HASH_WATCH_OPENCL_HEADERS=str(sysroot / 'usr/lib/llvm-21/lib/clang/21/include'),
               POCL_PATH_CLANG=str(sysroot / 'usr/bin/clang-18'),
               POCL_PATH_LLVM_SPIRV=str(sysroot / 'usr/bin/llvm-spirv-18'),
               POCL_DEVICES='pthread',
               NO_COLOR='1')
    return env


def run(argv, *, cwd, seconds=30, env=None, stop=None, limit=2_000_000):
    if env and str(env.get('OCL_ICD_VENDORS','')).endswith('vendors-gpu'):
        link = Path(cwd) / '.clc'
        if not link.exists():
            link.symlink_to(TOOLS / 'sysroot/usr/lib/clc', target_is_directory=True)
    start = time.monotonic()
    status = 'complete'
    with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
        guard=Path(__file__).with_name('process_guard.py')
        proc = subprocess.Popen([sys.executable,str(guard),str(os.getpid()),*[str(x) for x in argv]], cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                stdout=out, stderr=err, start_new_session=True)
        try:
            while proc.poll() is None:
                if stop is not None and stop.is_set():
                    status = 'interrupted'
                    break
                if time.monotonic() - start >= seconds:
                    status = 'timeout'
                    break
                if os.fstat(out.fileno()).st_size + os.fstat(err.fileno()).st_size > limit:
                    status = 'output_limit'
                    break
                time.sleep(0.03)
        finally:
            if proc.poll() is None:
                try:
                    os.killpg(proc.pid, signal.SIGTERM)
                    proc.wait(timeout=1)
                except subprocess.TimeoutExpired:
                    os.killpg(proc.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            proc.wait()
        if os.fstat(out.fileno()).st_size + os.fstat(err.fileno()).st_size > limit:
            status = 'output_limit'
        out.seek(0)
        err.seek(0)
        stdout = out.read(limit).decode('utf-8', errors='replace')
        stderr = err.read(limit).decode('utf-8', errors='replace')
    return {'status': status, 'returncode': proc.returncode, 'stdout': stdout, 'stderr': stderr,
            'seconds': round(time.monotonic() - start, 4), 'argv': [str(x) for x in argv]}


def save_raw(folder, prefix, result):
    folder.mkdir(parents=True, exist_ok=True)
    for stream in ('stdout', 'stderr'):
        (folder / (prefix + '.' + stream + '.txt')).write_text(result[stream])
    (folder / (prefix + '.json')).write_text(json.dumps({k:v for k,v in result.items() if k not in ('stdout','stderr')},indent=2)+'\n')


def fingerprints():
    """Include the shared core/plugins and private compute runtimes, not just launchers."""
    modules=sorted((TOOLS/'hashcat/modules').glob('*.so'))
    result={'john':digest(JOHN.read_bytes()), 'hashcat':digest(HASHCAT.read_bytes()),
            'hashcat_core':digest((TOOLS/'hashcat/libhashcat.so.8').read_bytes()),
            'hashcat_modules':digest(b''.join(p.name.encode()+bytes.fromhex(digest(p.read_bytes())) for p in modules))}
    for name,path in [('pocl',TOOLS/'sysroot/usr/lib/x86_64-linux-gnu/libpocl.so.2'),
                      ('rusticl',TOOLS/'sysroot/usr/lib/x86_64-linux-gnu/libRusticlOpenCL-relocated.so')]:
        result[name]=digest(path.read_bytes()) if path.exists() else None
    return result
