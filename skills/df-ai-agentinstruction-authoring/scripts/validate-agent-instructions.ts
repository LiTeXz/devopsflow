#!/usr/bin/env bun

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

const AGENT_INSTRUCTION_EXTENSION = /\.(?:json|md|toml|ya?ml)$/i;
const HEADING_PATTERN = /^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/;
const HAN_PATTERN = /\p{Script=Han}/u;

export interface AuthoringViolation {
  path: string;
  message: string;
}

export interface CliLogger {
  log(message: string): void;
  error(message: string): void;
}

interface Heading {
  line: number;
  level: number;
  title: string;
}

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function hasHanCharacters(content: string): boolean {
  return HAN_PATTERN.test(content);
}

function collectHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const match = line.match(HEADING_PATTERN);
    if (!match) continue;
    headings.push({
      line: index + 1,
      level: match[1].length,
      title: match[2].trim(),
    });
  }
  return headings;
}

function isAllowedMixedHeading(title: string): boolean {
  const match = title.match(
    /^([^"\p{Script=Han}]*[A-Za-z][^"\p{Script=Han}]*) "[^"]*\p{Script=Han}[^"]*"[^"\p{Script=Han}]*$/u,
  );
  return Boolean(match);
}

function validateHeadings(path: string, content: string): AuthoringViolation[] {
  const violations: AuthoringViolation[] = [];
  for (const heading of collectHeadings(content)) {
    if (
      hasHanCharacters(heading.title) &&
      !isAllowedMixedHeading(heading.title)
    ) {
      violations.push({
        path,
        message: `line ${heading.line} heading "${heading.title}" must be English or use the form English "中文"`,
      });
    }
  }
  return violations;
}

function firstH1(content: string): Heading | undefined {
  return collectHeadings(content).find((heading) => heading.level === 1);
}

function validateAgentWrappers(
  path: string,
  relativePath: string,
  content: string,
): AuthoringViolation[] {
  const expectedPath =
    relativePath === "AGENTS.md" ? "/AGENTS.md" : relativePath;
  const expectedStart = `<!-- BEGIN:${expectedPath} -->`;
  const expectedEnd = `<!-- END:${expectedPath} -->`;
  const violations: AuthoringViolation[] = [];
  const displayName = basename(path);

  if (!content.startsWith(expectedStart)) {
    violations.push({
      path,
      message: `${displayName} must start with "${expectedStart}"`,
    });
  }
  if (!content.trimEnd().endsWith(expectedEnd)) {
    violations.push({
      path,
      message: `${displayName} must end with "${expectedEnd}"`,
    });
  }
  const expectedH1 = `# ${expectedPath}`;
  if (firstH1(content)?.title !== expectedPath) {
    violations.push({
      path,
      message: `${displayName} first H1 must be "${expectedH1}"`,
    });
  }
  return violations;
}

function isGovernedFile(relativePath: string): boolean {
  if (basename(relativePath) === "AGENTS.md") return true;
  if (
    relativePath.startsWith("agents/") &&
    AGENT_INSTRUCTION_EXTENSION.test(relativePath)
  ) {
    return true;
  }
  if (!relativePath.startsWith("skills/")) return false;
  if (relativePath.endsWith("/SKILL.md")) return true;
  return /\/agents\/.+\.(?:json|md|toml|ya?ml)$/i.test(relativePath);
}

function validatePortableContext(
  path: string,
  relativePath: string,
  content: string,
): AuthoringViolation[] {
  const normalized = normalizedPath(relativePath);
  const violations: AuthoringViolation[] = [];
  if (normalized.startsWith("agents/") && normalized.endsWith(".toml")) {
    const descriptionLine = content
      .split(/\r?\n/)
      .find((line) => /^description\s*=/.test(line));
    if (
      descriptionLine &&
      /DevopsFlow\s+(?:中|项目|仓库)/u.test(descriptionLine)
    ) {
      violations.push({
        path,
        message:
          "agent description must describe the current target project, not DevopsFlow as its runtime project",
      });
    }
  }
  if (
    normalized.startsWith("skills/") &&
    /\bbun\s+(?:skills\/|test\s+skills\/)/u.test(content)
  ) {
    violations.push({
      path,
      message:
        "skill instructions must use an installed skill/plugin root placeholder instead of the source repository path bun skills/...",
    });
  }
  return violations;
}

export function findGovernedFiles(projectRoot: string): string[] {
  if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory())
    return [];
  const governedFiles: string[] = [];
  const ignoredDirectories = new Set([".git", "node_modules"]);

  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name))
          visit(join(directory, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      const path = join(directory, entry.name);
      const relativePath = normalizedPath(relative(projectRoot, path));
      if (isGovernedFile(relativePath)) governedFiles.push(path);
    }
  }

  visit(projectRoot);
  return governedFiles.sort((firstPath, secondPath) =>
    firstPath.localeCompare(secondPath),
  );
}

export function validateProjectAuthoring(
  projectRoot: string,
): AuthoringViolation[] {
  if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
    return [{ path: projectRoot, message: "project root does not exist" }];
  }

  const violations: AuthoringViolation[] = [];
  for (const path of findGovernedFiles(projectRoot)) {
    const content = readFileSync(path, "utf-8");
    violations.push(...validateHeadings(path, content));
    const relativePath = normalizedPath(relative(projectRoot, path));
    violations.push(...validatePortableContext(path, relativePath, content));
    if (basename(relativePath) === "AGENTS.md") {
      violations.push(...validateAgentWrappers(path, relativePath, content));
    }
  }
  return violations;
}

export function validateGlobalAgentsFile(
  globalAgentsPath: string,
): AuthoringViolation[] {
  if (!existsSync(globalAgentsPath) || !statSync(globalAgentsPath).isFile()) {
    return [
      { path: globalAgentsPath, message: "global AGENTS.md does not exist" },
    ];
  }

  const content = readFileSync(globalAgentsPath, "utf-8");
  const displayName = basename(globalAgentsPath);
  const violations = validateHeadings(globalAgentsPath, content);
  const expectedStart = "<!-- BEGINE_GLOBAL:~/.codex/ -->";
  const expectedEnd = "<!-- END_GLOBAL:~/.codex/ -->";
  const expectedH1 = "~/.codex/AGENTS.md: Global Codex Constitution";

  if (!content.startsWith(expectedStart)) {
    violations.push({
      path: globalAgentsPath,
      message: `${displayName} must start with "${expectedStart}"`,
    });
  }
  if (!content.trimEnd().endsWith(expectedEnd)) {
    violations.push({
      path: globalAgentsPath,
      message: `${displayName} must end with "${expectedEnd}"`,
    });
  }
  if (firstH1(content)?.title !== expectedH1) {
    violations.push({
      path: globalAgentsPath,
      message: `${displayName} first H1 must be "# ${expectedH1}"`,
    });
  }
  return violations;
}

function usage(): string {
  return "Usage: validate-agent-instructions.ts [--root <project-root> | --global <AGENTS.md>]";
}

export function runCli(
  argumentsList: readonly string[] = process.argv.slice(2),
  logger: CliLogger = console,
): number {
  let projectRoot = process.cwd();
  let globalAgentsPath: string | undefined;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--root" && argumentsList[index + 1]) {
      projectRoot = argumentsList[index + 1];
      index += 1;
      continue;
    }
    if (argument === "--global" && argumentsList[index + 1]) {
      globalAgentsPath = argumentsList[index + 1];
      index += 1;
      continue;
    }
    logger.error(usage());
    return 2;
  }

  const violations = globalAgentsPath
    ? validateGlobalAgentsFile(globalAgentsPath)
    : validateProjectAuthoring(projectRoot);
  if (violations.length) {
    for (const violation of violations) {
      logger.error(`::error file=${violation.path}::${violation.message}`);
    }
    return 1;
  }
  logger.log(
    globalAgentsPath
      ? "Global AGENTS validation passed."
      : "Agent instruction validation passed.",
  );
  return 0;
}

if (import.meta.main) process.exit(runCli());
