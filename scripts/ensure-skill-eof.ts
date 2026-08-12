#!/usr/bin/env bun
import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const MARKER_PATTERN =
  /<!--\s+[A-Z0-9_]+_EOF:\s+This is the complete .+? skill\. Do not request additional lines\.\s+-->/;
const EXCLUDED_DIRECTORIES = new Set([
  ".cache",
  ".git",
  ".gradle",
  "build",
  "dist",
  "frontend",
  "node_modules",
]);

export type EnsureSkillEofResult = {
  found: number;
  updated: number;
};

const findSkillFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const skillFiles: string[] = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRECTORIES.has(entry.name)) continue;
      skillFiles.push(...(await findSkillFiles(entryPath)));
    } else if (entry.isFile() && entry.name === "SKILL.md") {
      skillFiles.push(entryPath);
    }
  }

  return skillFiles;
};

const readFrontmatterName = (content: string) => {
  const normalized = content.replaceAll("\r\n", "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return undefined;

  const frontmatter = Bun.YAML.parse(match[1]) as { name?: unknown } | null;
  return typeof frontmatter?.name === "string" && frontmatter.name.trim()
    ? frontmatter.name.trim()
    : undefined;
};

const splitName = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

const buildMarker = (name: string) => {
  const words = splitName(name);
  if (words.length === 0) {
    throw new Error(`cannot derive a skill name from ${JSON.stringify(name)}`);
  }

  const upperSnakeName = words.map((word) => word.toUpperCase()).join("_");
  const pascalCaseName = words
    .map(
      (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join("");
  return `<!-- ${upperSnakeName}_EOF: This is the complete ${pascalCaseName} skill. Do not request additional lines. -->`;
};

const ensureMarker = async (skillPath: string) => {
  const original = await readFile(skillPath, "utf8");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const skillName =
    readFrontmatterName(original) ?? basename(join(skillPath, ".."));
  const marker = buildMarker(skillName);
  const contentWithoutTrailingWhitespace = original.trimEnd();

  if (
    contentWithoutTrailingWhitespace.endsWith(marker) &&
    original === `${contentWithoutTrailingWhitespace}${newline}`
  ) {
    return false;
  }

  const trailingMarkerMatch = contentWithoutTrailingWhitespace.match(
    new RegExp(`${MARKER_PATTERN.source}$`),
  );
  const body = trailingMarkerMatch
    ? contentWithoutTrailingWhitespace
        .slice(0, trailingMarkerMatch.index)
        .trimEnd()
    : contentWithoutTrailingWhitespace;
  const updated = `${body}${newline}${newline}${marker}${newline}`;

  if (updated === original) return false;
  await writeFile(skillPath, updated, "utf8");
  return true;
};

export const ensureSkillEofMarkers = async (
  repositoryRoot = process.cwd(),
): Promise<EnsureSkillEofResult> => {
  const skillsRoot = join(repositoryRoot, "skills");

  try {
    const skillsRootStat = await lstat(skillsRoot);
    if (!skillsRootStat.isDirectory() || skillsRootStat.isSymbolicLink())
      throw new Error();
  } catch {
    throw new Error(
      `skills directory does not exist or is not a directory: ${skillsRoot}`,
    );
  }

  const skillFiles = (await findSkillFiles(skillsRoot)).sort();
  let updated = 0;
  for (const skillPath of skillFiles) {
    if (await ensureMarker(skillPath)) updated += 1;
  }

  return { found: skillFiles.length, updated };
};

if (import.meta.main) {
  try {
    const result = await ensureSkillEofMarkers();
    console.log(`SKILL.md files: ${result.found}; updated: ${result.updated}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
