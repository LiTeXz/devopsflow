import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir: string;
let featureRepo: string;
let mainRepo: string;
let devRepo: string;
let developRepo: string;

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

function initNestedRepos(
	root: string,
	nested: string,
	rootBranch: string,
	nestedBranch: string,
): void {
	initGitRepo(root, rootBranch);
	mkdirSync(nested, { recursive: true });
	Bun.write(`${nested}/README.md`, "nested\n");
	initGitRepo(nested, nestedBranch);
}

function _currentBranch(cwd: string): string | null {
	const result = Bun.spawnSync({
		cmd: ["git", "symbolic-ref", "--quiet", "--short", "HEAD"],
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	return result.stdout?.toString().trim() || null;
}

beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), "devflow-test-"));
	featureRepo = join(tempDir, "feature-repo");
	mainRepo = join(tempDir, "main-repo");
	devRepo = join(tempDir, "dev-repo");
	developRepo = join(tempDir, "develop-repo");

	initGitRepo(featureRepo, "feature/demo");
	initGitRepo(mainRepo, "main");
	initGitRepo(devRepo, "dev");
	initGitRepo(developRepo, "develop");
});

import {
	shouldBlock,
	shouldBlockSessionStart,
	shouldBlockTool,
} from "./prevent-protected-branch-push";

describe("ProtectedBranchPushHook", () => {
	describe("git push blocking", () => {
		it("blocks direct main push", () => {
			const decision = shouldBlock("git push origin main", featureRepo);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");
			expect(decision?.reason).toInclude("全场拦截");
		});

		it("blocks explicit destination push", () => {
			let decision = shouldBlock("git push origin HEAD:main", featureRepo);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");

			decision = shouldBlock(
				"git push origin feature:refs/heads/dev",
				featureRepo,
			);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");
		});

		it("blocks common develop typo", () => {
			const decision = shouldBlock("git push origin devlop", featureRepo);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");
		});

		it("blocks plain push from protected current branch", () => {
			const decision = shouldBlock("git push origin", developRepo);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");
		});

		it("blocks feature branch push", () => {
			const decision = shouldBlock(
				"git push -u origin codex/convert-to-plugin",
				featureRepo,
			);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");
		});

		it("blocks feature branch destination push", () => {
			const decision = shouldBlock(
				"git push origin HEAD:codex/convert-to-plugin",
				featureRepo,
			);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");
		});

		it("blocks wrapped git push forms", () => {
			expect(
				shouldBlock("command git push origin feature/demo", featureRepo),
			).not.toBeNull();
			expect(
				shouldBlock(
					"env GIT_SSH_COMMAND=ssh git push origin feature/demo",
					featureRepo,
				),
			).not.toBeNull();
			expect(
				shouldBlock("git -C ../repo push origin feature/demo", featureRepo),
			).not.toBeNull();
			expect(
				shouldBlock(
					"git -c credential.helper= push origin feature/demo",
					featureRepo,
				),
			).not.toBeNull();
		});

		it("blocks all branch push", () => {
			const decision = shouldBlock("git push --all origin", featureRepo);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");
		});
	});

	describe("proxy escalation", () => {
		it("escalates rtk proxy bypass attempts", () => {
			const decision = shouldBlock(
				"rtk proxy git push origin main",
				featureRepo,
			);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("*");
			expect(decision?.action).toBe("escalation");
			expect(decision?.reason).toInclude("二级警告");
		});

		it("escalates direct proxy attempts", () => {
			const decision = shouldBlock(
				"proxy sed -n '1,20p' README.md",
				featureRepo,
			);
			expect(decision).not.toBeNull();
			expect(decision?.action).toBe("escalation");
		});
	});

	describe("session start", () => {
		it("blocks session start on protected branch", () => {
			const decision = shouldBlockSessionStart(devRepo);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("dev");
			expect(decision?.action).toBe("session");
		});

		it("allows session start on feature branch", () => {
			expect(shouldBlockSessionStart(featureRepo)).toBeUndefined();
		});
	});

	describe("direct write tools", () => {
		it("blocks direct write tool on protected branch", () => {
			const decision = shouldBlockTool("apply_patch", {}, mainRepo);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("main");
		});

		it("allows direct write tool on feature branch", () => {
			expect(shouldBlockTool("Write", {}, featureRepo)).toBeUndefined();
		});
	});

	describe("nested repository branch detection", () => {
		it("uses tool workdir for nested repository branch detection", () => {
			const nestedRoot = join(tempDir, "nested-test-root");
			const nestedDir = join(nestedRoot, "nested");
			initNestedRepos(nestedRoot, nestedDir, "codex/root-topic", "codex/topic");

			expect(shouldBlockTool("Write", {}, nestedRoot)).toBeUndefined();
			expect(shouldBlockTool("Write", {}, nestedDir)).toBeUndefined();

			switchBranch(nestedRoot, "dev");
			const decision = shouldBlockTool("Write", {}, nestedRoot);
			expect(decision).not.toBeNull();
			expect(decision?.branch).toBe("dev");
			expect(decision?.reason).toInclude(nestedRoot);
		});
	});

	describe("shell commands on protected branch", () => {
		it("blocks shell redirection on protected branch", () => {
			expect(shouldBlock("printf hi > README.md", developRepo)).not.toBeNull();
			expect(shouldBlock("printf hi>README.md", developRepo)).not.toBeNull();
		});

		it("blocks file mutation commands on protected branch", () => {
			expect(shouldBlock("rm -rf build", mainRepo)).not.toBeNull();
			expect(shouldBlock("mv old new", mainRepo)).not.toBeNull();
			expect(shouldBlock("cp a b", mainRepo)).not.toBeNull();
			expect(
				shouldBlock("rg -n DevFlow README.md;rm README.md", mainRepo),
			).not.toBeNull();
		});

		it("blocks git writes on protected branch", () => {
			expect(shouldBlock("git add README.md", devRepo)).not.toBeNull();
			expect(shouldBlock("git commit -m test", devRepo)).not.toBeNull();
			expect(shouldBlock("git reset --hard HEAD~1", devRepo)).not.toBeNull();
		});

		it("blocks package install on protected branch", () => {
			expect(shouldBlock("pnpm add zod", developRepo)).not.toBeNull();
			expect(shouldBlock("npm install lodash", developRepo)).not.toBeNull();
		});
	});

	describe("safe operations", () => {
		it("allows branch escape on protected branch", () => {
			expect(shouldBlock("git switch -c codex/task", mainRepo)).toBeUndefined();
			expect(
				shouldBlock("git checkout -b codex/task", mainRepo),
			).toBeUndefined();
		});

		it("allows read-only commands on protected branch", () => {
			expect(shouldBlock("cat README.md", mainRepo)).toBeUndefined();
			expect(shouldBlock("sed -n '1,20p' README.md", mainRepo)).toBeUndefined();
			expect(shouldBlock("sed -n 1,20p README.md", mainRepo)).toBeUndefined();
			expect(
				shouldBlock("sed --quiet '1,20p' README.md", mainRepo),
			).toBeUndefined();
			expect(
				shouldBlock("sed --silent '1,20p' README.md", mainRepo),
			).toBeUndefined();
			expect(shouldBlock("sed 's/a/b/' README.md", mainRepo)).toBeUndefined();
			expect(shouldBlock("rg -n DevFlow README.md", mainRepo)).toBeUndefined();
			expect(shouldBlock("git status --short", mainRepo)).toBeUndefined();
			expect(shouldBlock("python3 -c 'print(1)'", mainRepo)).toBeUndefined();
			expect(
				shouldBlock("python3 -c 'open(\"README.md\").read()'", mainRepo),
			).toBeUndefined();
		});

		it("blocks mutating sed on protected branch", () => {
			expect(shouldBlock("sed -i 's/a/b/' README.md", mainRepo)).not.toBeNull();
			expect(
				shouldBlock("sed --in-place 's/a/b/' README.md", mainRepo),
			).not.toBeNull();
			expect(
				shouldBlock(
					'python3 -c \'open("README.md", "w").write("x")\'',
					mainRepo,
				),
			).not.toBeNull();
		});
	});
});

import { loadState, saveState } from "@/shared/state-store";

describe("df-publisher push exemption", () => {
	beforeAll(() => {
		const stateFile = join(tempDir, "pb-dfpub-sessions.json");
		process.env.DEVFLOW_MAIN_AGENT_WRITE_STATE = stateFile;
	});

	beforeEach(() => {
		const state = loadState();
		for (const key of Object.keys(state)) delete state[key];
		saveState(state);
	});

	it("allows df-publisher push on feature branch", () => {
		const state = loadState();
		state["dfpub-1"] = { agent: "df-publisher" };
		saveState(state);
		expect(
			shouldBlock("git push origin feature/demo", featureRepo, true),
		).toBeUndefined();
	});

	it("blocks df-publisher push on protected branch", () => {
		const state = loadState();
		state["dfpub-1"] = { agent: "df-publisher" };
		saveState(state);
		const decision = shouldBlock("git push origin", devRepo, true);
		expect(decision).not.toBeNull();
		expect(decision?.reason).toInclude("保护分支");
	});

	it("still blocks non-df-publisher push", () => {
		const state = loadState();
		state["worker-1"] = { agent: "some-worker" };
		saveState(state);
		const decision = shouldBlock(
			"git push origin feature/demo",
			featureRepo,
			false,
		);
		expect(decision).not.toBeNull();
		expect(decision?.branch).toBe("*");
	});
});
