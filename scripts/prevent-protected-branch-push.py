#!/usr/bin/env python3
"""Block writes on protected integration branches.

The hook keeps integration branches clean in two layers:

* block sessions that start directly on a protected branch;
* block write-capable tool calls while the current branch is protected.

It also keeps the older direct-push guard so explicit pushes into protected
branches are blocked even when the current checkout is on a feature branch.
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
REMOTE_LIKE_RE = re.compile(r"^(?:[\w.-]+|[\w.-]+:.+|https?://.+|ssh://.+)$")
OPTIONS_WITH_VALUE = {
  "--exec",
  "--receive-pack",
  "--repo",
  "--push-option",
  "-o",
}
SHELL_WRITE_COMMANDS = {
  "apply_patch",
  "cat",
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
    normalized = _normalize_command_prefix(segment)
    if len(normalized) < 2 or normalized[0] != "git" or normalized[1] != "push":
      decision = _analyze_shell_write(normalized, cwd)
      if decision is not None:
        return decision
      continue
    decision = _analyze_git_push(normalized[2:], cwd)
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


def _analyze_git_push(args: list[str], cwd: str) -> BlockDecision | None:
  positionals: list[str] = []
  block_all_branches = False
  index = 0
  while index < len(args):
    token = args[index]
    if token == "--":
      positionals.extend(args[index + 1 :])
      break
    if token in {"--all", "--mirror"}:
      block_all_branches = True
      index += 1
      continue
    if token in OPTIONS_WITH_VALUE:
      index += 2
      continue
    if token.startswith("--") and "=" in token:
      index += 1
      continue
    if token.startswith("-"):
      index += 1
      continue
    positionals.append(token)
    index += 1

  if block_all_branches:
    return BlockDecision("*", "`git push --all` 或 `git push --mirror` 可能推送保护分支")

  refspecs = _extract_refspecs(positionals)
  if not refspecs:
    current_branch = _current_branch(cwd)
    if current_branch in PROTECTED_BRANCHES:
      return BlockDecision(current_branch, "当前分支是保护分支，普通 `git push` 会直接推送它")
    return None

  current_branch: str | None = None
  for refspec in refspecs:
    branch = _protected_destination_branch(refspec)
    if branch is not None:
      return BlockDecision(branch, f"refspec `{refspec}` 指向保护分支")
    if refspec in {"HEAD", "@"}:
      current_branch = current_branch or _current_branch(cwd)
      if current_branch in PROTECTED_BRANCHES:
        return BlockDecision(current_branch, f"refspec `{refspec}` 会推送当前保护分支")
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
  subcommand = tokens[1]
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


def _block_current_branch_write(cwd: str, reason: str) -> BlockDecision | None:
  current_branch = _current_branch(cwd)
  if current_branch in PROTECTED_BRANCHES:
    return BlockDecision(current_branch, reason)
  return None


def _extract_refspecs(positionals: list[str]) -> list[str]:
  if not positionals:
    return []
  first = positionals[0]
  if len(positionals) == 1 and _looks_like_single_remote(first):
    return []
  if _looks_like_remote(first):
    return positionals[1:]
  return positionals


def _looks_like_single_remote(value: str) -> bool:
  if ":" in value:
    return False
  return REMOTE_LIKE_RE.fullmatch(value) is not None


def _looks_like_remote(value: str) -> bool:
  if ":" in value:
    return False
  if _branch_name(value) in PROTECTED_BRANCHES:
    return False
  return REMOTE_LIKE_RE.fullmatch(value) is not None


def _protected_destination_branch(refspec: str) -> str | None:
  normalized = refspec.lstrip("+")
  destination = normalized.split(":", 1)[1] if ":" in normalized else normalized
  branch = _branch_name(destination)
  return branch if branch in PROTECTED_BRANCHES else None


def _branch_name(ref: str) -> str:
  for prefix in ("refs/heads/", "origin/"):
    if ref.startswith(prefix):
      return ref[len(prefix) :]
  return ref.rsplit("/", 1)[-1]


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
  branch = "受保护分支" if decision.branch == "*" else f"`{decision.branch}`"
  action = "当前会话" if decision.action == "session" else "写操作"
  sys.stderr.write(
    "\n".join(
      [
        f"DevFlow 已阻止在 {branch} 上进行{action}。",
        f"原因：{decision.reason}。",
        "",
        "请先切到新的工作分支，再通过 PR 合并：",
        "  git switch -c codex/<task-name>",
        "  git push -u origin codex/<task-name>",
        "  gh pr create --base <target-branch> --head codex/<task-name>",
      ]
    )
  )
  sys.stderr.write("\n")


if __name__ == "__main__":
  raise SystemExit(main())
