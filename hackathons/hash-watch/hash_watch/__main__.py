"""Command-line watcher, queue worker, format resolution and laptop benchmarks."""
import argparse
from contextlib import ExitStack
import fcntl
import json
import logging
from pathlib import Path
import signal
import sys

from .benchmark import benchmark
from .detect import FORMATS
from .pipeline import Pipeline,Settings
from .store import atomic
from .tools import ROOT
from .watcher import FolderWatcher


def positive(value):
    n=int(value)
    if n<1:
        raise argparse.ArgumentTypeError('Must be positive')
    return n


def acquire(stack,path):
    path.parent.mkdir(parents=True,exist_ok=True)
    handle=stack.enter_context(path.open('a'))
    try:
        fcntl.flock(handle.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError:
        raise ValueError('Another worker owns '+str(path))


def main():
    parser=argparse.ArgumentParser(description='Local file hash discovery and checkpointed recovery queue')
    parser.add_argument('command',choices=['watch','scan','work','resolve','status','benchmark'])
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--watch',type=Path)
    parser.add_argument('--wordlist',type=Path,help='Deeper-plan seeds; default is John bundled password.lst')
    parser.add_argument('--benchmark-profile',type=Path,help='A compatible benchmark.json used for engine routing')
    parser.add_argument('--no-benchmark-profile',action='store_true')
    parser.add_argument('--raw-format',choices=['md5','sha1','sha224','sha256','sha384','sha512','ntlm'])
    for name in ['max-file-bytes','max-candidates','threads','quick-seconds','slice-seconds','batch-size']:
        parser.add_argument('--'+name,type=positive)
    parser.add_argument('--engine',choices=['auto','john','hashcat'])
    parser.add_argument('--backend',choices=['cpu','gpu'])
    parser.add_argument('--max-batches',type=positive,help='Work at most this many queue batches, then leave a checkpoint')
    parser.add_argument('--retry-errors',action='store_true',help='Requeue paused/error targets; offsets are retained')
    parser.add_argument('--scan-only',action='store_true',help='Enqueue without running quick attempts (scan command)')
    parser.add_argument('--polling',action='store_true')
    parser.add_argument('--reconcile-seconds',type=positive,default=30)
    parser.add_argument('--target',help='Target ID to resolve')
    parser.add_argument('--format',choices=list(FORMATS),dest='resolve_format')
    parser.add_argument('--repeats',type=positive,default=2)
    args=parser.parse_args()
    output=args.out.resolve()
    logging.basicConfig(level=logging.INFO,format='%(asctime)s %(levelname)s %(message)s')
    if args.command=='status':
        data=json.loads((output/'queue.json').read_text())
        counts={}
        for t in data['targets']:
            counts[t['status']]=counts.get(t['status'],0)+1
        print(json.dumps({'states':counts,'report':str(output/'index.html')},indent=2))
        return 0
    with ExitStack() as stack:
        try:
            if args.command=='benchmark':
                acquire(stack,ROOT/'.tmp/compute.lock')
                if (output/'benchmark.json').exists() or (output/'running.json').exists():
                    raise ValueError('Choose a new benchmark output directory to preserve previous measurements')
                result=benchmark(output,threads=args.threads or 4,repeats=args.repeats)
                print(json.dumps(result['choices'],indent=2))
                return 0
            previous={}
            configfile=output/'config.json'
            if configfile.exists():
                previous=json.loads(configfile.read_text())
            watch=(args.watch or Path(previous['watch']) if previous else args.watch)
            if watch is None:
                raise ValueError('--watch is required for a new queue')
            watch=watch.resolve()
            if watch==output or output.is_relative_to(watch) or watch.is_relative_to(output):
                raise ValueError('Input and output must be separate, non-nested folders')
            acquire(stack,output/'.lock')
            if args.command in ('watch','work') or (args.command=='scan' and not args.scan_only):
                acquire(stack,ROOT/'.tmp/compute.lock')
            values=previous.get('settings',{})
            for name in Settings.__dataclass_fields__:
                value=getattr(args,name)
                if value is not None:
                    values[name]=value
            settings=Settings(**values)
            wordlist=args.wordlist or previous.get('wordlist')
            profile=args.benchmark_profile or previous.get('benchmark_profile')
            if args.no_benchmark_profile:
                profile=None
            pipeline=Pipeline(watch,output,settings,wordlist=wordlist,benchmark_file=profile)
            stack.callback(pipeline.close)
            atomic(configfile,json.dumps({'watch':str(watch),'settings':values,
                       'wordlist':str(Path(wordlist).resolve()) if wordlist else None,
                       'benchmark_profile':str(Path(profile).resolve()) if profile else None},indent=2)+'\n')
            for signum in (signal.SIGINT,signal.SIGTERM):
                signal.signal(signum,lambda *_:pipeline.stop.set())
            if args.command=='resolve':
                if not args.target or not args.resolve_format:
                    raise ValueError('resolve needs --target and --format')
                print(pipeline.resolve(args.target,args.resolve_format))
            elif args.command=='watch':
                FolderWatcher(pipeline,reconcile=args.reconcile_seconds,polling=args.polling).run()
            else:
                if args.command=='scan':
                    for path in pipeline.files():
                        if pipeline.stop.is_set():
                            break
                        try:
                            report=pipeline.scan(path)
                            if report:
                                print(report,flush=True)
                        except OSError as error:
                            logging.error('%s: %s',path,error)
                if args.retry_errors:
                    pipeline.resume()
                completed=0
                if not args.scan_only:
                    while not pipeline.stop.is_set() and (args.max_batches is None or completed<args.max_batches):
                        if not pipeline.work_one(quick_only=args.command=='scan'):
                            break
                        completed+=1
                print('Report:',output/'index.html')
            return 0
        except (ValueError,OSError,KeyError) as error:
            parser.error(str(error))


if __name__=='__main__':
    sys.exit(main())
