---
name: repository-tooling-hygiene
description: "Move human-only scripts, one-off maintenance helpers, local environment launchers, and Gradle init scripts out of high-salience repository roots. Use when cleaning agent context noise, relocating reset or run scripts into docs/skills, or converting Groovy init.gradle snippets to Kotlin DSL init.gradle.kts templates."
---

# Repository Tooling Hygiene

Use this skill when a repository root contains tools that are useful to humans but misleading as default agent context: reset scripts, local launch wrappers, machine-specific helpers, or Gradle init scripts that are not part of the real build.

## Workflow

1. Identify whether each root file is a core project entrypoint or a convenience helper.
2. Preserve capability without keeping high-salience noise in the root:
   - Move reusable procedures into a project-neutral skill or documentation page.
   - Keep destructive operations behind explicit user confirmation.
   - Replace secret-printing wrappers with commands that load configuration without echoing values.
3. For Gradle init scripts, prefer Kotlin DSL and keep them outside the project build unless the project explicitly owns that convention.
4. Delete the root helper only after its replacement is discoverable.
5. Verify with `git status --short` and a focused docs or skill validation pass.

## Common Migrations

- `run.bat`: replace with documented `./gradlew bootRun`, `gradlew.bat bootRun`, or a project-specific runner that does not print `.env` values.
- `reset-db.bat`: replace with documented Docker Compose commands and warn that volume deletion is destructive.
- `init.gradle`: move the repository mirror setup to a reusable `init.gradle.kts` template. Use [templates/aliyun-init.gradle.kts](templates/aliyun-init.gradle.kts) when an Aliyun mirror init script is still needed.

## Safety Checks

- Do not include project secrets, internal hostnames, credentials, or copied `.env` values in the skill or docs.
- Do not make database reset commands look like routine startup commands.
- Do not let a project root expose both Groovy and Kotlin DSL Gradle conventions unless there is a deliberate compatibility reason.
- When working in a submodule that will be published independently, keep all guidance project-neutral.
