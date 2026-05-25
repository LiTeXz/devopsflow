---
name: engineering-workflow-router
description: "Mandatory engineering workflow router. Use at the start of software development, refactoring, bug fixing, domain modeling, code review, verification, branch finishing, or commit preparation to classify the task and select required skills such as resumable-workflow-guard, ddd-event-storming-design, ddd-to-tdd-handoff, implementation-planning, executing-implementation-plan, tdd-skill, spring-web-boundaries, systematic-debugging, requesting-code-review, receiving-code-review, verification-before-completion, finishing-development-branch, or parallel-agent-orchestration."
---

# Engineering Workflow Router

Use this skill before doing engineering work. Its job is to choose the mandatory workflow, not to implement the task.

## Routing Protocol

1. Classify the task:
   - `new_feature`
   - `bug_fix`
   - `pure_refactor`
   - `domain_modeling`
   - `design_review`
   - `code_review`
   - `review_feedback`
   - `verification`
   - `branch_finish`
   - `commit_or_pr`
2. Identify risk dimensions:
   - domain ambiguity or business rules
   - behavior change
   - existing behavior preservation
   - public API, HTTP, security, validation, or serialization boundary
   - persistence, transactions, ordering, pagination, external side effects
   - failing tests, production bug, or unclear root cause
   - multi-module work that can be split
   - long-running, multi-turn, interruption-prone, or resumed work
3. Select the required skills.
4. State the selected workflow before proceeding.
5. If a selected skill is unavailable, say which one is missing and use the closest available workflow.

## Skill Selection

- Use `resumable-workflow-guard` when the task may span multiple turns or sessions, exceed about 30 minutes, resume after interruption, approach context limits, involve several workflow stages, or need checkpoint/handoff evidence.
- Use `ddd-event-storming-design` when requirements contain non-trivial business language, domain events, commands, policies, aggregates, read models, or unclear business boundaries.
- Use `ddd-to-tdd-handoff` after a DDD design is confirmed and the user wants implementation slices, tests, or development planning.
- Use `implementation-planning` for multi-step implementation, refactoring, risky changes, or any task whose safe execution needs more than one red/green slice.
- Use `executing-implementation-plan` when following an existing plan or after writing one.
- Use `tdd-skill` when writing or changing executable behavior, fixing bugs, characterizing existing behavior, or doing behavior-preserving refactors.
- Use `spring-web-boundaries` when changing Java/Spring controllers, REST endpoints, request/response mapping, validation, security, uploads/downloads, exports, or service/controller boundaries.
- Use `systematic-debugging` when a test fails unexpectedly, a bug report lacks a proven root cause, or a proposed fix is based on guessing.
- Use `parallel-agent-orchestration` when independent modules, plan review, implementation, and review can be split across non-overlapping contexts.
- Use `requesting-code-review` after the main implementation is complete and before final handoff or PR.
- Use `receiving-code-review` when addressing review comments.
- Use `verification-before-completion` before claiming the task is complete.
- Use `finishing-development-branch` before committing, pushing, opening a PR, or preparing a branch handoff.

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

- Long or resumed task: `resumable-workflow-guard` -> selected inner workflow -> checkpoint updates -> `verification-before-completion`.
- New domain feature: `ddd-event-storming-design` -> `ddd-to-tdd-handoff` -> `implementation-planning` -> `executing-implementation-plan` with `tdd-skill` -> `verification-before-completion`.
- Bug fix: `systematic-debugging` -> `tdd-skill` -> `verification-before-completion`.
- Pure refactor: `implementation-planning` -> `tdd-skill` characterization -> `executing-implementation-plan` -> `verification-before-completion`.
- Spring endpoint change: `tdd-skill` + `spring-web-boundaries` -> `verification-before-completion`.
- Review feedback: `receiving-code-review` -> targeted verification -> `verification-before-completion`.
- Commit or PR: `verification-before-completion` -> `finishing-development-branch`.

## Non-Negotiable Rules

- Do not skip routing because a task looks small unless it is documentation-only, formatting-only, or a direct question.
- Do not begin production-code edits when routing selected modeling, planning, TDD, or debugging first.
- Do not use DDD as a coding plan by itself; bridge confirmed domain design through `ddd-to-tdd-handoff`.
- Do not claim completion without `verification-before-completion` for engineering changes.
- Respect user-owned changes in the worktree. Never revert unrelated edits.

See `references/workflow-map.md` for the full skill combination map.
