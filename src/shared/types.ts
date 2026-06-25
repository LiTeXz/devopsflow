export interface BlockDecision {
	readonly branch: string;
	readonly reason: string;
	readonly action: "write" | "session" | "escalation";
	readonly escalation: boolean;
}

export function createBlockDecision(
	branch: string,
	reason: string,
	action: "write" | "session" | "escalation" = "write",
): BlockDecision {
	return {
		branch,
		reason,
		action,
		escalation: action === "escalation",
	} as const;
}

export interface Payload {
	tool_name?: string;
	toolName?: string;
	tool?: string;
	hook_event_name?: string;
	hookEventName?: string;
	event?: string;
	tool_input?: ToolInput;
	toolInput?: ToolInput;
	cwd?: string;
	session_id?: string;
	sessionId?: string;
	agent_type?: string;
	agentType?: string;
	agentName?: string;
	agentDisplayName?: string;
	[key: string]: unknown;
}

export interface ToolInput {
	command?: string;
	cmd?: string;
	workdir?: string;
	[key: string]: unknown;
}

export interface SessionState {
	agent?: string;
}

export interface StateStore {
	[sessionId: string]: SessionState;
}
