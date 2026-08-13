import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PROTECTED_BRANCHES,
  updateProtectedBranches,
  writeFailure,
} from "./update-protected-branches";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "devopsflow-branch-update-"));
  tempRoots.push(root);
  return root;
}

function git(cwd: string, ...args: string[]): string {
  const result = Bun.spawnSync({
    cmd: ["git", ...args],
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString() || result.stdout.toString());
  }
  return result.stdout.toString().trim();
}

function configureIdentity(cwd: string): void {
  git(cwd, "config", "user.email", "test@example.com");
  git(cwd, "config", "user.name", "Test User");
}

function createRemoteFixture(): {
  remote: string;
  workspace: string;
  writer: string;
} {
  const root = tempRoot();
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  const workspace = join(root, "workspace");
  const writer = join(root, "writer");
  git(root, "init", "--bare", remote);
  git(root, "init", "-b", "main", seed);
  configureIdentity(seed);
  writeFileSync(join(seed, "README.md"), "initial\n");
  git(seed, "add", "README.md");
  git(seed, "commit", "-m", "initial");
  git(seed, "remote", "add", "origin", remote);
  for (const branch of PROTECTED_BRANCHES) {
    if (branch !== "main") git(seed, "branch", branch);
    git(seed, "push", "origin", `${branch}:${branch}`);
  }
  git(root, "clone", "--branch", "main", remote, workspace);
  git(root, "clone", "--branch", "main", remote, writer);
  configureIdentity(workspace);
  configureIdentity(writer);
  return { remote, workspace, writer };
}

function createMainOnlyRemoteFixture(): string {
  const root = tempRoot();
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  const workspace = join(root, "workspace");
  git(root, "init", "--bare", remote);
  git(root, "init", "-b", "main", seed);
  configureIdentity(seed);
  writeFileSync(join(seed, "README.md"), "initial\n");
  git(seed, "add", "README.md");
  git(seed, "commit", "-m", "initial");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "origin", "main");
  git(root, "clone", "--branch", "main", remote, workspace);
  return workspace;
}

describe("SessionStart protected branch updater", () => {
  it("skips cwd values without a .git directory", () => {
    const cwd = tempRoot();
    expect(existsSync(join(cwd, ".git"))).toBe(false);
    expect(updateProtectedBranches(cwd)).toEqual({
      updated: [],
      skipped: true,
    });
  });

  it("updates successfully when origin contains only some protected branches", () => {
    const workspace = createMainOnlyRemoteFixture();
    expect(updateProtectedBranches(workspace)).toEqual({
      updated: [],
      skipped: false,
    });
  });

  it("fast-forwards every protected local branch that exists on origin", async () => {
    const { workspace, writer } = createRemoteFixture();
    git(writer, "switch", "main");
    writeFileSync(join(writer, "remote.txt"), "remote\n");
    git(writer, "add", "remote.txt");
    git(writer, "commit", "-m", "remote update");
    git(writer, "push", "origin", "main");

    const expected = git(writer, "rev-parse", "main");
    const result = updateProtectedBranches(workspace);

    expect(result.skipped).toBe(false);
    expect(result.updated).toContain("main");
    expect(git(workspace, "rev-parse", "main")).toBe(expected);
    expect(git(workspace, "branch", "--show-current")).toBe("main");
    expect((await Bun.file(join(workspace, "remote.txt")).text()).trim()).toBe(
      "remote",
    );
  });

  it("fails instead of overwriting a diverged protected branch", () => {
    const { workspace, writer } = createRemoteFixture();
    git(workspace, "switch", "main");
    writeFileSync(join(workspace, "local.txt"), "local\n");
    git(workspace, "add", "local.txt");
    git(workspace, "commit", "-m", "local update");
    git(writer, "switch", "main");
    writeFileSync(join(writer, "remote.txt"), "remote\n");
    git(writer, "add", "remote.txt");
    git(writer, "commit", "-m", "remote update");
    git(writer, "push", "origin", "main");

    expect(() => updateProtectedBranches(workspace)).toThrow("main");
    expect(git(workspace, "log", "-1", "--format=%s", "main")).toBe(
      "local update",
    );
  });

  it("injects immediate conflict-handling instructions for the agent", () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (message?: unknown) => lines.push(String(message));
    try {
      writeFailure(new Error("main diverged"));
    } finally {
      console.log = originalLog;
    }
    const output = JSON.parse(lines.at(-1) ?? "{}") as {
      hookSpecificOutput?: { additionalContext?: string };
    };
    expect(output.hookSpecificOutput?.additionalContext).toContain(
      "Agent 必须立即检查",
    );
    expect(output.hookSpecificOutput?.additionalContext).toContain(
      "与用户协商如何处理冲突",
    );
  });
});
