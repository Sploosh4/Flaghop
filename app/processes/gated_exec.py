"""A child cannot execute a tool until its parent durably records its identity."""

import os
import sys


def main():
    descriptor = int(sys.argv[1])
    try:
        permitted = os.read(descriptor, 1) == b"G"
    finally:
        os.close(descriptor)
    if not permitted:
        return 125
    os.execvpe(sys.argv[2], sys.argv[2:], os.environ)


if __name__ == "__main__":
    sys.exit(main())
