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


if __name__ == "__main__":
    unittest.main()
