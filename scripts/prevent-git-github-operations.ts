#!/usr/bin/env bun

import { createHash } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	statSync,
	unlinkSync,
} from "node:fs";
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

function readPluginVersion(pluginRoot?: string): string | undefined {
	if (!pluginRoot) return undefined;
	try {
		const pkg = JSON.parse(
			readFileSync(join(pluginRoot, "package.json"), "utf-8"),
		);
		return typeof pkg.version === "string" ? pkg.version : undefined;
	} catch {
		return undefined;
	}
}

function readTomlVersionMarker(path: string): string | undefined {
	try {
		const content = readFileSync(path, "utf-8");
		const match = content.match(/^#\s*devopsflow-version\s*=\s*"([^"]+)"/m);
		return match?.[1];
	} catch {
		return undefined;
	}
}

function hasLegacyTopLevelVersionField(path: string): boolean {
	try {
		return /^version\s*=/.test(readFileSync(path, "utf-8"));
	} catch {
		return false;
	}
}

const AGENT_TOML_ALLOWED_FIELDS = new Set([
	"name",
	"description",
	"nickname_candidates",
	"developer_instructions",
]);

type AgentTomlValidation =
	| { valid: true; versionMarker: string | undefined }
	| { valid: false; reason: string; versionMarker: string | undefined };

function validateDfPublisherToml(path: string): AgentTomlValidation {
	const versionMarker = readTomlVersionMarker(path);
	let parsed: unknown;
	try {
		parsed = Bun.TOML.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		return {
			valid: false,
			versionMarker,
			reason: `TOML 解析失败：${errorMessage(error)}`,
		};
	}

	if (!isRecord(parsed)) {
		return { valid: false, versionMarker, reason: "TOML 顶层必须是对象" };
	}

	for (const field of Object.keys(parsed)) {
		if (!AGENT_TOML_ALLOWED_FIELDS.has(field)) {
			return {
				valid: false,
				versionMarker,
				reason: `包含不支持字段：${field}`,
			};
		}
	}

	for (const field of ["name", "developer_instructions"]) {
		if (!isNonEmptyString(parsed[field])) {
			return {
				valid: false,
				versionMarker,
				reason: `缺少必需字符串字段：${field}`,
			};
		}
	}

	if ("description" in parsed && !isNonEmptyString(parsed.description)) {
		return {
			valid: false,
			versionMarker,
			reason: "description 必须是非空字符串",
		};
	}

	if (
		"nickname_candidates" in parsed &&
		(!Array.isArray(parsed.nickname_candidates) ||
			!parsed.nickname_candidates.every(isNonEmptyString))
	) {
		return {
			valid: false,
			versionMarker,
			reason: "nickname_candidates 必须是非空字符串数组",
		};
	}

	return { valid: true, versionMarker };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function fileHash(path: string): string | undefined {
	try {
		return createHash("sha256").update(readFileSync(path)).digest("hex");
	} catch {
		return undefined;
	}
}

export function ensureDfPublisherAgent(
	cwd: string,
	pluginRoot?: string,
): string | undefined {
	const agentsDir = join(cwd, ".codex", "agents");
	const codexPath = join(cwd, ".codex");
	const dfPublisherToml = join(agentsDir, "df-publisher.toml");
	const expectedVersion = readPluginVersion(pluginRoot);

	let reinstallReason: string | undefined;
	let targetCanBeHashChecked = false;

	// File exists — check version and schema
	if (existsSync(dfPublisherToml) && expectedVersion) {
		const installedValidation = validateDfPublisherToml(dfPublisherToml);
		if (!installedValidation.valid) {
			reinstallReason = `目标 agent TOML 无效，已自愈重装（${installedValidation.reason}）`;
		} else if (hasLegacyTopLevelVersionField(dfPublisherToml)) {
			reinstallReason = "目标 agent TOML 含旧版顶层 version 字段，已自愈重装";
		} else if (installedValidation.versionMarker === expectedVersion) {
			if (!pluginRoot) return undefined;
			targetCanBeHashChecked = true;
		}
		// Version mismatch or invalid schema — fall through to re-install
	} else if (existsSync(dfPublisherToml) && !expectedVersion) {
		// Can't determine expected version — assume OK
		return undefined;
	}

	// File missing or outdated — try auto-install
	if (pluginRoot) {
		const sourceToml = join(pluginRoot, "agents", "df-publisher.toml");
		if (existsSync(sourceToml)) {
			const sourceValidation = validateDfPublisherToml(sourceToml);
			if (!sourceValidation.valid) {
				return invalidSourceMessage(
					dfPublisherToml,
					pluginRoot,
					sourceToml,
					sourceValidation.reason,
				);
			}
			if (targetCanBeHashChecked) {
				const installedHash = fileHash(dfPublisherToml);
				const sourceHash = fileHash(sourceToml);
				if (installedHash && sourceHash && installedHash !== sourceHash) {
					reinstallReason =
						"目标 agent TOML 与插件源文件 hash 不一致，已自愈重装";
				} else {
					return undefined;
				}
			}
			if (existsSync(codexPath) && statSync(codexPath).isFile()) {
				unlinkSync(codexPath);
			}
			mkdirSync(agentsDir, { recursive: true });
			if (existsSync(dfPublisherToml) && reinstallReason) {
				unlinkSync(dfPublisherToml);
			}
			copyFileSync(sourceToml, dfPublisherToml);
			if (expectedVersion) {
				if (reinstallReason) {
					return `DevOpsFlow: ${reinstallReason}至 v${expectedVersion}（${dfPublisherToml}）`;
				}
				return `DevOpsFlow: df-publisher Codex worker session 定义已更新至 v${expectedVersion}（${dfPublisherToml}）`;
			}
			return `DevOpsFlow: 已自动安装 df-publisher Codex worker session 定义到 ${dfPublisherToml}`;
		}
	}

	const lines = [
		"DevOpsFlow 插件不完整：未找到 df-publisher Codex worker session 定义。",
		`预期位置：${dfPublisherToml}`,
	];
	if (pluginRoot) {
		lines.push(`插件根目录：${pluginRoot}`);
		lines.push("");
		lines.push("请手动复制安装（按平台选择）：");
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

function invalidSourceMessage(
	dfPublisherToml: string,
	pluginRoot: string,
	sourceToml: string,
	reason: string,
): string {
	return [
		"DevOpsFlow 插件不完整：df-publisher Codex worker session 源文件无效。",
		`源文件：${sourceToml}`,
		`原因：${reason}`,
		`目标位置：${dfPublisherToml}`,
		`插件根目录：${pluginRoot}`,
		"",
		"请更新或重新安装 DevOpsFlow 插件后重试，避免复制无法被 Codex 稳定识别的 agent TOML。",
	].join("\n");
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

function writeSessionStartMessage(message: string): void {
	for (const line of message.split("\n")) {
		process.stdout.write(`${line}\n`);
	}
}

function writeToolBlock(): void {
	const lines = [
		"DevOpsFlow 已阻止 git/gh 发布操作。",
		"原因：仅 df-publisher Codex worker session 可执行 git push、git commit、gh issue、gh pr。",
		"",
		"main Codex session 和普通 Codex worker session 可直接执行简单 git/gh 操作（如切换分支、合并、认证），",
		"但提交、推送、PR、issue 管理必须委托 df-publisher Codex worker session 完成。",
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
		const message = ensureDfPublisherAgent(cwd, pluginRoot);
		if (message) {
			writeSessionStartMessage(message);
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
