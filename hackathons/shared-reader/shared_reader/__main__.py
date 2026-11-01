import argparse
from contextlib import ExitStack
import fcntl
import json
import logging
from pathlib import Path
import signal
from . import ROOT
from .project import Limits
from .watch import Environment


def positive(value):
    n=int(value)
    if n<=0:
        raise argparse.ArgumentTypeError('Must be positive')
    return n


def main():
    parser=argparse.ArgumentParser(description='Continuously route project artifacts through Cipher Watch and John/Hashcat.')
    parser.add_argument('command',choices=['watch','once','resolve'])
    parser.add_argument('--root',type=Path,default=Path.home()/'Documents/Hackathon')
    parser.add_argument('--project',help='Optional single project name; otherwise all direct project folders')
    parser.add_argument('--projects-catalog',type=Path,action='append',default=[],help='Managed Hub catalog to enroll, repeatable; one worker still owns all roots')
    parser.add_argument('--wordlist',type=Path)
    parser.add_argument('--benchmark-profile',type=Path)
    parser.add_argument('--regex',help='Optional Python regex enforced on Ciphey checker results')
    for name in ('max-file-bytes','max-depth','max-nodes','max-expanded-bytes','max-members','decode-seconds','file-seconds','slice-seconds','threads','batch-size'):
        parser.add_argument('--'+name,type=positive)
    parser.add_argument('--reconcile-seconds',type=positive,default=30)
    parser.add_argument('--max-steps',type=positive,default=1000)
    parser.add_argument('--polling',action='store_true')
    parser.add_argument('--target')
    parser.add_argument('--format',choices=['md5','sha1','sha224','sha256','sha384','sha512','ntlm'])
    args=parser.parse_args()
    limits=Limits(**{k:getattr(args,k) for k in Limits.__dataclass_fields__ if getattr(args,k) is not None})
    logging.basicConfig(level=logging.INFO,format='%(asctime)s %(levelname)s %(message)s')
    with ExitStack() as stack:
        lockpath=ROOT/'hash-watch/.tmp/compute.lock'
        lockpath.parent.mkdir(exist_ok=True)
        lock=stack.enter_context(lockpath.open('a'))
        try:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:
            parser.exit(2,'Another hash worker/benchmark/shared-reader instance owns the compute lock.\n')
        environment=Environment(args.root,project=args.project,limits=limits,wordlist=args.wordlist,benchmark=args.benchmark_profile,reconcile=args.reconcile_seconds,polling=args.polling,projects_catalogs=args.projects_catalog)
        stack.callback(environment.close)
        def stop(*_):
            environment.stop.set()
            for project in environment.projects.values():
                project.hashes.stop.set()
        signal.signal(signal.SIGINT,stop);signal.signal(signal.SIGTERM,stop)
        if args.command=='resolve':
            if not args.project or not args.target or not args.format:
                parser.error('resolve requires --project, --target and --format')
            project=environment.project_for(environment.root/args.project)
            if not project:
                parser.exit(2,'Project is unavailable.\n')
            identifier=project.hashes.resolve(args.target,args.format)
            project.forward_recoveries()
            print(json.dumps({'resolved_to':identifier}))
            return 0
        if args.command=='watch':
            environment.watch()
            return 0
        finished=environment.once(args.max_steps)
        print(json.dumps({'projects':list(environment.projects),'blocked':environment.blocked,'drained':finished}))
        return 0 if finished and not environment.blocked else 2

if __name__=='__main__':
    raise SystemExit(main())
