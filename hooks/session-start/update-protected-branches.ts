#!/usr/bin/env bun

import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { findWorkdir, readPayload } from "@/shared/payload";
import { runLoggedScript } from "@/shared/script-logger";
import type { Payload } from "@/shared/types";

export const PROTECTED_BRANCHES = [
  "dev",
  "main",
  "master",
  "develop",
  "devlop",
] as const;

interface UpdateResult {
  readonly updated: string[];
  readonly skipped: boolean;
}

interface GitResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

function git(cwd: string, args: string[]): GitResult {
  const result = Bun.spawnSync({
    cmd: ["git", ...args],
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: result.exitCode,
    stdout: result.stdout.toString().trim(),
    stderr: result.stderr.toString().trim(),
  };
}

function requireGit(cwd: string, args: string[], context: string): GitResult {
  const result = git(cwd, args);
  if (result.exitCode !== 0) {
    throw new Error(`${context}: ${result.stderr || result.stdout}`);
  }
  return result;
}

function hasGitDirectory(cwd: string): boolean {
  const gitPath = join(cwd, ".git");
  return existsSync(gitPath) && statSync(gitPath).isDirectory();
}

export function updateProtectedBranches(cwd: string): UpdateResult {
  if (!hasGitDirectory(cwd)) return { updated: [], skipped: true };

  const remoteHeads = requireGit(
    cwd,
    [
      "ls-remote",
      "--heads",
      "origin",
      ...PROTECTED_BRANCHES.map((branch) => `refs/heads/${branch}`),
    ],
    "无法读取 origin 的受保护分支",
  ).stdout;
  const availableBranches = PROTECTED_BRANCHES.filter((branch) =>
    remoteHeads
      .split(/\r?\n/)
      .some((line) => line.endsWith(`\trefs/heads/${branch}`)),
  );
  if (availableBranches.length === 0) return { updated: [], skipped: false };

  requireGit(
    cwd,
    [
      "fetch",
      "--prune",
      "origin",
      ...availableBranches.map(
        (branch) => `+refs/heads/${branch}:refs/remotes/origin/${branch}`,
      ),
    ],
    "无法从 origin 获取受保护分支",
  );

  const updated: string[] = [];
  const checkedOutBranch = git(cwd, ["branch", "--show-current"]).stdout;
  for (const branch of availableBranches) {
    const remoteRef = `refs/remotes/origin/${branch}`;
    if (
      git(cwd, ["show-ref", "--verify", "--quiet", remoteRef]).exitCode !== 0
    ) {
      continue;
    }

    const localRef = `refs/heads/${branch}`;
    const remoteOid = requireGit(
      cwd,
      ["rev-parse", remoteRef],
      `无法解析 origin/${branch}`,
    ).stdout;
    const localOidResult = git(cwd, ["rev-parse", "--verify", localRef]);

    if (localOidResult.exitCode === 0) {
      if (localOidResult.stdout === remoteOid) continue;
      const ancestor = git(cwd, [
        "merge-base",
        "--is-ancestor",
        localOidResult.stdout,
        remoteOid,
      ]);
      if (ancestor.exitCode !== 0) {
        throw new Error(
          `受保护分支 ${branch} 无法 fast-forward 到 origin/${branch}；本地与远端可能存在冲突`,
        );
      }
      if (checkedOutBranch === branch) {
        requireGit(
          cwd,
          ["merge", "--ff-only", remoteRef],
          `更新当前分支 ${branch} 失败`,
        );
      } else {
        requireGit(
          cwd,
          ["update-ref", localRef, remoteOid, localOidResult.stdout],
          `更新 ${branch} 失败`,
        );
      }
    } else {
      requireGit(
        cwd,
        ["update-ref", localRef, remoteOid],
        `创建本地分支 ${branch} 失败`,
      );
    }
    updated.push(branch);
  }

  return { updated, skipped: false };
}

export function writeFailure(error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  const instruction =
    "Agent 必须立即检查 Git 状态和分支差异，并与用户协商如何处理冲突；不得强推、重置或擅自覆盖本地提交。";
  console.error(`DevopsFlow 无法更新受保护分支：${detail}`);
  console.error(instruction);
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `受保护分支更新失败：${detail}\n${instruction}`,
      },
    }),
  );
}

function main(payload: Payload | null = readPayload()): number {
  if (!payload || typeof payload !== "object") return 0;
  const cwd = findWorkdir(payload, {});
  try {
    const result = updateProtectedBranches(cwd);
    if (!result.skipped && result.updated.length > 0) {
      console.log(`DevopsFlow 已更新分支：${result.updated.join(", ")}`);
    }
    return 0;
  } catch (error) {
    writeFailure(error);
    return 2;
  }
}

if (import.meta.main) {
  const payload = readPayload();
  process.exit(
    runLoggedScript({ payload, scriptName: "update-protected-branches" }, () =>
      main(payload),
    ),
  );
}
