#!/usr/bin/env bun

import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { runLoggedScript } from "./script-logger";

const DEFAULT_COMMAND_TIMEOUT_SECONDS = 600;
const DEFAULT_ADDITIONAL_CONTEXT_LIMIT = 2_500;
const SESSION_END_DEFAULT_TIMEOUT_SECONDS = 1;
const SESSION_END_MAX_TIMEOUT_SECONDS = 3;

const EVENT_KEYS = {
  PreToolUse: "pre_tool_use",
  PermissionRequest: "permission_request",
  PostToolUse: "post_tool_use",
  PreCompact: "pre_compact",
  PostCompact: "post_compact",
  SessionStart: "session_start",
  SessionEnd: "session_end",
  UserPromptSubmit: "user_prompt_submit",
  SubagentStart: "subagent_start",
  SubagentStop: "subagent_stop",
  Stop: "stop",
} as const;

type CodexEventName = keyof typeof EVENT_KEYS;
type CodexEventKey = (typeof EVENT_KEYS)[CodexEventName];

const MATCHER_EVENTS = new Set<CodexEventKey>([
  "pre_tool_use",
  "permission_request",
  "post_tool_use",
  "pre_compact",
  "post_compact",
  "session_start",
  "session_end",
  "subagent_start",
  "subagent_stop",
]);

const ADDITIONAL_CONTEXT_EVENTS = new Set<CodexEventKey>([
  "pre_tool_use",
  "post_tool_use",
  "session_start",
  "user_prompt_submit",
  "subagent_start",
]);

interface CommandHook {
  type: "command";
  command: string;
  commandWindows?: string;
  timeout?: number;
  async?: boolean;
  statusMessage?: string;
  additionalContextLimit?: number;
}

interface UnsupportedHook {
  type: "prompt" | "agent";
}

interface MatcherGroup {
  matcher?: string;
  hooks: Array<CommandHook | UnsupportedHook>;
}

interface PluginManifest {
  name: string;
  hooks: string;
}

interface MarketplaceManifest {
  name: string;
}

export interface HookTrustEntry {
  key: string;
  trustedHash: string;
}

export interface TrustPluginHooksOptions {
  configPath?: string;
  platform?: NodeJS.Platform;
  pluginRoot?: string;
}

export interface TrustPluginHooksResult {
  status: "already-trusted" | "updated";
  trusted: number;
  unchanged: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonRecord(path: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    throw new Error(`Unable to parse JSON ${path}: ${errorMessage(error)}`);
  }
  if (!isRecord(parsed)) {
    throw new Error(`Expected a JSON object in ${path}`);
  }
  return parsed;
}

function readPluginManifest(pluginRoot: string): PluginManifest {
  const path = join(pluginRoot, ".codex-plugin", "plugin.json");
  const parsed = readJsonRecord(path);
  if (typeof parsed.name !== "string" || typeof parsed.hooks !== "string") {
    throw new Error(`${path} must define string name and hooks fields`);
  }
  return { name: parsed.name, hooks: parsed.hooks };
}

function readMarketplaceManifest(pluginRoot: string): MarketplaceManifest {
  const path = join(pluginRoot, ".codex-plugin", "marketplace.json");
  const parsed = readJsonRecord(path);
  if (typeof parsed.name !== "string") {
    throw new Error(`${path} must define a string name field`);
  }
  return { name: parsed.name };
}

function pluginRelativePath(
  pluginRoot: string,
  configuredPath: string,
): string {
  const absolutePath = resolve(pluginRoot, configuredPath);
  const relativePath = relative(pluginRoot, absolutePath);
  if (
    !relativePath ||
    isAbsolute(relativePath) ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`)
  ) {
    throw new Error(
      `Plugin hook path must stay within plugin root: ${configuredPath}`,
    );
  }
  return relativePath.replaceAll("\\", "/");
}

function readHookGroups(
  hookManifestPath: string,
): Array<[CodexEventName, MatcherGroup[]]> {
  const parsed = readJsonRecord(hookManifestPath);
  if (!isRecord(parsed.hooks)) {
    throw new Error(`${hookManifestPath} must define a hooks object`);
  }

  return Object.entries(parsed.hooks).map(([eventName, groups]) => {
    if (!(eventName in EVENT_KEYS)) {
      throw new Error(`Unsupported Codex hook event: ${eventName}`);
    }
    if (!Array.isArray(groups)) {
      throw new Error(
        `Codex hook event ${eventName} must contain matcher groups`,
      );
    }
    return [eventName as CodexEventName, groups as MatcherGroup[]];
  });
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function normalizedTimeout(eventKey: CodexEventKey, timeout?: number): number {
  if (eventKey === "session_end") {
    return Math.min(
      Math.max(timeout ?? SESSION_END_DEFAULT_TIMEOUT_SECONDS, 1),
      SESSION_END_MAX_TIMEOUT_SECONDS,
    );
  }
  return Math.max(timeout ?? DEFAULT_COMMAND_TIMEOUT_SECONDS, 1);
}

function normalizedCommandHook(
  eventKey: CodexEventKey,
  handler: CommandHook,
  platform: NodeJS.Platform,
): Record<string, unknown> | undefined {
  const command =
    platform === "win32" && handler.commandWindows !== undefined
      ? handler.commandWindows
      : handler.command;
  if (handler.async && eventKey !== "session_end") return undefined;
  if (!command.trim()) return undefined;

  const normalized: Record<string, unknown> = {
    type: "command",
    command,
    timeout: normalizedTimeout(eventKey, handler.timeout),
    async: handler.async ?? false,
  };
  if (handler.statusMessage !== undefined) {
    normalized.statusMessage = handler.statusMessage;
  }
  if (
    ADDITIONAL_CONTEXT_EVENTS.has(eventKey) &&
    handler.additionalContextLimit !== undefined &&
    handler.additionalContextLimit !== DEFAULT_ADDITIONAL_CONTEXT_LIMIT
  ) {
    normalized.additionalContextLimit = handler.additionalContextLimit;
  }
  return normalized;
}

function commandHookHash(
  eventKey: CodexEventKey,
  group: MatcherGroup,
  handler: CommandHook,
  platform: NodeJS.Platform,
): string | undefined {
  const normalizedHandler = normalizedCommandHook(eventKey, handler, platform);
  if (!normalizedHandler) return undefined;
  const matcher = MATCHER_EVENTS.has(eventKey) ? group.matcher : undefined;
  const identity = {
    event_name: eventKey,
    ...(matcher === undefined ? {} : { matcher }),
    hooks: [normalizedHandler],
  };
  const canonicalJson = JSON.stringify(canonicalize(identity));
  return `sha256:${createHash("sha256").update(canonicalJson).digest("hex")}`;
}

export function collectPluginHookTrustEntries(
  pluginRoot: string,
  platform: NodeJS.Platform = process.platform,
): HookTrustEntry[] {
  const plugin = readPluginManifest(pluginRoot);
  const marketplace = readMarketplaceManifest(pluginRoot);
  const hookRelativePath = pluginRelativePath(pluginRoot, plugin.hooks);
  const hookManifestPath = join(pluginRoot, ...hookRelativePath.split("/"));
  const keySource = `${plugin.name}@${marketplace.name}:${hookRelativePath}`;
  const entries: HookTrustEntry[] = [];

  for (const [eventName, groups] of readHookGroups(hookManifestPath)) {
    const eventKey = EVENT_KEYS[eventName];
    groups.forEach((group, groupIndex) => {
      if (!isRecord(group) || !Array.isArray(group.hooks)) {
        throw new Error(`${eventName} matcher group ${groupIndex} is invalid`);
      }
      group.hooks.forEach((handler, handlerIndex) => {
        if (!isRecord(handler) || typeof handler.type !== "string") {
          throw new Error(
            `${eventName} hook ${groupIndex}:${handlerIndex} is invalid`,
          );
        }
        if (handler.type === "prompt" || handler.type === "agent") return;
        if (handler.type !== "command" || typeof handler.command !== "string") {
          throw new Error(
            `${eventName} hook ${groupIndex}:${handlerIndex} is not a valid command hook`,
          );
        }
        const trustedHash = commandHookHash(
          eventKey,
          group,
          handler as unknown as CommandHook,
          platform,
        );
        if (!trustedHash) return;
        entries.push({
          key: `${keySource}:${eventKey}:${groupIndex}:${handlerIndex}`,
          trustedHash,
        });
      });
    });
  }
  return entries;
}

function parseConfig(
  content: string,
  configPath: string,
): Record<string, unknown> {
  try {
    const parsed = Bun.TOML.parse(content);
    if (!isRecord(parsed)) throw new Error("root value is not a table");
    return parsed;
  } catch (error) {
    throw new Error(
      `Unable to parse Codex config ${configPath}: ${errorMessage(error)}`,
    );
  }
}

function configuredHookStates(
  parsed: Record<string, unknown>,
): Record<string, unknown> {
  if (parsed.hooks === undefined) return {};
  if (!isRecord(parsed.hooks))
    throw new Error("Codex config hooks must be a table");
  if (parsed.hooks.state === undefined) return {};
  if (!isRecord(parsed.hooks.state)) {
    throw new Error("Codex config hooks.state must be a table");
  }
  return parsed.hooks.state;
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function sectionHeader(key: string): string {
  return `[hooks.state.${tomlString(key)}]`;
}

function updateExistingSection(
  content: string,
  key: string,
  trustedHash: string,
): string {
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const header = sectionHeader(key);
  const sectionStart = lines.findIndex((line) => line.trim() === header);
  if (sectionStart < 0) {
    throw new Error(
      `Unable to locate existing Codex hook state section: ${key}`,
    );
  }
  let sectionEnd = lines.length;
  for (let index = sectionStart + 1; index < lines.length; index++) {
    if (lines[index]?.trimStart().startsWith("[")) {
      sectionEnd = index;
      break;
    }
  }
  const hashIndex = lines.findIndex(
    (line, index) =>
      index > sectionStart &&
      index < sectionEnd &&
      /^\s*trusted_hash\s*=/.test(line),
  );
  const hashLine = `trusted_hash = ${tomlString(trustedHash)}`;
  if (hashIndex >= 0) lines[hashIndex] = hashLine;
  else lines.splice(sectionStart + 1, 0, hashLine);
  return lines.join(newline);
}

function appendStateSection(
  content: string,
  key: string,
  trustedHash: string,
): string {
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  let updated = content;
  if (updated && !updated.endsWith(newline)) updated += newline;
  if (updated && !updated.endsWith(`${newline}${newline}`)) updated += newline;
  return `${updated}${sectionHeader(key)}${newline}trusted_hash = ${tomlString(trustedHash)}${newline}`;
}

function existingTrustedHash(state: unknown): string | undefined {
  return isRecord(state) && typeof state.trusted_hash === "string"
    ? state.trusted_hash
    : undefined;
}

function writeConfigAtomically(
  configPath: string,
  originalContent: string | undefined,
  updatedContent: string,
): void {
  const configDirectory = dirname(configPath);
  mkdirSync(configDirectory, { recursive: true });
  const temporaryPath = join(
    configDirectory,
    `.${configPath.split(/[\\/]/).at(-1)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    writeFileSync(temporaryPath, updatedContent, {
      encoding: "utf-8",
      mode: originalContent === undefined ? 0o600 : statSync(configPath).mode,
    });
    if (
      originalContent !== undefined &&
      readFileSync(configPath, "utf-8") !== originalContent
    ) {
      throw new Error(
        `Codex config changed while trust entries were being prepared`,
      );
    }
    if (originalContent !== undefined) {
      chmodSync(temporaryPath, statSync(configPath).mode);
    }
    renameSync(temporaryPath, configPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

export function defaultCodexConfigPath(): string {
  const codexRoot = process.env.CODEX_HOME || join(homedir(), ".codex");
  return join(codexRoot, "config.toml");
}

function defaultPluginRoot(): string {
  return resolve(import.meta.dir, "../../..");
}

export function trustPluginHooks(
  options: TrustPluginHooksOptions = {},
): TrustPluginHooksResult {
  const pluginRoot =
    options.pluginRoot ?? process.env.PLUGIN_ROOT ?? defaultPluginRoot();
  const configPath = options.configPath ?? defaultCodexConfigPath();
  const platform = options.platform ?? process.platform;
  const entries = collectPluginHookTrustEntries(pluginRoot, platform);
  const originalContent = existsSync(configPath)
    ? readFileSync(configPath, "utf-8")
    : undefined;
  const parsed = parseConfig(originalContent ?? "", configPath);
  const states = configuredHookStates(parsed);
  let updatedContent = originalContent ?? "";
  let trusted = 0;
  let unchanged = 0;

  for (const entry of entries) {
    const existingState = states[entry.key];
    if (existingTrustedHash(existingState) === entry.trustedHash) {
      unchanged++;
      continue;
    }
    updatedContent =
      existingState === undefined
        ? appendStateSection(updatedContent, entry.key, entry.trustedHash)
        : updateExistingSection(updatedContent, entry.key, entry.trustedHash);
    trusted++;
  }

  if (trusted === 0) {
    return { status: "already-trusted", trusted, unchanged };
  }
  parseConfig(updatedContent, configPath);
  writeConfigAtomically(configPath, originalContent, updatedContent);
  return { status: "updated", trusted, unchanged };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function runCli(): number {
  try {
    const result = trustPluginHooks();
    if (result.status === "already-trusted") {
      console.log(
        `All ${result.unchanged} DevopsFlow hooks are already trusted.`,
      );
    } else {
      console.log(
        `Trusted ${result.trusted} DevopsFlow hooks; ${result.unchanged} were already trusted.`,
      );
    }
    return 0;
  } catch (error) {
    console.error(errorMessage(error));
    return 1;
  }
}

if (import.meta.main) {
  process.exit(
    runLoggedScript({ scriptName: "trust-codex-hooks" }, () => runCli()),
  );
}
