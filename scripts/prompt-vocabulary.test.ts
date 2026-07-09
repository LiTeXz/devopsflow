import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = join(import.meta.dir!, "..");

const PROMPT_VISIBLE_FILES = [
	"README.md",
	".codex-plugin/plugin.json",
	"agents/df-publisher.toml",
	"scripts/prevent-git-github-operations.ts",
	"scripts/prevent-main-agent-write.ts",
];

describe("prompt-visible Codex role vocabulary", () => {
	it("uses Codex worker wording instead of mixed agent identities", () => {
		for (const file of PROMPT_VISIBLE_FILES) {
			const content = readFileSync(join(ROOT, file), "utf-8");
			expect(content, file).not.toContain("worker/subagent");
			expect(content, file).not.toContain("Worker/subagent");
			expect(content, file).not.toContain("子代理");
			expect(content, file).not.toMatch(/Claude Code|CLAUDE_[A-Z_]+/);
		}
	});

	it("keeps plugin default prompts free of subagent identity wording", () => {
		const plugin = readFileSync(
			join(ROOT, ".codex-plugin/plugin.json"),
			"utf-8",
		);
		expect(plugin).not.toMatch(/subagent|worker\/subagent/i);
		expect(plugin).toContain("Codex worker session");
	});
});
