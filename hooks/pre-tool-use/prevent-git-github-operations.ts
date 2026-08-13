#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { join } from "node:path";
import { containsBlockedGitGh } from "@/shared/command-parser";
import {
  findCommand,
  findHookEvent,
  findSessionId,
  findToolInput,
  findToolName,
  findWorkdir,
  PRE_TOOL_USE_EVENTS,
  readPayload,
  SESSION_HOOK_NAMES,
  SHELL_TOOL_NAMES,
} from "@/shared/payload";
import { runLoggedScript } from "@/shared/script-logger";
import { isDfOpsVcsManagerSession } from "@/shared/state-store";
import type { Payload } from "@/shared/types";
import { installProjectAgent } from "../../skills/df-codex-assets/scripts/df-codex-assets";

export function ensureManagedSubagents(
  cwd: string,
  pluginRoot?: string,
): string | undefined {
  if (!pluginRoot) return undefined;
  if (!existsSync(join(pluginRoot, "agents"))) {
    return "DevopsFlow 插件不完整：未找到 agents/ 目录。";
  }
  const changed = installProjectAgent(pluginRoot, cwd);
  return changed ? "DevopsFlow: 已同步受管 Codex subagent 配置。" : undefined;
}

/** @deprecated Use ensureManagedSubagents. Kept for downstream hook compatibility. */
export const ensureDfPublisherAgent = ensureManagedSubagents;

export function shouldBlockTool(
  toolName: string,
  toolInput: { command?: string; cmd?: string; [key: string]: unknown },
  sessionId?: string,
): boolean {
  if (toolName && !SHELL_TOOL_NAMES.has(toolName)) return false;
  const command = findCommand(toolInput);
  if (!command || !containsBlockedGitGh(command)) return false;
  return !(sessionId && isDfOpsVcsManagerSession(sessionId));
}

function writeToolBlock(): void {
  for (const line of [
    "DevopsFlow 已阻止 git/gh 发布操作。",
    "原因：仅 df-ops-vcs-manager Codex worker session 可执行 git push、git commit、gh issue、gh pr。",
    "提交、推送、PR、issue 管理必须委托 df-ops-vcs-manager Codex worker session 完成。",
  ]) {
    console.error(line);
  }
}

function main(payload: Payload | null = readPayload()): number {
  if (!payload || typeof payload !== "object") return 0;
  const event = findHookEvent(payload);
  if (SESSION_HOOK_NAMES.has(event)) {
    const message = ensureManagedSubagents(
      findWorkdir(payload, findToolInput(payload) ?? {}),
      process.env.PLUGIN_ROOT,
    );
    if (message) console.log(message);
    return 0;
  }
  if (!PRE_TOOL_USE_EVENTS.has(event)) return 0;
  if (
    shouldBlockTool(
      findToolName(payload),
      findToolInput(payload) ?? {},
      findSessionId(payload),
    )
  ) {
    writeToolBlock();
    return 2;
  }
  return 0;
}

if (import.meta.main) {
  const payload = readPayload();
  process.exit(
    runLoggedScript(
      { payload, scriptName: "prevent-git-github-operations" },
      () => main(payload),
    ),
  );
}
