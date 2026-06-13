#!/usr/bin/env python3
"""Block direct pushes to protected integration branches.

The hook is intentionally conservative: it blocks only when a shell command is
recognized as `git push` and the destination branch is protected, or when a
plain push would use the current protected branch.
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
SHELL_TOOL_NAMES = {"Bash", "shell", "exec", "exec_command", "unified_exec"}
COMMAND_KEYS = ("command", "cmd")
REMOTE_LIKE_RE = re.compile(r"^(?:[\w.-]+|[\w.-]+:.+|https?://.+|ssh://.+)$")
OPTIONS_WITH_VALUE = {
    "--exec",
    "--receive-pack",
    "--repo",
    "--push-option",
    "-o",
}


@dataclass(frozen=True)
class BlockDecision:
    branch: str
    reason: str


def main() -> int:
    payload = _read_payload()
    if not isinstance(payload, dict):
        return 0
    tool_name = _find_tool_name(payload)
    if tool_name and tool_name not in SHELL_TOOL_NAMES:
        return 0
    tool_input = _find_tool_input(payload)
    if not tool_input:
        return 0
    command = _find_command(tool_input)
    if not command:
        return 0
    cwd = _find_workdir(payload, tool_input)
    decision = should_block(command, cwd)
    if decision is None:
        return 0
    _write_block_message(decision)
    return 2


def should_block(command: str, cwd: str) -> BlockDecision | None:
    for segment in _command_segments(command):
        normalized = _normalize_command_prefix(segment)
        if len(normalized) < 2 or normalized[0] != "git" or normalized[1] != "push":
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
        tokens = shlex.split(command, posix=True)
    except ValueError:
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
    sys.stderr.write(
        "\n".join(
            [
                f"DevFlow 已阻止直接 git push 到 {branch}。",
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
