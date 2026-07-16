#!/usr/bin/env bun

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { runLoggedScript } from "@/shared/script-logger";

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = dirname(import.meta.dir!);
const SKILL = join(ROOT, "SKILL.md");
const TEMPLATES = join(ROOT, "templates");

const EXPECTED_TEMPLATES: Record<string, string[]> = {
	"tdd_start.yaml": [
		"tdd_start:",
		"task_type:",
		"protected_behavior:",
		"stable_boundary:",
		"first_test_to_write:",
		"expected_red_reason:",
		"current_contract_wrong:",
		"wrong_contract_plan:",
	],
	"tdd_state.yaml": [
		"tdd_state:",
		"phase:",
		"command:",
		"exit_code:",
		"evidence:",
	],
	"tdd_finish.yaml": [
		"tdd_finish:",
		"task_type:",
		"red_observed:",
		"green_reached:",
		"refactor_performed:",
		"tests_run:",
		"phase:",
		"command:",
		"exit_code:",
		"evidence:",
		"current_contract_wrong:",
		"wrong_contract_characterized:",
		"wrong_contract_fixed:",
		"residual_risk:",
	],
};

function fail(message: string): number {
	console.error(`ERROR: ${message}`);
	return 1;
}

function main(): number {
	const skillText = readFileSync(SKILL, "utf-8");

	for (const blockName of ["tdd_start", "tdd_state", "tdd_finish"]) {
		if (!new RegExp(`templates/${blockName}\\.yaml`).test(skillText)) {
			return fail(`SKILL.md must reference templates/${blockName}.yaml`);
		}
		if (new RegExp(`\`\`\`ya?ml\\s*\\n${blockName}:`).test(skillText)) {
			return fail(`SKILL.md must not inline the ${blockName} YAML schema`);
		}
	}

	for (const [filename, requiredTokens] of Object.entries(EXPECTED_TEMPLATES)) {
		const path = join(TEMPLATES, filename);
		if (!existsSync(path)) {
			return fail(`Missing template: ${filename}`);
		}
		const templateText = readFileSync(path, "utf-8");
		for (const token of requiredTokens) {
			if (!templateText.includes(token)) {
				return fail(`${filename} is missing ${token}`);
			}
		}
	}

	console.log("Template extraction valid");
	return 0;
}

if (import.meta.main) {
	process.exit(
		runLoggedScript({ scriptName: "check-template-extraction" }, () => main()),
	);
}
