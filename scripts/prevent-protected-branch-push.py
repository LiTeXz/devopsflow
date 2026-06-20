#!/usr/bin/env python3
"""Block all Git push commands and protected-branch writes.

The hook keeps integration branches clean in three layers:

* block sessions that start directly on a protected branch;
* block write-capable tool calls while the current branch is protected.
* block every Git push attempt, including pushes to topic branches.

Proxy wrappers are escalated before normal command analysis because they can
indicate an agent is trying to route around an active hook or permission policy.
"""

from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import sys
from dataclasses import dataclass
from typing import Any


PROTECTED_BRANCHES = {"main", "dev", "develop", "devlop"}
SESSION_HOOK_NAMES = {"SessionStart", "session_start", "sessionStart"}
SHELL_TOOL_NAMES = {"Bash", "shell", "exec", "exec_command", "unified_exec"}
DIRECT_WRITE_TOOL_NAMES = {
  "Write",
  "Edit",
  "MultiEdit",
  "NotebookEdit",
  "apply_patch",
}
COMMAND_KEYS = ("command", "cmd")
GIT_GLOBAL_OPTIONS_WITH_VALUE = {"-C", "-c", "--git-dir", "--work-tree", "--namespace"}
GIT_GLOBAL_OPTIONS_WITH_OPTIONAL_VALUE = {"--config-env"}
SHELL_WRITE_COMMANDS = {
  "apply_patch",
  "chmod",
  "chown",
  "cp",
  "dd",
  "install",
  "ln",
  "mkdir",
  "mv",
  "patch",
  "rm",
  "tee",
  "touch",
  "truncate",
}
PACKAGE_MANAGERS = {"npm", "pnpm", "yarn", "bun", "pip", "pip3", "uv", "cargo", "go"}
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
SAFE_BRANCH_ESCAPE = {
  ("git", "switch"),
  ("git", "checkout"),
}


@dataclass(frozen=True)
class BlockDecision:
  branch: str
  reason: str
  action: str = "write"


def main() -> int:
  payload = _read_payload()
  if not isinstance(payload, dict):
    return 0
  cwd = _find_workdir(payload, _find_tool_input(payload) or {})
  hook_event = _find_hook_event(payload)
  if hook_event in SESSION_HOOK_NAMES:
    decision = should_block_session_start(cwd)
    if decision is None:
      return 0
    _write_block_message(decision)
    return 2
  tool_name = _find_tool_name(payload)
  if tool_name and tool_name not in SHELL_TOOL_NAMES | DIRECT_WRITE_TOOL_NAMES:
    return 0
  tool_input = _find_tool_input(payload)
  decision = should_block_tool(tool_name, tool_input or {}, cwd)
  if decision is None:
    return 0
  _write_block_message(decision)
  return 2


def should_block_session_start(cwd: str) -> BlockDecision | None:
  current_branch = _current_branch(cwd)
  if current_branch in PROTECTED_BRANCHES:
    return BlockDecision(
      current_branch,
      "当前会话启动在保护分支上；请先切到新的工作分支再让 Agent 修改代码",
      "session",
    )
  return None


def should_block_tool(tool_name: str, tool_input: dict[str, Any], cwd: str) -> BlockDecision | None:
  if tool_name in DIRECT_WRITE_TOOL_NAMES:
    return _block_current_branch_write(cwd, f"`{tool_name}` 是直接写入工具")
  command = _find_command(tool_input)
  if not command:
    return None
  return should_block(command, cwd)


def should_block(command: str, cwd: str) -> BlockDecision | None:
  for segment in _command_segments(command):
    proxy_decision = _proxy_escalation_decision(segment)
    if proxy_decision is not None:
      return proxy_decision
    normalized = _normalize_command_prefix(segment)
    decision = _analyze_git_push(normalized)
    if decision is not None:
      return decision
    decision = _analyze_shell_write(normalized, cwd)
    if decision is not None:
      return decision
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


def _find_tool_name(payload: dict[str, Any]) -> str:
  value = payload.get("tool_name") or payload.get("toolName") or payload.get("tool")
  return value if isinstance(value, str) else ""


def _find_hook_event(payload: dict[str, Any]) -> str:
  value = payload.get("hook_event_name") or payload.get("hookEventName") or payload.get("event")
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


def _find_workdir(payload: dict[str, Any], tool_input: dict[str, Any]) -> str:
  for value in (tool_input.get("workdir"), payload.get("cwd")):
    if isinstance(value, str) and value.strip():
      return value
  return os.getcwd()


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
  normalized = _strip_launcher_prefix(tokens)
  if normalized and normalized[0] == "rtk":
    normalized.pop(0)
    if normalized and normalized[0] == "proxy":
      normalized.pop(0)
  return normalized


def _proxy_escalation_decision(tokens: list[str]) -> BlockDecision | None:
  normalized = _strip_launcher_prefix(tokens)
  if normalized and normalized[0] == "proxy":
    return BlockDecision(
      "*",
      "二级警告：检测到 `proxy` 代理执行，疑似在尝试绕过既有权限或 hook 限制",
      "escalation",
    )
  if len(normalized) >= 2 and normalized[0] == "rtk" and normalized[1] == "proxy":
    return BlockDecision(
      "*",
      "二级警告：检测到 `rtk proxy` 代理执行，疑似在尝试绕过既有权限或 hook 限制",
      "escalation",
    )
  return None


def _strip_launcher_prefix(tokens: list[str]) -> list[str]:
  normalized = list(tokens)
  changed = True
  while changed:
    changed = False
    while normalized and _is_env_assignment(normalized[0]):
      normalized.pop(0)
      changed = True
    while normalized and normalized[0] in {"command", "builtin", "exec", "env"}:
      normalized.pop(0)
      changed = True
  return normalized


def _is_env_assignment(token: str) -> bool:
  if "=" not in token:
    return False
  name, _value = token.split("=", 1)
  return bool(name) and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name) is not None


def _analyze_git_push(tokens: list[str]) -> BlockDecision | None:
  if not tokens or tokens[0] != "git":
    return None
  subcommand = _git_subcommand(tokens[1:])
  if subcommand == "push":
    return BlockDecision("*", "`git push` 已被全场拦截；Agent 不允许执行任何推送")
  return None


def _git_subcommand(args: list[str]) -> str | None:
  index = 0
  while index < len(args):
    token = args[index]
    if token == "--":
      return args[index + 1] if index + 1 < len(args) else None
    if token in GIT_GLOBAL_OPTIONS_WITH_VALUE:
      index += 2
      continue
    if any(token.startswith(f"{option}=") for option in GIT_GLOBAL_OPTIONS_WITH_VALUE):
      index += 1
      continue
    if token in GIT_GLOBAL_OPTIONS_WITH_OPTIONAL_VALUE:
      index += 2
      continue
    if token.startswith("--") and "=" in token:
      index += 1
      continue
    if token.startswith("-"):
      index += 1
      continue
    return token
  return None


def _analyze_shell_write(tokens: list[str], cwd: str) -> BlockDecision | None:
  if not tokens:
    return None
  if _is_safe_branch_escape(tokens):
    return None
  if _has_shell_redirection(tokens):
    return _block_current_branch_write(cwd, "shell 重定向会写入文件")
  if tokens[0] == "git":
    return _analyze_git_write(tokens, cwd)
  if tokens[0] in PACKAGE_MANAGERS and _package_command_writes(tokens):
    return _block_current_branch_write(cwd, f"`{tokens[0]} {' '.join(tokens[1:3])}` 可能修改依赖或锁文件")
  if tokens[0] == "sed":
    reason = _sed_write_reason(tokens)
    if reason is not None:
      return _block_current_branch_write(cwd, reason)
    return None
  if tokens[0] in {"python", "python3"}:
    reason = _python_write_reason(tokens)
    if reason is not None:
      return _block_current_branch_write(cwd, reason)
    return None
  if tokens[0] in SHELL_WRITE_COMMANDS:
    return _block_current_branch_write(cwd, f"`{tokens[0]}` 是写入型 shell 命令")
  return None


def _is_safe_branch_escape(tokens: list[str]) -> bool:
  if len(tokens) < 3 or tuple(tokens[:2]) not in SAFE_BRANCH_ESCAPE:
    return False
  return tokens[2] in {"-b", "-B", "-c", "-C", "--create", "--force-create"}


def _has_shell_redirection(tokens: list[str]) -> bool:
  return any(token in {">", ">>", "1>", "2>", "&>"} or token.startswith((">", ">>")) for token in tokens)


def _analyze_git_write(tokens: list[str], cwd: str) -> BlockDecision | None:
  if len(tokens) < 2:
    return None
  subcommand = _git_subcommand(tokens[1:])
  if subcommand in GIT_WRITE_SUBCOMMANDS:
    return _block_current_branch_write(cwd, f"`git {subcommand}` 会修改工作区、索引或提交历史")
  return None


def _package_command_writes(tokens: list[str]) -> bool:
  if len(tokens) < 2:
    return False
  manager = tokens[0]
  command = tokens[1]
  if manager in {"npm", "pnpm", "yarn", "bun"}:
    return command in {"add", "install", "i", "remove", "rm", "update", "upgrade"}
  if manager in {"pip", "pip3", "uv"}:
    return command in {"install", "add", "remove", "sync"}
  if manager == "cargo":
    return command in {"add", "remove", "update", "install"}
  if manager == "go":
    return command in {"get", "mod", "work"}
  return False


def _sed_write_reason(tokens: list[str]) -> str | None:
  args = tokens[1:]
  if any(_is_sed_in_place_option(token) for token in args):
    return "`sed -i` 会原地修改文件"
  return None


def _is_sed_in_place_option(token: str) -> bool:
  return token == "-i" or token.startswith("-i") or token == "--in-place" or token.startswith("--in-place=")


def _python_write_reason(tokens: list[str]) -> str | None:
  filtered = _strip_python_runtime_options(tokens[1:])
  if not filtered:
    return None
  if filtered[0] == "-c":
    code = " ".join(filtered[1:])
    if _python_inline_code_writes(code):
      return "`python -c` 内联代码包含明显文件写入调用"
    return None
  script = filtered[0].rsplit("/", 1)[-1].lower()
  if any(marker in script for marker in ("write", "update", "generate", "codegen", "modify", "migrate")):
    return f"`python {' '.join(tokens[1:])}` 可能执行写入型脚本"
  return None


def _strip_python_runtime_options(args: list[str]) -> list[str]:
  filtered = list(args)
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
    if token == "-c":
      return filtered[index:]
    if token.startswith("-c") and len(token) > 2:
      return ["-c", token[2:], *filtered[index + 1 :]]
    if token.startswith("-"):
      index += 1
      continue
    return filtered[index:]
  return []


def _python_inline_code_writes(code: str) -> bool:
  if re.search(r"open\([^)]*,\s*['\"][^'\"]*[wax+][^'\"]*['\"]", code):
    return True
  return any(
    marker in code
    for marker in (
      ".write(",
      ".write_text(",
      ".write_bytes(",
      "os.remove(",
      "shutil.",
    )
  )


def _block_current_branch_write(cwd: str, reason: str) -> BlockDecision | None:
  current_branch = _current_branch(cwd)
  if current_branch in PROTECTED_BRANCHES:
    return BlockDecision(current_branch, reason)
  return None


def _current_branch(cwd: str) -> str | None:
  try:
    result = subprocess.run(
      ["git", "symbolic-ref", "--quiet", "--short", "HEAD"],
      cwd=cwd,
      check=False,
      text=True,
      stdout=subprocess.PIPE,
      stderr=subprocess.DEVNULL,
      timeout=2,
    )
  except (OSError, subprocess.TimeoutExpired):
    return None
  branch = result.stdout.strip()
  return branch or None


def _write_block_message(decision: BlockDecision) -> None:
  branch = "所有分支" if decision.branch == "*" else f"`{decision.branch}`"
  action = "当前会话" if decision.action == "session" else "代理绕过" if decision.action == "escalation" else "写操作"
  sys.stderr.write(
    "\n".join(
      [
        f"DevFlow 已阻止在 {branch} 上进行{action}。",
        f"原因：{decision.reason}。",
        "",
        "请停止推送尝试，保留本地分支和验证结果，交由人工或受信任流程推送并创建 PR：",
        "  git switch -c codex/<task-name>",
      ]
    )
  )
  sys.stderr.write("\n")


if __name__ == "__main__":
  raise SystemExit(main())
