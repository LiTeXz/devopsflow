import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateSkillMetadata } from "./check-skill-metadata";

function withSkillsRoot(run: (skillsRoot: string) => void): void {
	const root = mkdtempSync(join(tmpdir(), "skill-metadata-"));
	try {
		const skillsRoot = join(root, "skills");
		mkdirSync(skillsRoot);
		run(skillsRoot);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

function writeSkill(
	skillsRoot: string,
	folderName: string,
	frontMatterName: string,
	description = "Test skill",
) {
	const skillDir = join(skillsRoot, folderName);
	mkdirSync(skillDir, { recursive: true });
	writeFileSync(
		join(skillDir, "SKILL.md"),
		`---\nname: ${frontMatterName}\ndescription: ${description}\n---\n\n# Test\n`,
		"utf-8",
	);
}

function writeOpenAiAgent(
	skillsRoot: string,
	folderName: string,
	displayName: string,
	shortDescription = "Test skill",
) {
	const agentDir = join(skillsRoot, folderName, "agents");
	mkdirSync(agentDir, { recursive: true });
	writeFileSync(
		join(agentDir, "openai.yaml"),
		`interface:\n  display_name: "${displayName}"\n  short_description: "${shortDescription}"\n  default_prompt: "Use this test skill."\n`,
		"utf-8",
	);
}

describe("skill metadata validation", () => {
	it("accepts df-prefixed skill folders whose front matter name matches", () => {
		withSkillsRoot((skillsRoot) => {
			writeSkill(skillsRoot, "df-example-skill", "df-example-skill");
			writeOpenAiAgent(skillsRoot, "df-example-skill", "Example Skill");

			expect(validateSkillMetadata(skillsRoot)).toEqual([]);
		});
	});

	it("rejects SKILL.md front matter names that do not match the folder", () => {
		withSkillsRoot((skillsRoot) => {
			writeSkill(skillsRoot, "df-example-skill", "different-name");
			writeOpenAiAgent(skillsRoot, "df-example-skill", "Example Skill");

			expect(validateSkillMetadata(skillsRoot)).toEqual([
				{
					path: join(skillsRoot, "df-example-skill", "SKILL.md"),
					message:
						'front matter name "different-name" must match folder "df-example-skill"',
				},
			]);
		});
	});

	it("rejects skill folders that do not start with df-", () => {
		withSkillsRoot((skillsRoot) => {
			writeSkill(skillsRoot, "example-skill", "example-skill");
			writeOpenAiAgent(skillsRoot, "example-skill", "Example Skill");

			expect(validateSkillMetadata(skillsRoot)).toEqual([
				{
					path: join(skillsRoot, "example-skill", "SKILL.md"),
					message: 'skill folder "example-skill" must start with "df-"',
				},
			]);
		});
	});

	it("rejects skills without agents/openai.yaml", () => {
		withSkillsRoot((skillsRoot) => {
			writeSkill(skillsRoot, "df-example-skill", "df-example-skill");

			expect(validateSkillMetadata(skillsRoot)).toEqual([
				{
					path: join(skillsRoot, "df-example-skill", "agents", "openai.yaml"),
					message: "agents/openai.yaml is required",
				},
			]);
		});
	});

	it("rejects display names that are not derived from the folder name", () => {
		withSkillsRoot((skillsRoot) => {
			writeSkill(skillsRoot, "df-example-skill", "df-example-skill");
			writeOpenAiAgent(skillsRoot, "df-example-skill", "Df Example Skill");

			expect(validateSkillMetadata(skillsRoot)).toEqual([
				{
					path: join(skillsRoot, "df-example-skill", "agents", "openai.yaml"),
					message:
						'interface.display_name "Df Example Skill" must be "Example Skill"',
				},
			]);
		});
	});

	it("rejects short descriptions that do not match SKILL.md descriptions", () => {
		withSkillsRoot((skillsRoot) => {
			writeSkill(
				skillsRoot,
				"df-example-skill",
				"df-example-skill",
				"Full SKILL description",
			);
			writeOpenAiAgent(
				skillsRoot,
				"df-example-skill",
				"Example Skill",
				"Short UI description",
			);

			expect(validateSkillMetadata(skillsRoot)).toEqual([
				{
					path: join(skillsRoot, "df-example-skill", "agents", "openai.yaml"),
					message:
						'interface.short_description must exactly match SKILL.md description "Full SKILL description"',
				},
			]);
		});
	});
});
