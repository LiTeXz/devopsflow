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
  computeManagedAssetHash,
  HASH_FILE_PATH,
  MANAGED_ASSET_PATHS,
} from "../skills/df-codex-assets/scripts/df-codex-assets";

const AGENT_EOF_MARKER = "# DF_AGENT_EOF";

const ROOT = join(import.meta.dir, "..");
const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function createRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "devopsflow-husky-hash-"));
  tempRoots.push(root);
  for (const path of MANAGED_ASSET_PATHS) {
    const absolutePath = join(root, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, `baseline:${path}\n`);
  }
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ version: "1.0.0" }),
  );
  const pluginPath = join(root, ".codex-plugin", "plugin.json");
  mkdirSync(dirname(pluginPath), { recursive: true });
  writeFileSync(pluginPath, JSON.stringify({ version: "1.0.0" }));
  for (const path of AGENT_TOML_PATHS) {
    writeFileSync(
      join(root, path),
      '# devopsflow-version = "1.0.0"\nname = "test-agent"\n',
    );
  }
  const hashPath = join(root, HASH_FILE_PATH);
  mkdirSync(dirname(hashPath), { recursive: true });
  writeFileSync(hashPath, "baseline-hash\n");
  git(root, "init");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "DevopsFlow Test");
  git(root, "add", ".");
  git(root, "commit", "--no-verify", "-m", "test: baseline");
  return root;
}

function git(root: string, ...args: string[]): string {
  const result = Bun.spawnSync({
    cmd: ["git", ...args],
    cwd: root,
    stderr: "pipe",
    stdout: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString());
  }
  return result.stdout.toString().trim();
}

describe("Husky managed asset hash", () => {
  it("manages every distributable subagent TOML", () => {
    expect(AGENT_TOML_PATHS).toEqual([
      "agents/df-dev-backend-engineer.toml",
      "agents/df-dev-backend-test-engineer.toml",
      "agents/df-dev-database-steward.toml",
      "agents/df-doc-documentation-writer.toml",
      "agents/df-dev-frontend-engineer.toml",
      "agents/df-dev-frontend-test-engineer.toml",
      "agents/df-ops-artifact-manager.toml",
      "agents/df-ops-vcs-manager.toml",
    ]);
  });

  it("requires every distributable subagent TOML to end with its EOF marker", () => {
    for (const path of AGENT_TOML_PATHS) {
      expect(readFileSync(join(ROOT, path), "utf-8").trimEnd()).toEndWith(
        AGENT_EOF_MARKER,
      );
    }
  });

  it("blocks a commit when staged versions are not aligned", () => {
    const root = createRepository();
    const pluginPath = join(root, ".codex-plugin", "plugin.json");
    writeFileSync(pluginPath, JSON.stringify({ version: "2.0.0" }));
    git(root, "add", ".codex-plugin/plugin.json");

    const result = runAssetCli(root, "check-versions-staged");

    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain(
      "Version mismatch: package.json=1.0.0, plugin.json=2.0.0",
    );
  });

  it("syncs and stages a hash for the exact Git index contents", () => {
    const root = createRepository();
    const managedPath = MANAGED_ASSET_PATHS[0];
    const absolutePath = join(root, managedPath);
    writeFileSync(absolutePath, "staged version\n");
    git(root, "add", managedPath);
    const expectedHash = computeManagedAssetHash(root);
    writeFileSync(absolutePath, "unstaged version\n");

    const result = Bun.spawnSync({
      cmd: [
        process.execPath,
        join(
          ROOT,
          "skills",
          "df-codex-assets",
          "scripts",
          "df-codex-assets.ts",
        ),
        "sync-staged",
      ],
      cwd: root,
      env: { ...process.env, PLUGIN_ROOT: root },
      stderr: "pipe",
      stdout: "pipe",
    });

    expect(result.exitCode, result.stderr.toString()).toBe(0);
    expect(result.stdout.toString()).toContain(expectedHash);
    expect(readFileSync(absolutePath, "utf-8")).toBe("unstaged version\n");
    expect(git(root, "show", `:${managedPath}`)).toBe("staged version");
    expect(git(root, "show", `:${HASH_FILE_PATH}`)).toBe(expectedHash);
    expect(git(root, "diff", "--cached", "--name-only")).toContain(
      HASH_FILE_PATH,
    );
  });

  it("configures Husky quality and managed asset gates before commit", () => {
    const packageJson = JSON.parse(
      readFileSync(join(ROOT, "package.json"), "utf-8"),
    ) as {
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const hookPath = join(ROOT, ".husky", "pre-commit");

    expect(packageJson.scripts?.prepare).toBe("husky");
    expect(packageJson.devDependencies?.husky).toBeDefined();
    expect(existsSync(hookPath)).toBe(true);
    expect(readFileSync(hookPath, "utf-8").trim()).toBe(
      [
        "bun scripts/ensure-skill-eof.ts",
        "bun run format:check",
        "bun run lint",
        "bun skills/df-codex-assets/scripts/df-codex-assets.ts check-versions-staged",
        "bun skills/df-codex-assets/scripts/df-codex-assets.ts sync-staged",
      ].join("\n"),
    );
  });
});

function runAssetCli(
  root: string,
  command: string,
): Bun.ReadableSyncSubprocess {
  return Bun.spawnSync({
    cmd: [
      process.execPath,
      join(ROOT, "skills", "df-codex-assets", "scripts", "df-codex-assets.ts"),
      command,
    ],
    cwd: root,
    env: { ...process.env, PLUGIN_ROOT: root },
    stderr: "pipe",
    stdout: "pipe",
  });
}
