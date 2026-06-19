#!/usr/bin/env python3
"""Check that TDD protocol schemas are extracted from SKILL.md."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "SKILL.md"
TEMPLATES = ROOT / "templates"
EXPECTED_TEMPLATES = {
  "tdd_start.yaml": [
    "tdd_start:",
    "task_type:",
    "protected_behavior:",
    "stable_boundary:",
    "first_test_to_write:",
    "expected_red_reason:",
    "current_contract_wrong:",
    "wrong_contract_plan:",
  ],
  "tdd_state.yaml": [
    "tdd_state:",
    "phase:",
    "command:",
    "exit_code:",
    "evidence:",
  ],
  "tdd_finish.yaml": [
    "tdd_finish:",
    "task_type:",
    "red_observed:",
    "green_reached:",
    "refactor_performed:",
    "tests_run:",
    "phase:",
    "command:",
    "exit_code:",
    "evidence:",
    "current_contract_wrong:",
    "wrong_contract_characterized:",
    "wrong_contract_fixed:",
    "residual_risk:",
  ],
}


def fail(message: str) -> int:
  print(f"ERROR: {message}", file=sys.stderr)
  return 1


def main() -> int:
  skill_text = SKILL.read_text(encoding="utf-8")

  for block_name in ["tdd_start", "tdd_state", "tdd_finish"]:
    if not re.search(rf"templates/{block_name}\.yaml", skill_text):
      return fail(f"SKILL.md must reference templates/{block_name}.yaml")
    if re.search(rf"```ya?ml\s*\n{block_name}:", skill_text):
      return fail(f"SKILL.md must not inline the {block_name} YAML schema")

  for filename, required_tokens in EXPECTED_TEMPLATES.items():
    path = TEMPLATES / filename
    if not path.exists():
      return fail(f"Missing template: {path.relative_to(ROOT)}")
    template_text = path.read_text(encoding="utf-8")
    for token in required_tokens:
      if token not in template_text:
        return fail(f"{filename} is missing {token}")

  print("Template extraction valid")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
