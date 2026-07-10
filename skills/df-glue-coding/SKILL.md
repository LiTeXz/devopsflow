---
name: df-glue-coding
description: "Glue Coding workflow for AI implementation that should reuse local project material without blindly copying old structure. Use after domain ambiguity has been resolved or declared thin, and before implementation planning or coding, when a task resembles existing CRUD pages, list/form/detail screens, imports/exports, endpoints, adapters, command handlers, projections, tests, configuration, refactors, migrations, modernization, or other repeatable project patterns. The skill discovers local style packs, reference code, examples, docs, AGENTS.md rules, and nearby production implementations, classifies them as target patterns, legacy patterns, anti-patterns, or behavior evidence, preserves the right conventions, and limits new code to the intended delta."
---

# Glue Coding

Use this skill when the implementation should be assembled from existing project material.

The goal is not to make Codex more creative. The goal is to make Codex preserve the right local conventions by copying the right target pattern and changing only the required delta.

## Core Boundary

DDD owns business truth. Glue Coding owns engineering reuse.

If the request has unclear domain language, hidden business rules, state transitions, multi-role collaboration, authority questions, policies, aggregates, or read-model ambiguity, use `df-ddd-event-storming-design` first. Code patterns may be read early as discovery input, but they must not become the final design before the DDD gate is confirmed.

Use Glue Coding after:

- the domain is already clear or intentionally thin
- the request is mostly an extension of an existing feature shape
- confirmed DDD conclusions are ready to be mapped into implementation

## Material Types

Look for project-owned material in this order:

1. Rules: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, local docs, package scripts, framework config.
2. Style packs and reference patterns: explicit user-provided style pack paths, `.devopsflow/style-pack/`, `reference/`, `references/`, `examples/`, `docs/patterns/`, `.ai/patterns/`, templates, scaffolds.
3. Nearby production code: similar pages, endpoints, handlers, adapters, projections, tests, fixtures, migrations, exports, imports, jobs, or config. For refactors, classify whether each candidate is a target pattern, legacy pattern, anti-pattern, or behavior evidence.
4. Historical context: `.ai/tracks/`, prior specs, plans, ADRs, issue notes, PR descriptions, or implementation notes.

Do not store project-specific sample code in this skill. Concrete samples belong in the project repository. This skill only defines how to find and use them.

## Workflow

1. Classify the task as:
   - `glue_fit`: existing local pattern likely covers most structure
   - `glue_partial`: a pattern exists but important deltas need design or tests
   - `not_glue`: no trustworthy local pattern, or the work is novel
   - `domain_blocked`: the task looks glue-like but business meaning is unclear
   - `refactor_glue`: current code is being migrated away from an old pattern toward a target pattern
2. If `domain_blocked`, return to `df-ddd-event-storming-design`. Use discovered code only as evidence for questions and candidate language.
3. Search local material before planning implementation. Prefer `rg --files` and targeted `rg` searches.
4. If a style pack is available and applicable, select it before choosing source examples. Use `references/style-packs.md` for discovery locations, recommended structure, and usage rules.
5. Select the closest pattern and record why it fits:
   - same user workflow or business capability
   - same framework or layer
   - same file organization
   - same dependency, request, validation, error, transaction, auth, or test style
   - same lifecycle, command, event, projection, or read-model shape
6. Identify what must be preserved:
   - file and module structure
   - naming and imports
   - component or API composition
   - request/response mapping
   - validation and error semantics
   - persistence, ordering, pagination, transaction, concurrency, or side-effect behavior
   - test style and fixture shape
7. Identify the delta:
   - fields, labels, columns, filters, routes, endpoints, DTOs, events, commands, policies, invariants, read-model fields, adapter mappings, or business rules that differ from the pattern
8. Pass the selected style pack, selected pattern, preserved conventions, and delta to `df-implementation-planning` or `df-ddd-to-tdd-handoff`.

## Refactor Mode

When the user asks for refactoring, migration, cleanup, modernization, standardization, or replacing an old pattern, do not assume nearby similar code is the target pattern.

Classify discovered code as:

- `target_pattern`: a convention to preserve, copy, or migrate toward
- `legacy_pattern`: current implementation style that explains behavior but should not be copied as structure
- `anti_pattern`: code shape, dependency, or convention the task is explicitly trying to remove
- `behavior_evidence`: source for characterization tests, compatibility constraints, inputs, outputs, errors, ordering, persistence, transactions, and side effects
- `unknown`: candidate needs more evidence before being used

For refactor work:

1. Read legacy code to understand behavior, public contracts, side effects, and compatibility risks.
2. Use `df-tdd-skill` characterization tests before changing behavior-preserving code.
3. Search for target patterns elsewhere in the repository or in explicit reference material.
4. If no target pattern exists, pass a target-design task to `df-implementation-planning` instead of copying the legacy shape.
5. Preserve behavior evidence, not accidental structure.
6. Keep refactor steps separate from behavior changes.

## Output Format

```markdown
## Glue Coding 判断

- 分类：glue_fit / glue_partial / not_glue / domain_blocked / refactor_glue
- DDD 前置：已确认 / 领域很薄 / 需要先 DDD
- 选中的目标样板/相似实现：
- 旧模式/反模式/行为证据：
- 选择理由：
- 必须保持：
- 本次差异：
- 不采用的候选：
- 下一步：
```

Keep this concise. Do not paste long source files into the response; cite file paths and relevant symbols.

## Non-Negotiable Rules

- Do not skip DDD when a CRUD-looking request hides business meaning.
- Do not copy code before stating the selected pattern and delta.
- Do not invent a new project structure while a good local pattern exists.
- Do not ignore an applicable project-owned style pack after the business design is confirmed.
- Do not treat legacy code or anti-patterns as target patterns during refactors.
- Do not refactor behavior-preserving code without characterization coverage unless the user explicitly accepts the risk.
- Do not treat stale or unrelated examples as authoritative; prefer current production code when reference material conflicts with the repository.
- Do not preserve a pattern blindly when it violates confirmed domain rules, security, validation, persistence, or public contracts.
- Do not turn Glue Coding into test avoidance. Behavior changes still need `df-tdd-skill` unless the task is documentation-only or explicitly non-executable.
- Do not add project-specific samples to this skill. Put reusable samples in the project repository and mention them from `AGENTS.md` or local docs.
- Do not treat style packs as business truth. They preserve implementation style after DDD, API, security, validation, and persistence constraints are already respected.

## Material Flywheel

Before handoff or completion, ask whether the task revealed reusable material:

- a new or improved code pattern worth adding to `reference/`, `examples/`, `docs/patterns/`, or `.ai/patterns/`
- a style pack rule, golden example, anti-pattern, or review checklist entry worth adding to `.devopsflow/style-pack/`
- a rule that belongs in `AGENTS.md` or project docs
- domain knowledge or a pitfall that belongs in local knowledge notes
- a persistent spec or decision that belongs in `.ai/tracks/`

Recommend material updates, but do not create broad repositories of patterns unless the user asked for that scope.
