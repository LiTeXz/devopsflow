import { readSync } from "node:fs";
import type { Payload, ToolInput } from "@/shared/types";

const COMMAND_KEYS = ["command", "cmd"] as const;
const SESSION_KEYS = ["session_id", "sessionId"] as const;

export const SESSION_HOOK_NAMES = new Set([
	"SessionStart",
	"session_start",
	"sessionStart",
]);
export const SUBAGENT_START_EVENTS = new Set([
	"SubagentStart",
	"subagent_start",
	"subagentStart",
]);
export const SUBAGENT_STOP_EVENTS = new Set([
	"SubagentStop",
	"subagent_stop",
	"subagentStop",
]);
export const PRE_TOOL_USE_EVENTS = new Set([
	"PreToolUse",
	"pre_tool_use",
	"preToolUse",
	"",
]);

export const SHELL_TOOL_NAMES = new Set([
	"Bash",
	"shell",
	"exec",
	"exec_command",
	"unified_exec",
]);
export const DIRECT_WRITE_TOOL_NAMES = new Set([
	"Write",
	"Edit",
	"MultiEdit",
	"NotebookEdit",
	"apply_patch",
]);
export const SUBAGENT_TOOL_NAMES = new Set([
	"Task",
	"delegate_task",
	"SubagentStart",
	"subagent_start",
	"WorkerStart",
	"worker_start",
]);

export function readPayload(): Payload | null {
	try {
		const chunks: Buffer[] = [];
		const buf = Buffer.alloc(65536);
		let bytesRead: number;
		// biome-ignore lint/suspicious/noAssignInExpressions: standard read loop pattern
		while ((bytesRead = readSync(0, buf, 0, buf.length, null)) > 0) {
			chunks.push(Buffer.from(buf.subarray(0, bytesRead)));
		}
		const raw = Buffer.concat(chunks).toString("utf-8");
		if (!raw.trim()) return null;
		return JSON.parse(raw) as Payload;
	} catch {
		return null;
	}
}

export function findHookEvent(payload: Payload): string {
	const value =
		payload.hook_event_name ?? payload.hookEventName ?? payload.event;
	return typeof value === "string" ? value : "";
}

export function findToolName(payload: Payload): string {
	const value = payload.tool_name ?? payload.toolName ?? payload.tool;
	return typeof value === "string" ? value : "";
}

export function findToolInput(payload: Payload): ToolInput | null {
	const value = payload.tool_input ?? payload.toolInput;
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as ToolInput)
		: null;
}

export function findCommand(toolInput: ToolInput): string | undefined {
	for (const key of COMMAND_KEYS) {
		const value = toolInput[key];
		if (typeof value === "string" && value.trim()) return value;
	}
	return undefined;
}

export function findWorkdir(payload: Payload, toolInput: ToolInput): string {
	const toolWorkdir = findToolWorkdir(toolInput);
	if (toolWorkdir) return toolWorkdir;
	const cwdValue = payload.cwd;
	if (typeof cwdValue === "string" && cwdValue.trim()) return cwdValue;
	return process.cwd();
}

export function findToolWorkdir(toolInput: ToolInput): string | undefined {
	const value = toolInput.workdir;
	if (typeof value === "string" && value.trim()) return value;
	return undefined;
}

export function findSessionId(payload: Payload): string | undefined {
	for (const key of SESSION_KEYS) {
		const value = payload[key];
		if (typeof value === "string" && value.trim()) return value;
	}
	return undefined;
}

export function findAgentName(payload: Payload): string {
	const values = [
		payload.agent_type,
		payload.agentType,
		payload.agentName,
		payload.agentDisplayName,
	];
	return values
		.filter((v): v is string => typeof v === "string")
		.join(" ")
		.trim();
}
