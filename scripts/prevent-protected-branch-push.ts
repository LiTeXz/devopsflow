#!/usr/bin/env bun

import { currentBranch, PROTECTED_BRANCHES } from "@/shared/branch";
import {
	commandSegments,
	GIT_WRITE_SUBCOMMANDS,
	gitEffectiveCwd,
	gitSubcommand,
	hasShellRedirection,
	isPackageCommandWrites,
	isSedWriteCommand,
	normalizeCommandPrefix,
	PACKAGE_MANAGERS,
	pythonWriteReason,
	SAFE_BRANCH_ESCAPE,
	SHELL_WRITE_COMMANDS,
} from "@/shared/command-parser";
import {
	DIRECT_WRITE_TOOL_NAMES,
	findCommand,
	findHookEvent,
	findSessionId,
	findToolInput,
	findToolName,
	findWorkdir,
	readPayload,
	SESSION_HOOK_NAMES,
	SHELL_TOOL_NAMES,
} from "@/shared/payload";
import { runLoggedScript } from "@/shared/script-logger";
import { isDfPublisherSession } from "@/shared/state-store";
import type { Payload, ToolInput } from "@/shared/types";
import { type BlockDecision, createBlockDecision } from "@/shared/types";

export function shouldBlockSessionStart(
	cwd: string,
): BlockDecision | undefined {
	const branch = currentBranch(cwd);
	if (branch && PROTECTED_BRANCHES.has(branch)) {
		return createBlockDecision(
			branch,
			"当前会话启动在保护分支上；请先切到新的工作分支再让 Agent 修改代码",
			"session",
		);
	}
	return undefined;
}

export function shouldBlockTool(
	toolName: string,
	toolInput: ToolInput,
	cwd: string,
	isDfPublisher = false,
): BlockDecision | undefined {
	if (DIRECT_WRITE_TOOL_NAMES.has(toolName)) {
		return blockCurrentBranchWrite(cwd, `\`${toolName}\` 是直接写入工具`);
	}
	const command = findCommand(toolInput);
	if (!command) return undefined;
	return shouldBlock(command, cwd, isDfPublisher);
}

export function shouldBlock(
	command: string,
	cwd: string,
	isDfPublisher = false,
): BlockDecision | undefined {
	for (const segment of commandSegments(command)) {
		const proxyDecision = proxyEscalationDecision(segment);
		if (proxyDecision) return proxyDecision;
		const normalized = normalizeCommandPrefix(segment);
		const gitPushDecision = analyzeGitPush(normalized, cwd, isDfPublisher);
		if (gitPushDecision) return gitPushDecision;
		const shellWriteDecision = analyzeShellWrite(normalized, cwd);
		if (shellWriteDecision) return shellWriteDecision;
	}
	return undefined;
}

function proxyEscalationDecision(tokens: string[]): BlockDecision | undefined {
	const { stripLauncherPrefix } = require("@/shared/command-parser");
	const normalized = stripLauncherPrefix(tokens);
	if (normalized.length && normalized[0] === "proxy") {
		return createBlockDecision(
			"*",
			"二级警告：检测到 `proxy` 代理执行，疑似在尝试绕过既有权限或 hook 限制",
			"escalation",
		);
	}
	if (
		normalized.length >= 2 &&
		normalized[0] === "rtk" &&
		(normalized[1] as string) === "proxy"
	) {
		return createBlockDecision(
			"*",
			"二级警告：检测到 `rtk proxy` 代理执行，疑似在尝试绕过既有权限或 hook 限制",
			"escalation",
		);
	}
	return undefined;
}

function analyzeGitPush(
	tokens: string[],
	cwd: string,
	isDfPublisher: boolean,
): BlockDecision | undefined {
	if (!tokens.length || tokens[0] !== "git") return undefined;
	const subcommand = gitSubcommand(tokens.slice(1));
	if (subcommand === "push") {
		if (isDfPublisher) {
			return blockCurrentBranchWrite(cwd, "`git push` 在保护分支上被禁止");
		}
		return createBlockDecision(
			"*",
			"`git push` 已被全场拦截；Agent 不允许执行任何推送",
		);
	}
	return undefined;
}

function analyzeShellWrite(
	tokens: string[],
	cwd: string,
): BlockDecision | undefined {
	if (!tokens.length) return undefined;
	if (isSafeBranchEscape(tokens)) return undefined;
	if (hasShellRedirection(tokens)) {
		return blockCurrentBranchWrite(cwd, "shell 重定向会写入文件");
	}
	if (tokens[0] === "git") return analyzeGitWrite(tokens, cwd);
	if (PACKAGE_MANAGERS.has(tokens[0]) && isPackageCommandWrites(tokens)) {
		return blockCurrentBranchWrite(
			cwd,
			`\`${tokens[0]} ${tokens.slice(1, 3).join(" ")}\` 可能修改依赖或锁文件`,
		);
	}
	if (tokens[0] === "sed") {
		const reason = isSedWriteCommand(tokens);
		if (reason) return blockCurrentBranchWrite(cwd, "`sed -i` 会原地修改文件");
		return undefined;
	}
	if (tokens[0] === "python" || tokens[0] === "python3") {
		const reason = pythonWriteReason(tokens.slice(1));
		if (reason) return blockCurrentBranchWrite(cwd, reason);
		return undefined;
	}
	if (SHELL_WRITE_COMMANDS.has(tokens[0])) {
		return blockCurrentBranchWrite(cwd, `\`${tokens[0]}\` 是写入型 shell 命令`);
	}
	return undefined;
}

function isSafeBranchEscape(tokens: string[]): boolean {
	if (tokens.length < 3) return false;
	const prefix = `${tokens[0]} ${tokens[1]}`;
	if (!SAFE_BRANCH_ESCAPE.has(prefix)) return false;
	return ["-b", "-B", "-c", "-C", "--create", "--force-create"].includes(
		tokens[2],
	);
}

function analyzeGitWrite(
	tokens: string[],
	cwd: string,
): BlockDecision | undefined {
	if (tokens.length < 2) return undefined;
	const subcommand = gitSubcommand(tokens.slice(1));
	if (subcommand && GIT_WRITE_SUBCOMMANDS.has(subcommand)) {
		const effectiveCwd = gitEffectiveCwd(tokens, cwd);
		return blockCurrentBranchWrite(
			effectiveCwd,
			`\`git ${subcommand}\` 会修改工作区、索引或提交历史`,
		);
	}
	return undefined;
}

function blockCurrentBranchWrite(
	cwd: string,
	reason: string,
): BlockDecision | undefined {
	const branch = currentBranch(cwd);
	if (branch && PROTECTED_BRANCHES.has(branch)) {
		return createBlockDecision(branch, `${reason}（cwd: ${cwd}）`);
	}
	return undefined;
}

function writeBlockMessage(decision: BlockDecision): void {
	const branch =
		decision.branch === "*" ? "所有分支" : `\`${decision.branch}\``;
	const action =
		decision.action === "session"
			? "当前会话"
			: decision.action === "escalation"
				? "代理绕过"
				: "写操作";
	const lines = [
		`DevOpsFlow 已阻止在 ${branch} 上进行${action}。`,
		`原因：${decision.reason}。`,
		"",
		"请停止推送尝试，保留本地分支和验证结果，交由人工或受信任流程推送并创建 PR：",
		"  git switch -c codex/<task-name>",
	];
	for (const line of lines) {
		console.error(line);
	}
}

function main(payload: Payload | null = readPayload()): number {
	if (!payload || typeof payload !== "object") return 0;

	const toolInput = findToolInput(payload) ?? {};
	const cwd = findWorkdir(payload, toolInput);
	const hookEvent = findHookEvent(payload);
	const sessionId = findSessionId(payload);
	const isDfPublisher = sessionId ? isDfPublisherSession(sessionId) : false;

	if (SESSION_HOOK_NAMES.has(hookEvent)) {
		const decision = shouldBlockSessionStart(cwd);
		if (decision) {
			writeBlockMessage(decision);
			return 2;
		}
		return 0;
	}

	const toolName = findToolName(payload);
	if (
		toolName &&
		!SHELL_TOOL_NAMES.has(toolName) &&
		!DIRECT_WRITE_TOOL_NAMES.has(toolName)
	) {
		return 0;
	}

	const decision = shouldBlockTool(toolName, toolInput, cwd, isDfPublisher);
	if (decision) {
		writeBlockMessage(decision);
		return 2;
	}
	return 0;
}

if (import.meta.main) {
	const payload = readPayload();
	process.exit(
		runLoggedScript(
			{ payload, scriptName: "prevent-protected-branch-push" },
			() => main(payload),
		),
	);
}
