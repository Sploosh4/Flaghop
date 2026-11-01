"""Linux child supervisor: stop the entire compute group if its owner disappears."""
import ctypes
import os
import resource
import signal
import subprocess
import sys


def terminate(*_):
    os.killpg(os.getpgrp(), signal.SIGKILL)


signal.signal(signal.SIGUSR1,terminate)
signal.signal(signal.SIGTERM,terminate)
signal.signal(signal.SIGINT,terminate)
expected=int(sys.argv[1])
libc=ctypes.CDLL(None,use_errno=True)
if libc.prctl(1,signal.SIGUSR1,0,0,0)!=0:
    raise OSError(ctypes.get_errno(),'PR_SET_PDEATHSIG failed')
if os.getppid()!=expected:
    terminate()
resource.setrlimit(resource.RLIMIT_CORE,(0,0))
resource.setrlimit(resource.RLIMIT_FSIZE,(64*1024*1024,64*1024*1024))
os.nice(5)
child=subprocess.Popen(sys.argv[2:])
sys.exit(child.wait())
