#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { join } from "node:path";
import { containsBlockedGitGh } from "@/shared/command-parser";
import {
	DIRECT_WRITE_TOOL_NAMES,
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
	SUBAGENT_TOOL_NAMES,
} from "@/shared/payload";
import { isDfPublisherSession } from "@/shared/state-store";

export function shouldBlockSessionStart(
	cwd: string,
	pluginRoot?: string,
): string | undefined {
	const agentsDir = join(cwd, ".codex", "agents");
	const dfPublisherToml = join(agentsDir, "df-publisher.toml");
	if (!existsSync(dfPublisherToml)) {
		const lines = [
			"DevFlow 插件不完整：未找到 df-publisher 子代理定义。",
			`预期位置：${dfPublisherToml}`,
		];
		if (pluginRoot) {
			lines.push(`插件根目录：${pluginRoot}`);
			lines.push("");
			lines.push("请复制安装（按平台选择）：");
			lines.push(
				`  Linux/macOS: mkdir -p .codex/agents && cp "${pluginRoot}/agents/df-publisher.toml" .codex/agents/df-publisher.toml`,
			);
			lines.push(
				`  Windows:     mkdir .codex\\agents 2>nul & copy "${pluginRoot}\\agents\\df-publisher.toml" .codex\\agents\\df-publisher.toml`,
			);
		} else {
			lines.push("");
			lines.push("请在项目 .codex/agents/ 目录中安装 df-publisher.toml，");
			lines.push(
				"或运行插件安装流程将 agents/df-publisher.toml 复制到 .codex/agents/。",
			);
		}
		return lines.join("\n");
	}
	return undefined;
}

export function shouldBlockTool(
	toolName: string,
	toolInput: { command?: string; cmd?: string; [key: string]: unknown },
	sessionId?: string,
): boolean {
	if (toolName && !SHELL_TOOL_NAMES.has(toolName)) return false;
	if (DIRECT_WRITE_TOOL_NAMES.has(toolName)) return false;
	if (SUBAGENT_TOOL_NAMES.has(toolName)) return false;
	const command = findCommand(toolInput);
	if (!command) return false;
	if (!containsBlockedGitGh(command)) return false;
	if (sessionId && isDfPublisherSession(sessionId)) return false;
	return true;
}

function writeSessionStartWarning(message: string): void {
	for (const line of message.split("\n")) {
		process.stdout.write(`${line}\n`);
	}
}

function writeToolBlock(): void {
	const lines = [
		"DevFlow 已阻止 git/gh 发布操作。",
		"原因：仅 df-publisher 子代理可执行 git push、git commit、gh issue、gh pr。",
		"",
		"主 Agent 和其他 worker 可直接执行简单 git/gh 操作（如切换分支、合并、认证），",
		"但提交、推送、PR、issue 管理必须委托 df-publisher 子代理完成。",
	];
	for (const line of lines) {
		process.stderr.write(`${line}\n`);
	}
}

function main(): number {
	const payload = readPayload();
	if (!payload || typeof payload !== "object") return 0;

	const event = findHookEvent(payload);

	if (SESSION_HOOK_NAMES.has(event)) {
		const toolInput = findToolInput(payload) ?? {};
		const cwd = findWorkdir(payload, toolInput);
		const pluginRoot = process.env.PLUGIN_ROOT;
		const message = shouldBlockSessionStart(cwd, pluginRoot);
		if (message) {
			writeSessionStartWarning(message);
			return 0;
		}
		return 0;
	}

	if (!PRE_TOOL_USE_EVENTS.has(event)) {
		return 0;
	}

	const toolName = findToolName(payload);
	const toolInput = findToolInput(payload) ?? {};
	const sessionId = findSessionId(payload);

	if (shouldBlockTool(toolName, toolInput, sessionId)) {
		writeToolBlock();
		return 2;
	}
	return 0;
}

if (import.meta.main) {
	process.exit(main());
}
