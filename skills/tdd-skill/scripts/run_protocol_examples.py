#!/usr/bin/env python3
"""Run protocol validator examples as a lightweight eval suite."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VALIDATOR = ROOT / "validate_tdd_protocol.py"
EXAMPLES = ROOT / "examples"


CASES = [
    ("valid_finish", "finish", EXAMPLES / "valid_finish.md", 0),
    ("structured_finish", "finish", EXAMPLES / "structured_finish.md", 0),
    ("greenfield_finish", "finish", EXAMPLES / "greenfield_finish.md", 0),
    ("missing_start", "before_edit", EXAMPLES / "missing_start.md", 1),
    ("vague_red", "state", EXAMPLES / "vague_red.md", 1),
]


def main() -> int:
    failures: list[str] = []

    for name, stage, input_path, expected in CASES:
        result = subprocess.run(
            [sys.executable, str(VALIDATOR), "--stage", stage, "--input", str(input_path)],
            text=True,
            capture_output=True,
        )
        ok = result.returncode == expected
        status = "PASS" if ok else "FAIL"
        print(f"{status} {name}: expected {expected}, got {result.returncode}")
        if not ok:
            if result.stdout:
                print(result.stdout.strip())
            if result.stderr:
                print(result.stderr.strip())
            failures.append(name)

    if failures:
        print("Failed cases: " + ", ".join(failures), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
