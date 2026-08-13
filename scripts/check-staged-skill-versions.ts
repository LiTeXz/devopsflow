#!/usr/bin/env bun

import { runLoggedScript } from "@/shared/script-logger";

const SKILL_PATH_PATTERN = /^skills\/([^/]+)\//;
const SKILL_MARKDOWN_PATH = (skill: string) => `skills/${skill}/SKILL.md`;

interface SkillVersions {
  version: string;
  metadataVersion: string;
}

function git(root: string, args: string[]): Bun.ReadableSyncSubprocess {
  return Bun.spawnSync({
    cmd: ["git", ...args],
    cwd: root,
    stderr: "pipe",
    stdout: "pipe",
  });
}

function gitOutput(root: string, args: string[]): string {
  const result = git(root, args);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim());
  }
  return result.stdout.toString();
}

function readHeadFile(root: string, path: string): string | undefined {
  const result = git(root, ["show", `HEAD:${path}`]);
  if (result.exitCode === 0) return result.stdout.toString();
  if (result.exitCode === 128) return undefined;
  throw new Error(result.stderr.toString().trim());
}

function readStagedFile(root: string, path: string): string {
  return gitOutput(root, ["show", `:${path}`]);
}

function changedSkills(root: string): string[] {
  const paths = gitOutput(root, [
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
    "HEAD",
    "--",
    "skills",
  ]);
  return [
    ...new Set(
      paths
        .split(/\r?\n/)
        .map((path) => path.match(SKILL_PATH_PATTERN)?.[1])
        .filter((skill): skill is string => Boolean(skill)),
    ),
  ].sort();
}

function parseVersions(path: string, content: string): SkillVersions {
  const frontMatter = content.match(
    /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
  )?.[1];
  if (!frontMatter) throw new Error(`${path} is missing YAML front matter`);

  const version = frontMatter.match(
    /^version:\s*["']?([^"'\s]+)["']?\s*$/m,
  )?.[1];
  const metadataVersion = frontMatter.match(
    /^metadata:\s*\r?\n(?:^ {2}[^\r\n]+\r?\n)*?^ {2}version:\s*["']?([^"'\s]+)["']?\s*$/m,
  )?.[1];
  if (!version || !metadataVersion) {
    throw new Error(`${path} must define version and metadata.version`);
  }
  if (version !== metadataVersion) {
    throw new Error(`${path} version and metadata.version must match`);
  }
  return { version, metadataVersion };
}

function incrementPatch(version: string): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`version "${version}" must be MAJOR.MINOR.PATCH`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function checkStagedSkillVersions(root = process.cwd()): string[] {
  const checked: string[] = [];
  for (const skill of changedSkills(root)) {
    const path = SKILL_MARKDOWN_PATH(skill);
    const staged = parseVersions(path, readStagedFile(root, path));
    const head = readHeadFile(root, path);
    if (head) {
      const expected = incrementPatch(parseVersions(path, head).version);
      if (staged.version !== expected) {
        throw new Error(
          `${path} version must increment from "${parseVersions(path, head).version}" to "${expected}"`,
        );
      }
    }
    checked.push(path);
  }
  return checked;
}

function main(): number {
  const checked = checkStagedSkillVersions();
  console.log(`Staged skill versions checked: ${checked.length}`);
  return 0;
}

if (import.meta.main) {
  process.exit(
    runLoggedScript({ scriptName: "check-staged-skill-versions" }, () =>
      main(),
    ),
  );
}
