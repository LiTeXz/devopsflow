import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

// biome-ignore lint/style/noNonNullAssertion: import.meta.dir is always defined at runtime
const ROOT = join(import.meta.dir!, "..");
const EXCLUDED_DIRECTORIES = new Set([".git", "node_modules"]);
const TEXT_EXTENSIONS = new Set([
	"",
	".json",
	".md",
	".toml",
	".ts",
	".yml",
	".yaml",
	".svg",
]);

const legacySlug = ["dev", "flow-skills"].join("");
const legacyBrand = ["Dev", "Flow"].join("");
const legacyUpper = ["DEV", "FLOW"].join("");
const legacyDotDirectory = [".dev", "flow"].join("");
const allowedGithubSource = `LiTeXz/${legacySlug}`;

function collectTextFiles(directory: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(directory)) {
		if (EXCLUDED_DIRECTORIES.has(entry)) continue;
		const path = join(directory, entry);
		if (statSync(path).isDirectory()) {
			files.push(...collectTextFiles(path));
		} else if (TEXT_EXTENSIONS.has(extname(entry))) {
			files.push(path);
		}
	}
	return files;
}

describe("DevOpsFlow project identity", () => {
	it("contains no legacy internal branding or filenames", () => {
		for (const file of collectTextFiles(ROOT)) {
			const projectPath = relative(ROOT, file).replaceAll("\\", "/");
			expect(projectPath, projectPath).not.toContain(legacySlug);

			const content = readFileSync(file, "utf-8").replaceAll(
				allowedGithubSource,
				"",
			);
			expect(content, projectPath).not.toContain(legacySlug);
			expect(content, projectPath).not.toContain(legacyBrand);
			expect(content, projectPath).not.toContain(legacyUpper);
			expect(content, projectPath).not.toContain(legacyDotDirectory);
		}
	});

	it("uses the new package and plugin identity", () => {
		const packageJson = JSON.parse(
			readFileSync(join(ROOT, "package.json"), "utf-8"),
		);
		const pluginJson = JSON.parse(
			readFileSync(join(ROOT, ".codex-plugin", "plugin.json"), "utf-8"),
		);

		expect(packageJson.name).toBe("devopsflow");
		expect(pluginJson.name).toBe("devopsflow");
		expect(pluginJson.interface.displayName).toBe("DevOpsFlow");
	});
});
