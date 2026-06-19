#!/usr/bin/env python3
"""Regression tests for the main-agent write guard hook."""

from __future__ import annotations

import importlib.util
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("prevent-main-agent-write.py")
SPEC = importlib.util.spec_from_file_location("prevent_main_agent_write", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
HOOK = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = HOOK
SPEC.loader.exec_module(HOOK)


class MainAgentWriteGuardTest(unittest.TestCase):
  def setUp(self) -> None:
    self.tempdir = tempfile.TemporaryDirectory()
    self.state_path = Path(self.tempdir.name) / "sessions.json"
    self.env_patch = patch.dict(os.environ, {HOOK.STATE_PATH_ENV: str(self.state_path)})
    self.env_patch.start()

  def tearDown(self) -> None:
    self.env_patch.stop()
    self.tempdir.cleanup()

  def assert_blocked_tool(
    self,
    tool_name: str,
    tool_input: dict[str, object] | None = None,
    session_id: str | None = "main-session",
  ) -> None:
    decision = HOOK.should_block_tool(tool_name, tool_input or {}, session_id)
    self.assertIsNotNone(decision)

  def assert_allowed_tool(
    self,
    tool_name: str,
    tool_input: dict[str, object] | None = None,
    session_id: str | None = "main-session",
  ) -> None:
    self.assertIsNone(HOOK.should_block_tool(tool_name, tool_input or {}, session_id))

  def start_subagent(self, session_id: str, agent_name: str = "worker") -> None:
    payload = {
      "hook_event_name": "SubagentStart",
      "session_id": session_id,
      "agentName": agent_name,
    }
    self.assertEqual(HOOK._handle_subagent_start(payload, session_id), 0)

  def stop_subagent(self, session_id: str) -> None:
    self.assertEqual(HOOK._handle_subagent_stop(session_id), 0)

  def test_blocks_main_agent_direct_write_tools(self) -> None:
    self.assert_blocked_tool("Write")
    self.assert_blocked_tool("Edit")
    self.assert_blocked_tool("apply_patch")

  def test_blocks_main_agent_shell_redirection_rm_git_add_and_pnpm_add(self) -> None:
    self.assert_blocked_tool("Bash", {"command": "printf hi > README.md"})
    self.assert_blocked_tool("Bash", {"command": "rm -rf build"})
    self.assert_blocked_tool("Bash", {"command": "git add README.md"})
    self.assert_blocked_tool("Bash", {"command": "pnpm add zod"})
    self.assert_blocked_tool("Bash", {"command": "pnpm run generate"})
    self.assert_blocked_tool("Bash", {"command": "pnpm run build"})

  def test_allows_main_agent_read_status_and_test_commands(self) -> None:
    self.assert_allowed_tool("Bash", {"command": "rg -n DevFlow README.md"})
    self.assert_allowed_tool("Bash", {"command": "git status --short"})
    self.assert_allowed_tool("Bash", {"command": "python3 -X utf8 scripts/test-prevent-main-agent-write.py"})
    self.assert_allowed_tool("Bash", {"command": "pnpm test"})
    self.assert_allowed_tool("Bash", {"command": "pnpm run test"})
    self.assert_allowed_tool("Bash", {"command": "pnpm run typecheck"})
    self.assert_allowed_tool("Bash", {"command": "pnpm run lint"})

  def test_allows_registered_subagent_write(self) -> None:
    self.start_subagent("worker-1")
    self.assert_allowed_tool("Write", session_id="worker-1")
    self.assert_allowed_tool("Bash", {"command": "git add README.md"}, session_id="worker-1")

  def test_subagent_start_registers_builtin_names_without_worker_marker(self) -> None:
    self.start_subagent("explorer-session", "explorer")
    self.start_subagent("default-session", "default")
    self.assert_allowed_tool("Write", session_id="explorer-session")
    self.assert_allowed_tool("Write", session_id="default-session")

  def test_blocks_after_subagent_stop(self) -> None:
    self.start_subagent("worker-1")
    self.stop_subagent("worker-1")
    self.assert_blocked_tool("Write", session_id="worker-1")

  def test_blocks_write_without_session_id(self) -> None:
    self.assert_blocked_tool("Write", session_id=None)
    self.assert_blocked_tool("Bash", {"command": "touch marker"}, session_id=None)

  def test_multiple_subagent_sessions_do_not_interfere(self) -> None:
    self.start_subagent("worker-1")
    self.start_subagent("worker-2")
    self.assert_allowed_tool("Write", session_id="worker-1")
    self.assert_allowed_tool("Write", session_id="worker-2")
    self.stop_subagent("worker-1")
    self.assert_blocked_tool("Write", session_id="worker-1")
    self.assert_allowed_tool("Write", session_id="worker-2")


if __name__ == "__main__":
  unittest.main()
