#!/usr/bin/env bun

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { readScriptPayload, runLoggedScriptAsync } from "./script-logger";

export const MANAGED_ASSET_PATHS = [
  "agents/df-publisher.toml",
  "skills/df-codex-assets/assets/.gitignore",
  "scripts/prevent-git-github-operations.ts",
  "scripts/prevent-main-agent-write.ts",
  "scripts/prevent-protected-branch-push.ts",
  "src/shared/branch.ts",
  "src/shared/command-parser.ts",
  "src/shared/opencode-adapter.ts",
  "src/shared/payload.ts",
  "src/shared/script-logger.ts",
  "src/shared/state-store.ts",
  "src/shared/types.ts",
  "package.json",
  "tsconfig.json",
] as const;

export const HASH_FILE_PATH = "skills/df-codex-assets/assets/hash.txt";
export const PROJECT_GITIGNORE_TEMPLATE_PATH =
  "skills/df-codex-assets/assets/.gitignore";
export const PROJECT_GITIGNORE_START = "# BEGIN DEVOPSFLOW MANAGED";
export const PROJECT_GITIGNORE_END = "# END DEVOPSFLOW MANAGED";
export const DEFAULT_REPOSITORY = "LiTeXz/devopsflow";

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface HydrateOptions {
  fetchImpl?: FetchLike;
  tagExists?: (repository: string, tag: string) => Promise<boolean>;
  log?: (message: string) => void;
  error?: (message: string) => void;
}

export interface HydrateResult {
  status: "already-current" | "hydrated";
  hash: string;
  tag?: string;
}

export interface HashMismatch {
  storedHash: string;
  correctHash: string;
  updateCommand: string;
}

export interface HookPayload {
  readonly cwd?: unknown;
  readonly hook_event_name?: unknown;
}

export interface SyncStagedHashResult {
  readonly hash: string;
  readonly staged: boolean;
}

export interface SyncProjectGitignoreResult {
  readonly status: "created" | "updated" | "already-current" | "skipped";
  readonly warning?: string;
}

export interface VersionAlignment {
  readonly version: string;
}

function normalizeLineEndings(buffer: Buffer): Buffer {
  return Buffer.from(buffer.toString("utf-8").replace(/\r\n?/g, "\n"), "utf-8");
}

export function hashContent(buffer: Buffer): string {
  return createHash("sha256")
    .update(normalizeLineEndings(buffer))
    .digest("hex");
}

export function manifestForFiles(
  pluginRoot: string,
  paths: readonly string[] = MANAGED_ASSET_PATHS,
): string {
  return [...paths]
    .sort((a, b) => a.localeCompare(b))
    .map((relativePath) => {
      const absolutePath = join(pluginRoot, relativePath);
      if (!existsSync(absolutePath)) {
        throw new Error(`Missing managed asset: ${relativePath}`);
      }
      return `${relativePath}\0${hashContent(readFileSync(absolutePath))}\n`;
    })
    .join("");
}

export function computeManagedAssetHash(
  pluginRoot: string,
  paths: readonly string[] = MANAGED_ASSET_PATHS,
): string {
  return createHash("sha256")
    .update(manifestForFiles(pluginRoot, paths))
    .digest("hex");
}

export function readStoredHash(pluginRoot: string): string {
  const hashPath = join(pluginRoot, HASH_FILE_PATH);
  if (!existsSync(hashPath)) {
    throw new Error(`Missing stored asset hash: ${HASH_FILE_PATH}`);
  }
  return readFileSync(hashPath, "utf-8").trim();
}

export function writeStoredHash(pluginRoot: string, hash: string): void {
  const hashPath = join(pluginRoot, HASH_FILE_PATH);
  mkdirSync(dirname(hashPath), { recursive: true });
  writeFileSync(hashPath, `${hash}\n`);
}

export function computeStagedManagedAssetHash(pluginRoot: string): string {
  const manifest = [...MANAGED_ASSET_PATHS]
    .sort((left, right) => left.localeCompare(right))
    .map((relativePath) => {
      return `${relativePath}\0${hashContent(readStagedFile(pluginRoot, relativePath))}\n`;
    })
    .join("");
  return createHash("sha256").update(manifest).digest("hex");
}

export function checkStagedVersionAlignment(
  pluginRoot: string,
): VersionAlignment {
  const packageVersion = jsonVersion(
    "package.json",
    readStagedFile(pluginRoot, "package.json"),
  );
  const pluginVersion = jsonVersion(
    ".codex-plugin/plugin.json",
    readStagedFile(pluginRoot, ".codex-plugin/plugin.json"),
  );
  const agentContent = readStagedFile(
    pluginRoot,
    "agents/df-publisher.toml",
  ).toString("utf-8");
  if (/^version\s*=/m.test(agentContent)) {
    throw new Error(
      'agents/df-publisher.toml must use # devopsflow-version = "..." instead of a top-level version field',
    );
  }
  const agentVersion = agentContent.match(
    /^#\s*devopsflow-version\s*=\s*"([^"]+)"/m,
  )?.[1];
  if (!agentVersion) {
    throw new Error(
      "agents/df-publisher.toml is missing its devopsflow-version marker",
    );
  }
  if (packageVersion !== pluginVersion || packageVersion !== agentVersion) {
    throw new Error(
      `Version mismatch: package.json=${packageVersion}, plugin.json=${pluginVersion}, df-publisher.toml=${agentVersion}`,
    );
  }
  return { version: packageVersion };
}

function jsonVersion(path: string, content: Buffer): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content.toString("utf-8"));
  } catch (error) {
    throw new Error(`${path} is invalid JSON: ${errorMessage(error)}`);
  }
  const version = isRecord(parsed) ? parsed.version : undefined;
  if (!isNonEmptyString(version)) {
    throw new Error(`${path} is missing a non-empty version`);
  }
  return version;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readStagedFile(pluginRoot: string, relativePath: string): Buffer {
  const result = git(pluginRoot, ["show", `:${relativePath}`]);
  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to read staged file ${relativePath}: ${result.stderr.toString().trim()}`,
    );
  }
  return result.stdout;
}

export function syncStagedManagedAssetHash(
  pluginRoot: string,
): SyncStagedHashResult {
  const hash = computeStagedManagedAssetHash(pluginRoot);
  writeStoredHash(pluginRoot, hash);
  const addResult = git(pluginRoot, ["add", "--", HASH_FILE_PATH]);
  if (addResult.exitCode !== 0) {
    throw new Error(
      `Unable to stage ${HASH_FILE_PATH}: ${addResult.stderr.toString().trim()}`,
    );
  }
  const diffResult = git(pluginRoot, [
    "diff",
    "--cached",
    "--quiet",
    "--",
    HASH_FILE_PATH,
  ]);
  if (diffResult.exitCode !== 0 && diffResult.exitCode !== 1) {
    throw new Error(
      `Unable to inspect staged ${HASH_FILE_PATH}: ${diffResult.stderr.toString().trim()}`,
    );
  }
  return { hash, staged: diffResult.exitCode === 1 };
}

function git(pluginRoot: string, args: string[]): Bun.ReadableSyncSubprocess {
  return Bun.spawnSync({
    cmd: ["git", ...args],
    cwd: pluginRoot,
    stderr: "pipe",
    stdout: "pipe",
  });
}

export function assetHashUpdateCommand(): string {
  return `bun skills/df-codex-assets/scripts/df-codex-assets.ts compute > ${HASH_FILE_PATH}`;
}

export function checkManagedAssetHash(
  pluginRoot: string,
): HashMismatch | undefined {
  const storedHash = readStoredHash(pluginRoot);
  const correctHash = computeManagedAssetHash(pluginRoot);
  if (storedHash === correctHash) return undefined;
  return {
    storedHash,
    correctHash,
    updateCommand: assetHashUpdateCommand(),
  };
}

export function readJsonFile(
  path: string,
): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function readPluginVersion(pluginRoot: string): string {
  const pluginJson = readJsonFile(
    join(pluginRoot, ".codex-plugin", "plugin.json"),
  );
  const packageJson = readJsonFile(join(pluginRoot, "package.json"));
  const version =
    typeof pluginJson?.version === "string"
      ? pluginJson.version
      : typeof packageJson?.version === "string"
        ? packageJson.version
        : undefined;
  if (!version) {
    throw new Error(
      "Unable to determine plugin version from .codex-plugin/plugin.json or package.json",
    );
  }
  return version;
}

export function readPluginRepository(pluginRoot: string): string {
  const pluginJson = readJsonFile(
    join(pluginRoot, ".codex-plugin", "plugin.json"),
  );
  const repository =
    typeof pluginJson?.repository === "string"
      ? repositoryFromUrl(pluginJson.repository)
      : undefined;
  return repository ?? DEFAULT_REPOSITORY;
}

export function repositoryFromUrl(repositoryUrl: string): string | undefined {
  const trimmed = repositoryUrl.trim();
  const githubMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/?#].*)?$/i,
  );
  if (githubMatch) return `${githubMatch[1]}/${githubMatch[2]}`;
  const shorthandMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (shorthandMatch) return trimmed;
  return undefined;
}

export function rawAssetUrl(
  repository: string,
  tag: string,
  path: string,
): string {
  return `https://raw.githubusercontent.com/${repository}/${tag}/${path}`;
}

export async function downloadAsset(
  repository: string,
  tag: string,
  path: string,
  fetchImpl: FetchLike = fetch,
): Promise<Buffer> {
  const response = await fetchImpl(rawAssetUrl(repository, tag, path));
  if (!response.ok) {
    throw new Error(
      `Failed to download ${path} from ${tag}: HTTP ${response.status}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

async function defaultTagExists(
  repository: string,
  tag: string,
  fetchImpl: FetchLike,
): Promise<boolean> {
  const tagUrl = `https://github.com/${repository}/releases/tag/${tag}`;
  try {
    const response = await fetchImpl(tagUrl, { method: "HEAD" });
    if (response.ok) return true;
    if (response.status !== 405) return false;
    const getResponse = await fetchImpl(tagUrl, { method: "GET" });
    return getResponse.ok;
  } catch {
    return false;
  }
}

export async function hydrateManagedAssets(
  pluginRoot = process.env.PLUGIN_ROOT || process.cwd(),
  options: HydrateOptions = {},
): Promise<HydrateResult> {
  const storedHash = readStoredHash(pluginRoot);
  try {
    const currentHash = computeManagedAssetHash(pluginRoot);
    if (currentHash === storedHash) {
      return { status: "already-current", hash: currentHash };
    }
  } catch {
    // Missing or incomplete installed plugin assets are hydrated below.
  }

  const version = readPluginVersion(pluginRoot);
  const tag = `v${version}`;
  const repository = readPluginRepository(pluginRoot);
  const fetchImpl = options.fetchImpl ?? fetch;
  const tagExists =
    options.tagExists ??
    ((repo, releaseTag) => defaultTagExists(repo, releaseTag, fetchImpl));

  if (!(await tagExists(repository, tag))) {
    throw new Error(
      `Required release tag ${tag} was not found in ${repository}`,
    );
  }

  for (const path of MANAGED_ASSET_PATHS) {
    const content = await downloadAsset(repository, tag, path, fetchImpl);
    const targetPath = join(pluginRoot, path);
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, normalizeLineEndings(content));
  }

  const hydratedHash = computeManagedAssetHash(pluginRoot);
  if (hydratedHash !== storedHash) {
    throw new Error(
      `Hydrated asset hash mismatch: stored ${storedHash}, hydrated ${hydratedHash}`,
    );
  }
  return { status: "hydrated", hash: hydratedHash, tag };
}

export function installProjectAgent(
  pluginRoot: string,
  projectRoot: string,
): boolean {
  const sourcePath = join(pluginRoot, "agents", "df-publisher.toml");
  const targetPath = join(projectRoot, ".codex", "agents", "df-publisher.toml");
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing managed asset: agents/df-publisher.toml`);
  }
  if (
    existsSync(targetPath) &&
    hashContent(readFileSync(targetPath)) ===
      hashContent(readFileSync(sourcePath))
  ) {
    return false;
  }
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
  return true;
}

function countMarkerLines(content: string, marker: string): number {
  return content
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line === marker).length;
}

function markerLineIndex(content: string, marker: string): number {
  const matcher = new RegExp(
    `(?:^|\\r?\\n)${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\r?\\n|$)`,
  );
  const match = matcher.exec(content);
  if (!match) return -1;
  return (
    match.index +
    (match[0].startsWith("\r\n") ? 2 : match[0].startsWith("\n") ? 1 : 0)
  );
}

function newlineFor(content: string): "\r\n" | "\n" {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

function normalizeTemplate(content: string, newline: "\r\n" | "\n"): string {
  return `${content.replace(/\r\n?/g, "\n").trimEnd().replaceAll("\n", newline)}${newline}`;
}

export function syncProjectGitignore(
  pluginRoot: string,
  projectRoot: string,
): SyncProjectGitignoreResult {
  const sourcePath = join(pluginRoot, PROJECT_GITIGNORE_TEMPLATE_PATH);
  if (!existsSync(sourcePath)) {
    return {
      status: "skipped",
      warning: `Missing managed asset: ${PROJECT_GITIGNORE_TEMPLATE_PATH}; project .gitignore was not modified`,
    };
  }

  const sourceContent = readFileSync(sourcePath, "utf-8");
  if (
    countMarkerLines(sourceContent, PROJECT_GITIGNORE_START) !== 1 ||
    countMarkerLines(sourceContent, PROJECT_GITIGNORE_END) !== 1 ||
    markerLineIndex(sourceContent, PROJECT_GITIGNORE_START) >=
      markerLineIndex(sourceContent, PROJECT_GITIGNORE_END)
  ) {
    return {
      status: "skipped",
      warning: `Managed template markers are invalid; project .gitignore was not modified`,
    };
  }

  const targetPath = join(projectRoot, ".devopsflow", ".gitignore");
  if (!existsSync(targetPath)) {
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, normalizeTemplate(sourceContent, "\n"));
    return { status: "created" };
  }

  const currentContent = readFileSync(targetPath, "utf-8");
  const newline = newlineFor(currentContent);
  const managedBlock = normalizeTemplate(sourceContent, newline);
  const startCount = countMarkerLines(currentContent, PROJECT_GITIGNORE_START);
  const endCount = countMarkerLines(currentContent, PROJECT_GITIGNORE_END);
  let updatedContent: string;

  if (startCount === 0 && endCount === 0) {
    const prefix = currentContent.trimEnd();
    updatedContent = prefix
      ? `${prefix}${newline}${newline}${managedBlock}`
      : managedBlock;
  } else if (startCount === 1 && endCount === 1) {
    const startIndex = markerLineIndex(currentContent, PROJECT_GITIGNORE_START);
    const endIndex = markerLineIndex(currentContent, PROJECT_GITIGNORE_END);
    if (startIndex < 0 || endIndex < startIndex) {
      return {
        status: "skipped",
        warning: `Managed project .gitignore markers are malformed; file was not modified`,
      };
    }
    const blockEnd = endIndex + PROJECT_GITIGNORE_END.length;
    const trailingNewlineLength = currentContent.startsWith("\r\n", blockEnd)
      ? 2
      : currentContent.startsWith("\n", blockEnd)
        ? 1
        : 0;
    updatedContent = `${currentContent.slice(0, startIndex)}${managedBlock}${currentContent.slice(blockEnd + trailingNewlineLength)}`;
  } else {
    return {
      status: "skipped",
      warning: `Managed project .gitignore markers are malformed; file was not modified`,
    };
  }

  if (updatedContent === currentContent) return { status: "already-current" };
  writeFileSync(targetPath, updatedContent);
  return { status: "updated" };
}

function projectRootFromPayload(
  payload: HookPayload | null,
): string | undefined {
  return typeof payload?.cwd === "string" && payload.cwd.trim()
    ? payload.cwd
    : undefined;
}

function defaultPluginRoot(): string {
  return resolve(import.meta.dir, "../../..");
}

function printCheckMismatch(
  mismatch: HashMismatch,
  error: (message: string) => void,
): void {
  error("DevopsFlow Codex asset hash mismatch.");
  error(`stored hash:  ${mismatch.storedHash}`);
  error(`correct hash: ${mismatch.correctHash}`);
  error(`update with:   ${mismatch.updateCommand}`);
}

export async function runCli(
  args: string[] = process.argv.slice(2),
  payload: HookPayload | null = null,
): Promise<number> {
  const command = args[0] ?? "check";
  const pluginRoot = process.env.PLUGIN_ROOT || defaultPluginRoot();

  try {
    if (command === "compute") {
      console.log(computeManagedAssetHash(pluginRoot));
      return 0;
    }
    if (command === "check") {
      const mismatch = checkManagedAssetHash(pluginRoot);
      if (mismatch) {
        printCheckMismatch(mismatch, console.error);
        return 1;
      }
      return 0;
    }
    if (command === "hydrate") {
      await hydrateManagedAssets(pluginRoot);
      const projectRoot = projectRootFromPayload(payload);
      if (projectRoot) installProjectAgent(pluginRoot, projectRoot);
      return 0;
    }
    if (command === "sync-project-gitignore") {
      const projectRoot = projectRootFromPayload(payload);
      if (!projectRoot) return 0;
      const result = syncProjectGitignore(pluginRoot, projectRoot);
      if (result.warning) console.warn(result.warning);
      return 0;
    }
    if (command === "sync-staged") {
      const result = syncStagedManagedAssetHash(pluginRoot);
      console.log(`Managed Codex asset hash: ${result.hash}`);
      return 0;
    }
    if (command === "check-versions-staged") {
      const result = checkStagedVersionAlignment(pluginRoot);
      console.log(`All staged versions aligned: ${result.version}`);
      return 0;
    }
    console.error(`Unknown command: ${command}`);
    console.error(
      "Usage: df-codex-assets.ts <check-versions-staged|compute|check|hydrate|sync-project-gitignore|sync-staged>",
    );
    return 2;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (import.meta.main) {
  const payload = process.stdin.isTTY ? null : readScriptPayload();
  process.exit(
    await runLoggedScriptAsync(
      {
        details: { command: process.argv[2] ?? "check" },
        payload,
        scriptName: "df-codex-assets",
      },
      () => runCli(undefined, payload),
    ),
  );
}
