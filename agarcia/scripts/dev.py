import argparse
import concurrent.futures
from functools import partial
import itertools
import subprocess
import sys

def run_cmd(cmd: str, name: str):
    result = subprocess.run(cmd, shell=True)

    prefixed_output = '\n'.join([f'[{name}] {line}' for line in result.stdout.splitlines()])

    sys.stdout.write(prefixed_output)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="Concurrently", description="Run shell commands concurrently"
    )

    parser.add_argument("commands", nargs="+")
    parser.add_argument("--names", nargs="*", default=[])
    args = parser.parse_args()

    if len(args.names) < len(args.commands):
        diff = len(args.names) - len(args.commands)
        args.names += args.commands[diff:]


    with concurrent.futures.ThreadPoolExecutor() as executor:
        try:
            executor.map(run_cmd, args.commands, args.names)

        except KeyboardInterrupt:
            executor.shutdown(wait=False)
