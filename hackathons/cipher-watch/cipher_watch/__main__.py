"""Command-line entry point. No background service is installed automatically."""
import argparse
import fcntl
import logging
from pathlib import Path
import signal
import sys

from . import __version__
from .scanner import Scanner, Settings
from .extract_bridge import ENCODING_FUNCTIONS
from .watcher import FolderWatcher
from .tool_paths import tool_path

ROOT = Path(__file__).resolve().parent.parent


def positive(value):
    number = int(value)
    if number <= 0:
        raise argparse.ArgumentTypeError("Must be a positive integer")
    return number


def main():
    parser = argparse.ArgumentParser(description="Watch local files and save decoded candidates separately")
    parser.add_argument("--version", action="version", version=__version__)
    parser.add_argument("--watch", type=Path, required=True, help="Existing input folder (recursive)")
    parser.add_argument("--out", type=Path, required=True, help="Separate output folder; cannot nest with input")
    parser.add_argument("--once", action="store_true", help="Scan existing files and exit")
    parser.add_argument("--retry", action="store_true", help="Reprocess unchanged versions in --once mode")
    parser.add_argument("--polling", action="store_true", help="Use polling instead of native filesystem events")
    parser.add_argument("--regex", help="Optional Rust regex Ciphey plaintext must match, e.g. flag\\{")
    parser.add_argument("--encodings", default="b64,hex,bx,bu,pu", help="base64dump encoding IDs")
    parser.add_argument("--min-decoded-bytes", type=positive, default=8)
    parser.add_argument("--max-file-bytes", type=positive, default=2_000_000)
    parser.add_argument("--max-candidate-bytes", type=positive, default=16_384)
    parser.add_argument("--max-candidates", type=positive, default=64)
    parser.add_argument("--decode-seconds", type=positive, default=2)
    parser.add_argument("--file-seconds", type=positive, default=30)
    parser.add_argument("--reconcile-seconds", type=positive, default=30)
    parser.add_argument("--ignore", action="append", default=[], help="Glob on relative path; repeatable")
    parser.add_argument("--base64dump", type=Path, default=tool_path("base64dump.py"))
    parser.add_argument("--ciphey", type=Path, default=tool_path("ciphey"))
    args = parser.parse_args()
    if args.encodings == "all":
        args.encodings = ",".join(ENCODING_FUNCTIONS)
    if any(e not in ENCODING_FUNCTIONS for e in args.encodings.split(",")):
        parser.error("Unknown encoding ID; choose " + ",".join(ENCODING_FUNCTIONS) + " or all")
    if args.retry and not args.once:
        parser.error("--retry requires --once")
    if args.decode_seconds > args.file_seconds:
        parser.error("--decode-seconds cannot exceed --file-seconds")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    # Output is newly created with private permissions; reject overlap before creating anything.
    watch, out = args.watch.resolve(), args.out.resolve()
    if watch == out or out.is_relative_to(watch) or watch.is_relative_to(out):
        parser.error("Input and output must be separate, non-nested folders")
    if not watch.is_dir():
        parser.error("Watch folder does not exist")
    out.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (out / ".lock").open("a") as lock:
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            parser.error("Another cipher-watch process owns this output folder")
        settings = Settings(**{k: getattr(args, k) for k in Settings.__dataclass_fields__ if k != "ignore"},
                            ignore=tuple(args.ignore))
        try:
            scanner = Scanner(watch, out, args.base64dump, args.ciphey, settings)
        except ValueError as error:
            parser.error(str(error))
        try:
            if args.once:
                partial = False
                for path in scanner.files():
                    try:
                        report = scanner.scan(path, retry=args.retry)
                        if report:
                            print(report)
                        partial |= scanner.last_status in ("partial", "error", "skipped")
                    except (OSError, ValueError) as error:
                        logging.error("%s: %s", path, error)
                        partial = True
                return 2 if partial else 0
            watcher = FolderWatcher(scanner, reconcile=args.reconcile_seconds, polling=args.polling)
            for sig in (signal.SIGINT, signal.SIGTERM):
                signal.signal(sig, lambda *_: watcher.stop.set())
            watcher.run()
        finally:
            scanner.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
