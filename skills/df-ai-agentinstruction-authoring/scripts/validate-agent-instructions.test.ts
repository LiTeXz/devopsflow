import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  findGovernedFiles,
  runCli,
  validateGlobalAgentsFile,
  validateProjectAuthoring,
} from "./validate-agent-instructions";

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length) {
    const temporaryRoot = temporaryRoots.pop();
    if (temporaryRoot) rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

function temporaryProject(): string {
  const projectRoot = mkdtempSync(join(tmpdir(), "agent-instructions-"));
  temporaryRoots.push(projectRoot);
  return projectRoot;
}

function writeFixture(
  projectRoot: string,
  relativePath: string,
  content: string,
): void {
  const destination = join(projectRoot, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content, "utf-8");
}

function writeValidProject(projectRoot: string): void {
  writeFixture(
    projectRoot,
    "AGENTS.md",
    `<!-- BEGIN:/AGENTS.md -->

# /AGENTS.md

Write instruction files in English.

<!-- END:/AGENTS.md -->
`,
  );
  writeFixture(
    projectRoot,
    "skills/AGENTS.md",
    `<!-- BEGIN:skills/AGENTS.md -->

# skills/AGENTS.md

Use the df- prefix for skills.

<!-- END:skills/AGENTS.md -->
`,
  );
  writeFixture(
    projectRoot,
    "skills/df-example/SKILL.md",
    `---
name: df-example
description: "Example authoring validation skill"
---

# Example Skill

## Vendor "公司名"

This body may include a local-language note: 汉字内容.
`,
  );
  writeFixture(
    projectRoot,
    "skills/df-example/agents/openai.yaml",
    `interface:
  display_name: "Example"
  short_description: "Example authoring validation skill"
  default_prompt: "Use $df-example."
`,
  );
  writeFixture(
    projectRoot,
    "agents/publisher.toml",
    `name = "publisher"
description = "Publishes approved changes."
developer_instructions = """
## Role

Publish approved changes.
"""
`,
  );
}

function violationMessages(projectRoot: string): string[] {
  return validateProjectAuthoring(projectRoot).map(
    (violation) => violation.message,
  );
}

describe("agent instruction authoring validation", () => {
  it("accepts a governed project with a quoted Chinese term in a heading", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);

    expect(validateProjectAuthoring(projectRoot)).toEqual([]);
  });

  it("requires exact AGENTS markers and relative-path H1 values", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);
    writeFixture(
      projectRoot,
      "skills/AGENTS.md",
      `<!-- BEGIN:/AGENTS.md -->

# Incorrect

Use English.

<!-- END:/AGENTS.md -->
`,
    );

    const messages = violationMessages(projectRoot);

    expect(messages).toContain(
      'AGENTS.md must start with "<!-- BEGIN:skills/AGENTS.md -->"',
    );
    expect(messages).toContain(
      'AGENTS.md must end with "<!-- END:skills/AGENTS.md -->"',
    );
    expect(messages).toContain(
      'AGENTS.md first H1 must be "# skills/AGENTS.md"',
    );
  });

  it("rejects headings with Chinese that do not use ASCII double quotes", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);
    writeFixture(
      projectRoot,
      "skills/df-example/SKILL.md",
      `---
name: df-example
description: "Example authoring validation skill"
---

# Vendor: 公司名
`,
    );

    expect(violationMessages(projectRoot)).toContain(
      'line 6 heading "Vendor: 公司名" must be English or use the form English "中文"',
    );
  });

  it("governs nested agent instruction documents", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);
    const instructionPath = join(projectRoot, "agents/workers/instructions.md");
    writeFixture(
      projectRoot,
      "agents/workers/instructions.md",
      "# Worker Instructions\n\nFollow the assigned responsibility.\n",
    );

    expect(findGovernedFiles(projectRoot)).toContain(instructionPath);
  });

  it("allows non-English body prose", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);
    writeFixture(
      projectRoot,
      "agents/workers/instructions.md",
      "# Worker Instructions\n\n正文可采用汉字内容.\n",
    );

    expect(validateProjectAuthoring(projectRoot)).toEqual([]);
  });

  it("rejects governed prose that still requires dictionary normalization", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);
    writeFixture(
      projectRoot,
      "agents/workers/instructions.md",
      "# Worker Instructions\n\n如果插件安装验证失败，检查项目根文件夹。\n",
    );

    expect(violationMessages(projectRoot)).toContain(
      "instruction prose requires dictionary normalization",
    );
  });

  it("excludes README files from the governed corpus", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);
    writeFixture(projectRoot, "README.md", "# 中文标题\n\n中".repeat(500));

    expect(validateProjectAuthoring(projectRoot)).toEqual([]);
  });

  it("requires the intentional global BEGINE marker", () => {
    const projectRoot = temporaryProject();
    const globalAgentsPath = join(projectRoot, "AGENTS.md");
    writeFixture(
      projectRoot,
      "AGENTS.md",
      `<!-- BEGINE_GLOBAL:~/.codex/ -->

# ~/.codex/AGENTS.md: Global Codex Constitution

Use English for global instructions.

<!-- END_GLOBAL:~/.codex/ -->
`,
    );

    expect(validateGlobalAgentsFile(globalAgentsPath)).toEqual([]);
    writeFixture(
      projectRoot,
      "AGENTS.md",
      `<!-- BEGIN_GLOBAL:~/.codex/ -->

# ~/.codex/AGENTS.md: Global Codex Constitution

Use English for global instructions.

<!-- END_GLOBAL:~/.codex/ -->
`,
    );

    expect(validateGlobalAgentsFile(globalAgentsPath)[0]?.message).toBe(
      'AGENTS.md must start with "<!-- BEGINE_GLOBAL:~/.codex/ -->"',
    );
  });

  it("normalizes the global AGENTS prose with the same dictionary", () => {
    const projectRoot = temporaryProject();
    const globalAgentsPath = join(projectRoot, "AGENTS.md");
    writeFixture(
      projectRoot,
      "AGENTS.md",
      `<!-- BEGINE_GLOBAL:~/.codex/ -->

# ~/.codex/AGENTS.md: Global Codex Constitution

如果插件安装验证失败，停止。

<!-- END_GLOBAL:~/.codex/ -->
`,
    );

    expect(validateGlobalAgentsFile(globalAgentsPath)).toContainEqual({
      path: globalAgentsPath,
      message: "instruction prose requires dictionary normalization",
    });
  });

  it("prints CLI errors and returns a non-zero exit code", () => {
    const projectRoot = temporaryProject();
    writeFixture(projectRoot, "AGENTS.md", "# Invalid\n");
    const errors: string[] = [];

    const exitCode = runCli(["--root", projectRoot], {
      log: () => undefined,
      error: (message) => errors.push(message),
    });

    expect(exitCode).toBe(1);
    expect(errors.join("\n")).toContain("::error file=");
  });

  it("prints a success message after successful project validation", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);
    const logs: string[] = [];

    const exitCode = runCli(["--root", projectRoot], {
      log: (message) => logs.push(message),
      error: () => undefined,
    });

    expect(exitCode).toBe(0);
    expect(logs).toEqual(["Agent instruction validation passed."]);
  });

  it("rejects source-repository role descriptions and skill commands", () => {
    const projectRoot = temporaryProject();
    writeValidProject(projectRoot);
    writeFixture(
      projectRoot,
      "agents/worker.toml",
      'description = "DevopsFlow 中专注后端实现的 agent。"\n',
    );
    writeFixture(
      projectRoot,
      "skills/df-example/SKILL.md",
      '---\nname: df-example\ndescription: "Example authoring validation skill"\n---\n\n# Example Skill\n\nRun `bun skills/df-example/scripts/check.ts`.\n',
    );

    const messages = violationMessages(projectRoot);
    expect(messages).toContain(
      "agent description must describe the current target project, not DevopsFlow as its runtime project",
    );
    expect(messages).toContain(
      "skill instructions must use an installed skill/plugin root placeholder instead of the source repository path bun skills/...",
    );
  });
});
