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
const intermediateSlug = ["dev", "flow"].join("");
const currentSlug = "devopsflow";
const repository = `LiTeXz/${currentSlug}`;
const repositoryUrl = `https://github.com/${repository}`;
const migrationDocument = "README.md";
const legacyCode = ["`", legacySlug, "`"].join("");
const namingPath = [
	legacyCode,
	" → ",
	["`", intermediateSlug, "`"].join(""),
	" → ",
	["`", currentSlug, "`"].join(""),
].join("");

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
				projectPath === migrationDocument ? legacyCode : "",
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
		expect(pluginJson.homepage).toBe(repositoryUrl);
		expect(pluginJson.repository).toBe(repositoryUrl);
		expect(pluginJson.interface.websiteURL).toBe(repositoryUrl);
		const pluginDescription = [
			pluginJson.description,
			pluginJson.interface.longDescription,
		].join(" ");
		for (const capability of ["skills", "hooks", "MCP", "agent harness"]) {
			expect(pluginDescription).toContain(capability);
		}
	});

	it("documents project scope, naming rationale, and migration rules", () => {
		const readme = readFileSync(join(ROOT, migrationDocument), "utf-8");

		expect(readme).toContain(namingPath);
		for (const capability of [
			"skills",
			"hooks",
			"MCP",
			"agent",
			"agent harness",
		]) {
			expect(readme).toContain(capability);
		}
		for (const testLayer of [
			"单元测试",
			"功能性测试",
			"集成测试",
			"属性测试",
			"灰度测试",
			"线上问题排查测试",
		]) {
			expect(readme).toContain(testLayer);
		}
		expect(readme).toContain(`codex plugin marketplace add ${repository}`);
		expect(readme).toContain("历史 Git 提交、标签和发布记录保持不变");
	});
});
