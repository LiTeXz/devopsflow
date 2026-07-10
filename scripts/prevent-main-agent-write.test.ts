import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir: string;

function initGitRepo(path: string, branch: string): void {
	mkdirSync(path, { recursive: true });
	Bun.spawnSync({
		cmd: ["git", "init", "-b", branch],
		cwd: path,
		stdout: "ignore",
	});
	Bun.spawnSync({
		cmd: ["git", "config", "user.email", "test@example.com"],
		cwd: path,
	});
	Bun.spawnSync({
		cmd: ["git", "config", "user.name", "Test User"],
		cwd: path,
	});
	Bun.write(`${path}/README.md`, "test\n");
	Bun.spawnSync({ cmd: ["git", "add", "README.md"], cwd: path });
	Bun.spawnSync({
		cmd: ["git", "commit", "-m", "init"],
		cwd: path,
		stdout: "ignore",
	});
}

function switchBranch(path: string, branch: string): void {
	Bun.spawnSync({
		cmd: ["git", "switch", "-c", branch],
		cwd: path,
		stdout: "ignore",
	});
}

function initBranchOnlyRepo(path: string, branch: string): void {
	mkdirSync(path, { recursive: true });
	Bun.spawnSync({
		cmd: ["git", "init", "-b", branch],
		cwd: path,
		stdout: "ignore",
	});
}

// Set up state path for tests
let stateFilePath: string;
const STATE_PATH_ENV = "DEVOPSFLOW_MAIN_AGENT_WRITE_STATE";

beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), "devopsflow-test-main-"));
	stateFilePath = join(tempDir, "test-sessions.json");
	process.env[STATE_PATH_ENV] = stateFilePath;
});

function cleanupState(): void {
	if (existsSync(stateFilePath)) {
		unlinkSync(stateFilePath);
	}
}

import { isWritableAgentContext } from "@/shared/payload";
import { loadState, saveState } from "@/shared/state-store";
import { shouldBlockTool } from "./prevent-main-agent-write";

function startSubagent(sessionId: string, agentName: string = "worker"): void {
	const state = loadState();
	state[sessionId] = { agent: agentName };
	saveState(state);
}

function stopSubagent(sessionId: string): void {
	const state = loadState();
	delete state[sessionId];
	saveState(state);
}

describe("MainAgentWriteGuard", () => {
	beforeEach(() => {
		cleanupState();
	});

	afterEach(() => {
		cleanupState();
	});

	describe("direct write tool blocking", () => {
		it("blocks main agent direct write tools", () => {
			expect(shouldBlockTool("Write", {})).not.toBeNull();
			expect(shouldBlockTool("Edit", {})).not.toBeNull();
			expect(shouldBlockTool("apply_patch", {})).not.toBeNull();
		});
	});

	describe("shell command blocking", () => {
		it("blocks main agent shell redirection, rm, git add, and pnpm add", () => {
			expect(
				shouldBlockTool("Bash", { command: "printf hi > README.md" }),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", { command: "rm -rf build" }),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", { command: "git add README.md" }),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", { command: "git push origin feature/demo" }),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", { command: "pnpm add zod" }),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", { command: "pnpm run generate" }),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", { command: "pnpm run build" }),
			).not.toBeNull();
		});
	});

	describe("safe commands", () => {
		it("allows main agent read, status, and test commands", () => {
			expect(
				shouldBlockTool("Bash", { command: "cat README.md" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "sed -n '1,20p' README.md" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "sed -n 1,20p README.md" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "sed --quiet '1,20p' README.md" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "sed --silent '1,20p' README.md" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "sed 's/a/b/' README.md" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "rg -n DevOpsFlow README.md" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "git status --short" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "python3 -c 'print(1)'" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", {
					command: "python3 -c 'open(\"README.md\").read()'",
				}),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", {
					command: "python3 -X utf8 scripts/test-prevent-main-agent-write.py",
				}),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", {
					command: "python3 -X utf8 scripts/run_design_examples.py",
				}),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", {
					command:
						"python3 -X utf8 skills/df-tdd-skill/scripts/run_protocol_examples.py",
				}),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "python3 -m unittest" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "python3 -m pytest" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", {
					command: "python3 -m py_compile scripts/prevent-main-agent-write.py",
				}),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", {
					command: "python3 -m json.tool hooks/hooks.codex.json",
				}),
			).toBeUndefined();
			expect(shouldBlockTool("Bash", { command: "pnpm test" })).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "pnpm run test" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "pnpm run typecheck" }),
			).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "pnpm run lint" }),
			).toBeUndefined();
		});
	});

	describe("unsafe commands", () => {
		it("blocks main agent mutating sed and unsafe python commands", () => {
			expect(
				shouldBlockTool("Bash", { command: "sed -i 's/a/b/' README.md" }),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", {
					command: "sed --in-place 's/a/b/' README.md",
				}),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", {
					command: 'python3 -c \'open("README.md", "w").write("x")\'',
				}),
			).not.toBeNull();
			expect(
				shouldBlockTool("Bash", {
					command: "python3 scripts/update_readme.py",
				}),
			).not.toBeNull();
		});
	});

	describe("proxy escalation", () => {
		it("escalates proxy bypass attempts", () => {
			const decision = shouldBlockTool(
				"Bash",
				{ command: "rtk proxy sed -n '1,20p' README.md" },
				"worker-1",
			);
			expect(decision).not.toBeNull();
			expect(decision?.escalation).toBe(true);
			expect(decision?.reason).toInclude("二级警告");

			const decision2 = shouldBlockTool(
				"Bash",
				{ command: "proxy python3 -c 'print(1)'" },
				"worker-1",
			);
			expect(decision2).not.toBeNull();
			expect(decision2?.escalation).toBe(true);
		});
	});

	describe("Codex worker sessions", () => {
		it("blocks git push even for registered Codex worker", () => {
			startSubagent("worker-1");
			expect(
				shouldBlockTool(
					"Bash",
					{ command: "git push -u origin codex/task" },
					"worker-1",
				),
			).not.toBeNull();
			expect(
				shouldBlockTool(
					"Bash",
					{ command: "command git push origin codex/task" },
					"worker-1",
				),
			).not.toBeNull();
			expect(
				shouldBlockTool(
					"Bash",
					{ command: "git -C ../repo push origin codex/task" },
					"worker-1",
				),
			).not.toBeNull();
		});

		it("allows registered Codex worker write", () => {
			startSubagent("worker-1");
			expect(shouldBlockTool("Write", {}, "worker-1")).toBeUndefined();
			expect(
				shouldBlockTool("Bash", { command: "git add README.md" }, "worker-1"),
			).toBeUndefined();
		});

		it("blocks after Codex worker stop", () => {
			startSubagent("worker-1");
			stopSubagent("worker-1");
			expect(shouldBlockTool("Write", {}, "worker-1")).not.toBeNull();
		});

		it("blocks write without session id", () => {
			expect(shouldBlockTool("Write", {})).not.toBeNull();
			expect(
				shouldBlockTool("Bash", { command: "touch marker" }),
			).not.toBeNull();
		});

		it("multiple Codex worker sessions do not interfere", () => {
			startSubagent("worker-1");
			startSubagent("worker-2");
			expect(shouldBlockTool("Write", {}, "worker-1")).toBeUndefined();
			expect(shouldBlockTool("Write", {}, "worker-2")).toBeUndefined();
			stopSubagent("worker-1");
			expect(shouldBlockTool("Write", {}, "worker-1")).not.toBeNull();
			expect(shouldBlockTool("Write", {}, "worker-2")).toBeUndefined();
		});

		it("allows unregistered direct write when payload declares worker context", () => {
			expect(
				shouldBlockTool(
					"Write",
					{},
					undefined,
					undefined,
					isWritableAgentContext({
						agent_type: "worker",
					}),
				),
			).toBeUndefined();
		});

		it("allows unregistered shell write when adapter payload declares writable worker context", () => {
			expect(
				shouldBlockTool(
					"Bash",
					{ command: "touch marker" },
					"unregistered-worker",
					undefined,
					isWritableAgentContext({
						agent: { mode: "subagent", name: "worker" },
					}),
				),
			).toBeUndefined();
		});

		it("allows unregistered writes when agent names declare fork or background context", () => {
			expect(
				shouldBlockTool(
					"Write",
					{},
					"fork-worker",
					undefined,
					isWritableAgentContext({
						agentName: "Codex App Fork Worker",
					}),
				),
			).toBeUndefined();
			expect(
				shouldBlockTool(
					"Bash",
					{ command: "touch marker" },
					"background-worker",
					undefined,
					isWritableAgentContext({
						agentDisplayName: "background task runner",
					}),
				),
			).toBeUndefined();
		});

		it("blocks unregistered writes when payload declares primary, build, or main context", () => {
			const primaryDecision = shouldBlockTool(
				"Write",
				{},
				"primary-agent",
				undefined,
				isWritableAgentContext({
					agent_type: "primary",
				}),
			);
			const buildDecision = shouldBlockTool(
				"Write",
				{},
				"build-agent",
				undefined,
				isWritableAgentContext({
					agentName: "build",
				}),
			);
			const mainDecision = shouldBlockTool(
				"Write",
				{},
				"main-agent",
				undefined,
				isWritableAgentContext({
					session: { agentMode: "main" },
				}),
			);

			expect(primaryDecision).not.toBeNull();
			expect(buildDecision).not.toBeNull();
			expect(mainDecision).not.toBeNull();
			expect(primaryDecision?.reason).toInclude("payload 未显示受支持");
		});

		it("blocks git push even for unregistered worker context", () => {
			const decision = shouldBlockTool(
				"Bash",
				{ command: "git push -u origin codex/task" },
				"unregistered-worker",
				undefined,
				isWritableAgentContext({ agent_type: "worker" }),
			);

			expect(decision).not.toBeNull();
			expect(decision?.reason).toInclude("git push");
		});

		it("blocks unregistered worker write on protected branch via workdir", () => {
			const protectedRoot = join(tempDir, "payload-worker-pb-root");
			initGitRepo(protectedRoot, "dev");

			const decision = shouldBlockTool(
				"Bash",
				{ command: "touch marker", workdir: protectedRoot },
				"unregistered-worker",
				undefined,
				isWritableAgentContext({ agent_type: "worker" }),
			);

			expect(decision).not.toBeNull();
			expect(decision?.reason).toInclude("受保护");
			expect(decision?.reason).toInclude(protectedRoot);
		});
	});

	describe("protected branch write for registered Codex worker", () => {
		it("blocks registered Codex worker write on protected branch via workdir", () => {
			startSubagent("worker-1");

			const root = join(tempDir, "pb-root");
			const nested = join(tempDir, "pb-nested");
			initGitRepo(root, "codex/root-topic");
			initGitRepo(nested, "codex/topic");

			expect(
				shouldBlockTool(
					"Bash",
					{ command: "touch marker", workdir: root },
					"worker-1",
				),
			).toBeUndefined();
			expect(
				shouldBlockTool(
					"Bash",
					{ command: "touch marker", workdir: nested },
					"worker-1",
				),
			).toBeUndefined();

			switchBranch(root, "dev");
			const decision = shouldBlockTool(
				"Bash",
				{ command: "touch marker", workdir: root },
				"worker-1",
			);
			expect(decision).not.toBeNull();
			expect(decision?.reason).toInclude("cwd");
			expect(decision?.reason).toInclude(root);
		});

		it("uses git -C cwd instead of parent cwd for registered worker git writes", () => {
			startSubagent("worker-1");

			const root = join(tempDir, "worker-nested-git-c-root");
			const allowedNested = join(root, "allowed-nested");
			const blockedNested = join(root, "blocked-nested");
			initBranchOnlyRepo(root, "dev");
			initBranchOnlyRepo(allowedNested, "codex/topic");
			initBranchOnlyRepo(blockedNested, "dev");

			expect(
				shouldBlockTool(
					"Bash",
					{ command: `git -C "${allowedNested}" add README.md` },
					"worker-1",
					root,
				),
			).toBeUndefined();

			const decision = shouldBlockTool(
				"Bash",
				{ command: `git -C "${blockedNested}" add README.md` },
				"worker-1",
				root,
			);
			expect(decision).not.toBeNull();
			expect(decision?.reason).toInclude("cwd");
			expect(decision?.reason).toInclude(blockedNested);
		});
	});

	describe("hook manifest", () => {
		it("hook manifest uses codex plugin root variable", () => {
			const { existsSync, readFileSync } = require("node:fs");
			const { join } = require("node:path");
			const manifestPath = join(
				import.meta.dir,
				"..",
				"hooks",
				"hooks.codex.json",
			);
			if (existsSync(manifestPath)) {
				const hooks = readFileSync(manifestPath, "utf-8") as string;
				// biome-ignore lint/suspicious/noTemplateCurlyInString: literal string check for hook manifest
				expect(hooks).toInclude("${PLUGIN_ROOT}");
				expect(hooks).not.toInclude("CLAUDE_PLUGIN_ROOT");
				expect(hooks).not.toInclude("CODEX_PLUGIN_ROOT");
			}
		});
	});
});

describe("df-publisher push exemption", () => {
	beforeEach(() => {
		cleanupState();
	});

	afterEach(() => {
		cleanupState();
	});

	it("allows df-publisher to git push", () => {
		startSubagent("dfpub-1", "df-publisher");
		expect(
			shouldBlockTool(
				"Bash",
				{ command: "git push origin codex/task" },
				"dfpub-1",
			),
		).toBeUndefined();
		stopSubagent("dfpub-1");
	});

	it("blocks non-df-publisher worker git push", () => {
		startSubagent("worker-1", "some-worker");
		expect(
			shouldBlockTool(
				"Bash",
				{ command: "git push origin codex/task" },
				"worker-1",
			),
		).not.toBeNull();
		stopSubagent("worker-1");
	});

	it("allows df-publisher to git add and commit", () => {
		startSubagent("dfpub-1", "df-publisher");
		expect(
			shouldBlockTool("Bash", { command: "git add README.md" }, "dfpub-1"),
		).toBeUndefined();
		expect(
			shouldBlockTool("Bash", { command: "git commit -m test" }, "dfpub-1"),
		).toBeUndefined();
		stopSubagent("dfpub-1");
	});
});
