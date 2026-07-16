import { afterEach, describe, expect, it } from "bun:test";
import {
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runLoggedScript } from "@/shared/script-logger";

interface LogEntry {
	timestamp: string;
	level: string;
	event: string;
	script: string;
	sessionId: string;
	message?: string;
	exitCode?: number;
}

const tempDirs: string[] = [];
const repositoryRoot = join(import.meta.dir, "..");
const operationalScriptPaths = [
	"scripts/check-skill-metadata.ts",
	"scripts/prevent-git-github-operations.ts",
	"scripts/prevent-main-agent-write.ts",
	"scripts/prevent-protected-branch-push.ts",
	"skills/df-codex-assets/scripts/df-codex-assets.ts",
	"skills/df-ddd-event-storming-design/scripts/validate-ddd-design.ts",
	"skills/df-iam-access-control-design/scripts/validate-authorization-identifiers.ts",
	"skills/df-tdd-skill/scripts/check-template-extraction.ts",
	"skills/df-tdd-skill/scripts/validate-tdd-protocol.ts",
] as const;

function createPluginRoot(): string {
	const root = mkdtempSync(join(tmpdir(), "devopsflow-script-logging-"));
	tempDirs.push(root);
	return root;
}

function logFiles(pluginRoot: string): string[] {
	return readdirSync(join(pluginRoot, ".logs")).sort();
}

function logEntries(pluginRoot: string, fileName: string): LogEntry[] {
	return readFileSync(join(pluginRoot, ".logs", fileName), "utf-8")
		.trim()
		.split("\n")
		.map((line) => JSON.parse(line) as LogEntry);
}

afterEach(() => {
	for (const tempDir of tempDirs.splice(0)) {
		rmSync(tempDir, { recursive: true, force: true });
	}
});

describe("script session logging", () => {
	it("creates a sortable minute-sessionId log file under the plugin root", () => {
		const pluginRoot = createPluginRoot();

		const exitCode = runLoggedScript(
			{
				pluginRoot,
				scriptName: "example-script",
				sessionId: "session-abc",
				now: new Date(2026, 6, 16, 9, 5, 30),
			},
			() => 0,
		);

		expect(exitCode).toBe(0);
		expect(logFiles(pluginRoot)).toEqual(["202607160905-session-abc.log"]);
		expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])).toMatchObject([
			{
				level: "info",
				event: "script.start",
				script: "example-script",
				sessionId: "session-abc",
			},
			{
				level: "info",
				event: "script.finish",
				script: "example-script",
				sessionId: "session-abc",
				exitCode: 0,
			},
		]);
	});

	it("appends later executions from the same session to its first log file", () => {
		const pluginRoot = createPluginRoot();

		runLoggedScript(
			{
				pluginRoot,
				scriptName: "first-script",
				sessionId: "same-session",
				now: new Date(2026, 6, 16, 9, 5),
			},
			() => 0,
		);
		runLoggedScript(
			{
				pluginRoot,
				scriptName: "second-script",
				sessionId: "same-session",
				now: new Date(2026, 6, 16, 10, 45),
			},
			() => 2,
		);

		expect(logFiles(pluginRoot)).toEqual(["202607160905-same-session.log"]);
		expect(
			logEntries(pluginRoot, logFiles(pluginRoot)[0]).map(
				(entry) => `${entry.script}:${entry.event}:${entry.exitCode ?? ""}`,
			),
		).toEqual([
			"first-script:script.start:",
			"first-script:script.finish:0",
			"second-script:script.start:",
			"second-script:script.finish:2",
		]);
	});

	it("uses payload sessionId and keeps different sessions separate", () => {
		const pluginRoot = createPluginRoot();

		runLoggedScript(
			{
				pluginRoot,
				scriptName: "snake-session",
				payload: { session_id: "session-one" },
				now: new Date(2026, 6, 16, 9, 5),
			},
			() => 0,
		);
		runLoggedScript(
			{
				pluginRoot,
				scriptName: "camel-session",
				payload: { sessionId: "session-two" },
				now: new Date(2026, 6, 16, 9, 6),
			},
			() => 0,
		);

		expect(logFiles(pluginRoot)).toEqual([
			"202607160905-session-one.log",
			"202607160906-session-two.log",
		]);
	});

	it("keeps sessionIds with different unsafe filename characters separate", () => {
		const pluginRoot = createPluginRoot();

		for (const sessionId of ["session/a", "session?a"]) {
			runLoggedScript(
				{
					pluginRoot,
					scriptName: "encoded-session",
					sessionId,
					now: new Date(2026, 6, 16, 9, 5),
				},
				() => 0,
			);
		}

		expect(logFiles(pluginRoot)).toEqual([
			"202607160905-session%2Fa.log",
			"202607160905-session%3Fa.log",
		]);
	});

	it("records console output and thrown errors without swallowing the error", () => {
		const pluginRoot = createPluginRoot();

		expect(() =>
			runLoggedScript(
				{
					pluginRoot,
					scriptName: "failing-script",
					sessionId: "failure-session",
					now: new Date(2026, 6, 16, 9, 5),
				},
				() => {
					console.error("diagnostic output");
					throw new Error("boom");
				},
			),
		).toThrow("boom");

		const entries = logEntries(pluginRoot, logFiles(pluginRoot)[0]);
		expect(entries).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					level: "error",
					event: "script.output",
					message: "diagnostic output",
				}),
				expect.objectContaining({
					level: "error",
					event: "script.error",
					message: "boom",
				}),
			]),
		);
	});

	it("does not change script behavior when the log directory cannot be created", () => {
		const pluginRootFile = join(createPluginRoot(), "not-a-directory");
		writeFileSync(pluginRootFile, "blocking file");

		const exitCode = runLoggedScript(
			{
				pluginRoot: pluginRootFile,
				scriptName: "resilient-script",
				sessionId: "resilient-session",
			},
			() => 7,
		);

		expect(exitCode).toBe(7);
	});
});

describe("operational script logging coverage", () => {
	it("uses the hook payload sessionId in a real script process", () => {
		const pluginRoot = createPluginRoot();
		const payloadPath = join(pluginRoot, "payload.json");
		writeFileSync(
			payloadPath,
			JSON.stringify({
				cwd: repositoryRoot,
				hook_event_name: "SessionStart",
				session_id: "hook-session",
			}),
		);

		const result = Bun.spawnSync({
			cmd: [process.execPath, "scripts/prevent-main-agent-write.ts"],
			cwd: repositoryRoot,
			env: { ...process.env, PLUGIN_ROOT: pluginRoot },
			stderr: "pipe",
			stdin: Bun.file(payloadPath),
			stdout: "pipe",
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout.toString()).toContain("DevOpsFlow mode");
		expect(logFiles(pluginRoot)[0]).toMatch(/^\d{12}-hook-session\.log$/);
		expect(logEntries(pluginRoot, logFiles(pluginRoot)[0])).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					event: "script.start",
					hookEvent: "SessionStart",
					script: "prevent-main-agent-write",
					sessionId: "hook-session",
				}),
				expect.objectContaining({
					event: "script.finish",
					exitCode: 0,
				}),
			]),
		);
	});

	for (const relativePath of operationalScriptPaths) {
		it(`${relativePath} runs through the shared logger`, () => {
			const source = readFileSync(join(repositoryRoot, relativePath), "utf-8");

			expect(source).toContain("script-logger");
			expect(source).toMatch(/runLoggedScript(?:Async)?\s*\(/);
			expect(source).not.toMatch(/process\.(?:stdout|stderr)\.write/);
		});
	}

	it("hydrates the shared logger with the managed runtime assets", () => {
		const source = readFileSync(
			join(repositoryRoot, "skills/df-codex-assets/scripts/df-codex-assets.ts"),
			"utf-8",
		);

		expect(source).toContain('"src/shared/script-logger.ts"');
	});

	it("keeps the asset bootstrap independent from hydratable shared files", () => {
		const source = readFileSync(
			join(repositoryRoot, "skills/df-codex-assets/scripts/df-codex-assets.ts"),
			"utf-8",
		);

		expect(source).not.toContain('from "@/shared/');
		expect(source).toContain('from "./script-logger"');
	});
});
