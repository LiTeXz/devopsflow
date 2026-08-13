import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { containsBlockedGitGh, containsGitOrGh } from "@/shared/command-parser";
import { loadState, saveState } from "@/shared/state-store";
import {
  ensureManagedSubagents,
  shouldBlockTool,
} from "./prevent-git-github-operations";

const ROOT = join(import.meta.dir, "..");
const tempRoots: string[] = [];
const statePath = join(tmpdir(), "devopsflow-test-gitgh-sessions.json");

beforeEach(() => {
  process.env.DEVOPSFLOW_MAIN_AGENT_WRITE_STATE = statePath;
  rmSync(statePath, { force: true });
});

afterEach(() => {
  for (const root of tempRoots.splice(0))
    rmSync(root, { recursive: true, force: true });
  rmSync(statePath, { force: true });
});

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "devopsflow-test-gitgh-"));
  tempRoots.push(root);
  return root;
}

function startSubagent(sessionId: string, agent: string): void {
  const state = loadState();
  state[sessionId] = { agent };
  saveState(state);
}

describe("Git and GitHub command parsing", () => {
  it("distinguishes Git and GitHub operations from unrelated commands", () => {
    expect(containsGitOrGh("git status")).toBe(true);
    expect(containsGitOrGh("gh pr create")).toBe(true);
    expect(containsGitOrGh("rg -n DevopsFlow README.md")).toBe(false);
    expect(containsBlockedGitGh("git push origin main")).toBe(true);
    expect(containsBlockedGitGh("gh issue list")).toBe(true);
    expect(containsBlockedGitGh("git status")).toBe(false);
  });
});

describe("Managed subagent installation", () => {
  it("installs every distributable agent and does not rewrite matching files", () => {
    const projectRoot = tempRoot();
    expect(ensureManagedSubagents(projectRoot, ROOT)).toContain("已同步");

    for (const name of [
      "df-dev-backend-engineer.toml",
      "df-dev-backend-test-engineer.toml",
      "df-dev-database-steward.toml",
      "df-doc-documentation-writer.toml",
      "df-dev-frontend-engineer.toml",
      "df-dev-frontend-test-engineer.toml",
      "df-ops-artifact-manager.toml",
      "df-ops-vcs-manager.toml",
    ]) {
      const installed = join(projectRoot, ".codex", "agents", name);
      expect(existsSync(installed)).toBe(true);
      expect(readFileSync(installed, "utf-8")).toBe(
        readFileSync(join(ROOT, "agents", name), "utf-8"),
      );
    }
    expect(ensureManagedSubagents(projectRoot, ROOT)).toBeUndefined();
  });
});

describe("Git and GitHub operation guard", () => {
  it("blocks protected publishing operations for ordinary sessions", () => {
    expect(shouldBlockTool("Bash", { command: "git push origin main" })).toBe(
      true,
    );
    expect(shouldBlockTool("Bash", { command: "git commit -m test" })).toBe(
      true,
    );
    expect(shouldBlockTool("Bash", { command: "gh pr create" })).toBe(true);
    expect(shouldBlockTool("Bash", { command: "git status" })).toBe(false);
  });

  it("grants the publishing exemption only to df-ops-vcs-manager", () => {
    startSubagent("vcs-1", "df-ops-vcs-manager");
    expect(
      shouldBlockTool("Bash", { command: "git push origin feature" }, "vcs-1"),
    ).toBe(false);
    expect(shouldBlockTool("Bash", { command: "gh issue list" }, "vcs-1")).toBe(
      false,
    );

    startSubagent("other-1", "df-dev-backend-engineer");
    expect(
      shouldBlockTool(
        "Bash",
        { command: "git push origin feature" },
        "other-1",
      ),
    ).toBe(true);
  });
});
