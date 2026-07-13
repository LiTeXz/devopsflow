#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const MANAGED_ASSET_PATHS = [
	"agents/df-publisher.toml",
	"scripts/prevent-git-github-operations.ts",
	"scripts/prevent-main-agent-write.ts",
	"scripts/prevent-protected-branch-push.ts",
	"src/shared/branch.ts",
	"src/shared/command-parser.ts",
	"src/shared/opencode-adapter.ts",
	"src/shared/payload.ts",
	"src/shared/state-store.ts",
	"src/shared/types.ts",
	"package.json",
	"tsconfig.json",
] as const;

export const HASH_FILE_PATH = "skills/df-codex-assets/assets/hash.txt";
export const DEFAULT_REPOSITORY = "TrueNine/devopsflow";

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

function printCheckMismatch(
	mismatch: HashMismatch,
	error: (message: string) => void,
): void {
	error("DevOpsFlow Codex asset hash mismatch.");
	error(`stored hash:  ${mismatch.storedHash}`);
	error(`correct hash: ${mismatch.correctHash}`);
	error(`update with:   ${mismatch.updateCommand}`);
}

export async function runCli(
	args: string[] = process.argv.slice(2),
): Promise<number> {
	const command = args[0] ?? "check";
	const pluginRoot = process.env.PLUGIN_ROOT || process.cwd();

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
			return 0;
		}
		console.error(`Unknown command: ${command}`);
		console.error("Usage: df-codex-assets.ts <compute|check|hydrate>");
		return 2;
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

if (import.meta.main) {
	process.exit(await runCli());
}
