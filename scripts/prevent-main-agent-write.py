#!/usr/bin/env python3
"""Block main-agent writes while allowing registered worker/subagent sessions."""

from __future__ import annotations

import json
import os
import re
import shlex
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any


SUBAGENT_START_EVENTS = {"SubagentStart", "subagent_start", "subagentStart"}
SUBAGENT_STOP_EVENTS = {"SubagentStop", "subagent_stop", "subagentStop"}
PRE_TOOL_USE_EVENTS = {"PreToolUse", "pre_tool_use", "preToolUse", ""}
SHELL_TOOL_NAMES = {"Bash", "shell", "exec", "exec_command", "unified_exec"}
DIRECT_WRITE_TOOL_NAMES = {
  "Write",
  "Edit",
  "MultiEdit",
  "NotebookEdit",
  "apply_patch",
}
SUBAGENT_TOOL_NAMES = {
  "Task",
  "delegate_task",
  "SubagentStart",
  "subagent_start",
  "WorkerStart",
  "worker_start",
}
COMMAND_KEYS = ("command", "cmd")
SESSION_KEYS = ("session_id", "sessionId")
STATE_PATH_ENV = "DEVFLOW_MAIN_AGENT_WRITE_STATE"
STATE_PATH = Path(tempfile.gettempdir()) / f"devflow-main-agent-write-sessions-{os.getuid()}.json"
SHELL_WRITE_COMMANDS = {
  "chmod",
  "chown",
  "cp",
  "dd",
  "install",
  "ln",
  "mkdir",
  "mv",
  "patch",
  "perl",
  "python",
  "python3",
  "rm",
  "sed",
  "tee",
  "touch",
  "truncate",
}
GIT_WRITE_SUBCOMMANDS = {
  "add",
  "am",
  "apply",
  "cherry-pick",
  "clean",
  "commit",
  "merge",
  "mv",
  "pull",
  "rebase",
  "reset",
  "restore",
  "revert",
  "rm",
  "stash",
}
PACKAGE_MANAGERS = {"npm", "pnpm", "yarn", "bun", "pip", "pip3", "uv", "cargo", "go"}


@dataclass(frozen=True)
class BlockDecision:
  reason: str


def main() -> int:
  payload = _read_payload()
  if not isinstance(payload, dict):
    return 0

  event = _find_hook_event(payload)
  session_id = _find_session_id(payload)
  if event in SUBAGENT_START_EVENTS:
    return _handle_subagent_start(payload, session_id)
  if event in SUBAGENT_STOP_EVENTS:
    return _handle_subagent_stop(session_id)
  if event not in PRE_TOOL_USE_EVENTS:
    return 0

  tool_name = _find_tool_name(payload)
  if tool_name in SUBAGENT_TOOL_NAMES:
    return 0
  tool_input = _find_tool_input(payload) or {}
  decision = should_block_tool(tool_name, tool_input, session_id)
  if decision is None:
    return 0
  _write_block_message(decision)
  return 2


def should_block_tool(
  tool_name: str,
  tool_input: dict[str, Any],
  session_id: str | None,
) -> BlockDecision | None:
  write_reason = _write_reason_for_tool(tool_name, tool_input)
  if write_reason is None:
    return None
  if not session_id:
    return BlockDecision(
      f"{write_reason}，但 payload 缺少 session_id，无法证明这是 worker/subagent 写入"
    )
  if not is_registered_subagent_session(session_id):
    return BlockDecision(f"{write_reason}，当前 session `{session_id}` 未登记为 worker/subagent")
  return None


def is_registered_subagent_session(session_id: str) -> bool:
  return session_id in _load_state()


def _handle_subagent_start(payload: dict[str, Any], session_id: str | None) -> int:
  if not session_id:
    return 0
  agent_name = _find_agent_name(payload)
  state = _load_state()
  state[session_id] = {"agent": agent_name}
  _save_state(state)
  return 0


def _handle_subagent_stop(session_id: str | None) -> int:
  if not session_id:
    return 0
  state = _load_state()
  if session_id in state:
    state.pop(session_id, None)
    _save_state(state)
  return 0


def _write_reason_for_tool(tool_name: str, tool_input: dict[str, Any]) -> str | None:
  if tool_name in DIRECT_WRITE_TOOL_NAMES:
    return f"`{tool_name}` 是直接写入工具"
  if tool_name and tool_name not in SHELL_TOOL_NAMES:
    return None
  command = _find_command(tool_input)
  if not command:
    return None
  return _write_reason_for_command(command)


def _write_reason_for_command(command: str) -> str | None:
  for segment in _command_segments(command):
    normalized = _normalize_command_prefix(segment)
    if not normalized:
      continue
    if _is_test_command(normalized):
      continue
    if _has_shell_redirection(normalized):
      return "shell 重定向会写入文件"
    if normalized[0] == "git":
      reason = _git_write_reason(normalized)
      if reason is not None:
        return reason
      continue
    if normalized[0] in PACKAGE_MANAGERS and _package_command_writes(normalized):
      return f"`{normalized[0]} {' '.join(normalized[1:3])}` 可能修改依赖或锁文件"
    if normalized[0] in SHELL_WRITE_COMMANDS:
      return f"`{normalized[0]}` 是写入型 shell 命令"
  return None


def _read_payload() -> Any:
  try:
    raw = sys.stdin.read()
  except OSError:
    return None
  if not raw.strip():
    return None
  try:
    return json.loads(raw)
  except json.JSONDecodeError:
    return None


def _find_hook_event(payload: dict[str, Any]) -> str:
  value = payload.get("hook_event_name") or payload.get("hookEventName") or payload.get("event")
  return value if isinstance(value, str) else ""


def _find_tool_name(payload: dict[str, Any]) -> str:
  value = payload.get("tool_name") or payload.get("toolName") or payload.get("tool")
  return value if isinstance(value, str) else ""


def _find_tool_input(payload: dict[str, Any]) -> dict[str, Any] | None:
  value = payload.get("tool_input") or payload.get("toolInput")
  return value if isinstance(value, dict) else None


def _find_command(tool_input: dict[str, Any]) -> str | None:
  for key in COMMAND_KEYS:
    value = tool_input.get(key)
    if isinstance(value, str) and value.strip():
      return value
  return None


def _find_session_id(payload: dict[str, Any]) -> str | None:
  for key in SESSION_KEYS:
    value = payload.get(key)
    if isinstance(value, str) and value.strip():
      return value
  return None


def _find_agent_name(payload: dict[str, Any]) -> str:
  values = [
    payload.get("agent_type"),
    payload.get("agentType"),
    payload.get("agentName"),
    payload.get("agentDisplayName"),
  ]
  return " ".join(value for value in values if isinstance(value, str)).strip()


def _command_segments(command: str) -> list[list[str]]:
  try:
    lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|<>")
    lexer.whitespace_split = True
    tokens = list(lexer)
  except (TypeError, ValueError):
    tokens = command.split()
  segments: list[list[str]] = []
  current: list[str] = []
  for token in tokens:
    if token in {";", "&&", "||", "|"}:
      if current:
        segments.append(current)
        current = []
      continue
    current.append(token)
  if current:
    segments.append(current)
  return segments


def _normalize_command_prefix(tokens: list[str]) -> list[str]:
  normalized = list(tokens)
  while normalized and _is_env_assignment(normalized[0]):
    normalized.pop(0)
  while normalized and normalized[0] in {"command", "builtin", "exec", "env"}:
    normalized.pop(0)
  if normalized and normalized[0] == "rtk":
    normalized.pop(0)
    if normalized and normalized[0] == "proxy":
      normalized.pop(0)
  return normalized


def _is_env_assignment(token: str) -> bool:
  if "=" not in token:
    return False
  name, _value = token.split("=", 1)
  return bool(name) and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name) is not None


def _has_shell_redirection(tokens: list[str]) -> bool:
  return any(
    token in {">", ">>", "1>", "2>", "&>", "<>"} or token.startswith((">", ">>"))
    for token in tokens
  )


def _git_write_reason(tokens: list[str]) -> str | None:
  subcommand = _first_non_option(tokens[1:])
  if subcommand in GIT_WRITE_SUBCOMMANDS:
    return f"`git {subcommand}` 会修改工作区、索引或提交历史"
  return None


def _first_non_option(tokens: list[str]) -> str | None:
  index = 0
  while index < len(tokens):
    token = tokens[index]
    if token == "--":
      return tokens[index + 1] if index + 1 < len(tokens) else None
    if token.startswith("-"):
      index += 1
      continue
    return token
  return None


def _package_command_writes(tokens: list[str]) -> bool:
  command = _first_non_option(tokens[1:])
  if command is None:
    return False
  manager = tokens[0]
  if manager in {"npm", "pnpm", "yarn", "bun"}:
    return command in {
      "add",
      "build",
      "generate",
      "codegen",
      "install",
      "i",
      "remove",
      "rm",
      "run",
      "update",
      "upgrade",
    }
  if manager in {"pip", "pip3", "uv"}:
    return command in {"install", "add", "remove", "sync"}
  if manager == "cargo":
    return command in {"add", "remove", "update", "install"}
  if manager == "go":
    return command in {"get", "mod", "work"}
  return False


def _is_test_command(tokens: list[str]) -> bool:
  command = tokens[0]
  args = tokens[1:]
  if command in {"pytest", "tox", "nox"}:
    return True
  if command in {"npm", "pnpm", "yarn", "bun"}:
    subcommand = _first_non_option(args)
    if subcommand == "test":
      return True
    if subcommand == "run":
      script_name = _script_name_after_run(args)
      return script_name is not None and _is_test_like_script_name(script_name)
    return False
  if command in {"cargo", "go"}:
    return _first_non_option(args) == "test"
  if command in {"mvn", "gradle", "./gradlew"}:
    return any("test" in arg.lower() or "check" in arg.lower() for arg in args)
  if command in {"python", "python3"}:
    return _is_python_safe_test_command(args)
  return False


def _script_name_after_run(args: list[str]) -> str | None:
  run_index = next((index for index, token in enumerate(args) if token == "run"), None)
  if run_index is None:
    return None
  for token in args[run_index + 1 :]:
    if token == "--":
      continue
    if token.startswith("-"):
      continue
    return token
  return None


def _is_test_like_script_name(script_name: str) -> bool:
  normalized = script_name.lower()
  return any(marker in normalized for marker in ("test", "check", "lint", "typecheck"))


def _is_python_safe_test_command(args: list[str]) -> bool:
  filtered = _strip_python_runtime_options(args)
  if not filtered:
    return False
  if filtered[0] == "-m" and len(filtered) >= 2:
    return filtered[1] in {"pytest", "unittest", "py_compile", "json.tool"}
  script = Path(filtered[0]).name
  return script.startswith("test-") or script.startswith("test_")


def _strip_python_runtime_options(args: list[str]) -> list[str]:
  filtered = list(args)
  options_with_value = {"-c", "-m", "-W", "-X"}
  result: list[str] = []
  index = 0
  while index < len(filtered):
    token = filtered[index]
    if token == "-m":
      return filtered[index:]
    if token in {"-X", "-W"}:
      index += 2
      continue
    if token.startswith(("-X", "-W")) and len(token) > 2:
      index += 1
      continue
    if token == "-c" or token.startswith("-c"):
      return filtered[index:]
    if token.startswith("-"):
      index += 1
      continue
    result.extend(filtered[index:])
    return result
  return result


def _load_state() -> dict[str, Any]:
  path = _state_path()
  try:
    value = json.loads(path.read_text(encoding="utf-8"))
  except (OSError, json.JSONDecodeError):
    return {}
  return value if isinstance(value, dict) else {}


def _save_state(state: dict[str, Any]) -> None:
  path = _state_path()
  path.parent.mkdir(parents=True, exist_ok=True)
  tmp = path.with_suffix(f"{path.suffix}.tmp")
  tmp.write_text(json.dumps(state, ensure_ascii=False, sort_keys=True), encoding="utf-8")
  os.replace(tmp, path)


def _state_path() -> Path:
  configured = os.environ.get(STATE_PATH_ENV)
  return Path(configured) if configured else STATE_PATH


def _write_block_message(decision: BlockDecision) -> None:
  sys.stderr.write(
    "\n".join(
      [
        "DevFlow 已阻止主 Agent 直接执行写操作。",
        f"原因：{decision.reason}。",
        "",
        "主 Agent 只能协调、审查和验证；请通过 worker/subagent 完成代码写入。",
      ]
    )
  )
  sys.stderr.write("\n")


if __name__ == "__main__":
  raise SystemExit(main())
