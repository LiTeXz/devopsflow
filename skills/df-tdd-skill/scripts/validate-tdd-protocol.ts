#!/usr/bin/env bun

import { runLoggedScript } from "@/shared/script-logger";

const TASK_TYPES = new Set([
	"greenfield_feature",
	"bug_fix",
	"pure_refactor",
	"characterize_then_fix",
]);
const WRONG_CONTRACT_PLANS = new Set([
	"none",
	"characterize_only",
	"fix_after_characterization",
]);
const PHASES = new Set([
	"test_written",
	"red_observed",
	"green_reached",
	"refactor_done",
]);
const PHASE_ORDER = [
	"test_written",
	"red_observed",
	"green_reached",
	"refactor_done",
];

function loadText(path?: string): string {
	if (path) {
		return require("node:fs").readFileSync(path, "utf-8") as string;
	}
	const chunks: Buffer[] = [];
	const buf = Buffer.alloc(65536);
	const { readSync: fsRead } = require("node:fs");
	let bytesRead: number;
	// biome-ignore lint/suspicious/noAssignInExpressions: standard read loop pattern
	while ((bytesRead = fsRead(0, buf, 0, buf.length, null)) > 0) {
		chunks.push(Buffer.from(buf.subarray(0, bytesRead)));
	}
	return Buffer.concat(chunks).toString("utf-8");
}

function parseScalar(value: string): unknown {
	value = value.trim();
	if (value === "true") return true;
	if (value === "false") return false;
	if (value === "null" || value === "~") return null;
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function parseProtocolYaml(candidate: string): Record<string, unknown> | null {
	const lines = candidate.split("\n");
	const root: Record<string, unknown> = {};
	let currentKey: string | null = null;
	let currentMap: Record<string, unknown> | null = null;
	let currentListKey: string | null = null;
	let currentListItem: Record<string, unknown> | null = null;

	for (const raw of lines) {
		if (!raw.trim() || raw.trimStart().startsWith("#")) continue;

		const indent = raw.length - raw.trimStart().length;
		const line = raw.trim();

		if (indent === 0) {
			if (!line.endsWith(":")) return null;
			currentKey = line.slice(0, -1);
			currentMap = {};
			root[currentKey] = currentMap;
			currentListKey = null;
			currentListItem = null;
			continue;
		}

		if (!currentMap) return null;

		if (indent === 2) {
			if (!line.includes(":")) return null;
			const colonIdx = line.indexOf(":");
			const key = line.slice(0, colonIdx).trim();
			const value = line.slice(colonIdx + 1).trim();
			if (value) {
				currentMap[key] = parseScalar(value);
				currentListKey = null;
				currentListItem = null;
			} else {
				const list: unknown[] = [];
				currentMap[key] = list;
				currentListKey = key;
				currentListItem = null;
			}
			continue;
		}

		if (indent === 4 && currentListKey) {
			if (!line.startsWith("- ")) return null;
			const item = line.slice(2);
			if (item.includes(":")) {
				const colonIdx = item.indexOf(":");
				const key = item.slice(0, colonIdx).trim();
				const value = item.slice(colonIdx + 1).trim();
				currentListItem = { [key]: parseScalar(value) };
				(currentMap[currentListKey] as unknown[]).push(currentListItem);
			} else {
				currentListItem = null;
				(currentMap[currentListKey] as unknown[]).push(parseScalar(item));
			}
			continue;
		}

		if (indent === 6 && currentListKey && currentListItem) {
			if (!line.includes(":")) return null;
			const colonIdx = line.indexOf(":");
			const key = line.slice(0, colonIdx).trim();
			const value = line.slice(colonIdx + 1).trim();
			currentListItem[key] = parseScalar(value);
			continue;
		}

		return null;
	}

	return Object.keys(root).length ? root : null;
}

function extractYamlDocuments(text: string): Record<string, unknown>[] {
	const docs: Record<string, unknown>[] = [];

	const fencedRegex = /```(?:yaml|yml)\s*\n([\s\S]*?)```/gi;
	const fencedContents: string[] = [];
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration pattern
	while ((match = fencedRegex.exec(text)) !== null) {
		fencedContents.push(match[1]);
	}

	const candidates = fencedContents.length ? fencedContents : [text];

	for (const candidate of candidates) {
		const doc = parseProtocolYaml(candidate);
		if (doc && typeof doc === "object") {
			docs.push(doc);
		}
	}

	return docs;
}

interface TddBlock {
	[key: string]: unknown;
}

function collectBlocks(docs: Record<string, unknown>[]): {
	start: TddBlock | null;
	states: TddBlock[];
	finish: TddBlock | null;
} {
	let start: TddBlock | null = null;
	const states: TddBlock[] = [];
	let finish: TddBlock | null = null;

	for (const doc of docs) {
		if (
			typeof doc.tdd_start === "object" &&
			doc.tdd_start &&
			!Array.isArray(doc.tdd_start)
		) {
			start = doc.tdd_start as TddBlock;
		}
		if (
			typeof doc.tdd_state === "object" &&
			doc.tdd_state &&
			!Array.isArray(doc.tdd_state)
		) {
			states.push(doc.tdd_state as TddBlock);
		}
		if (
			typeof doc.tdd_finish === "object" &&
			doc.tdd_finish &&
			!Array.isArray(doc.tdd_finish)
		) {
			finish = doc.tdd_finish as TddBlock;
		}
	}

	return { start, states, finish };
}

function isBlank(value: unknown): boolean {
	return (
		value === null ||
		value === undefined ||
		(typeof value === "string" && !value.trim())
	);
}

function requireFields(
	block: TddBlock,
	fields: string[],
	prefix: string,
	errors: string[],
): void {
	for (const field of fields) {
		if (!(field in block) || isBlank(block[field])) {
			errors.push(`${prefix}.${field} is required`);
		}
	}
}

function validateStart(start: TddBlock | null): string[] {
	const errors: string[] = [];
	if (!start) return ["tdd_start is required before editing production code"];

	requireFields(
		start,
		[
			"task_type",
			"protected_behavior",
			"stable_boundary",
			"first_test_to_write",
			"expected_red_reason",
			"current_contract_wrong",
			"wrong_contract_plan",
		],
		"tdd_start",
		errors,
	);

	const taskType = start.task_type as string;
	if (!TASK_TYPES.has(taskType)) {
		errors.push(
			`tdd_start.task_type must be one of ${[...TASK_TYPES].sort().join(", ")}`,
		);
	}

	const plan = start.wrong_contract_plan as string;
	if (!WRONG_CONTRACT_PLANS.has(plan)) {
		errors.push(
			`tdd_start.wrong_contract_plan must be one of ${[...WRONG_CONTRACT_PLANS].sort().join(", ")}`,
		);
	}

	if (start.current_contract_wrong === true && plan === "none") {
		errors.push(
			"tdd_start.wrong_contract_plan cannot be none when current_contract_wrong is true",
		);
	}

	if (
		taskType === "characterize_then_fix" &&
		plan !== "fix_after_characterization"
	) {
		errors.push(
			"characterize_then_fix requires wrong_contract_plan: fix_after_characterization",
		);
	}

	return errors;
}

function validateStates(
	states: TddBlock[],
	requireRed: boolean = false,
): string[] {
	const errors: string[] = [];
	const observed: string[] = [];

	for (let index = 0; index < states.length; index++) {
		const state = states[index];
		const idx = index + 1;
		const phase = state.phase as string;
		const evidence = state.evidence as string;

		if (!PHASES.has(phase)) {
			errors.push(
				`tdd_state[${idx}].phase must be one of ${[...PHASES].sort().join(", ")}`,
			);
			continue;
		}
		if (isBlank(evidence)) {
			errors.push(`tdd_state[${idx}].evidence is required`);
		}

		const phasePosition = PHASE_ORDER.indexOf(phase);
		const missingPrevious = PHASE_ORDER.slice(0, phasePosition).filter(
			(p) => !observed.includes(p),
		);
		if (missingPrevious.length) {
			errors.push(
				`tdd_state[${idx}].phase ${phase} is out of order; missing ${JSON.stringify(missingPrevious)}`,
			);
		}

		observed.push(phase);

		if (phase === "red_observed") {
			const lowered = String(evidence).toLowerCase();
			const tokens = [
				"fail",
				"red",
				"失败",
				"红",
				"expected",
				"预期",
				"reason",
				"原因",
			];
			if (!tokens.some((t) => lowered.includes(t))) {
				errors.push(
					"red_observed evidence should explain the failure reason and target risk",
				);
			}
			if (state.exit_code === 0 || state.exit_code === "0") {
				errors.push("red_observed exit_code should be non-zero when recorded");
			}
			if (isBlank(state.command)) {
				errors.push(
					"red_observed command is required, or use command: none with explanation in evidence",
				);
			}
		}
		if (phase === "green_reached") {
			if (
				state.exit_code !== undefined &&
				state.exit_code !== 0 &&
				state.exit_code !== "0" &&
				state.exit_code !== null
			) {
				errors.push("green_reached exit_code should be 0 when recorded");
			}
			if (isBlank(state.command)) {
				errors.push(
					"green_reached command is required, or use command: none with explanation in evidence",
				);
			}
		}
	}

	if (requireRed && !observed.includes("red_observed")) {
		errors.push("red_observed state is required");
	}

	return errors;
}

function testRunPhase(item: unknown): string | null {
	if (item && typeof item === "object" && !Array.isArray(item)) {
		const obj = item as Record<string, unknown>;
		const phase = obj.phase;
		return phase != null ? String(phase) : null;
	}
	const text = String(item).toLowerCase();
	const redTokens = ["red", "fail", "failed", "失败", "红"];
	if (redTokens.some((t) => text.includes(t))) return "red";
	const greenTokens = ["green", "pass", "passed", "通过", "绿", "final"];
	if (greenTokens.some((t) => text.includes(t))) return "green";
	return null;
}

function validateTestsRun(testsRun: unknown): {
	errors: string[];
	phases: Set<string>;
} {
	const errors: string[] = [];
	const phases = new Set<string>();

	if (!Array.isArray(testsRun) || !testsRun.length) {
		return {
			errors: ["tdd_finish.tests_run must be a non-empty list"],
			phases,
		};
	}

	testsRun.forEach((item, index) => {
		const idx = index + 1;
		if (isBlank(item)) {
			errors.push(`tdd_finish.tests_run[${idx}] must not be blank`);
			return;
		}

		const phase = testRunPhase(item);
		if (phase) phases.add(phase);

		if (item && typeof item === "object" && !Array.isArray(item)) {
			const obj = item as Record<string, unknown>;
			const command = obj.command;
			const evidence = obj.evidence;
			const exitCode = obj.exit_code;

			if (!phase || !["red", "green", "final"].includes(phase)) {
				errors.push(
					`tdd_finish.tests_run[${idx}].phase must be red, green, or final`,
				);
			}
			if (isBlank(command)) {
				errors.push(`tdd_finish.tests_run[${idx}].command is required`);
			}
			if (isBlank(evidence)) {
				errors.push(`tdd_finish.tests_run[${idx}].evidence is required`);
			}
			if (phase === "red" && (exitCode === 0 || exitCode === "0")) {
				errors.push(
					`tdd_finish.tests_run[${idx}].exit_code should be non-zero for red`,
				);
			}
			if (
				["green", "final"].includes(phase as string) &&
				exitCode !== undefined &&
				exitCode !== 0 &&
				exitCode !== "0" &&
				exitCode !== null
			) {
				errors.push(
					`tdd_finish.tests_run[${idx}].exit_code should be 0 for green/final`,
				);
			}
		} else {
			const lowered = String(item).toLowerCase();
			if (!phase) {
				errors.push(
					`tdd_finish.tests_run[${idx}] should include a red/green/final phase hint or use a structured entry`,
				);
			}
			const cmdTokens = [
				"test",
				"pytest",
				"cargo",
				"mvn",
				"gradle",
				"npm",
				"pnpm",
				"go test",
				"passed",
				"failed",
				"通过",
				"失败",
			];
			if (!cmdTokens.some((t) => lowered.includes(t))) {
				errors.push(
					`tdd_finish.tests_run[${idx}] should include a command, test name, or concrete result`,
				);
			}
		}
	});

	return { errors, phases };
}

function validateFinish(finish: TddBlock | null): string[] {
	const errors: string[] = [];
	if (!finish) return ["tdd_finish is required before reporting completion"];

	requireFields(
		finish,
		[
			"task_type",
			"red_observed",
			"green_reached",
			"refactor_performed",
			"tests_run",
			"current_contract_wrong",
			"wrong_contract_characterized",
			"wrong_contract_fixed",
			"residual_risk",
		],
		"tdd_finish",
		errors,
	);

	const taskType = finish.task_type as string;
	if (!TASK_TYPES.has(taskType)) {
		errors.push(
			`tdd_finish.task_type must be one of ${[...TASK_TYPES].sort().join(", ")}`,
		);
	}

	if (finish.red_observed !== true) {
		errors.push("tdd_finish.red_observed must be true");
	}
	if (finish.green_reached !== true) {
		errors.push("tdd_finish.green_reached must be true");
	}

	const { errors: testErrors, phases: testPhases } = validateTestsRun(
		finish.tests_run,
	);
	errors.push(...testErrors);
	if (finish.red_observed === true && !testPhases.has("red")) {
		errors.push("tdd_finish.tests_run should include red phase evidence");
	}
	if (
		finish.green_reached === true &&
		!(testPhases.has("green") || testPhases.has("final"))
	) {
		errors.push(
			"tdd_finish.tests_run should include green or final phase evidence",
		);
	}

	if (
		finish.current_contract_wrong === true &&
		finish.wrong_contract_characterized !== true
	) {
		errors.push(
			"wrong current contracts must be characterized before completion",
		);
	}

	if (
		taskType === "characterize_then_fix" &&
		finish.wrong_contract_fixed !== true
	) {
		errors.push(
			"characterize_then_fix requires tdd_finish.wrong_contract_fixed: true, or the task is not complete",
		);
	}

	return errors;
}

export function validate(stage: string, text: string): string[] {
	const docs = extractYamlDocuments(text);
	const { start, states, finish } = collectBlocks(docs);

	if (stage === "before_edit") return validateStart(start);
	if (stage === "state")
		return [...validateStart(start), ...validateStates(states)];
	if (stage === "finish")
		return [
			...validateStart(start),
			...validateStates(states, true),
			...validateFinish(finish),
		];
	throw new Error(`Unknown stage: ${stage}`);
}

function main(): number {
	const rawArgs = Bun.argv;
	const scriptIdx = rawArgs.findIndex((a) =>
		a.includes("validate-tdd-protocol"),
	);
	const args = scriptIdx >= 0 ? rawArgs.slice(scriptIdx + 1) : rawArgs.slice(2);

	let stage = "";
	let inputPath: string | undefined;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--stage" && i + 1 < args.length) {
			stage = args[++i];
		} else if (args[i] === "--input" && i + 1 < args.length) {
			inputPath = args[++i];
		}
	}

	if (!["before_edit", "state", "finish"].includes(stage)) {
		console.error(
			"Usage: validate-tdd-protocol.ts --stage <stage> [--input <file>]",
		);
		return 1;
	}

	const errors = validate(stage, loadText(inputPath));
	if (errors.length) {
		for (const error of errors) {
			console.error(`ERROR: ${error}`);
		}
		return 1;
	}

	console.log("TDD protocol valid");
	return 0;
}

if (import.meta.main) {
	process.exit(
		runLoggedScript({ scriptName: "validate-tdd-protocol" }, () => main()),
	);
}
