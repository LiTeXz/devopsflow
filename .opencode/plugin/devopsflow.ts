import { shouldBlockOpenCodeToolInput } from "../../src/shared/opencode-adapter";

interface OpenCodeHookOutput {
	args?: unknown;
}

interface OpenCodePluginInput {
	directory?: unknown;
	project?: unknown;
}

function writeBlockMessage(reason: string): void {
	process.stderr.write(
		`DevOpsFlow 已阻止 OpenCode 工具调用。\n原因：${reason}。\n`,
	);
}

export default async function devopsflowOpenCodePlugin(
	pluginInput: OpenCodePluginInput = {},
) {
	return {
		"tool.execute.before": async (
			input: unknown,
			output: OpenCodeHookOutput = {},
		) => {
			const decision = shouldBlockOpenCodeToolInput({
				...pluginInput,
				...(typeof input === "object" && input !== null
					? (input as Record<string, unknown>)
					: {}),
				...(typeof output.args === "object" && output.args !== null
					? { args: output.args }
					: {}),
			});
			if (!decision) return;

			writeBlockMessage(decision.reason);
			throw new Error(decision.reason);
		},
	};
}
