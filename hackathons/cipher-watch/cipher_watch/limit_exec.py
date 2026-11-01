"""Apply Linux process memory limits without using preexec_fn in a threaded parent."""
import os
import ctypes
import resource
import signal
import subprocess
import sys

resource.setrlimit(resource.RLIMIT_AS, (768 * 1024 * 1024, 768 * 1024 * 1024))
resource.setrlimit(resource.RLIMIT_FSIZE, (8 * 1024 * 1024, 8 * 1024 * 1024))
resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
def terminate(*_):
    os.killpg(os.getpgrp(),signal.SIGKILL)

signal.signal(signal.SIGUSR1,terminate)
signal.signal(signal.SIGTERM,terminate)
expected=int(sys.argv[1])
libc=ctypes.CDLL(None,use_errno=True)
if libc.prctl(1,signal.SIGUSR1,0,0,0)!=0:
    raise OSError(ctypes.get_errno(),'PR_SET_PDEATHSIG failed')
if os.getppid()!=expected:terminate()
# Retain a supervisor so owner death also stops native subprocess descendants.
child=subprocess.Popen(sys.argv[2:])
sys.exit(child.wait())
