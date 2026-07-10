import { afterEach, describe, expect, it } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
	checkManagedAssetHash,
	computeManagedAssetHash,
	type FetchLike,
	hashContent,
	hydrateManagedAssets,
	MANAGED_ASSET_PATHS,
	manifestForFiles,
	readPluginVersion,
	runCli,
	writeStoredHash,
} from "./df-codex-assets";

const tempRoots: string[] = [];

afterEach(() => {
	while (tempRoots.length) {
		const root = tempRoots.pop();
		if (root) rmSync(root, { recursive: true, force: true });
	}
	delete process.env.PLUGIN_ROOT;
});

function tempRoot(): string {
	const root = mkdtempSync(join(tmpdir(), "df-codex-assets-"));
	tempRoots.push(root);
	return root;
}

function writeAsset(root: string, path: string, content: string): void {
	const absolutePath = join(root, path);
	mkdirSync(dirname(absolutePath), { recursive: true });
	writeFileSync(absolutePath, content);
}

function writeManagedAssets(
	root: string,
	overrides: Record<string, string> = {},
): void {
	for (const path of MANAGED_ASSET_PATHS) {
		writeAsset(root, path, overrides[path] ?? `${path}\n`);
	}
}

function fixtureFetch(root: string): FetchLike {
	return (async (input: string | URL | Request) => {
		const url = String(input);
		const marker = "/v1.2.3/";
		const markerIndex = url.indexOf(marker);
		if (markerIndex < 0) return new Response("missing", { status: 404 });
		const relativePath = url.slice(markerIndex + marker.length);
		const absolutePath = join(root, relativePath);
		if (!existsSync(absolutePath))
			return new Response("missing", { status: 404 });
		return new Response(readFileSync(absolutePath));
	}) as FetchLike;
}

describe("df-codex-assets", () => {
	it("sorts relative paths before hashing the manifest", () => {
		const root = tempRoot();
		writeAsset(root, "b.txt", "b\n");
		writeAsset(root, "a.txt", "a\n");

		const manifest = manifestForFiles(root, ["b.txt", "a.txt"]);

		expect(manifest.indexOf("a.txt\0")).toBeLessThan(
			manifest.indexOf("b.txt\0"),
		);
		expect(computeManagedAssetHash(root, ["b.txt", "a.txt"])).toBe(
			computeManagedAssetHash(root, ["a.txt", "b.txt"]),
		);
	});

	it("normalizes CRLF and CR line endings before hashing file content", () => {
		expect(hashContent(Buffer.from("one\r\ntwo\rthree\n"))).toBe(
			hashContent(Buffer.from("one\ntwo\nthree\n")),
		);
	});

	it("fails when a managed asset is missing", () => {
		const root = tempRoot();
		writeManagedAssets(root);
		rmSync(join(root, "src/shared/types.ts"));

		expect(() => computeManagedAssetHash(root)).toThrow(
			"Missing managed asset: src/shared/types.ts",
		);
	});

	it("reports check mismatches with stored hash, correct hash, and update command", () => {
		const root = tempRoot();
		writeManagedAssets(root);
		writeStoredHash(root, "old-hash");

		const mismatch = checkManagedAssetHash(root);

		expect(mismatch?.storedHash).toBe("old-hash");
		expect(mismatch?.correctHash).toMatch(/^[a-f0-9]{64}$/);
		expect(mismatch?.updateCommand).toBe(
			"bun skills/df-codex-assets/scripts/df-codex-assets.ts compute > skills/df-codex-assets/assets/hash.txt",
		);
	});

	it("prints check mismatch details from the CLI", async () => {
		const root = tempRoot();
		writeManagedAssets(root);
		writeStoredHash(root, "old-hash");
		process.env.PLUGIN_ROOT = root;
		const errors: string[] = [];
		const originalError = console.error;
		console.error = (message?: unknown) => {
			errors.push(String(message));
		};
		try {
			const exitCode = await runCli(["check"]);
			expect(exitCode).toBe(1);
			expect(errors.join("\n")).toInclude("stored hash:  old-hash");
			expect(errors.join("\n")).toInclude("correct hash:");
			expect(errors.join("\n")).toInclude("update with:");
		} finally {
			console.error = originalError;
		}
	});

	it("hydrates missing managed assets from a matching version tag", async () => {
		const source = tempRoot();
		const target = tempRoot();
		writeManagedAssets(source, {
			"scripts/prevent-main-agent-write.ts": "line\r\nfrom tag\r\n",
		});
		const storedHash = computeManagedAssetHash(source);
		writeStoredHash(source, storedHash);
		writeStoredHash(target, storedHash);
		writeAsset(
			target,
			".codex-plugin/plugin.json",
			JSON.stringify({
				version: "1.2.3",
				repository: "https://github.com/example/devopsflow",
			}),
		);

		const result = await hydrateManagedAssets(target, {
			fetchImpl: fixtureFetch(source),
			tagExists: async (repo, tag) =>
				repo === "example/devopsflow" && tag === "v1.2.3",
		});

		expect(result.status).toBe("hydrated");
		expect(result.hash).toBe(storedHash);
		expect(
			readFileSync(
				join(target, "scripts/prevent-main-agent-write.ts"),
				"utf-8",
			),
		).toBe("line\nfrom tag\n");
	});

	it("fails hydration when the required tag is missing", async () => {
		const root = tempRoot();
		writeStoredHash(root, "stored");
		writeAsset(root, "package.json", JSON.stringify({ version: "1.2.3" }));

		await expect(
			hydrateManagedAssets(root, { tagExists: async () => false }),
		).rejects.toThrow("Required release tag v1.2.3 was not found");
	});

	it("fails hydration when a remote asset cannot be downloaded", async () => {
		const source = tempRoot();
		const target = tempRoot();
		writeManagedAssets(source);
		writeStoredHash(target, computeManagedAssetHash(source));
		writeAsset(target, "package.json", JSON.stringify({ version: "1.2.3" }));

		await expect(
			hydrateManagedAssets(target, {
				fetchImpl: (async () =>
					new Response("missing", { status: 404 })) as FetchLike,
				tagExists: async () => true,
			}),
		).rejects.toThrow("Failed to download agents/df-publisher.toml");
	});

	it("fails closed when hydrated assets do not match the stored hash", async () => {
		const source = tempRoot();
		const target = tempRoot();
		writeManagedAssets(source);
		writeStoredHash(
			target,
			"0000000000000000000000000000000000000000000000000000000000000000",
		);
		writeAsset(target, "package.json", JSON.stringify({ version: "1.2.3" }));

		await expect(
			hydrateManagedAssets(target, {
				fetchImpl: fixtureFetch(source),
				tagExists: async () => true,
			}),
		).rejects.toThrow("Hydrated asset hash mismatch");
	});

	it("reads version from plugin metadata before package.json", () => {
		const root = tempRoot();
		writeAsset(root, "package.json", JSON.stringify({ version: "0.0.1" }));
		writeAsset(
			root,
			".codex-plugin/plugin.json",
			JSON.stringify({ version: "1.2.3" }),
		);

		expect(readPluginVersion(root)).toBe("1.2.3");
	});
});
