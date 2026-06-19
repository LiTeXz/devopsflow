#!/usr/bin/env python3
"""Validate TDD protocol YAML blocks in a transcript or message file."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

TASK_TYPES = {"greenfield_feature", "bug_fix", "pure_refactor", "characterize_then_fix"}
WRONG_CONTRACT_PLANS = {"none", "characterize_only", "fix_after_characterization"}
PHASES = {"test_written", "red_observed", "green_reached", "refactor_done"}
PHASE_ORDER = ["test_written", "red_observed", "green_reached", "refactor_done"]


def load_text(path: str | None) -> str:
  if path:
    return Path(path).read_text(encoding="utf-8")
  return sys.stdin.read()


def parse_scalar(value: str) -> Any:
  value = value.strip()
  if value == "true":
    return True
  if value == "false":
    return False
  if value in {"null", "~"}:
    return None
  if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
    return value[1:-1]
  return value


def parse_protocol_yaml(candidate: str) -> dict[str, Any] | None:
  lines = candidate.splitlines()
  root: dict[str, Any] = {}
  current_key: str | None = None
  current_map: dict[str, Any] | None = None
  current_list_key: str | None = None
  current_list_item: dict[str, Any] | None = None

  for raw in lines:
    if not raw.strip() or raw.lstrip().startswith("#"):
      continue

    indent = len(raw) - len(raw.lstrip(" "))
    line = raw.strip()

    if indent == 0:
      if not line.endswith(":"):
        return None
      current_key = line[:-1]
      current_map = {}
      root[current_key] = current_map
      current_list_key = None
      current_list_item = None
      continue

    if current_map is None:
      return None

    if indent == 2:
      if ":" not in line:
        return None
      key, value = line.split(":", 1)
      key = key.strip()
      value = value.strip()
      if value:
        current_map[key] = parse_scalar(value)
        current_list_key = None
        current_list_item = None
      else:
        current_map[key] = []
        current_list_key = key
        current_list_item = None
      continue

    if indent == 4 and current_list_key:
      if not line.startswith("- "):
        return None
      item = line[2:]
      if ":" in item:
        key, value = item.split(":", 1)
        current_list_item = {key.strip(): parse_scalar(value.strip())}
        current_map[current_list_key].append(current_list_item)
      else:
        current_list_item = None
        current_map[current_list_key].append(parse_scalar(item))
      continue

    if indent == 6 and current_list_key and current_list_item is not None:
      if ":" not in line:
        return None
      key, value = line.split(":", 1)
      current_list_item[key.strip()] = parse_scalar(value.strip())
      continue

    return None

  return root or None


def extract_yaml_documents(text: str) -> list[dict[str, Any]]:
  docs: list[dict[str, Any]] = []

  fenced = re.findall(r"```(?:yaml|yml)\s*\n(.*?)```", text, flags=re.IGNORECASE | re.DOTALL)
  candidates = fenced if fenced else [text]

  for candidate in candidates:
    doc = parse_protocol_yaml(candidate)
    if isinstance(doc, dict):
      docs.append(doc)

  return docs


def collect_blocks(docs: list[dict[str, Any]]) -> tuple[dict[str, Any] | None, list[dict[str, Any]], dict[str, Any] | None]:
  start = None
  states: list[dict[str, Any]] = []
  finish = None

  for doc in docs:
    if isinstance(doc.get("tdd_start"), dict):
      start = doc["tdd_start"]
    if isinstance(doc.get("tdd_state"), dict):
      states.append(doc["tdd_state"])
    if isinstance(doc.get("tdd_finish"), dict):
      finish = doc["tdd_finish"]

  return start, states, finish


def is_blank(value: Any) -> bool:
  return value is None or (isinstance(value, str) and not value.strip())


def require_fields(block: dict[str, Any], fields: list[str], prefix: str, errors: list[str]) -> None:
  for field in fields:
    if field not in block or is_blank(block[field]):
      errors.append(f"{prefix}.{field} is required")


def validate_start(start: dict[str, Any] | None) -> list[str]:
  errors: list[str] = []
  if start is None:
    return ["tdd_start is required before editing production code"]

  require_fields(
    start,
    [
      "task_type",
      "protected_behavior",
      "stable_boundary",
      "first_test_to_write",
      "expected_red_reason",
      "current_contract_wrong",
      "wrong_contract_plan",
    ],
    "tdd_start",
    errors,
  )

  task_type = start.get("task_type")
  if task_type not in TASK_TYPES:
    errors.append(f"tdd_start.task_type must be one of {sorted(TASK_TYPES)}")

  plan = start.get("wrong_contract_plan")
  if plan not in WRONG_CONTRACT_PLANS:
    errors.append(f"tdd_start.wrong_contract_plan must be one of {sorted(WRONG_CONTRACT_PLANS)}")

  if start.get("current_contract_wrong") is True and plan == "none":
    errors.append("tdd_start.wrong_contract_plan cannot be none when current_contract_wrong is true")

  if task_type == "characterize_then_fix" and plan != "fix_after_characterization":
    errors.append("characterize_then_fix requires wrong_contract_plan: fix_after_characterization")

  return errors


def validate_states(states: list[dict[str, Any]], require_red: bool = False) -> list[str]:
  errors: list[str] = []
  observed: list[str] = []

  for index, state in enumerate(states, start=1):
    phase = state.get("phase")
    evidence = state.get("evidence")

    if phase not in PHASES:
      errors.append(f"tdd_state[{index}].phase must be one of {sorted(PHASES)}")
      continue
    if is_blank(evidence):
      errors.append(f"tdd_state[{index}].evidence is required")

    phase_position = PHASE_ORDER.index(phase)
    missing_previous = [p for p in PHASE_ORDER[:phase_position] if p not in observed]
    if missing_previous:
      errors.append(f"tdd_state[{index}].phase {phase} is out of order; missing {missing_previous}")

    observed.append(phase)

    if phase == "red_observed":
      lowered = str(evidence).lower()
      if not any(token in lowered for token in ["fail", "red", "失败", "红", "expected", "预期", "reason", "原因"]):
        errors.append("red_observed evidence should explain the failure reason and target risk")
      if state.get("exit_code") in {0, "0"}:
        errors.append("red_observed exit_code should be non-zero when recorded")
      if is_blank(state.get("command")):
        errors.append("red_observed command is required, or use command: none with explanation in evidence")
    if phase == "green_reached":
      if state.get("exit_code") not in {0, "0", None}:
        errors.append("green_reached exit_code should be 0 when recorded")
      if is_blank(state.get("command")):
        errors.append("green_reached command is required, or use command: none with explanation in evidence")

  if require_red and "red_observed" not in observed:
    errors.append("red_observed state is required")

  return errors


def test_run_phase(item: Any) -> str | None:
  if isinstance(item, dict):
    phase = item.get("phase")
    return str(phase) if phase is not None else None
  text = str(item).lower()
  if any(token in text for token in ["red", "fail", "failed", "失败", "红"]):
    return "red"
  if any(token in text for token in ["green", "pass", "passed", "通过", "绿", "final"]):
    return "green"
  return None


def validate_tests_run(tests_run: Any) -> tuple[list[str], set[str]]:
  errors: list[str] = []
  phases: set[str] = set()

  if not isinstance(tests_run, list) or not tests_run:
    return ["tdd_finish.tests_run must be a non-empty list"], phases

  for index, item in enumerate(tests_run, start=1):
    if is_blank(item):
      errors.append(f"tdd_finish.tests_run[{index}] must not be blank")
      continue

    phase = test_run_phase(item)
    if phase:
      phases.add(phase)

    if isinstance(item, dict):
      command = item.get("command")
      evidence = item.get("evidence")
      exit_code = item.get("exit_code")
      if phase not in {"red", "green", "final"}:
        errors.append(f"tdd_finish.tests_run[{index}].phase must be red, green, or final")
      if is_blank(command):
        errors.append(f"tdd_finish.tests_run[{index}].command is required")
      if is_blank(evidence):
        errors.append(f"tdd_finish.tests_run[{index}].evidence is required")
      if phase == "red" and exit_code in {0, "0"}:
        errors.append(f"tdd_finish.tests_run[{index}].exit_code should be non-zero for red")
      if phase in {"green", "final"} and exit_code not in {0, "0", None}:
        errors.append(f"tdd_finish.tests_run[{index}].exit_code should be 0 for green/final")
    else:
      lowered = str(item).lower()
      if phase is None:
        errors.append(
          f"tdd_finish.tests_run[{index}] should include a red/green/final phase hint or use a structured entry"
        )
      if not any(token in lowered for token in ["test", "pytest", "cargo", "mvn", "gradle", "npm", "pnpm", "go test", "passed", "failed", "通过", "失败"]):
        errors.append(
          f"tdd_finish.tests_run[{index}] should include a command, test name, or concrete result"
        )

  return errors, phases


def validate_finish(finish: dict[str, Any] | None) -> list[str]:
  errors: list[str] = []
  if finish is None:
    return ["tdd_finish is required before reporting completion"]

  require_fields(
    finish,
    [
      "task_type",
      "red_observed",
      "green_reached",
      "refactor_performed",
      "tests_run",
      "current_contract_wrong",
      "wrong_contract_characterized",
      "wrong_contract_fixed",
      "residual_risk",
    ],
    "tdd_finish",
    errors,
  )

  task_type = finish.get("task_type")
  if task_type not in TASK_TYPES:
    errors.append(f"tdd_finish.task_type must be one of {sorted(TASK_TYPES)}")

  if finish.get("red_observed") is not True:
    errors.append("tdd_finish.red_observed must be true")
  if finish.get("green_reached") is not True:
    errors.append("tdd_finish.green_reached must be true")

  test_errors, test_phases = validate_tests_run(finish.get("tests_run"))
  errors.extend(test_errors)
  if finish.get("red_observed") is True and "red" not in test_phases:
    errors.append("tdd_finish.tests_run should include red phase evidence")
  if finish.get("green_reached") is True and not ({"green", "final"} & test_phases):
    errors.append("tdd_finish.tests_run should include green or final phase evidence")

  if finish.get("current_contract_wrong") is True and finish.get("wrong_contract_characterized") is not True:
    errors.append("wrong current contracts must be characterized before completion")

  if task_type == "characterize_then_fix" and finish.get("wrong_contract_fixed") is not True:
    errors.append("characterize_then_fix requires tdd_finish.wrong_contract_fixed: true, or the task is not complete")

  return errors


def validate(stage: str, text: str) -> list[str]:
  docs = extract_yaml_documents(text)
  start, states, finish = collect_blocks(docs)

  if stage == "before_edit":
    return validate_start(start)
  if stage == "state":
    return validate_start(start) + validate_states(states)
  if stage == "finish":
    return validate_start(start) + validate_states(states, require_red=True) + validate_finish(finish)
  raise ValueError(f"Unknown stage: {stage}")


def main() -> int:
  parser = argparse.ArgumentParser(description="Validate pure TDD protocol YAML blocks.")
  parser.add_argument("--stage", choices=["before_edit", "state", "finish"], required=True)
  parser.add_argument("--input", help="Transcript or message file. Reads stdin when omitted.")
  args = parser.parse_args()

  errors = validate(args.stage, load_text(args.input))
  if errors:
    for error in errors:
      print(f"ERROR: {error}", file=sys.stderr)
    return 1

  print("TDD protocol valid")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
