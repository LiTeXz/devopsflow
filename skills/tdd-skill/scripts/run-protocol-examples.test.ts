import { beforeAll, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = import.meta.dir!;
const EXAMPLES = join(ROOT, "examples");

type ValidateFunc = (stage: string, text: string) => string[];

let validate: ValidateFunc;

beforeAll(async () => {
	const mod = await import("./validate-tdd-protocol");
	validate = mod.validate as ValidateFunc;
});

const CASES = [
	{
		name: "valid_finish",
		stage: "finish",
		file: "valid_finish.md",
		expectErrors: false,
	},
	{
		name: "structured_finish",
		stage: "finish",
		file: "structured_finish.md",
		expectErrors: false,
	},
	{
		name: "greenfield_finish",
		stage: "finish",
		file: "greenfield_finish.md",
		expectErrors: false,
	},
	{
		name: "missing_start",
		stage: "before_edit",
		file: "missing_start.md",
		expectErrors: true,
	},
	{
		name: "vague_red",
		stage: "state",
		file: "vague_red.md",
		expectErrors: true,
	},
];

describe("TDD Protocol Validation", () => {
	for (const testCase of CASES) {
		it(`${testCase.name} (${testCase.stage})`, () => {
			const filePath = join(EXAMPLES, testCase.file);
			const text = readFileSync(filePath, "utf-8");
			const errors = validate(testCase.stage, text);

			if (testCase.expectErrors) {
				expect(errors.length).toBeGreaterThan(0);
			} else {
				expect(errors.length).toBe(0);
			}
		});
	}
});
