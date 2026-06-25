import { beforeAll, describe, expect, it } from "bun:test";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = import.meta.dir!;
const EXAMPLES = join(ROOT, "examples");

function readText(filePath: string): string {
	try {
		const stat = statSync(filePath);
		if (stat.isDirectory()) {
			const { readdirSync } = require("node:fs");
			const parts: string[] = [];
			const files = readdirSync(filePath).sort();
			for (const file of files) {
				if (file.endsWith(".md")) {
					parts.push(`\n# FILE: ${file}\n`);
					parts.push(readFileSync(join(filePath, file), "utf-8"));
				}
			}
			return parts.join("\n");
		}
	} catch {
		// Not a directory
	}
	return readFileSync(filePath, "utf-8");
}

type ValidateFunc = (text: string, requireSections?: boolean) => string[];
let validate: ValidateFunc;

beforeAll(async () => {
	const mod = await import("./validate-ddd-design");
	validate = mod.validateDesign as ValidateFunc;
});

const CASES = [
	{ name: "valid_design", file: "valid_design.md", expectErrors: false },
	{ name: "table_first", file: "table_first.md", expectErrors: true },
	{ name: "flat_admin", file: "flat_admin.md", expectErrors: true },
	{
		name: "full_draft_before_gate",
		file: "full_draft_before_gate.md",
		expectErrors: true,
	},
	{ name: "data_model_echo", file: "data_model_echo.md", expectErrors: true },
	{
		name: "artifact_flooding",
		file: "artifact_flooding.md",
		expectErrors: true,
	},
];

describe("DDD Design Validation", () => {
	for (const testCase of CASES) {
		it(`${testCase.name}`, () => {
			const filePath = join(EXAMPLES, testCase.file);
			const text = readText(filePath);
			const errors = validate(text, testCase.file === "valid_design.md");

			if (testCase.expectErrors) {
				expect(errors.length).toBeGreaterThan(0);
			} else {
				expect(errors.length).toBe(0);
			}
		});
	}
});
