---
name: df-depend-man
description: "Audit and safely clean JavaScript, Gradle, Maven, and GitHub dependencies; detect dead, transitive, duplicated, mis-scoped, drifting, or abused declarations and review Dependabot rules."
---

# Depend Man

Use this skill whenever a repository adds, removes, upgrades, audits, or consolidates dependencies, or when an agent must review dependency hygiene. It combines Knip, Gradle/Maven dependency analysis, GitHub configuration checks, and evidence-backed cleanup without guessing at architectural intent.

## Workflow

1. Inspect repository boundaries before changing anything: package manager and lockfile, Gradle/Maven modules, source sets, generated code, CI files, and existing dependency policies.
2. Classify every finding as direct or transitive, runtime or development, production or test, optional/peer/workspace, or platform-specific. A dependency used only through an undeclared transitive path is a boundary violation, not a reason to add another convenience dependency.
3. Run the matching script from `scripts/` in scan mode. Prefer the repository's wrapper (`pnpm`, `bun`, `gradlew.bat`, `mvnw.cmd`) and existing verification tasks.
4. Separate definite findings from suggestions. Do not remove a dependency when generated code, reflection, plugins, annotation processing, service loading, framework conventions, or platform packaging may use it without a textual import.
5. Use `--fix` only with explicit user authorization. Before edits, capture a diff and temporary backup; after edits, run the smallest meaningful build/test/lockfile verification. Restore the backup when verification fails.
6. Record new dependency justification: purpose, call sites, rejected alternatives, scope, license/security implications, and removal evidence. Pair behavior changes with `df-tdd-skill`; reuse local conventions through `df-glue-coding`; finish with `df-verification-before-completion`.

## Script Contract

Each checker accepts `--path`, `--fix`, `--dry-run`, and `--format text|json`. JSON findings contain `ecosystem`, `file`, `dependency`, `type`, `evidence`, `risk`, `action`, and `autoFixable`. Exit `0` means no blocking findings, `1` means blocking findings, `2` means a required tool or build entrypoint is unavailable, and `3` means a fix or its verification failed.

### JavaScript

Run `bun scripts/check-js-dependencies.ts --path .`. Detect npm/pnpm/Bun from lockfiles and invoke Knip when installed or available through the package manager. `--fix` is limited to Knip-confirmed direct unused/unlisted dependencies and preserves peer, optional, workspace, and runtime entry declarations.

### Gradle and Maven

Run the matching checker at the repository root. Inspect dependency trees, `dependencyInsight` or `dependency:analyze`, direct declarations, source sets, profiles, and multi-module boundaries. JVM `--fix` is allowed only for an explicit candidate with a local declaration and a successful post-edit verification; otherwise emit a patch recommendation.

### GitHub

Run `bun scripts/check-github-dependencies.ts --path .` to inspect Dependabot, Actions, container images, and pinned tool versions. The default policy is weekly updates, production/development groups, `open-pull-requests-limit: 5`, and preserved security updates. Do not invent labels, assignees, or ignore rules.

## References and Assets

Load [dependency-tool-matrix.md](references/dependency-tool-matrix.md) when choosing an ecosystem tool, [dependency-policy.md](references/dependency-policy.md) when reviewing architecture or a new dependency, and [dependabot-policy.md](references/dependabot-policy.md) when generating GitHub update configuration. Copy [dependency-governance.yml](assets/dependency-governance.yml) into a host repository only after adapting its commands and available ecosystems.
