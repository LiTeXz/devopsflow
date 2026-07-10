---
name: df-engineering-workflow-router
description: "Mandatory engineering workflow router. Use at the start of software development, refactoring, bug fixing, domain modeling, glue coding, API or authorization design, code review, verification, branch finishing, or commit preparation to classify the task and select required skills such as df-resumable-workflow-guard, df-ddd-event-storming-design, df-glue-coding, df-iam-access-control-design, df-ddd-to-tdd-handoff, df-implementation-planning, df-executing-implementation-plan, df-tdd-skill, df-spring-web-boundaries, df-systematic-debugging, df-requesting-code-review, df-receiving-code-review, df-verification-before-completion, df-finishing-development-branch, or df-parallel-agent-orchestration."
---

# Engineering Workflow Router

Use this skill before doing engineering work. Its job is to choose the mandatory workflow, not to implement the task.

## Routing Protocol

1. Classify the task:
   - `new_feature`
   - `bug_fix`
   - `pure_refactor`
   - `domain_modeling`
   - `glue_coding`
   - `design_review`
   - `code_review`
   - `review_feedback`
   - `verification`
   - `branch_finish`
   - `commit_or_pr`
2. Identify risk dimensions:
   - domain ambiguity or business rules
   - df-glue-coding fit: existing CRUD/page/endpoint/adapter/pattern likely covers most structure
   - behavior change
   - existing behavior preservation
   - public API, HTTP, authorization naming, RBAC/ABAC, security, validation, or serialization boundary
   - persistence, transactions, ordering, pagination, external side effects
   - failing tests, production bug, or unclear root cause
   - multi-module work that can be split
   - long-running, multi-turn, interruption-prone, or resumed work
3. Select the required skills.
4. State the selected workflow before proceeding.
5. If a selected skill is unavailable, say which one is missing and use the closest available workflow.

## Skill Selection

- Use `df-resumable-workflow-guard` when the task may span multiple turns or sessions, exceed about 30 minutes, resume after interruption, approach context limits, involve several workflow stages, or need checkpoint/handoff evidence.
- Use `df-ddd-event-storming-design` when requirements contain non-trivial business language, domain events, commands, policies, aggregates, read models, or unclear business boundaries.
- Use `df-glue-coding` after domain ambiguity is resolved or intentionally thin, when implementation should reuse local project material such as CRUD/page patterns, reference examples, endpoints, adapters, handlers, projections, tests, imports/exports, or other repeatable structures.
- Use `df-iam-access-control-design` when defining or reviewing permission and role identifiers, RBAC/ABAC bindings, CEL conditions, API authorization mappings, or migrations away from colon-delimited permission names.
- Use `df-ddd-to-tdd-handoff` after a DDD design is confirmed and the user wants implementation slices, tests, or development planning.
- Use `df-implementation-planning` for multi-step implementation, refactoring, risky changes, or any task whose safe execution needs more than one red/green slice.
- Use `df-executing-implementation-plan` when following an existing plan or after writing one.
- Use `df-tdd-skill` when writing or changing executable behavior, fixing bugs, characterizing existing behavior, or doing behavior-preserving refactors.
- Use `df-spring-web-boundaries` when changing Java/Spring controllers, REST endpoints, request/response mapping, validation, security, uploads/downloads, exports, or service/controller boundaries.
- Use `df-systematic-debugging` when a test fails unexpectedly, a bug report lacks a proven root cause, or a proposed fix is based on guessing.
- Use `df-parallel-agent-orchestration` when independent modules, plan review, implementation, and review can be split across non-overlapping contexts.
- Use `df-requesting-code-review` after the main implementation is complete and before final handoff or PR.
- Use `df-receiving-code-review` when addressing review comments.
- Use `df-verification-before-completion` before claiming the task is complete.
- Use `df-finishing-development-branch` before committing, pushing, opening a PR, or preparing a branch handoff.

## Output Format

```text
当前任务类型：<classification>
主要风险：<risk list>
必须使用的 skill：
1. <skill> - <reason>
2. <skill> - <reason>
执行顺序：
1. <workflow step>
2. <workflow step>
暂不使用：
- <skill> - <reason>
```

Keep the routing concise. After routing, immediately follow the selected skills.

## Default Chains

- Long or resumed task: `df-resumable-workflow-guard` -> selected inner workflow -> checkpoint updates -> `df-verification-before-completion`.
- New domain feature: `df-ddd-event-storming-design` -> `df-glue-coding` when local patterns exist -> `df-ddd-to-tdd-handoff` -> `df-implementation-planning` -> `df-executing-implementation-plan` with `df-tdd-skill` -> `df-verification-before-completion`.
- Glue-style implementation: DDD gate if business meaning is unclear -> `df-glue-coding` -> `df-implementation-planning` -> `df-executing-implementation-plan` with `df-tdd-skill` when behavior changes -> `df-verification-before-completion`.
- Bug fix: `df-systematic-debugging` -> `df-tdd-skill` -> `df-verification-before-completion`.
- Pure refactor: `df-implementation-planning` -> `df-tdd-skill` characterization -> `df-executing-implementation-plan` -> `df-verification-before-completion`.
- Spring endpoint change: `df-tdd-skill` + `df-spring-web-boundaries` -> `df-verification-before-completion`.
- API authorization design: `df-iam-access-control-design` + `df-google-aip-api-design` when resource or transport design is involved -> `df-implementation-planning` for executable changes -> `df-verification-before-completion`.
- Review feedback: `df-receiving-code-review` -> targeted verification -> `df-verification-before-completion`.
- Commit or PR: `df-verification-before-completion` -> `df-finishing-development-branch`.

## Non-Negotiable Rules

- Do not skip routing because a task looks small unless it is documentation-only, formatting-only, or a direct question.
- Do not begin production-code edits when routing selected modeling, planning, TDD, or debugging first.
- Do not use DDD as a coding plan by itself; bridge confirmed domain design through `df-ddd-to-tdd-handoff`.
- Do not let Glue Coding bypass DDD. If a CRUD-looking task hides business rules, use local patterns only as discovery input until the DDD gate is confirmed.
- Do not invent structure for glue-style work before checking local patterns and recording the selected pattern plus delta.
- Do not claim completion without `df-verification-before-completion` for engineering changes.
- Respect user-owned changes in the worktree. Never revert unrelated edits.

See `references/workflow-map.md` for the full skill combination map.
