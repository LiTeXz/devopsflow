import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir: string;
let stateFilePath: string;
const STATE_PATH_ENV = "DEVFLOW_MAIN_AGENT_WRITE_STATE";

beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), "devflow-test-gitgh-"));
	stateFilePath = join(tempDir, "test-sessions.json");
	process.env[STATE_PATH_ENV] = stateFilePath;
});

function cleanupState(): void {
	if (existsSync(stateFilePath)) {
		unlinkSync(stateFilePath);
	}
}

import { containsBlockedGitGh, containsGitOrGh } from "@/shared/command-parser";
import { loadState, saveState } from "@/shared/state-store";
import {
	shouldBlockSessionStart,
	shouldBlockTool,
} from "./prevent-git-github-operations";

function startSubagent(sessionId: string, agentName: string): void {
	const state = loadState();
	state[sessionId] = { agent: agentName };
	saveState(state);
}

function stopSubagent(sessionId: string): void {
	const state = loadState();
	delete state[sessionId];
	saveState(state);
}

describe("containsGitOrGh", () => {
	it("detects plain git and gh commands", () => {
		expect(containsGitOrGh("git status")).toBe(true);
		expect(containsGitOrGh("git push origin main")).toBe(true);
		expect(containsGitOrGh("git log --oneline -5")).toBe(true);
		expect(containsGitOrGh("gh pr create")).toBe(true);
		expect(containsGitOrGh("gh issue list")).toBe(true);
	});

	it("detects path-prefixed binaries", () => {
		expect(containsGitOrGh("/usr/bin/git status")).toBe(true);
		expect(containsGitOrGh("/usr/local/bin/gh pr create")).toBe(true);
	});

	it("detects wrapped commands", () => {
		expect(containsGitOrGh('bash -c "git push"')).toBe(true);
		expect(containsGitOrGh('sh -c "git log"')).toBe(true);
		expect(containsGitOrGh('eval "git status"')).toBe(true);
		expect(containsGitOrGh("command git status")).toBe(true);
		expect(containsGitOrGh("env GIT_AUTHOR_DATE=x git commit")).toBe(true);
		expect(containsGitOrGh("rtk proxy git push origin main")).toBe(true);
	});

	it("does not false-positive on non-git commands", () => {
		expect(containsGitOrGh("cat README.md")).toBe(false);
		expect(containsGitOrGh("rg -n DevFlow README.md")).toBe(false);
		expect(containsGitOrGh("ls .git/")).toBe(false);
		expect(containsGitOrGh("echo git is great")).toBe(false);
		expect(containsGitOrGh("find . -name .git")).toBe(false);
	});
});

describe("containsBlockedGitGh", () => {
	it("detects blocked git push and commit", () => {
		expect(containsBlockedGitGh("git push origin main")).toBe(true);
		expect(containsBlockedGitGh("git commit -m test")).toBe(true);
		expect(containsBlockedGitGh("git push -u origin feature")).toBe(true);
	});

	it("detects blocked gh issue and pr", () => {
		expect(containsBlockedGitGh("gh issue list")).toBe(true);
		expect(containsBlockedGitGh("gh pr create")).toBe(true);
		expect(containsBlockedGitGh("gh pr merge 123")).toBe(true);
		expect(containsBlockedGitGh("gh issue close 45")).toBe(true);
	});

	it("detects wrapped blocked commands", () => {
		expect(containsBlockedGitGh('bash -c "git push"')).toBe(true);
		expect(containsBlockedGitGh('sh -c "git commit -m test"')).toBe(true);
		expect(containsBlockedGitGh("command git push origin main")).toBe(true);
		expect(containsBlockedGitGh("rtk proxy git push origin main")).toBe(true);
	});

	it("does not block safe git/gh commands", () => {
		expect(containsBlockedGitGh("git status")).toBe(false);
		expect(containsBlockedGitGh("git log --oneline")).toBe(false);
		expect(containsBlockedGitGh("git switch -c feature")).toBe(false);
		expect(containsBlockedGitGh("git checkout main")).toBe(false);
		expect(containsBlockedGitGh("git merge feature")).toBe(false);
		expect(containsBlockedGitGh("git diff HEAD~1")).toBe(false);
		expect(containsBlockedGitGh("git add README.md")).toBe(false);
		expect(containsBlockedGitGh("gh auth status")).toBe(false);
		expect(containsBlockedGitGh("gh auth login")).toBe(false);
		expect(containsBlockedGitGh("gh repo view")).toBe(false);
	});

	it("does not false-positive on non-git commands", () => {
		expect(containsBlockedGitGh("cat README.md")).toBe(false);
		expect(containsBlockedGitGh("rg -n DevFlow README.md")).toBe(false);
		expect(containsBlockedGitGh("bun test")).toBe(false);
	});
});

describe("GitGhOperationsHook SessionStart", () => {
	it("warns when .codex/agents/df-publisher.toml is missing", () => {
		const projectDir = mkdtempSync(join(tempDir, "no-agents-"));
		const message = shouldBlockSessionStart(projectDir);
		expect(message).not.toBeUndefined();
		expect(message).toInclude("df-publisher");
		expect(message).toInclude("插件不完整");
	});

	it("includes plugin root and copy commands when pluginRoot is provided", () => {
		const projectDir = mkdtempSync(join(tempDir, "no-agents-pr-"));
		const message = shouldBlockSessionStart(projectDir, "/fake/plugin/root");
		expect(message).not.toBeUndefined();
		expect(message).toInclude("/fake/plugin/root");
		expect(message).toInclude("cp");
		expect(message).toInclude("mkdir -p");
		expect(message).toInclude("copy");
		expect(message).toInclude("mkdir");
	});

	it("allows when df-publisher.toml exists", () => {
		const projectDir = mkdtempSync(join(tempDir, "has-agents-"));
		const agentsDir = join(projectDir, ".codex", "agents");
		mkdirSync(agentsDir, { recursive: true });
		writeFileSync(
			join(agentsDir, "df-publisher.toml"),
			'name = "df-publisher"',
		);
		const message = shouldBlockSessionStart(projectDir);
		expect(message).toBeUndefined();
	});
});

describe("GitGhOperationsHook PreToolUse", () => {
	beforeEach(() => {
		cleanupState();
	});

	afterEach(() => {
		cleanupState();
	});

	it("blocks non-df-publisher git push and commit", () => {
		expect(shouldBlockTool("Bash", { command: "git push origin main" })).toBe(
			true,
		);
		expect(shouldBlockTool("Bash", { command: "git commit -m test" })).toBe(
			true,
		);
	});

	it("blocks non-df-publisher gh issue and pr", () => {
		expect(shouldBlockTool("Bash", { command: "gh issue list" })).toBe(true);
		expect(shouldBlockTool("Bash", { command: "gh pr create" })).toBe(true);
		expect(shouldBlockTool("Bash", { command: "gh pr merge 123" })).toBe(true);
	});

	it("blocks wrapped blocked commands for non-df-publisher", () => {
		expect(shouldBlockTool("Bash", { command: 'bash -c "git push"' })).toBe(
			true,
		);
		expect(
			shouldBlockTool("Bash", { command: "command git push origin main" }),
		).toBe(true);
		expect(
			shouldBlockTool("Bash", { command: "rtk proxy git push origin main" }),
		).toBe(true);
	});

	it("allows safe git/gh commands for non-df-publisher", () => {
		expect(shouldBlockTool("Bash", { command: "git status" })).toBe(false);
		expect(shouldBlockTool("Bash", { command: "git log --oneline" })).toBe(
			false,
		);
		expect(shouldBlockTool("Bash", { command: "git switch -c feature" })).toBe(
			false,
		);
		expect(shouldBlockTool("Bash", { command: "git checkout main" })).toBe(
			false,
		);
		expect(shouldBlockTool("Bash", { command: "git merge feature" })).toBe(
			false,
		);
		expect(shouldBlockTool("Bash", { command: "git diff HEAD~1" })).toBe(false);
		expect(shouldBlockTool("Bash", { command: "git add README.md" })).toBe(
			false,
		);
		expect(shouldBlockTool("Bash", { command: "gh auth status" })).toBe(false);
		expect(shouldBlockTool("Bash", { command: "gh auth login" })).toBe(false);
	});

	it("allows non-git/gh commands", () => {
		expect(shouldBlockTool("Bash", { command: "cat README.md" })).toBe(false);
		expect(
			shouldBlockTool("Bash", { command: "rg -n DevFlow README.md" }),
		).toBe(false);
		expect(shouldBlockTool("Bash", { command: "bun test" })).toBe(false);
		expect(shouldBlockTool("Bash", { command: "ls -la" })).toBe(false);
	});

	it("allows blocked git/gh commands for df-publisher session", () => {
		startSubagent("dfpub-1", "df-publisher");
		expect(
			shouldBlockTool(
				"Bash",
				{ command: "git push origin feature" },
				"dfpub-1",
			),
		).toBe(false);
		expect(
			shouldBlockTool("Bash", { command: "git commit -m test" }, "dfpub-1"),
		).toBe(false);
		expect(
			shouldBlockTool("Bash", { command: "gh pr create" }, "dfpub-1"),
		).toBe(false);
		expect(
			shouldBlockTool("Bash", { command: "gh issue list" }, "dfpub-1"),
		).toBe(false);
		stopSubagent("dfpub-1");
	});

	it("blocks git push/commit for non-df-publisher worker", () => {
		startSubagent("worker-1", "some-worker");
		expect(shouldBlockTool("Bash", { command: "git push" }, "worker-1")).toBe(
			true,
		);
		expect(
			shouldBlockTool("Bash", { command: "git commit -m test" }, "worker-1"),
		).toBe(true);
		expect(
			shouldBlockTool("Bash", { command: "gh pr create" }, "worker-1"),
		).toBe(true);
		stopSubagent("worker-1");
	});

	it("allows safe git/gh for non-df-publisher worker", () => {
		startSubagent("worker-1", "some-worker");
		expect(shouldBlockTool("Bash", { command: "git status" }, "worker-1")).toBe(
			false,
		);
		expect(
			shouldBlockTool("Bash", { command: "git switch -c feature" }, "worker-1"),
		).toBe(false);
		expect(
			shouldBlockTool("Bash", { command: "gh auth status" }, "worker-1"),
		).toBe(false);
		stopSubagent("worker-1");
	});

	it("blocks after df-publisher session ends", () => {
		startSubagent("dfpub-1", "df-publisher");
		expect(shouldBlockTool("Bash", { command: "git push" }, "dfpub-1")).toBe(
			false,
		);
		stopSubagent("dfpub-1");
		expect(shouldBlockTool("Bash", { command: "git push" }, "dfpub-1")).toBe(
			true,
		);
	});

	it("returns false for direct write tools", () => {
		expect(shouldBlockTool("Write", {})).toBe(false);
		expect(shouldBlockTool("Edit", {})).toBe(false);
		expect(shouldBlockTool("apply_patch", {})).toBe(false);
	});
});
