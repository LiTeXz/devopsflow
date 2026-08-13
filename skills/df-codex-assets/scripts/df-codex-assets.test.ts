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
  AGENT_TOML_PATHS,
  checkManagedAssetHash,
  computeManagedAssetHash,
  DEFAULT_REPOSITORY,
  type FetchLike,
  hashContent,
  hydrateManagedAssets,
  MANAGED_ASSET_PATHS,
  manifestForFiles,
  readPluginRepository,
  readPluginVersion,
  runCli,
  writeStoredHash,
} from "./df-codex-assets";

const tempRoots: string[] = [];
const PROJECT_GITIGNORE_TEMPLATE = [
  "# BEGIN DEVOPSFLOW MANAGED",
  ".tdd_checkpoints/**",
  "# END DEVOPSFLOW MANAGED",
  "",
].join("\n");

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
  it("uses Windows-compatible SessionStart commands", () => {
    const hooks = JSON.parse(
      readFileSync(
        join(import.meta.dir, "..", "..", "..", "hooks", "hooks.codex.json"),
        "utf-8",
      ),
    ) as {
      hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }> };
    };
    const commands = hooks.hooks.SessionStart[0]?.hooks.map(
      (hook) => hook.command,
    );
    const pluginRootToken = ["$", "{PLUGIN_ROOT}"].join("");

    expect(commands).toEqual([
      `bun "${pluginRootToken}/skills/df-codex-assets/scripts/df-codex-assets.ts" hydrate`,
      `bun "${pluginRootToken}/skills/df-codex-assets/scripts/df-codex-assets.ts" sync-project-gitignore`,
    ]);
    for (const command of commands ?? []) expect(command).not.toMatch(/^\w+=/);
  });

  it("injects every managed subagent into the SessionStart project after hydration", async () => {
    const pluginRoot = tempRoot();
    const projectRoot = tempRoot();
    writeManagedAssets(pluginRoot);
    writeStoredHash(pluginRoot, computeManagedAssetHash(pluginRoot));
    process.env.PLUGIN_ROOT = pluginRoot;

    const exitCode = await runCli(["hydrate"], {
      cwd: projectRoot,
      hook_event_name: "SessionStart",
    });

    expect(exitCode).toBe(0);
    for (const path of AGENT_TOML_PATHS) {
      expect(readFileSync(join(projectRoot, ".codex", path), "utf-8")).toBe(
        `${path}\n`,
      );
    }
  });

  it("creates the managed project gitignore from the plugin template", async () => {
    const pluginRoot = tempRoot();
    const projectRoot = tempRoot();
    writeAsset(
      pluginRoot,
      "skills/df-codex-assets/assets/.gitignore",
      PROJECT_GITIGNORE_TEMPLATE,
    );
    process.env.PLUGIN_ROOT = pluginRoot;

    const exitCode = await runCli(["sync-project-gitignore"], {
      cwd: projectRoot,
      hook_event_name: "SessionStart",
    });

    expect(exitCode).toBe(0);
    expect(
      readFileSync(join(projectRoot, ".devopsflow", ".gitignore"), "utf-8"),
    ).toBe(PROJECT_GITIGNORE_TEMPLATE);
  });

  it("appends and updates only the managed project gitignore block", async () => {
    const pluginRoot = tempRoot();
    const projectRoot = tempRoot();
    const targetPath = join(projectRoot, ".devopsflow", ".gitignore");
    writeAsset(
      pluginRoot,
      "skills/df-codex-assets/assets/.gitignore",
      PROJECT_GITIGNORE_TEMPLATE,
    );
    writeAsset(projectRoot, ".devopsflow/.gitignore", "custom-cache/\n");
    process.env.PLUGIN_ROOT = pluginRoot;

    expect(await runCli(["sync-project-gitignore"], { cwd: projectRoot })).toBe(
      0,
    );
    expect(readFileSync(targetPath, "utf-8")).toBe(
      `custom-cache/\n\n${PROJECT_GITIGNORE_TEMPLATE}`,
    );

    writeFileSync(
      targetPath,
      [
        "custom-cache/",
        "",
        "# BEGIN DEVOPSFLOW MANAGED",
        "old-rule/",
        "# END DEVOPSFLOW MANAGED",
        "",
        "keep-me/",
        "",
      ].join("\n"),
    );

    expect(await runCli(["sync-project-gitignore"], { cwd: projectRoot })).toBe(
      0,
    );
    expect(readFileSync(targetPath, "utf-8")).toBe(
      `custom-cache/\n\n${PROJECT_GITIGNORE_TEMPLATE}\nkeep-me/\n`,
    );
  });

  it("does not rewrite an already current project gitignore", async () => {
    const pluginRoot = tempRoot();
    const projectRoot = tempRoot();
    const targetPath = join(projectRoot, ".devopsflow", ".gitignore");
    writeAsset(
      pluginRoot,
      "skills/df-codex-assets/assets/.gitignore",
      PROJECT_GITIGNORE_TEMPLATE,
    );
    writeAsset(
      projectRoot,
      ".devopsflow/.gitignore",
      PROJECT_GITIGNORE_TEMPLATE,
    );
    process.env.PLUGIN_ROOT = pluginRoot;
    const before = Bun.file(targetPath).lastModified;

    await Bun.sleep(10);
    expect(await runCli(["sync-project-gitignore"], { cwd: projectRoot })).toBe(
      0,
    );

    expect(Bun.file(targetPath).lastModified).toBe(before);
  });

  for (const [name, malformed] of [
    [
      "a missing end marker",
      "custom-cache/\n# BEGIN DEVOPSFLOW MANAGED\nold-rule/\n",
    ],
    [
      "reversed markers",
      "custom-cache/\n# END DEVOPSFLOW MANAGED\nold-rule/\n# BEGIN DEVOPSFLOW MANAGED\n",
    ],
    [
      "duplicate markers",
      "custom-cache/\n# BEGIN DEVOPSFLOW MANAGED\nold-rule/\n# BEGIN DEVOPSFLOW MANAGED\n# END DEVOPSFLOW MANAGED\n",
    ],
  ] as const) {
    it(`fails open without changing ${name}`, async () => {
      const pluginRoot = tempRoot();
      const projectRoot = tempRoot();
      const targetPath = join(projectRoot, ".devopsflow", ".gitignore");
      writeAsset(
        pluginRoot,
        "skills/df-codex-assets/assets/.gitignore",
        PROJECT_GITIGNORE_TEMPLATE,
      );
      writeAsset(projectRoot, ".devopsflow/.gitignore", malformed);
      process.env.PLUGIN_ROOT = pluginRoot;
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (message?: unknown) => warnings.push(String(message));
      try {
        expect(
          await runCli(["sync-project-gitignore"], { cwd: projectRoot }),
        ).toBe(0);
      } finally {
        console.warn = originalWarn;
      }

      expect(readFileSync(targetPath, "utf-8")).toBe(malformed);
      expect(warnings.join("\n")).toContain("not modified");
    });
  }

  it("skips project gitignore synchronization without a payload cwd", async () => {
    const pluginRoot = tempRoot();
    writeAsset(
      pluginRoot,
      "skills/df-codex-assets/assets/.gitignore",
      PROJECT_GITIGNORE_TEMPLATE,
    );
    process.env.PLUGIN_ROOT = pluginRoot;

    expect(await runCli(["sync-project-gitignore"], null)).toBe(0);
  });

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
      "bun skills/df-codex-assets/scripts/df-codex-assets.ts compute > skills/df-codex-assets/assets/all.lock",
    );
  });

  it("keeps the staged managed asset lock under Husky control", () => {
    const preCommit = readFileSync(
      join(import.meta.dir, "..", "..", "..", ".husky", "pre-commit"),
      "utf-8",
    );

    expect(preCommit).toContain(
      "bun skills/df-codex-assets/scripts/df-codex-assets.ts sync-staged",
    );
    expect(preCommit).not.toContain("all.lock");
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
      "hooks/subagent/prevent-main-agent-write.ts": "line\r\nfrom tag\r\n",
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
        join(target, "hooks", "subagent", "prevent-main-agent-write.ts"),
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
    ).rejects.toThrow(`Failed to download ${AGENT_TOML_PATHS[0]}`);
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

  it("uses the DevopsFlow repository when plugin metadata has no repository", () => {
    const root = tempRoot();
    writeAsset(root, ".codex-plugin/plugin.json", JSON.stringify({}));

    expect(DEFAULT_REPOSITORY).toBe("LiTeXz/devopsflow");
    expect(readPluginRepository(root)).toBe(DEFAULT_REPOSITORY);
  });
});
