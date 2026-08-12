import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { ensureSkillEofMarkers } from "./ensure-skill-eof";

const temporaryDirectories: string[] = [];

const createRepository = async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), "ensure-skill-eof-"));
  temporaryDirectories.push(repositoryRoot);
  return repositoryRoot;
};

const writeSkill = async (
  repositoryRoot: string,
  relativePath: string,
  content: string,
) => {
  const skillPath = join(repositoryRoot, "skills", relativePath, "SKILL.md");
  await mkdir(dirname(skillPath), { recursive: true });
  await writeFile(skillPath, content, "utf8");
  return skillPath;
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("ensureSkillEofMarkers", () => {
  test("uses the frontmatter name to append the canonical marker", async () => {
    const repositoryRoot = await createRepository();
    const skillPath = await writeSkill(
      repositoryRoot,
      "ignored-directory-name",
      "---\nname: apiClient-v2\ndescription: Example\n---\n\n# API Client\n",
    );

    const result = await ensureSkillEofMarkers(repositoryRoot);

    expect(result).toEqual({ found: 1, updated: 1 });
    expect(await readFile(skillPath, "utf8")).toBe(
      "---\nname: apiClient-v2\ndescription: Example\n---\n\n# API Client\n\n" +
        "<!-- API_CLIENT_V2_EOF: This is the complete ApiClientV2 skill. Do not request additional lines. -->\n",
    );
  });

  test("falls back to the direct parent directory when frontmatter name is absent", async () => {
    const repositoryRoot = await createRepository();
    const skillPath = await writeSkill(
      repositoryRoot,
      "release_goal",
      "# Release Goal\n",
    );

    await ensureSkillEofMarkers(repositoryRoot);

    expect(await readFile(skillPath, "utf8")).toEndWith(
      "<!-- RELEASE_GOAL_EOF: This is the complete ReleaseGoal skill. Do not request additional lines. -->\n",
    );
  });

  test("leaves an already canonical file byte-for-byte unchanged", async () => {
    const repositoryRoot = await createRepository();
    const original =
      "---\nname: stable-skill\n---\n\n# Stable\n\n" +
      "<!-- STABLE_SKILL_EOF: This is the complete StableSkill skill. Do not request additional lines. -->\n";
    const skillPath = await writeSkill(
      repositoryRoot,
      "stable-skill",
      original,
    );

    const firstResult = await ensureSkillEofMarkers(repositoryRoot);
    const contentAfterFirstRun = await readFile(skillPath, "utf8");
    const secondResult = await ensureSkillEofMarkers(repositoryRoot);

    expect(firstResult).toEqual({ found: 1, updated: 0 });
    expect(secondResult).toEqual({ found: 1, updated: 0 });
    expect(contentAfterFirstRun).toBe(original);
    expect(await readFile(skillPath, "utf8")).toBe(original);
  });

  test("replaces an outdated trailing marker without duplicating it", async () => {
    const repositoryRoot = await createRepository();
    const skillPath = await writeSkill(
      repositoryRoot,
      "renamed-skill",
      "---\nname: renamed-skill\n---\n\n# Renamed\n\n" +
        "<!-- OLD_NAME_EOF: This is the complete OldName skill. Do not request additional lines. -->\n\n",
    );

    await ensureSkillEofMarkers(repositoryRoot);
    const content = await readFile(skillPath, "utf8");

    expect(content).toEndWith(
      "<!-- RENAMED_SKILL_EOF: This is the complete RenamedSkill skill. Do not request additional lines. -->\n",
    );
    expect(content.match(/Do not request additional lines\./g)).toHaveLength(1);
    expect(content).not.toContain("OLD_NAME_EOF");
  });

  test("preserves CRLF and normalizes the final separator and newline", async () => {
    const repositoryRoot = await createRepository();
    const skillPath = await writeSkill(
      repositoryRoot,
      "windows-skill",
      "---\r\nname: windows-skill\r\n---\r\n\r\n# Windows\r\n\r\n\r\n",
    );

    await ensureSkillEofMarkers(repositoryRoot);
    const content = await readFile(skillPath, "utf8");

    expect(content).toBe(
      "---\r\nname: windows-skill\r\n---\r\n\r\n# Windows\r\n\r\n" +
        "<!-- WINDOWS_SKILL_EOF: This is the complete WindowsSkill skill. Do not request additional lines. -->\r\n",
    );
    expect(content.replaceAll("\r\n", "")).not.toContain("\n");
  });

  test("recurses while ignoring unrelated files, managed directories, and symbolic links", async () => {
    const repositoryRoot = await createRepository();
    const firstSkill = await writeSkill(
      repositoryRoot,
      "group/first-skill",
      "# First\n",
    );
    const secondSkill = await writeSkill(
      repositoryRoot,
      "second-skill",
      "# Second\n",
    );
    const dependencySkill = await writeSkill(
      repositoryRoot,
      "node_modules/dependency",
      "# Dependency\n",
    );
    const buildSkill = await writeSkill(
      repositoryRoot,
      "build/generated",
      "# Generated\n",
    );
    const cacheSkill = await writeSkill(
      repositoryRoot,
      ".cache/generated",
      "# Cache\n",
    );
    const frontendSkill = await writeSkill(
      repositoryRoot,
      "frontend/local",
      "# Frontend\n",
    );
    const externalRoot = join(repositoryRoot, "external-skills");
    const linkedSkill = join(externalRoot, "linked-skill", "SKILL.md");
    await mkdir(dirname(linkedSkill), { recursive: true });
    await writeFile(linkedSkill, "# Linked\n", "utf8");
    await writeFile(
      join(repositoryRoot, "skills", "README.md"),
      "# Skills\n",
      "utf8",
    );
    await symlink(
      externalRoot,
      join(repositoryRoot, "skills", "linked"),
      "junction",
    );

    const result = await ensureSkillEofMarkers(repositoryRoot);

    expect(result).toEqual({ found: 2, updated: 2 });
    expect(await readFile(firstSkill, "utf8")).toContain("FIRST_SKILL_EOF");
    expect(await readFile(secondSkill, "utf8")).toContain("SECOND_SKILL_EOF");
    expect(await readFile(dependencySkill, "utf8")).toBe("# Dependency\n");
    expect(await readFile(buildSkill, "utf8")).toBe("# Generated\n");
    expect(await readFile(cacheSkill, "utf8")).toBe("# Cache\n");
    expect(await readFile(frontendSkill, "utf8")).toBe("# Frontend\n");
    expect(await readFile(linkedSkill, "utf8")).toBe("# Linked\n");
  });

  test("fails clearly when the repository skills directory is missing", async () => {
    const repositoryRoot = await createRepository();

    await expect(ensureSkillEofMarkers(repositoryRoot)).rejects.toThrow(
      "skills directory does not exist or is not a directory",
    );
  });

  test("succeeds with zero counts when the skills directory is empty", async () => {
    const repositoryRoot = await createRepository();
    await mkdir(join(repositoryRoot, "skills"));

    await expect(ensureSkillEofMarkers(repositoryRoot)).resolves.toEqual({
      found: 0,
      updated: 0,
    });
  });
});

test("CLI exits non-zero and prints a clear error when skills is missing", async () => {
  const repositoryRoot = await createRepository();
  const scriptPath = join(import.meta.dir, "ensure-skill-eof.ts");

  const childProcess = Bun.spawn([process.execPath, scriptPath], {
    cwd: repositoryRoot,
    stderr: "pipe",
    stdout: "pipe",
  });
  const [exitCode, stderr] = await Promise.all([
    childProcess.exited,
    new Response(childProcess.stderr).text(),
  ]);

  expect(exitCode).not.toBe(0);
  expect(stderr).toContain(
    "skills directory does not exist or is not a directory",
  );
});
