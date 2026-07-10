import {
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { StateStore } from "@/shared/types";

let _statePathEnv = "DEVOPSFLOW_MAIN_AGENT_WRITE_STATE";
let _statePath = join(
	tmpdir(),
	`devopsflow-main-agent-write-sessions-${process.getuid?.() ?? 0}.json`,
);

export function setStatePathForTest(path: string): void {
	_statePath = path;
	_statePathEnv = "DEVOPSFLOW_MAIN_AGENT_WRITE_STATE";
}

export function getStatePathEnv(): string {
	return _statePathEnv;
}

export function statePath(): string {
	const configured = process.env[_statePathEnv];
	return configured ?? _statePath;
}

export function loadState(): StateStore {
	const path = statePath();
	try {
		if (!existsSync(path)) return {};
		const raw = readFileSync(path, "utf-8");
		const value = JSON.parse(raw);
		return value && typeof value === "object" && !Array.isArray(value)
			? (value as StateStore)
			: {};
	} catch {
		return {};
	}
}

export function saveState(state: StateStore): void {
	const path = statePath();
	const dir = dirname(path);
	mkdirSync(dir, { recursive: true });

	const tmp = `${path}.tmp`;
	writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
	renameSync(tmp, path);
}

export function isRegisteredSubagentSession(sessionId: string): boolean {
	return sessionId in loadState();
}

export const DF_PUBLISHER_AGENT_NAME = "df-publisher";

export function isDfPublisherSession(sessionId: string): boolean {
	const state = loadState();
	const session = state[sessionId];
	if (!session?.agent) return false;
	return session.agent.toLowerCase().includes(DF_PUBLISHER_AGENT_NAME);
}
