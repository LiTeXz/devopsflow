import type { BlockDecision, ToolInput } from "@/shared/types";
import { shouldBlockOpenCodeTool } from "../../scripts/prevent-main-agent-write";

type UnknownRecord = Record<string, unknown>;

export interface OpenCodeToolBeforeInput {
	readonly tool?: unknown;
	readonly toolName?: unknown;
	readonly name?: unknown;
	readonly args?: unknown;
	readonly input?: unknown;
	readonly agent?: unknown;
	readonly agentName?: unknown;
	readonly mode?: unknown;
	readonly session?: unknown;
	readonly project?: unknown;
	readonly directory?: unknown;
	readonly cwd?: unknown;
}

export function isOpenCodeDfPublisher(input: OpenCodeToolBeforeInput): boolean {
	const name =
		stringValue(input.agentName) ??
		stringValue(input.agent) ??
		stringValue(recordValue(input.agent, "name")) ??
		stringValue(recordValue(input.agent, "id")) ??
		stringValue(recordValue(input.session, "agentName")) ??
		stringValue(recordValue(recordValue(input.session, "agent"), "name"));
	if (!name) return false;
	return name.toLowerCase().includes("df-publisher");
}

export function shouldBlockOpenCodeToolInput(
	input: OpenCodeToolBeforeInput,
): BlockDecision | undefined {
	const toolName = findOpenCodeToolName(input);
	const toolInput = findOpenCodeToolInput(input);
	const cwd = findOpenCodeCwd(input, toolInput);
	return shouldBlockOpenCodeTool(
		toolName,
		toolInput,
		isOpenCodeSubagent(input),
		cwd,
		isOpenCodeDfPublisher(input),
	);
}

export function isOpenCodeSubagent(input: OpenCodeToolBeforeInput): boolean {
	const mode =
		stringValue(input.mode) ??
		stringValue(recordValue(input.agent, "mode")) ??
		stringValue(recordValue(input.session, "agentMode")) ??
		stringValue(recordValue(recordValue(input.session, "agent"), "mode"));
	if (mode) return mode === "subagent";

	const name =
		stringValue(input.agentName) ??
		stringValue(input.agent) ??
		stringValue(recordValue(input.agent, "name")) ??
		stringValue(recordValue(input.agent, "id")) ??
		stringValue(recordValue(input.session, "agentName")) ??
		stringValue(recordValue(recordValue(input.session, "agent"), "name"));

	return isSubagentName(name);
}

function findOpenCodeToolName(input: OpenCodeToolBeforeInput): string {
	const name =
		stringValue(input.tool) ??
		stringValue(recordValue(input.tool, "name")) ??
		stringValue(recordValue(input.tool, "id")) ??
		stringValue(input.toolName) ??
		stringValue(input.name) ??
		"";
	return normalizeOpenCodeToolName(name);
}

function normalizeOpenCodeToolName(name: string): string {
	switch (name.toLowerCase()) {
		case "bash":
		case "shell":
			return "Bash";
		case "edit":
			return "Edit";
		case "write":
			return "Write";
		case "multiedit":
		case "multi_edit":
			return "MultiEdit";
		case "apply_patch":
		case "patch":
			return "apply_patch";
		default:
			return name;
	}
}

function findOpenCodeToolInput(input: OpenCodeToolBeforeInput): ToolInput {
	const args = asRecord(input.args) ?? asRecord(input.input) ?? {};
	const command = stringValue(args.command) ?? stringValue(args.cmd);
	const workdir =
		stringValue(args.workdir) ??
		stringValue(args.cwd) ??
		stringValue(args.directory);
	return {
		...args,
		...(command ? { command } : {}),
		...(workdir ? { workdir } : {}),
	};
}

function findOpenCodeCwd(
	input: OpenCodeToolBeforeInput,
	toolInput: ToolInput,
): string | undefined {
	return (
		stringValue(toolInput.workdir) ??
		stringValue(input.cwd) ??
		stringValue(input.directory) ??
		stringValue(recordValue(input.project, "directory")) ??
		stringValue(recordValue(input.project, "cwd"))
	);
}

function isSubagentName(name: string | undefined): boolean {
	if (!name) return false;
	const normalized = name.toLowerCase();
	return normalized.includes("subagent") || normalized.includes("worker");
}

function recordValue(value: unknown, key: string): unknown {
	return asRecord(value)?.[key];
}

function asRecord(value: unknown): UnknownRecord | undefined {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as UnknownRecord)
		: undefined;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value : undefined;
}
