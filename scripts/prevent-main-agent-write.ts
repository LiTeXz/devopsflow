#!/usr/bin/env bun

import { currentBranch, PROTECTED_BRANCHES } from "@/shared/branch";
import {
	commandSegments,
	containsBlockedGitGh,
	GIT_WRITE_SUBCOMMANDS,
	gitSubcommand,
	hasShellRedirection,
	isPackageCommandWrites,
	isSedWriteCommand,
	isTestCommand,
	normalizeCommandPrefix,
	PACKAGE_MANAGERS,
	pythonWriteReason,
	SHELL_WRITE_COMMANDS,
	stripLauncherPrefix,
} from "@/shared/command-parser";
import {
	DIRECT_WRITE_TOOL_NAMES,
	findAgentName,
	findCommand,
	findHookEvent,
	findSessionId,
	findToolInput,
	findToolName,
	findToolWorkdir,
	findWorkdir,
	PRE_TOOL_USE_EVENTS,
	readPayload,
	SESSION_HOOK_NAMES,
	SHELL_TOOL_NAMES,
	SUBAGENT_START_EVENTS,
	SUBAGENT_STOP_EVENTS,
	SUBAGENT_TOOL_NAMES,
} from "@/shared/payload";
import {
	isDfPublisherSession,
	isRegisteredSubagentSession,
	loadState,
	saveState,
} from "@/shared/state-store";
import type { Payload, ToolInput } from "@/shared/types";
import { type BlockDecision, createBlockDecision } from "@/shared/types";

export function shouldBlockTool(
	toolName: string,
	toolInput: ToolInput,
	sessionId?: string,
	cwd?: string,
): BlockDecision | undefined {
	const decision = decisionForTool(toolName, toolInput);
	if (!decision) return undefined;
	if (decision.escalation) return decision;
	if (isGlobalGitPushDecision(decision)) {
		if (sessionId && isDfPublisherSession(sessionId)) {
			const effectiveCwd = cwd ?? findToolWorkdir(toolInput);
			if (effectiveCwd) {
				const pbDecision = protectedBranchWriteDecision(
					effectiveCwd,
					decision.reason,
				);
				if (pbDecision) return pbDecision;
			}
			return undefined;
		}
		return decision;
	}

	if (!sessionId) {
		return createBlockDecision(
			"unknown",
			`${decision.reason}，但 payload 缺少 session_id，无法证明这是 worker/subagent 写入`,
		);
	}
	if (!isRegisteredSubagentSession(sessionId)) {
		return createBlockDecision(
			"unknown",
			`${decision.reason}，当前 session \`${sessionId}\` 未登记为 worker/subagent`,
		);
	}

	const effectiveCwd = cwd ?? findToolWorkdir(toolInput);
	if (effectiveCwd) {
		const protectedBranchDecision = protectedBranchWriteDecision(
			effectiveCwd,
			decision.reason,
		);
		if (protectedBranchDecision) return protectedBranchDecision;
	}

	return undefined;
}

export function shouldBlockOpenCodeTool(
	toolName: string,
	toolInput: ToolInput,
	isSubagent: boolean,
	cwd?: string,
	isDfPublisher = false,
): BlockDecision | undefined {
	const ocCommand = findCommand(toolInput);
	if (ocCommand && containsBlockedGitGh(ocCommand)) {
		if (isDfPublisher) {
			if (cwd) {
				const pbDecision = protectedBranchWriteDecision(
					cwd,
					"df-publisher 在保护分支上执行 git/gh 操作",
				);
				if (pbDecision) return pbDecision;
			}
			return undefined;
		}
		return createBlockDecision(
			"unknown",
			"git push/commit/gh issue/gh pr 操作已被禁止；请委托 df-publisher 子代理完成",
		);
	}
	const decision = decisionForTool(toolName, toolInput);
	if (!decision) return undefined;
	if (decision.escalation) return decision;
	if (isGlobalGitPushDecision(decision)) {
		if (isDfPublisher) {
			if (cwd) {
				const pbDecision = protectedBranchWriteDecision(cwd, decision.reason);
				if (pbDecision) return pbDecision;
			}
			return undefined;
		}
		return decision;
	}

	if (!isSubagent) {
		return createBlockDecision(
			"unknown",
			`${decision.reason}，当前 OpenCode agent 不是 subagent，主 Agent 禁止写入`,
		);
	}

	const effectiveCwd = cwd ?? findToolWorkdir(toolInput);
	if (effectiveCwd) {
		const protectedBranchDecision = protectedBranchWriteDecision(
			effectiveCwd,
			decision.reason,
		);
		if (protectedBranchDecision) return protectedBranchDecision;
	}

	return undefined;
}

function decisionForTool(
	toolName: string,
	toolInput: ToolInput,
): BlockDecision | undefined {
	if (DIRECT_WRITE_TOOL_NAMES.has(toolName)) {
		return createBlockDecision("unknown", `\`${toolName}\` 是直接写入工具`);
	}
	if (toolName && !SHELL_TOOL_NAMES.has(toolName)) return undefined;

	const command = findCommand(toolInput);
	if (!command) return undefined;
	return decisionForCommand(command);
}

function decisionForCommand(command: string): BlockDecision | undefined {
	for (const segment of commandSegments(command)) {
		const proxyReason = proxyEscalationReason(segment);
		if (proxyReason) {
			return createBlockDecision("unknown", proxyReason, "escalation");
		}
		const normalized = normalizeCommandPrefix(segment);
		if (!normalized.length) continue;

		if (isTestCommand(normalized)) continue;

		if (hasShellRedirection(normalized)) {
			return createBlockDecision("unknown", "shell 重定向会写入文件");
		}
		if (normalized[0] === "git") {
			const pushReason = gitPushReason(normalized);
			if (pushReason) return createBlockDecision("unknown", pushReason);
			const writeReason = gitWriteReason(normalized);
			if (writeReason) return createBlockDecision("unknown", writeReason);
			continue;
		}
		if (
			PACKAGE_MANAGERS.has(normalized[0]) &&
			isPackageCommandWrites(normalized)
		) {
			const packageName = normalized.slice(0, 3).join(" ");
			return createBlockDecision(
				"unknown",
				`\`${packageName}\` 可能修改依赖或锁文件`,
			);
		}
		if (normalized[0] === "sed") {
			const reason = isSedWriteCommand(normalized);
			if (reason)
				return createBlockDecision("unknown", "`sed -i` 会原地修改文件");
			continue;
		}
		if (normalized[0] === "python" || normalized[0] === "python3") {
			const reason = pythonWriteReason(normalized.slice(1));
			if (reason) return createBlockDecision("unknown", reason);
			continue;
		}
		if (SHELL_WRITE_COMMANDS.has(normalized[0])) {
			return createBlockDecision(
				"unknown",
				`\`${normalized[0]}\` 是写入型 shell 命令`,
			);
		}
	}
	return undefined;
}

function proxyEscalationReason(tokens: string[]): string | undefined {
	const normalized = stripLauncherPrefix(tokens);
	if (normalized.length && normalized[0] === "proxy") {
		return "二级警告：检测到 `proxy` 代理执行，疑似在尝试绕过既有权限或 hook 限制";
	}
	if (
		normalized.length >= 2 &&
		normalized[0] === "rtk" &&
		(normalized[1] as string) === "proxy"
	) {
		return "二级警告：检测到 `rtk proxy` 代理执行，疑似在尝试绕过既有权限或 hook 限制";
	}
	return undefined;
}

function gitPushReason(tokens: string[]): string | undefined {
	const subcommand = gitSubcommand(tokens.slice(1));
	if (subcommand === "push") {
		return "`git push` 已被全场拦截；Agent 不允许执行任何推送";
	}
	return undefined;
}

function gitWriteReason(tokens: string[]): string | undefined {
	const subcommand = gitSubcommand(tokens.slice(1));
	if (subcommand && GIT_WRITE_SUBCOMMANDS.has(subcommand)) {
		return `\`git ${subcommand}\` 会修改工作区、索引或提交历史`;
	}
	return undefined;
}

function isGlobalGitPushDecision(decision: BlockDecision): boolean {
	return decision.reason.startsWith("`git push` 已被全场拦截");
}

function protectedBranchWriteDecision(
	cwd: string,
	reason: string,
): BlockDecision | undefined {
	const branch = currentBranch(cwd);
	if (branch && PROTECTED_BRANCHES.has(branch)) {
		return createBlockDecision(
			"unknown",
			`${reason}，当前分支 \`${branch}\` 受保护（cwd: ${cwd}）`,
		);
	}
	return undefined;
}

function handleSubagentStart(
	payload: Payload,
	sessionId: string | undefined,
): number {
	if (!sessionId) return 0;
	const agentName = findAgentName(payload);
	const state = loadState();
	state[sessionId] = { agent: agentName };
	saveState(state);
	return 0;
}

function handleSubagentStop(sessionId: string | undefined): number {
	if (!sessionId) return 0;
	const state = loadState();
	if (sessionId in state) {
		delete state[sessionId];
		saveState(state);
	}
	return 0;
}

function handleSessionStart(): number {
	const lines = [
		"DevFlow mode: coordinator-only",
		"Main agent may coordinate, review, and verify only.",
		"Worker/subagent sessions may write files.",
		"Read-only inspection commands are allowed.",
	];
	for (const line of lines) {
		process.stdout.write(`${line}\n`);
	}
	return 0;
}

function writeBlockMessage(decision: BlockDecision): void {
	const lines = [
		"DevFlow 已阻止主 Agent 直接执行写操作。",
		`原因：${decision.reason}。`,
		"",
		"主 Agent 只能协调、审查和验证；请通过 worker/subagent 完成代码写入。",
	];
	for (const line of lines) {
		process.stderr.write(`${line}\n`);
	}
}

function main(): number {
	const payload = readPayload();
	if (!payload || typeof payload !== "object") return 0;

	const event = findHookEvent(payload);
	const sessionId = findSessionId(payload);

	if (SESSION_HOOK_NAMES.has(event)) {
		return handleSessionStart();
	}
	if (SUBAGENT_START_EVENTS.has(event)) {
		return handleSubagentStart(payload, sessionId);
	}
	if (SUBAGENT_STOP_EVENTS.has(event)) {
		return handleSubagentStop(sessionId);
	}
	if (!PRE_TOOL_USE_EVENTS.has(event)) {
		return 0;
	}

	const toolName = findToolName(payload);
	if (SUBAGENT_TOOL_NAMES.has(toolName)) return 0;

	const toolInput = findToolInput(payload) ?? {};
	const cwd = findWorkdir(payload, toolInput);
	const decision = shouldBlockTool(toolName, toolInput, sessionId, cwd);

	if (decision) {
		writeBlockMessage(decision);
		return 2;
	}
	return 0;
}

if (import.meta.main) {
	process.exit(main());
}
