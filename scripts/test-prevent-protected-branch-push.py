#!/usr/bin/env python3
"""Regression tests for the protected branch push hook."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("prevent-protected-branch-push.py")
SPEC = importlib.util.spec_from_file_location("prevent_protected_branch_push", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
HOOK = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = HOOK
SPEC.loader.exec_module(HOOK)


class ProtectedBranchPushHookTest(unittest.TestCase):
  def assert_blocked(self, command: str, branch: str = "main") -> None:
    with patch.object(HOOK, "_current_branch", return_value=branch):
      decision = HOOK.should_block(command, "/repo")
    self.assertIsNotNone(decision)
    self.assertEqual(decision.branch, branch)

  def assert_allowed(self, command: str, current_branch: str = "feature/demo") -> None:
    with patch.object(HOOK, "_current_branch", return_value=current_branch):
      self.assertIsNone(HOOK.should_block(command, "/repo"))

  def test_blocks_direct_main_push(self) -> None:
    self.assert_blocked("git push origin main")

  def test_blocks_explicit_destination(self) -> None:
    self.assert_blocked("git push origin HEAD:main")
    self.assert_blocked("git push origin feature:refs/heads/dev", "dev")

  def test_blocks_common_develop_typo(self) -> None:
    self.assert_blocked("git push origin devlop", "devlop")

  def test_blocks_plain_push_from_protected_current_branch(self) -> None:
    with patch.object(HOOK, "_current_branch", return_value="develop"):
      decision = HOOK.should_block("git push origin", "/repo")
    self.assertIsNotNone(decision)
    self.assertEqual(decision.branch, "develop")

  def test_allows_feature_branch_push(self) -> None:
    self.assert_allowed("git push -u origin codex/convert-to-plugin")

  def test_allows_feature_branch_destination(self) -> None:
    self.assert_allowed("git push origin HEAD:codex/convert-to-plugin")

  def test_blocks_rtk_wrapped_command(self) -> None:
    self.assert_blocked("rtk proxy git push origin main")

  def test_blocks_all_branch_push(self) -> None:
    decision = HOOK.should_block("git push --all origin", "/repo")
    self.assertIsNotNone(decision)
    self.assertEqual(decision.branch, "*")

  def test_blocks_session_start_on_protected_branch(self) -> None:
    with patch.object(HOOK, "_current_branch", return_value="dev"):
      decision = HOOK.should_block_session_start("/repo")
    self.assertIsNotNone(decision)
    self.assertEqual(decision.branch, "dev")
    self.assertEqual(decision.action, "session")

  def test_allows_session_start_on_feature_branch(self) -> None:
    with patch.object(HOOK, "_current_branch", return_value="codex/task"):
      self.assertIsNone(HOOK.should_block_session_start("/repo"))

  def test_blocks_direct_write_tool_on_protected_branch(self) -> None:
    with patch.object(HOOK, "_current_branch", return_value="main"):
      decision = HOOK.should_block_tool("apply_patch", {}, "/repo")
    self.assertIsNotNone(decision)
    self.assertEqual(decision.branch, "main")

  def test_allows_direct_write_tool_on_feature_branch(self) -> None:
    with patch.object(HOOK, "_current_branch", return_value="codex/task"):
      self.assertIsNone(HOOK.should_block_tool("Write", {}, "/repo"))

  def test_blocks_shell_redirection_on_protected_branch(self) -> None:
    self.assert_blocked("printf hi > README.md", "develop")
    self.assert_blocked("printf hi>README.md", "develop")

  def test_blocks_file_mutation_commands_on_protected_branch(self) -> None:
    self.assert_blocked("rm -rf build", "main")
    self.assert_blocked("mv old new", "main")
    self.assert_blocked("cp a b", "main")
    self.assert_blocked("rg -n DevFlow README.md;rm README.md", "main")

  def test_blocks_git_writes_on_protected_branch(self) -> None:
    self.assert_blocked("git add README.md", "dev")
    self.assert_blocked("git commit -m test", "dev")
    self.assert_blocked("git reset --hard HEAD~1", "dev")

  def test_allows_branch_escape_on_protected_branch(self) -> None:
    with patch.object(HOOK, "_current_branch", return_value="main"):
      self.assertIsNone(HOOK.should_block("git switch -c codex/task", "/repo"))
      self.assertIsNone(HOOK.should_block("git checkout -b codex/task", "/repo"))

  def test_blocks_package_install_on_protected_branch(self) -> None:
    self.assert_blocked("pnpm add zod", "develop")
    self.assert_blocked("npm install lodash", "develop")

  def test_allows_read_only_commands_on_protected_branch(self) -> None:
    with patch.object(HOOK, "_current_branch", return_value="main"):
      self.assertIsNone(HOOK.should_block("rg -n DevFlow README.md", "/repo"))
      self.assertIsNone(HOOK.should_block("git status --short", "/repo"))


if __name__ == "__main__":
  unittest.main()
