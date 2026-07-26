---
name: df-agent-instruction-authoring
description: "Improve AGENTS, SKILL, and agent instruction effects."
---

# Agent Instruction Authoring

Improve the structure and effectiveness of AGENTS, skills, and agent instructions.

## Scope

Apply this skill when the user asks to improve AGENTS formatting or effectiveness, standardize AGENTS behavior, optimize a SKILL, or optimize agents. Govern project and nested `AGENTS.md` files, `SKILL.md` files, every instruction document under `agents/`, and skill `agents/openai.yaml` metadata. Do not apply it to README files, references, templates, or examples unless the user expands the scope.

## Workflow

1. Identify all governed files before editing.
2. Preserve existing technical behavior, identifiers, commands, and non-language policies.
3. Apply the English rule to H1 through H6 headings only.
4. Validate the repository and any requested global instruction file before completion.

## Language Rules

- Require English H1 through H6 headings; body prose may use the project's working language.
- When a heading must contain an unavoidable Chinese term, wrap it in ASCII double quotes, such as `Vendor "公司名"` or `Domain Term "修仙"`.
- Do not use a Chinese-only heading or place Chinese outside the double quotes in a mixed heading.

## AGENTS Structure

For a project root file, use this exact wrapper and first H1:

```markdown
<!-- BEGIN /AGENTS.md -->

# /AGENTS.md

...

<!-- END /AGENTS.md -->
```

For a nested file, use its project-relative path without a leading slash:

```markdown
<!-- BEGIN skills/AGENTS.md -->

# skills/AGENTS.md

...

<!-- END skills/AGENTS.md -->
```

For `~/.codex/AGENTS.md`, preserve the intentional `BEGINE` spelling:

```markdown
<!-- BEGINE GLOBAL ~/.codex/ -->

# ~/.codex/AGENTS.md: Global Codex Instructions

...

<!-- END GLOBAL ~/.codex/ -->
```

Do not add path H1s or AGENTS wrapper comments to skills or agent definitions.

## Validation

Run the repository check from its root:

```bash
bun run check:agent-instructions
```

Validate the global file explicitly when it is in scope:

```bash
bun skills/df-agent-instruction-authoring/scripts/validate-agent-instructions.ts --global ~/.codex/AGENTS.md
```

Treat every reported violation as blocking. If a Chinese exception is necessary in a heading, keep it in the prescribed quoted form.
